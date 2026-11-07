import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { HttpError } from '../errors.js';
import { GAMES, GAME_XP_DAILY_CAP, SUBJECT_IDS } from '../catalog.js';
import { addXP, evaluateBadges, getMastery } from '../services/progress.js';

// The games themselves run in the browser with no AI calls. These routes record results and award XP.
const router = Router();
router.use(requireAuth);

const GAME_IDS = new Set(GAMES.map((g) => g.id));

const gameXpToday = (userId) => db.prepare(`
  SELECT COALESCE(SUM(xp), 0) AS n FROM game_plays
  WHERE user_id = ? AND date(created_at, 'localtime') = date('now', 'localtime')
`).get(userId).n;

router.get('/stats', (req, res) => {
  const rows = db.prepare(`
    SELECT game, COUNT(*) AS plays, MAX(score * 100 / total) AS best FROM game_plays WHERE user_id = ? GROUP BY game
  `).all(req.user.id);
  res.json({
    played: rows.reduce((n, r) => n + r.plays, 0),
    xpToday: gameXpToday(req.user.id),
    xpCap: GAME_XP_DAILY_CAP,
    mathLevel: getMastery(req.user.id, 'math').level,
    games: Object.fromEntries(rows.map((r) => [r.game, { plays: r.plays, best: r.best }])),
  });
});

router.post('/finish', (req, res) => {
  const game = String(req.body?.game ?? '');
  if (!GAME_IDS.has(game)) throw new HttpError(400, 'We do not know that game.');
  const score = Number(req.body?.score);
  const total = Number(req.body?.total);
  if (!Number.isInteger(total) || total < 1 || total > 500 || !Number.isInteger(score) || score < 0 || score > total) {
    throw new HttpError(400, 'That score does not look right.');
  }

  let storyId = null;
  let subject = SUBJECT_IDS.includes(req.body?.subject) ? req.body.subject : null;
  if (req.body?.storyId != null) {
    const story = db.prepare('SELECT id, subject FROM stories WHERE id = ? AND user_id = ?').get(Number(req.body.storyId), req.user.id);
    if (!story) throw new HttpError(404, "We couldn't find that story.");
    storyId = story.id;
    subject = story.subject;
  }
  if (game === 'math') subject = 'math';

  const previousBest = db.prepare(`
    SELECT MAX(score * 100 / total) AS best FROM game_plays WHERE user_id = ? AND game = ? AND story_id IS ? AND subject IS ?
  `).get(req.user.id, game, storyId, subject).best;

  // 2 XP for playing plus up to 8 for the score, within the daily game allowance.
  const earned = 2 + Math.round((8 * score) / total);
  const xpGained = Math.max(0, Math.min(earned, GAME_XP_DAILY_CAP - gameXpToday(req.user.id)));

  db.prepare('INSERT INTO game_plays (user_id, game, subject, story_id, score, total, xp) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(req.user.id, game, subject, storyId, score, total, xpGained);
  addXP(req.user.id, 'game', xpGained); // also counts towards the day streak
  const newBadges = evaluateBadges(req.user.id);

  res.status(201).json({
    xpGained,
    capped: xpGained < earned,
    xpToday: gameXpToday(req.user.id),
    xpCap: GAME_XP_DAILY_CAP,
    percent: Math.round((score / total) * 100),
    previousBest,
    newBadges,
  });
});

export default router;
