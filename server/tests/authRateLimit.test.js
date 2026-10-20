// Rate-limit tests for the auth routes (Step 17).
// Kept in their own file: Node runs each test file in a separate process,
// so the limiter's counters start fresh and don't affect other tests.

import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/appointment_platform_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');

let server;
let baseUrl;

before(async () => {
  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  mock.restoreAll();
  server.close();
});

function post(path, body) {
  return fetch(baseUrl + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

test('login: the 11th failed attempt within 15 minutes returns 429', async () => {
  mock.method(User, 'findOne', () => ({ select: async () => null })); // every login fails

  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const response = await post('/api/auth/login', {
      email: 'a@example.com',
      password: 'Wrong1234',
    });
    assert.equal(response.status, 401, `attempt ${attempt}`);
  }

  const blocked = await post('/api/auth/login', { email: 'a@example.com', password: 'Wrong1234' });
  assert.equal(blocked.status, 429);
  assert.deepEqual(await blocked.json(), {
    error: 'Too many login attempts. Please try again in 15 minutes.',
  });
  assert.ok(blocked.headers.get('ratelimit'), 'standard RateLimit header is sent');
});

test('register: the 11th attempt within 15 minutes returns 429', async () => {
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    const response = await post('/api/auth/register', {}); // invalid on purpose: still counts
    assert.equal(response.status, 400, `attempt ${attempt}`);
  }
  const blocked = await post('/api/auth/register', {});
  assert.equal(blocked.status, 429);
});
