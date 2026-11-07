import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const DB_PATH = process.env.DB_PATH || path.join(import.meta.dirname, '..', 'data', 'gurukul.db');
if (DB_PATH !== ':memory:') mkdirSync(path.dirname(DB_PATH), { recursive: true });

export const db = new DatabaseSync(DB_PATH);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  -- A family login, owned by the parent or guardian.
  CREATE TABLE IF NOT EXISTS accounts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    parent_name   TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Learners: one row per child profile. All learning data references users(id).
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    child_name TEXT NOT NULL,
    age        INTEGER NOT NULL,
    grade      TEXT,
    avatar     TEXT NOT NULL DEFAULT 'lion',
    xp         INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS stories (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic        TEXT NOT NULL,
    subject      TEXT NOT NULL,
    kind         TEXT NOT NULL,
    level        INTEGER NOT NULL,
    title        TEXT NOT NULL,
    content      TEXT NOT NULL,
    moral        TEXT,
    fun_fact     TEXT,
    vocabulary   TEXT NOT NULL DEFAULT '[]',
    image_prompt TEXT,
    source       TEXT NOT NULL,
    quiz_draft   TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id   INTEGER NOT NULL UNIQUE REFERENCES stories(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    questions  TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS quiz_attempts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    quiz_id    INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject    TEXT NOT NULL,
    answers    TEXT NOT NULL,
    score      INTEGER NOT NULL,
    total      INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS mastery (
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject   TEXT NOT NULL,
    level     INTEGER NOT NULL DEFAULT 1,
    attempts  INTEGER NOT NULL DEFAULT 0,
    avg_score REAL NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, subject)
  );

  CREATE TABLE IF NOT EXISTS homework (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject    TEXT NOT NULL,
    mode       TEXT NOT NULL,
    question   TEXT NOT NULL,
    answer     TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activity (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL,
    xp         INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS badges (
    user_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge     TEXT NOT NULL,
    earned_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (user_id, badge)
  );

  CREATE TABLE IF NOT EXISTS game_plays (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game       TEXT NOT NULL,
    subject    TEXT,
    story_id   INTEGER REFERENCES stories(id) ON DELETE SET NULL,
    score      INTEGER NOT NULL,
    total      INTEGER NOT NULL,
    xp         INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_stories_user  ON stories(user_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_games_user    ON game_plays(user_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_attempts_user ON quiz_attempts(user_id, created_at);
  CREATE INDEX IF NOT EXISTS idx_activity_user ON activity(user_id, created_at);
`);

// Migrations for databases created by older versions.
const columns = (table) => db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);

if (!columns('stories').includes('quiz_draft')) db.exec('ALTER TABLE stories ADD COLUMN quiz_draft TEXT');

// v1 kept the parent login and the single child in one `users` row. Split it into an account plus a
// child profile, keeping every id so existing learning data and login sessions stay valid.
if (columns('users').includes('email')) {
  db.exec('PRAGMA foreign_keys = OFF');
  try {
    db.exec(`
      BEGIN;
      INSERT INTO accounts (id, email, password_hash, parent_name, created_at)
        SELECT id, email, password_hash, parent_name, created_at FROM users;
      CREATE TABLE users_v2 (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        child_name TEXT NOT NULL,
        age        INTEGER NOT NULL,
        grade      TEXT,
        avatar     TEXT NOT NULL DEFAULT 'lion',
        xp         INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      INSERT INTO users_v2 (id, account_id, child_name, age, grade, avatar, xp, created_at)
        SELECT id, id, child_name, age, grade, avatar, xp, created_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_v2 RENAME TO users;
      COMMIT;
    `);
  } catch (err) {
    try { db.exec('ROLLBACK'); } catch { /* no open transaction */ }
    throw err;
  } finally {
    db.exec('PRAGMA foreign_keys = ON');
  }
}

db.exec('CREATE INDEX IF NOT EXISTS idx_users_account ON users(account_id)');
