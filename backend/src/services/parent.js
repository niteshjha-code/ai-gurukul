import { db } from '../db.js';
import { publicUser } from '../auth.js';
import { BADGES, GAMES, SUBJECTS } from '../catalog.js';
import { summary } from './progress.js';

const subjectName = (id) => SUBJECTS.find((s) => s.id === id)?.name ?? id;
const badgeInfo = new Map(BADGES.map(({ id, name, emoji }) => [id, { name, emoji }]));
const gameName = (id) => GAMES.find((g) => g.id === id)?.name ?? id;
// SQLite stores UTC as "YYYY-MM-DD HH:MM:SS".
const daysSince = (sqlDate) => Math.floor((Date.now() - new Date(`${sqlDate.replace(' ', 'T')}Z`).getTime()) / 86_400_000);

function weekStats(userId) {
  const row = (sql) => db.prepare(sql).get(userId);
  return {
    activeDays: row(`SELECT COUNT(DISTINCT date(created_at, 'localtime')) AS n FROM activity WHERE user_id = ? AND created_at >= datetime('now', '-6 days', 'start of day')`).n,
    xp: row(`SELECT COALESCE(SUM(xp), 0) AS n FROM activity WHERE user_id = ? AND created_at >= datetime('now', '-6 days', 'start of day')`).n,
    homework: row(`SELECT COUNT(*) AS n FROM homework WHERE user_id = ? AND created_at >= datetime('now', '-6 days', 'start of day')`).n,
    games: row(`SELECT COUNT(*) AS n FROM game_plays WHERE user_id = ? AND created_at >= datetime('now', '-6 days', 'start of day')`).n,
  };
}

// Plain-language notes for the parent, most useful first.
function insights(child, s, lastActive, week) {
  const name = child.child_name;
  const out = [];
  if (!lastActive) {
    out.push({ tone: 'info', text: `${name} hasn't started yet. Creating a first story together is a great way to begin!` });
    return out;
  }
  const idle = daysSince(lastActive);
  if (idle >= 3) out.push({ tone: 'warn', text: `${name} hasn't learned for ${idle} days. A quick 5-minute story can restart the habit.` });
  if (s.streak >= 3) out.push({ tone: 'good', text: `${name} is on a ${s.streak}-day learning streak!` });

  const tried = s.mastery.filter((m) => m.avgScore != null).sort((a, b) => a.avgScore - b.avgScore);
  const weakest = tried[0];
  const strongest = tried.at(-1);
  if (strongest && strongest.avgScore >= 80) {
    out.push({ tone: 'good', text: `Doing great in ${subjectName(strongest.subject)} with a ${strongest.avgScore}% quiz average (level ${strongest.level}).` });
  }
  if (weakest && weakest.avgScore < 60) {
    const rec = s.recommendations.find((r) => r.subject === weakest.subject);
    out.push({ tone: 'warn', text: `${subjectName(weakest.subject)} needs a little practice (${weakest.avgScore}% average).${rec ? ` Try a story about "${rec.topic}".` : ''}` });
  }
  if (s.totals.stories > 0 && s.totals.quizzes === 0) {
    out.push({ tone: 'info', text: `${name} has read ${s.totals.stories} ${s.totals.stories === 1 ? 'story' : 'stories'} but taken no quizzes yet. Quizzes help lock in what was learned.` });
  }
  if (week.games > 0) out.push({ tone: 'good', text: `Played ${week.games} learning ${week.games === 1 ? 'game' : 'games'} this week to practise new words and maths.` });
  if (week.homework > 0) out.push({ tone: 'info', text: `Asked Guru Owl ${week.homework} homework ${week.homework === 1 ? 'question' : 'questions'} this week.` });
  const untried = SUBJECTS.filter((sub) => !s.mastery.find((m) => m.subject === sub.id)?.stories);
  if (untried.length >= 6) out.push({ tone: 'info', text: `So far ${name} has explored ${SUBJECTS.length - untried.length} of ${SUBJECTS.length} subjects. Suggest something new like ${untried[0].name}!` });
  return out.slice(0, 4);
}

function activityFeed(userId, limit = 20) {
  return db.prepare(`
    SELECT 'story' AS type, s.created_at AS at, s.title AS title, s.subject, NULL AS score, NULL AS total, s.id AS storyId
      FROM stories s WHERE s.user_id = ?
    UNION ALL
    SELECT 'quiz', a.created_at, s.title, a.subject, a.score, a.total, s.id
      FROM quiz_attempts a JOIN quizzes q ON q.id = a.quiz_id JOIN stories s ON s.id = q.story_id WHERE a.user_id = ?
    UNION ALL
    SELECT 'homework', h.created_at, h.question, h.subject, NULL, NULL, NULL FROM homework h WHERE h.user_id = ?
    UNION ALL
    SELECT 'game', g.created_at, g.game, g.subject, g.score, g.total, g.story_id FROM game_plays g WHERE g.user_id = ?
    UNION ALL
    SELECT 'badge', b.earned_at, b.badge, NULL, NULL, NULL, NULL FROM badges b WHERE b.user_id = ?
    ORDER BY at DESC LIMIT ?
  `).all(userId, userId, userId, userId, userId, limit).map((e) => {
    if (e.type === 'badge') return { ...e, title: badgeInfo.get(e.title)?.name ?? e.title, emoji: badgeInfo.get(e.title)?.emoji };
    if (e.type === 'game') return { ...e, title: gameName(e.title) };
    return e;
  });
}

// The compact card shown for each child on the overview.
export function childCard(child) {
  const s = summary(child.id);
  const lastActive = db.prepare('SELECT MAX(created_at) AS t FROM activity WHERE user_id = ?').get(child.id).t;
  const week = weekStats(child.id);
  return {
    profile: publicUser(child),
    rank: s.rank,
    streak: s.streak,
    totals: s.totals,
    lastActive,
    week,
    weekActivity: s.weekActivity,
    mastery: s.mastery,
    insights: insights(child, s, lastActive, week),
  };
}

// Everything about one child for the detail view.
export function childDetail(child) {
  const s = summary(child.id);
  return {
    ...childCard(child),
    badges: s.badges,
    recentAttempts: s.recentAttempts,
    recommendations: s.recommendations,
    activity: activityFeed(child.id),
    homework: db.prepare(`
      SELECT id, subject, mode, question, answer, created_at AS createdAt FROM homework WHERE user_id = ? ORDER BY id DESC LIMIT 20
    `).all(child.id),
    stories: db.prepare(`
      SELECT s.id, s.title, s.topic, s.subject, s.kind, s.level, s.created_at AS createdAt,
        (SELECT MAX(a.score * 100 / a.total) FROM quizzes q JOIN quiz_attempts a ON a.quiz_id = q.id WHERE q.story_id = s.id) AS bestScore
      FROM stories s WHERE s.user_id = ? ORDER BY s.id DESC LIMIT 30
    `).all(child.id),
  };
}

export function familyOverview(account) {
  const children = db.prepare('SELECT * FROM users WHERE account_id = ? ORDER BY id').all(account.id).map(childCard);
  const sum = (fn) => children.reduce((n, c) => n + fn(c), 0);
  return {
    children,
    family: {
      explorers: children.length,
      stories: sum((c) => c.totals.stories),
      quizzes: sum((c) => c.totals.quizzes),
      homework: sum((c) => c.totals.homework),
      games: sum((c) => c.totals.games),
      xpThisWeek: sum((c) => c.week.xp),
    },
  };
}
