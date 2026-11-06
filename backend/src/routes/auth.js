import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { signLearnerToken, signParentToken, requireAuth, requireAccount, publicUser, publicAccount } from '../auth.js';
import { HttpError } from '../errors.js';
import { cleanProfile, createProfile, familyProfile, listProfiles, updateProfile } from '../services/profiles.js';

const router = Router();
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function checkPassword(account, password) {
  if (!account || !(await bcrypt.compare(String(password ?? ''), account.password_hash))) {
    throw new HttpError(401, 'That email and password do not match. Please try again.');
  }
}

// The parent creates the family account together with the first explorer.
router.post('/register', async (req, res) => {
  const { email, password, parentName, consent } = req.body ?? {};
  const normalized = String(email ?? '').trim().toLowerCase();
  if (!EMAIL.test(normalized)) throw new HttpError(400, 'Please enter a valid email address.');
  if (typeof password !== 'string' || password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
  const parent = String(parentName ?? '').trim().slice(0, 60);
  if (!parent) throw new HttpError(400, "Please enter the parent or guardian's name.");
  if (consent !== true) throw new HttpError(400, 'A parent or guardian must agree before creating an account.');
  cleanProfile(req.body); // validate the child before creating anything

  if (db.prepare('SELECT 1 FROM accounts WHERE email = ?').get(normalized)) {
    throw new HttpError(409, 'An account with this email already exists. Try logging in!');
  }
  const hash = await bcrypt.hash(password, 10);
  const { lastInsertRowid } = db.prepare('INSERT INTO accounts (email, password_hash, parent_name) VALUES (?, ?, ?)').run(normalized, hash, parent);
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(lastInsertRowid);
  const user = createProfile(account.id, req.body);
  res.status(201).json({
    token: signLearnerToken(user),
    parentToken: signParentToken(account),
    user: publicUser(user, account),
    profiles: listProfiles(account.id),
  });
});

// Logging in unlocks the family; the app then asks "Who's learning?" and calls /switch.
router.post('/login', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const account = db.prepare('SELECT * FROM accounts WHERE email = ?').get(email);
  await checkPassword(account, req.body?.password);
  res.json({ parentToken: signParentToken(account), account: publicAccount(account), profiles: listProfiles(account.id) });
});

router.get('/profiles', requireAccount, (req, res) => {
  res.json({ account: publicAccount(req.account), profiles: listProfiles(req.account.id) });
});

// Start learning as one of the family's explorers. Works from a parent session or a sibling's session.
router.post('/switch', requireAccount, (req, res) => {
  const user = familyProfile(req.account.id, req.body?.profileId);
  res.json({ token: signLearnerToken(user), user: publicUser(user, req.account) });
});

// Re-enter the account password to open Parent Corner from inside the app.
router.post('/unlock', requireAccount, async (req, res) => {
  await checkPassword(req.account, req.body?.password);
  res.json({ parentToken: signParentToken(req.account) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user, req.account) });
});

router.patch('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(updateProfile(req.user.id, req.body), req.account) });
});

export default router;
