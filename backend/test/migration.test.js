import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

test('a v1 database (parent + child in one users row) is migrated to accounts + profiles', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'gurukul-'));
  const file = path.join(dir, 'old.db');
  const old = new DatabaseSync(file);
  old.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
      parent_name TEXT NOT NULL, child_name TEXT NOT NULL, age INTEGER NOT NULL, grade TEXT, avatar TEXT NOT NULL DEFAULT 'lion',
      xp INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE stories (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      topic TEXT NOT NULL, subject TEXT NOT NULL, kind TEXT NOT NULL, level INTEGER NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL,
      moral TEXT, fun_fact TEXT, vocabulary TEXT NOT NULL DEFAULT '[]', image_prompt TEXT, source TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')));
    INSERT INTO users (id, email, password_hash, parent_name, child_name, age, xp) VALUES (7, 'old@example.com', 'hash', 'Asha', 'Dev', 9, 42);
    INSERT INTO stories (user_id, topic, subject, kind, level, title, content, source) VALUES (7, 't', 'science', 'story', 1, 'Title', 'Body', 'offline');
  `);
  old.close();

  process.env.DB_PATH = file;
  const { db } = await import('../src/db.js');
  assert.deepEqual(db.prepare('SELECT id, email, parent_name FROM accounts').all().map((r) => ({ ...r })), [{ id: 7, email: 'old@example.com', parent_name: 'Asha' }]);
  assert.deepEqual({ ...db.prepare('SELECT id, account_id, child_name, xp FROM users').get() }, { id: 7, account_id: 7, child_name: 'Dev', xp: 42 });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM stories WHERE user_id = 7').get().n, 1, 'learning data survives');
  assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
  // Deleting the account still cascades to the child and their stories.
  db.prepare('DELETE FROM accounts WHERE id = 7').run();
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM stories').get().n, 0);
  db.close();
  rmSync(dir, { recursive: true, force: true });
});
