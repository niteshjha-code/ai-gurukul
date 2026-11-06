import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { rankFor } from './services/progress.js';

const SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production');
}

// Two kinds of session:
//   learner - a child profile using the app (long-lived, used by all learning routes)
//   parent  - the grown-up, after entering the account password (short-lived, unlocks Parent Corner)
export function signLearnerToken(user) {
  return jwt.sign({ sub: String(user.id), acc: String(user.account_id), typ: 'learner' }, SECRET, { expiresIn: '7d' });
}

export function signParentToken(account) {
  return jwt.sign({ sub: String(account.id), typ: 'parent' }, SECRET, { expiresIn: '1h' });
}

function readToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.slice(7), SECRET);
  } catch {
    return undefined;
  }
}

const getUser = (id) => db.prepare('SELECT * FROM users WHERE id = ?').get(id);
const getAccount = (id) => db.prepare('SELECT * FROM accounts WHERE id = ?').get(id);

export function requireAuth(req, res, next) {
  const payload = readToken(req);
  if (payload === null) return res.status(401).json({ error: 'Please log in first.' });
  // Tokens from before parent accounts existed have no `typ` and always named a learner.
  const user = payload && (payload.typ ?? 'learner') === 'learner' ? getUser(Number(payload.sub)) : null;
  if (!user) return res.status(401).json({ error: 'Your session has ended. Please log in again.' });
  req.user = user;
  req.account = getAccount(user.account_id);
  next();
}

// Parent Corner. Answers 403 (not 401) so the app keeps the child's session when the parent lock expires.
export function requireParent(req, res, next) {
  const payload = readToken(req);
  const account = payload?.typ === 'parent' ? getAccount(Number(payload.sub)) : null;
  if (!account) return res.status(403).json({ error: 'Grown-ups only! Please enter the parent password.', code: 'PARENT_LOCKED' });
  req.account = account;
  next();
}

// Either kind of session; resolves the family account.
export function requireAccount(req, res, next) {
  const payload = readToken(req);
  let account = null;
  if (payload?.typ === 'parent') account = getAccount(Number(payload.sub));
  else if (payload) {
    const user = getUser(Number(payload.sub));
    if (user) account = getAccount(user.account_id);
  }
  if (!account) return res.status(401).json({ error: 'Please log in first.' });
  req.account = account;
  next();
}

export function publicUser(u, account) {
  return {
    id: u.id,
    childName: u.child_name,
    age: u.age,
    grade: u.grade,
    avatar: u.avatar,
    xp: u.xp,
    rank: rankFor(u.xp),
    createdAt: u.created_at,
    ...(account ? { email: account.email, parentName: account.parent_name } : {}),
  };
}

export function publicAccount(a) {
  return { id: a.id, email: a.email, parentName: a.parent_name, createdAt: a.created_at };
}
