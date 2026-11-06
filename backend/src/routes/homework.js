import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { aiLimiter } from '../limits.js';
import { HttpError } from '../errors.js';
import { HOMEWORK_MODES, SUBJECTS } from '../catalog.js';
import { assertKidSafe } from '../ai/safety.js';
import { homeworkHelp } from '../ai/index.js';
import { addXP, evaluateBadges } from '../services/progress.js';

const router = Router();
router.use(requireAuth);

router.post('/ask', aiLimiter, async (req, res) => {
  const question = String(req.body?.question ?? '').trim();
  if (question.length < 2 || question.length > 1000) throw new HttpError(400, 'Please type a question between 2 and 1000 letters.');
  assertKidSafe(question);
  const subject = SUBJECTS.find((s) => s.id === req.body?.subject) ?? { id: 'general', name: 'any subject' };
  const mode = HOMEWORK_MODES.includes(req.body?.mode) ? req.body.mode : 'hint';
  // Keep only the last few turns of the conversation for context.
  const history = (Array.isArray(req.body?.history) ? req.body.history : [])
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string')
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1500) }));

  const answer = await homeworkHelp({ question, subject: subject.name, mode, age: req.user.age, grade: req.user.grade, history });
  db.prepare('INSERT INTO homework (user_id, subject, mode, question, answer) VALUES (?, ?, ?, ?, ?)')
    .run(req.user.id, subject.id, mode, question, answer);
  addXP(req.user.id, 'homework', 5);
  res.json({ answer, xpGained: 5, newBadges: evaluateBadges(req.user.id) });
});

router.get('/recent', (req, res) => {
  const items = db.prepare(`
    SELECT id, subject, mode, question, answer, created_at AS createdAt FROM homework WHERE user_id = ? ORDER BY id DESC LIMIT 10
  `).all(req.user.id);
  res.json({ items });
});

export default router;
