import { createHmac } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

// Story illustrations come from the free Pollinations image API, which allows roughly one image
// per 45 seconds without a token. Each image is downloaded once through a spaced queue and cached on disk.

const DIR = process.env.IMAGE_DIR || path.join(import.meta.dirname, '..', '..', 'data', 'images');
const GAP_MS = process.env.POLLINATIONS_TOKEN ? 1000 : 46_000;
const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

mkdirSync(DIR, { recursive: true });

let chain = Promise.resolve();
let lastRequestAt = 0;
const pending = new Set();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// <img> tags cannot send auth headers, so image URLs carry a signature instead.
export function imageKey(id) {
  return createHmac('sha256', SECRET).update(`story-image:${id}`).digest('hex').slice(0, 20);
}

export function imageUrl(story) {
  return `/api/images/${story.id}?k=${imageKey(story.id)}`;
}

export const imageFile = (id) => path.join(DIR, `${id}.jpg`);

async function download(story) {
  const wait = lastRequestAt + GAP_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
  const prompt = `${story.image_prompt || story.topic}, cute colorful children's picture book illustration, soft warm light, lush jungle style, no text`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=960&height=640&nologo=true&seed=${story.id}`;
  const res = await fetch(url, {
    headers: process.env.POLLINATIONS_TOKEN ? { Authorization: `Bearer ${process.env.POLLINATIONS_TOKEN}` } : {},
    signal: AbortSignal.timeout(90_000),
  });
  // Over the free limit the API answers 402 with a "limit reached" picture, which must not be cached.
  if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) throw new Error(`HTTP ${res.status}`);
  await writeFile(imageFile(story.id), Buffer.from(await res.arrayBuffer()));
}

export function removeImages(storyIds) {
  for (const id of storyIds) rm(imageFile(id), { force: true }).catch(() => {});
}

// Queue a download unless the image is cached or already queued. Never blocks the caller.
export function queueImage(story) {
  if (process.env.AI_OFFLINE === '1' || pending.has(story.id) || existsSync(imageFile(story.id))) return;
  pending.add(story.id);
  chain = chain
    .then(() => download(story))
    .catch((err) => console.warn(`[images] story ${story.id} failed - ${err.message}`))
    .finally(() => pending.delete(story.id));
}
