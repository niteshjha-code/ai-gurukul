import { db } from '../db.js';
import { BADGES, RANKS, SUBJECTS, TOPIC_IDEAS } from '../catalog.js';

export function rankFor(xp) {
  let index = 0;
  RANKS.forEach((r, i) => { if (xp >= r.min) index = i; });
  const current = RANKS[index];
  const next = RANKS[index + 1] ?? null;
  const progress = next ? Math.round(((xp - current.min) / (next.min - current.min)) * 100) : 100;
  return { index, name: current.name, emoji: current.emoji, xp, nextAt: next?.min ?? null, nextName: next?.name ?? null, progress };
}

export function addXP(userId, type, xp) {
  db.prepare('INSERT INTO activity (user_id, type, xp) VALUES (?, ?, ?)').run(userId, type, xp);
  db.prepare('UPDATE users SET xp = xp + ? WHERE id = ?').run(xp, userId);
}

export function getMastery(userId, subject) {
  return db.prepare('SELECT * FROM mastery WHERE user_id = ? AND subject = ?').get(userId, subject)
    ?? { user_id: userId, subject, level: 1, attempts: 0, avg_score: 0 };
}

// Adapt the reading/quiz level from a quiz result: >=80% moves up, <50% moves down.
export function updateMastery(userId, subject, pct) {
  const m = getMastery(userId, subject);
  const before = m.level;
  let after = before;
  if (pct >= 0.8) after = Math.min(5, before + 1);
  else if (pct < 0.5) after = Math.max(1, before - 1);
  const attempts = m.attempts + 1;
  const avg = (m.avg_score * m.attempts + pct * 100) / attempts;
  db.prepare(`
    INSERT INTO mastery (user_id, subject, level, attempts, avg_score) VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (user_id, subject) DO UPDATE SET level = excluded.level, attempts = excluded.attempts, avg_score = excluded.avg_score
  `).run(userId, subject, after, attempts, avg);
  return { before, after };
}

