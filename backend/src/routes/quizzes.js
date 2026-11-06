import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { HttpError } from '../errors.js';
import { addXP, evaluateBadges, updateMastery } from '../services/progress.js';

const router = Router();
router.use(requireAuth);

function ownQuiz(req) {
  const quiz = db.prepare(`
    SELECT q.*, s.title, s.subject, s.id AS story_id, s.kind FROM quizzes q JOIN stories s ON s.id = q.story_id
    WHERE q.id = ? AND q.user_id = ?
  `).get(Number(req.params.id), req.user.id);
  if (!quiz) throw new HttpError(404, "We couldn't find that quiz.");
  return { ...quiz, questions: JSON.parse(quiz.questions) };
}

// Questions are sent without answers; answers are checked server-side.
router.get('/:id', (req, res) => {
  const quiz = ownQuiz(req);
  res.json({
    quiz: {
      id: quiz.id,
      storyId: quiz.story_id,
      title: quiz.title,
      subject: quiz.subject,
      questions: quiz.questions.map(({ question, options }) => ({ question, options })),
    },
  });
});

router.post('/:id/check', (req, res) => {
  const quiz = ownQuiz(req);
  const q = quiz.questions[Number(req.body?.index)];
  if (!q) throw new HttpError(400, 'That question does not exist.');
  const choice = Number(req.body?.choice);
  res.json({ correct: choice === q.answer, answer: q.answer, explanation: q.explanation });
});

router.post('/:id/submit', (req, res) => {
  const quiz = ownQuiz(req);
  const answers = Array.isArray(req.body?.answers) ? req.body.answers.map(Number) : [];
  if (answers.length !== quiz.questions.length) throw new HttpError(400, 'Please answer every question first.');

  const review = quiz.questions.map((q, i) => ({ ...q, choice: answers[i], correct: answers[i] === q.answer }));
  const score = review.filter((r) => r.correct).length;
  const total = review.length;
  const pct = score / total;

  db.prepare('INSERT INTO quiz_attempts (quiz_id, user_id, subject, answers, score, total) VALUES (?, ?, ?, ?, ?, ?)')
    .run(quiz.id, req.user.id, quiz.subject, JSON.stringify(answers), score, total);
  const level = updateMastery(req.user.id, quiz.subject, pct);
  const xpGained = score * 5 + (score === total ? 10 : 0);
  addXP(req.user.id, 'quiz', xpGained);
  const newBadges = evaluateBadges(req.user.id);

  res.json({ score, total, percent: Math.round(pct * 100), xpGained, level, subject: quiz.subject, newBadges, review });
});

export default router;
