import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_PATH = ':memory:';
process.env.AI_OFFLINE = '1';

let server, base, token;

async function api(path, { method = 'GET', body, auth = true } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(auth && token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: res.status === 204 ? null : await res.json() };
}

before(async () => {
  const { app } = await import('../src/app.js');
  server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  base = `http://localhost:${server.address().port}/api`;
});

after(() => server.close());

test('register validates input and requires consent', async () => {
  const bad = await api('/auth/register', { method: 'POST', body: { email: 'x@y.com', password: 'secret1', parentName: 'P', childName: 'Kid', age: 8 } });
  assert.equal(bad.status, 400);
  const ok = await api('/auth/register', { method: 'POST', body: { email: 'Parent@Example.com', password: 'secret1', parentName: 'Priya', childName: 'Aarav', age: 8, grade: '3', avatar: 'owl', consent: true } });
  assert.equal(ok.status, 201);
  assert.equal(ok.data.user.email, 'parent@example.com');
  assert.equal(ok.data.user.avatar, 'owl');
  const dup = await api('/auth/register', { method: 'POST', body: { email: 'parent@example.com', password: 'secret1', parentName: 'P', childName: 'K', age: 8, consent: true } });
  assert.equal(dup.status, 409);
});

test('login and protected routes', async () => {
  const wrong = await api('/auth/login', { method: 'POST', body: { email: 'parent@example.com', password: 'nope' } });
  assert.equal(wrong.status, 401);
  const ok = await api('/auth/login', { method: 'POST', body: { email: 'parent@example.com', password: 'secret1' } });
  assert.equal(ok.status, 200);
  assert.deepEqual(ok.data.profiles.map((p) => p.childName), ['Aarav']);
  // A parent session is not a learner session...
  token = ok.data.parentToken;
  assert.equal((await api('/auth/me')).status, 401);
  // ...until the parent picks who is learning.
  const sw = await api('/auth/switch', { method: 'POST', body: { profileId: ok.data.profiles[0].id } });
  assert.equal(sw.status, 200);
  token = sw.data.token;
  assert.equal((await api('/auth/me')).data.user.childName, 'Aarav');
  assert.equal((await api('/progress', { auth: false })).status, 401);
});

test('unsafe topics are rejected', async () => {
  const res = await api('/stories/generate', { method: 'POST', body: { topic: 'how to make a bomb', subject: 'science' } });
  assert.equal(res.status, 400);
});

test('story -> quiz -> submit updates xp, mastery and badges', async () => {
  const gen = await api('/stories/generate', { method: 'POST', body: { topic: 'the water cycle', subject: 'science', kind: 'story' } });
  assert.equal(gen.status, 201);
  assert.equal(gen.data.story.source, 'offline');
  assert.ok(gen.data.newBadges.some((b) => b.id === 'first_story'));
  const storyId = gen.data.story.id;

  const q = await api(`/stories/${storyId}/quiz`, { method: 'POST' });
  assert.equal(q.status, 201);
  const again = await api(`/stories/${storyId}/quiz`, { method: 'POST' });
  assert.equal(again.data.quizId, q.data.quizId);

  const quiz = (await api(`/quizzes/${q.data.quizId}`)).data.quiz;
  assert.ok(quiz.questions.length >= 3);
  assert.equal(quiz.questions[0].answer, undefined, 'answers must not leak');

  // Find the right answer to every question via /check, then submit a perfect score.
  const answers = [];
  for (let i = 0; i < quiz.questions.length; i++) {
    answers.push((await api(`/quizzes/${quiz.id}/check`, { method: 'POST', body: { index: i, choice: 0 } })).data.answer);
  }
  const result = await api(`/quizzes/${quiz.id}/submit`, { method: 'POST', body: { answers } });
  assert.equal(result.data.score, result.data.total);
  assert.deepEqual(result.data.level, { before: 1, after: 2 });
  assert.ok(result.data.newBadges.some((b) => b.id === 'sharp_eye'));

  const progress = (await api('/progress')).data;
  assert.equal(progress.totals.stories, 1);
  assert.equal(progress.totals.quizzes, 1);
  assert.equal(progress.streak, 1);
  assert.equal(progress.xp, 10 + result.data.xpGained);
  assert.equal(progress.mastery.find((m) => m.subject === 'science').level, 2);
  assert.equal(progress.recommendations.length, 4);
});

test('other users cannot see my stories', async () => {
  const mine = (await api('/stories')).data.stories[0];
  const reg = await api('/auth/register', { method: 'POST', body: { email: 'other@example.com', password: 'secret1', parentName: 'O', childName: 'Other', age: 7, consent: true } });
  const saved = token;
  token = reg.data.token;
  assert.equal((await api(`/stories/${mine.id}`)).status, 404);
  token = saved;
});