export function streak(userId) {
  const days = db.prepare(`
    SELECT DISTINCT date(created_at, 'localtime') AS d FROM activity WHERE user_id = ? ORDER BY d DESC LIMIT 60
  `).all(userId).map((r) => r.d);
  if (!days.length) return 0;
  const toKey = (date) => date.toLocaleDateString('en-CA'); // YYYY-MM-DD
  const cursor = new Date();
  if (days[0] !== toKey(cursor)) {
    cursor.setDate(cursor.getDate() - 1);
    if (days[0] !== toKey(cursor)) return 0;
  }
  let count = 0;
  for (const d of days) {
    if (d !== toKey(cursor)) break;
    count++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

function counts(userId) {
  const one = (sql) => db.prepare(sql).get(userId).n;
  return {
    stories: one('SELECT COUNT(*) AS n FROM stories WHERE user_id = ?'),
    quizzes: one('SELECT COUNT(*) AS n FROM quiz_attempts WHERE user_id = ?'),
    perfect: one('SELECT COUNT(*) AS n FROM quiz_attempts WHERE user_id = ? AND score = total'),
    homework: one('SELECT COUNT(*) AS n FROM homework WHERE user_id = ?'),
    subjects: one('SELECT COUNT(DISTINCT subject) AS n FROM stories WHERE user_id = ?'),
    games: one('SELECT COUNT(*) AS n FROM game_plays WHERE user_id = ?'),
    streak: streak(userId),
  };
}

// Award any badges the user has newly qualified for and return them.
export function evaluateBadges(userId) {
  const stats = counts(userId);
  const owned = new Set(db.prepare('SELECT badge FROM badges WHERE user_id = ?').all(userId).map((r) => r.badge));
  const earned = BADGES.filter((b) => !owned.has(b.id) && b.test(stats));
  const insert = db.prepare('INSERT OR IGNORE INTO badges (user_id, badge) VALUES (?, ?)');
  for (const b of earned) insert.run(userId, b.id);
  return earned.map(({ id, name, emoji, desc }) => ({ id, name, emoji, desc }));
}

export function recommendations(userId) {
  const used = new Set(db.prepare('SELECT lower(topic) AS t FROM stories WHERE user_id = ?').all(userId).map((r) => r.t));
  const freshTopic = (subject) => TOPIC_IDEAS[subject].find((t) => !used.has(t.toLowerCase())) ?? TOPIC_IDEAS[subject][0];
  const mastery = db.prepare('SELECT * FROM mastery WHERE user_id = ? ORDER BY avg_score ASC').all(userId);
  const tried = new Set(db.prepare('SELECT DISTINCT subject FROM stories WHERE user_id = ?').all(userId).map((r) => r.subject));

  const recs = [];
  const weakest = mastery.find((m) => m.avg_score < 70);
  if (weakest) recs.push({ subject: weakest.subject, topic: freshTopic(weakest.subject), reason: 'Practice makes perfect' });
  const strongest = mastery.at(-1);
  if (strongest && strongest.avg_score >= 80 && strongest.subject !== weakest?.subject) {
    recs.push({ subject: strongest.subject, topic: freshTopic(strongest.subject), reason: 'Level-up challenge' });
  }
  for (const s of SUBJECTS) {
    if (recs.length >= 4) break;
    if (!tried.has(s.id) && !recs.some((r) => r.subject === s.id)) {
      recs.push({ subject: s.id, topic: freshTopic(s.id), reason: 'Explore something new' });
    }
  }
  for (const s of SUBJECTS) {
    if (recs.length >= 4) break;
    if (!recs.some((r) => r.subject === s.id)) recs.push({ subject: s.id, topic: freshTopic(s.id), reason: 'Keep exploring' });
  }
  return recs;
}

export function summary(userId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const stats = counts(userId);
  const avg = db.prepare('SELECT AVG(score * 100.0 / total) AS a FROM quiz_attempts WHERE user_id = ?').get(userId).a;
  const owned = new Map(db.prepare('SELECT badge, earned_at FROM badges WHERE user_id = ?').all(userId).map((r) => [r.badge, r.earned_at]));
  const masteryRows = new Map(db.prepare('SELECT * FROM mastery WHERE user_id = ?').all(userId).map((m) => [m.subject, m]));
  const storyCounts = new Map(db.prepare('SELECT subject, COUNT(*) AS n FROM stories WHERE user_id = ? GROUP BY subject').all(userId).map((r) => [r.subject, r.n]));

  return {
    xp: user.xp,
    rank: rankFor(user.xp),
    streak: stats.streak,
    totals: {
      stories: stats.stories,
      quizzes: stats.quizzes,
      homework: stats.homework,
      perfect: stats.perfect,
      games: stats.games,
      avgScore: avg == null ? null : Math.round(avg),
    },
    mastery: SUBJECTS.map((s) => {
      const m = masteryRows.get(s.id);
      return { subject: s.id, level: m?.level ?? 1, attempts: m?.attempts ?? 0, avgScore: m ? Math.round(m.avg_score) : null, stories: storyCounts.get(s.id) ?? 0 };
    }),
    recentAttempts: db.prepare(`
      SELECT a.score, a.total, a.subject, a.created_at AS createdAt, s.title, s.id AS storyId
      FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id JOIN stories s ON s.id = q.story_id
      WHERE a.user_id = ? ORDER BY a.id DESC LIMIT 10
    `).all(userId).reverse(),
    weekActivity: db.prepare(`
      SELECT date(created_at, 'localtime') AS day, SUM(xp) AS xp, COUNT(*) AS count
      FROM activity WHERE user_id = ? AND created_at >= datetime('now', '-6 days', 'start of day')
      GROUP BY day ORDER BY day
    `).all(userId),
    badges: BADGES.map(({ id, name, emoji, desc }) => ({ id, name, emoji, desc, earned: owned.has(id), earnedAt: owned.get(id) ?? null })),
    recommendations: recommendations(userId),
  };
}
