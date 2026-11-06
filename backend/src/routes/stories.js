import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { aiLimiter } from '../limits.js';
import { HttpError } from '../errors.js';
import { KINDS, SUBJECT_IDS } from '../catalog.js';
import { assertKidSafe } from '../ai/safety.js';
import { generateStory, generateQuiz } from '../ai/index.js';
import { addXP, evaluateBadges, getMastery } from '../services/progress.js';
import { imageUrl, queueImage, removeImages } from '../services/images.js';

const router = Router();
router.use(requireAuth);

const toStory = (s) => ({
  id: s.id,
  topic: s.topic,
  subject: s.subject,
  kind: s.kind,
  level: s.level,
  title: s.title,
  content: s.content,
  moral: s.moral,
  funFact: s.fun_fact,
  vocabulary: JSON.parse(s.vocabulary),
  imagePrompt: s.image_prompt,
  source: s.source,
  imageUrl: imageUrl(s),
  createdAt: s.created_at,
});

function ownStory(req) {
  const story = db.prepare('SELECT * FROM stories WHERE id = ? AND user_id = ?').get(Number(req.params.id), req.user.id);
  if (!story) throw new HttpError(404, "We couldn't find that story.");
  return story;
}

router.post('/generate', aiLimiter, async (req, res) => {
  const topic = String(req.body?.topic ?? '').trim().replace(/\s+/g, ' ');
  const subject = SUBJECT_IDS.includes(req.body?.subject) ? req.body.subject : 'science';
  const kind = KINDS.includes(req.body?.kind) ? req.body.kind : 'story';
  if (topic.length < 2 || topic.length > 120) throw new HttpError(400, 'Please type a topic between 2 and 120 letters.');
  assertKidSafe(topic);

  const { level } = getMastery(req.user.id, subject);
  const story = await generateStory({ topic, subject, kind, level, age: req.user.age });
  const { lastInsertRowid } = db.prepare(`
    INSERT INTO stories (user_id, topic, subject, kind, level, title, content, moral, fun_fact, vocabulary, image_prompt, source, quiz_draft)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.user.id, topic, subject, kind, level, story.title, story.content, story.moral, story.funFact,
    JSON.stringify(story.vocabulary), story.imagePrompt || topic, story.source, story.quiz ? JSON.stringify(story.quiz) : null);

  addXP(req.user.id, 'story', 10);
  const newBadges = evaluateBadges(req.user.id);
  const row = db.prepare('SELECT * FROM stories WHERE id = ?').get(lastInsertRowid);
  queueImage(row); // start drawing the illustration while the child reads
  res.status(201).json({ story: toStory(row), xpGained: 10, newBadges });
});

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT s.*, q.id AS quiz_id,
      (SELECT MAX(score * 100 / total) FROM quiz_attempts a WHERE a.quiz_id = q.id) AS best_score
    FROM stories s LEFT JOIN quizzes q ON q.story_id = s.id
    WHERE s.user_id = ? ORDER BY s.id DESC
  `).all(req.user.id);
  res.json({
    stories: rows.map((r) => ({
      ...toStory(r),
      content: undefined,
      excerpt: r.content.slice(0, 160),
      quizId: r.quiz_id,
      bestScore: r.best_score,
    })),
  });
});

router.get('/:id', (req, res) => {
  const story = ownStory(req);
  const quiz = db.prepare('SELECT id FROM quizzes WHERE story_id = ?').get(story.id);
  res.json({ story: { ...toStory(story), quizId: quiz?.id ?? null } });
});

router.delete('/:id', (req, res) => {
  const story = ownStory(req);
  db.prepare('DELETE FROM stories WHERE id = ?').run(story.id);
  removeImages([story.id]);
  res.status(204).end();
});

// Create the quiz for a story (or return the one already made).
router.post('/:id/quiz', aiLimiter, async (req, res) => {
  const story = ownStory(req);
  const existing = db.prepare('SELECT id FROM quizzes WHERE story_id = ?').get(story.id);
  if (existing) return res.json({ quizId: existing.id });

  const { level } = getMastery(req.user.id, story.subject);
  const questions = story.quiz_draft
    ? JSON.parse(story.quiz_draft)
    : await generateQuiz({ story: toStory(story), level, age: req.user.age });
  // OR IGNORE: a parallel request may have saved a quiz for this story while we waited on the AI.
  const info = db.prepare('INSERT OR IGNORE INTO quizzes (story_id, user_id, questions) VALUES (?, ?, ?)')
    .run(story.id, req.user.id, JSON.stringify(questions));
  const quizId = info.changes ? info.lastInsertRowid : db.prepare('SELECT id FROM quizzes WHERE story_id = ?').get(story.id).id;
  res.status(201).json({ quizId: Number(quizId) });
});

export default router;