test('games record results, award XP up to a daily cap, and earn the Game On badge', async () => {
  const story = (await api('/stories')).data.stories[0];
  const finish = (body) => api('/games/finish', { method: 'POST', body });
  assert.equal((await finish({ game: 'chess', score: 1, total: 2 })).status, 400);
  assert.equal((await finish({ game: 'memory', score: 5, total: 4 })).status, 400);
  assert.equal((await finish({ game: 'memory', score: 1.5, total: 4 })).status, 400);
  assert.equal((await finish({ game: 'memory', score: 1, total: 4, storyId: 99999 })).status, 404);

  const xpBefore = (await api('/progress')).data.xp;
  const first = await finish({ game: 'memory', score: 4, total: 4, storyId: story.id });
  assert.equal(first.status, 201);
  assert.equal(first.data.xpGained, 10);
  assert.equal(first.data.previousBest, null);
  const again = await finish({ game: 'memory', score: 2, total: 4, storyId: story.id });
  assert.equal(again.data.xpGained, 6);
  assert.equal(again.data.previousBest, 100);

  // Keep playing: game XP stops at the daily cap, but plays still count.
  let xp = first.data.xpGained + again.data.xpGained;
  let badge = false;
  for (let i = 0; i < 5; i++) {
    const r = await finish({ game: 'math', score: 10, total: 10 });
    xp += r.data.xpGained;
    badge ||= r.data.newBadges.some((b) => b.id === 'game_on');
  }
  assert.equal(xp, 50);
  assert.ok(badge, 'the 5th game earns the Game On badge');

  const stats = (await api('/games/stats')).data;
  assert.equal(stats.played, 7);
  assert.equal(stats.xpToday, 50);
  assert.equal(stats.games.memory.best, 100);
  assert.equal(stats.mathLevel, 1);
  const progress = (await api('/progress')).data;
  assert.equal(progress.xp, xpBefore + 50);
  assert.equal(progress.totals.games, 7);
  assert.equal(progress.mastery.find((m) => m.subject === 'math').level, 1, 'games never change subject levels');
});

test('homework returns a friendly 503 when AI is offline', async () => {
  const res = await api('/homework/ask', { method: 'POST', body: { question: 'What is 7 x 8?', subject: 'math', mode: 'hint' } });
  assert.equal(res.status, 503);
  assert.match(res.data.error, /Guru Owl/);
});

test('story images need a valid signature and answer 202 until cached', async () => {
  const story = (await api('/stories')).data.stories[0];
  assert.match(story.imageUrl, /^\/api\/images\/\d+\?k=[0-9a-f]{20}$/);
  assert.equal((await fetch(base.replace('/api', '') + `/api/images/${story.id}?k=wrong`)).status, 404);
  assert.equal((await fetch(base.replace('/api', '') + story.imageUrl)).status, 202);
});

test('parent corner: locked for children, unlocked with the account password', async () => {
  const learnerToken = token;
  const locked = await api('/parent/overview');
  assert.equal(locked.status, 403);
  assert.equal(locked.data.code, 'PARENT_LOCKED');
  assert.equal((await api('/auth/unlock', { method: 'POST', body: { password: 'wrong' } })).status, 401);
  const unlock = await api('/auth/unlock', { method: 'POST', body: { password: 'secret1' } });
  assert.equal(unlock.status, 200);

  token = unlock.data.parentToken;
  const overview = (await api('/parent/overview')).data;
  assert.equal(overview.account.parentName, 'Priya');
  assert.equal(overview.children.length, 1);
  assert.equal(overview.children[0].totals.stories, 1);
  assert.ok(overview.children[0].insights.length > 0);
  token = learnerToken;
});

test('parent can add, edit, switch to and remove explorers', async () => {
  const learnerToken = token;
  token = (await api('/auth/unlock', { method: 'POST', body: { password: 'secret1' } })).data.parentToken;

  const add = await api('/parent/children', { method: 'POST', body: { childName: 'Meera', age: 6, avatar: 'elephant' } });
  assert.equal(add.status, 201);
  const meera = add.data.profile;
  assert.equal((await api(`/parent/children/${meera.id}`, { method: 'PATCH', body: { grade: '1' } })).data.profile.grade, '1');

  const detail = (await api(`/parent/children/${meera.id}`)).data;
  assert.equal(detail.profile.childName, 'Meera');
  assert.deepEqual(detail.activity, []);
  assert.equal(detail.badges.length, 9);

  // A sibling can switch to Meera without the parent password.
  token = learnerToken;
  assert.equal((await api('/auth/profiles')).data.profiles.length, 2);
  const sw = await api('/auth/switch', { method: 'POST', body: { profileId: meera.id } });
  assert.equal(sw.data.user.childName, 'Meera');
  assert.equal((await api('/stories', { auth: true })).status, 200);

  token = (await api('/auth/unlock', { method: 'POST', body: { password: 'secret1' } })).data.parentToken;
  assert.equal((await api(`/parent/children/${meera.id}`, { method: 'DELETE' })).status, 204);
  const aarav = (await api('/parent/overview')).data.children[0].profile;
  const last = await api(`/parent/children/${aarav.id}`, { method: 'DELETE' });
  assert.equal(last.status, 400, 'the last explorer cannot be removed');
  assert.equal((await api('/auth/switch', { method: 'POST', body: { profileId: meera.id } })).status, 404);
  token = learnerToken;
});

test('families cannot see each other', async () => {
  const learnerToken = token;
  const other = await api('/auth/register', { method: 'POST', body: { email: 'family2@example.com', password: 'secret1', parentName: 'Ravi', childName: 'Kabir', age: 9, consent: true } });
  const aaravId = (await api('/auth/me')).data.user.id;
  token = other.data.parentToken;
  assert.equal((await api(`/parent/children/${aaravId}`)).status, 404);
  assert.equal((await api('/auth/switch', { method: 'POST', body: { profileId: aaravId } })).status, 404);
  assert.equal((await api('/parent/overview')).data.children.length, 1);
  token = learnerToken;
});

test('parent can change the password', async () => {
  const learnerToken = token;
  token = (await api('/auth/unlock', { method: 'POST', body: { password: 'secret1' } })).data.parentToken;
  assert.equal((await api('/parent/password', { method: 'POST', body: { currentPassword: 'nope', newPassword: 'newpass1' } })).status, 400);
  assert.equal((await api('/parent/password', { method: 'POST', body: { currentPassword: 'secret1', newPassword: 'newpass1' } })).status, 200);
  assert.equal((await api('/auth/login', { method: 'POST', body: { email: 'parent@example.com', password: 'newpass1' } })).status, 200);
  token = learnerToken;
});
