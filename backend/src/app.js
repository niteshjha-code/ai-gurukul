import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { timingSafeEqual } from 'node:crypto';
import { db } from './db.js';
import { requireAuth } from './auth.js';
import { authLimiter } from './limits.js';
import { activeProviders } from './ai/providers.js';
import { SUBJECTS, TOPIC_IDEAS, KINDS, AVATARS } from './catalog.js';
import { summary } from './services/progress.js';
import { imageFile, imageKey, queueImage } from './services/images.js';
import authRoutes from './routes/auth.js';
import storyRoutes from './routes/stories.js';
import quizRoutes from './routes/quizzes.js';
import homeworkRoutes from './routes/homework.js';
import parentRoutes from './routes/parent.js';
import gameRoutes from './routes/games.js';

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, ai: [...new Set(activeProviders().map((p) => p.name))] });
});

app.get('/api/meta', (req, res) => {
  res.json({ subjects: SUBJECTS, topicIdeas: TOPIC_IDEAS, kinds: KINDS, avatars: AVATARS });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/stories', storyRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/games', gameRoutes);
app.get('/api/progress', requireAuth, (req, res) => res.json(summary(req.user.id)));

// Story illustrations: served from the disk cache, or queued and answered with 202 until ready.
app.get('/api/images/:id', (req, res) => {
  const id = Number(req.params.id);
  const expected = Buffer.from(imageKey(id));
  const given = Buffer.from(String(req.query.k ?? ''));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return res.status(404).end();
  if (existsSync(imageFile(id))) {
    res.set('Cache-Control', 'private, max-age=31536000, immutable');
    return res.sendFile(imageFile(id));
  }
  const story = db.prepare('SELECT id, topic, image_prompt FROM stories WHERE id = ?').get(id);
  if (!story) return res.status(404).end();
  queueImage(story);
  res.status(202).set('Retry-After', '15').end();
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// In production, serve the built frontend from ../frontend/dist when it exists.
const dist = path.resolve(import.meta.dirname, '..', '..', 'frontend', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.use((req, res, next) => (req.method === 'GET' ? res.sendFile(path.join(dist, 'index.html')) : next()));
}

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request body.' });
  if (!err.expose) console.error(err);
  res.status(err.status || 500).json({ error: err.expose ? err.message : 'Something went wrong. Please try again.' });
});
