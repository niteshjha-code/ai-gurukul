import { db } from '../db.js';
import { HttpError } from '../errors.js';
import { AVATARS } from '../catalog.js';
import { publicUser } from '../auth.js';

export const MAX_PROFILES = 6;

// Validate child profile fields from a request body. `partial` allows updating only some of them.
export function cleanProfile(body, { partial = false } = {}) {
  const out = {};
  if (!partial || body.childName !== undefined) {
    out.child_name = String(body.childName ?? '').trim().slice(0, 40);
    if (!out.child_name) throw new HttpError(400, "Please tell us the learner's name.");
  }
  if (!partial || body.age !== undefined) {
    out.age = Number(body.age);
    if (!Number.isInteger(out.age) || out.age < 3 || out.age > 16) throw new HttpError(400, 'Age should be between 3 and 16.');
  }
  if (!partial || body.grade !== undefined) out.grade = String(body.grade ?? '').trim().slice(0, 20) || null;
  if (!partial || body.avatar !== undefined) out.avatar = AVATARS.includes(body.avatar) ? body.avatar : 'lion';
  return out;
}

export function listProfiles(accountId) {
  return db.prepare('SELECT * FROM users WHERE account_id = ? ORDER BY id').all(accountId).map((u) => publicUser(u));
}

export function createProfile(accountId, body) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users WHERE account_id = ?').get(accountId).n;
  if (count >= MAX_PROFILES) throw new HttpError(400, `A family can have up to ${MAX_PROFILES} explorers.`);
  const p = cleanProfile(body);
  const { lastInsertRowid } = db.prepare('INSERT INTO users (account_id, child_name, age, grade, avatar) VALUES (?, ?, ?, ?, ?)')
    .run(accountId, p.child_name, p.age, p.grade, p.avatar);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(lastInsertRowid);
}

export function updateProfile(userId, body) {
  const changes = cleanProfile(body ?? {}, { partial: true });
  const keys = Object.keys(changes);
  if (keys.length) {
    db.prepare(`UPDATE users SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE id = ?`).run(...keys.map((k) => changes[k]), userId);
  }
  return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

// A profile that belongs to this account, or a 404.
export function familyProfile(accountId, profileId) {
  const user = db.prepare('SELECT * FROM users WHERE id = ? AND account_id = ?').get(Number(profileId), accountId);
  if (!user) throw new HttpError(404, "We couldn't find that explorer.");
  return user;
}
