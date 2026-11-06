import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireParent, publicUser, publicAccount } from '../auth.js';
import { HttpError } from '../errors.js';
import { createProfile, familyProfile, updateProfile } from '../services/profiles.js';
import { childDetail, familyOverview } from '../services/parent.js';
import { removeImages } from '../services/images.js';

// Parent Corner: needs a parent session (account password), never a child's session.
const router = Router();
router.use(requireParent);

router.get('/overview', (req, res) => {
  res.json({ account: publicAccount(req.account), ...familyOverview(req.account) });
});

router.get('/children/:id', (req, res) => {
  res.json(childDetail(familyProfile(req.account.id, req.params.id)));
});

router.post('/children', (req, res) => {
  res.status(201).json({ profile: publicUser(createProfile(req.account.id, req.body ?? {})) });
});

router.patch('/children/:id', (req, res) => {
  const child = familyProfile(req.account.id, req.params.id);
  res.json({ profile: publicUser(updateProfile(child.id, req.body)) });
});

router.delete('/children/:id', (req, res) => {
  const child = familyProfile(req.account.id, req.params.id);
  const count = db.prepare('SELECT COUNT(*) AS n FROM users WHERE account_id = ?').get(req.account.id).n;
  if (count <= 1) throw new HttpError(400, 'Every family needs at least one explorer. Add another one before removing this profile.');
  const storyIds = db.prepare('SELECT id FROM stories WHERE user_id = ?').all(child.id).map((r) => r.id);
  db.prepare('DELETE FROM users WHERE id = ?').run(child.id); // cascades to all of the child's learning data
  removeImages(storyIds);
  res.status(204).end();
});

router.patch('/account', (req, res) => {
  const parentName = String(req.body?.parentName ?? '').trim().slice(0, 60);
  if (!parentName) throw new HttpError(400, "Please enter the parent or guardian's name.");
  db.prepare('UPDATE accounts SET parent_name = ? WHERE id = ?').run(parentName, req.account.id);
  res.json({ account: publicAccount(db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.account.id)) });
});

router.post('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!(await bcrypt.compare(String(currentPassword ?? ''), req.account.password_hash))) {
    throw new HttpError(400, 'Your current password is not right.');
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) throw new HttpError(400, 'The new password must be at least 6 characters.');
  db.prepare('UPDATE accounts SET password_hash = ? WHERE id = ?').run(await bcrypt.hash(newPassword, 10), req.account.id);
  res.json({ ok: true });
});

export default router;
