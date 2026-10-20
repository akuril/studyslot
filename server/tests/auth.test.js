// Automated tests for the Authentication API (Step 17).
// Run from the server folder:  npm test
//
// No database: User.create / findOne / findById are mocked. Password hashing and
// JWT signing are REAL, so these tests prove the actual security behavior.

import { test, before, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/appointment_platform_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { hashPassword, signToken } = await import('../src/services/authService.js');
const { default: jwt } = await import('jsonwebtoken');

const PASSWORD = 'Passw0rd123';
let existingUser; // a fake "saved" user with a real bcrypt hash

let server;
let baseUrl;

before(async () => {
  existingUser = new User({
    name: 'Jordan Rivera',
    email: 'jordan.rivera@example.com',
    passwordHash: await hashPassword(PASSWORD),
  });
  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());
afterEach(() => mock.restoreAll());

async function call(method, path, { body, token, headers = {} } = {}) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

// Mocks for the queries the auth code makes.
function mockFindOneForLogin(user) {
  mock.method(User, 'findOne', (filter) => ({
    select: async (fields) => {
      assert.deepEqual(filter, { email: 'jordan.rivera@example.com' });
      assert.equal(fields, '+passwordHash');
      return user;
    },
  }));
}

function mockFindById(user) {
  mock.method(User, 'findById', async (id) => (user && String(user._id) === id ? user : null));
}

// ===== Register =====

test('1. successful registration: 201, token, safe user, password hashed', async () => {
  let saved;
  mock.method(User, 'create', async (data) => {
    saved = data;
    return new User(data);
  });

  const res = await call('POST', '/api/auth/register', {
    body: { name: '  Jordan Rivera ', email: ' Jordan.Rivera@Example.COM ', password: PASSWORD },
  });

  assert.equal(res.status, 201);
  assert.equal(typeof res.body.token, 'string');
  assert.equal(res.body.user.name, 'Jordan Rivera');
  assert.equal(res.body.user.email, 'jordan.rivera@example.com');
  assert.ok(!('passwordHash' in res.body.user));
  assert.ok(!('password' in res.body.user));

  // What was saved: a bcrypt hash, never the plain password.
  assert.notEqual(saved.passwordHash, PASSWORD);
  assert.match(saved.passwordHash, /^\$2[aby]\$12\$/);
  assert.ok(!('password' in saved));
});

test('2. duplicate email returns 409', async () => {
  mock.method(User, 'create', async () => {
    throw Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
  });
  const res = await call('POST', '/api/auth/register', {
    body: { name: 'Jordan', email: 'jordan.rivera@example.com', password: PASSWORD },
  });
  assert.equal(res.status, 409);
  assert.deepEqual(res.body, { error: 'An account with this email already exists' });
});

test('3. weak or missing passwords are rejected with clear messages', async () => {
  const cases = [
    [undefined, 'Password is required'],
    ['short1', 'Password must be at least 8 characters'],
    ['allletters', 'Password must include at least one letter and one number'],
    ['12345678', 'Password must include at least one letter and one number'],
    ['a1' + 'x'.repeat(71), 'Password is too long (maximum 72 characters)'],
  ];
  for (const [password, message] of cases) {
    const res = await call('POST', '/api/auth/register', {
      body: {
        name: 'Jordan',
        email: 'j@example.com',
        ...(password !== undefined ? { password } : {}),
      },
    });
    assert.equal(res.status, 400, String(password));
    assert.deepEqual(res.body.details, [{ field: 'password', message }]);
  }
});

test('register validates name and email, and rejects a "role" field', async () => {
  const bad = await call('POST', '/api/auth/register', {
    body: { name: 'J', email: 'not-an-email', password: PASSWORD },
  });
  assert.equal(bad.status, 400);
  assert.deepEqual(
    bad.body.details.map((detail) => detail.field),
    ['name', 'email'],
  );

  const withRole = await call('POST', '/api/auth/register', {
    body: { name: 'Jordan', email: 'j@example.com', password: PASSWORD, role: 'admin' },
  });
  assert.equal(withRole.status, 400);
  assert.deepEqual(withRole.body.details, [
    { field: 'role', message: 'This field is not allowed' },
  ]);
});

// ===== Login =====

test('4. successful login: 200 with token and safe user', async () => {
  mockFindOneForLogin(existingUser);
  const res = await call('POST', '/api/auth/login', {
    body: { email: 'JORDAN.RIVERA@example.com', password: PASSWORD },
  });
  assert.equal(res.status, 200);
  assert.equal(typeof res.body.token, 'string');
  assert.equal(res.body.user.email, 'jordan.rivera@example.com');
  assert.ok(!('passwordHash' in res.body.user));

  const payload = jwt.decode(res.body.token);
  assert.equal(payload.sub, String(existingUser._id));
  assert.ok(payload.exp > payload.iat);
  assert.deepEqual(Object.keys(payload).sort(), ['exp', 'iat', 'sub']); // no personal data
});

test('5. wrong password and unknown email give the SAME 401', async () => {
  mockFindOneForLogin(existingUser);
  const wrongPassword = await call('POST', '/api/auth/login', {
    body: { email: 'jordan.rivera@example.com', password: 'WrongPass99' },
  });
  mock.restoreAll();

  mockFindOneForLogin(null);
  const unknownEmail = await call('POST', '/api/auth/login', {
    body: { email: 'jordan.rivera@example.com', password: PASSWORD },
  });

  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownEmail.status, 401);
  assert.deepEqual(wrongPassword.body, { error: 'Invalid email or password' });
  assert.deepEqual(unknownEmail.body, wrongPassword.body);
});

test('login requires email and password', async () => {
  const res = await call('POST', '/api/auth/login', { body: {} });
  assert.equal(res.status, 400);
  assert.deepEqual(
    res.body.details.map((detail) => detail.field),
    ['email', 'password'],
  );
});

// ===== /me and the authenticate middleware =====

test('6. protected route without a token returns 401', async () => {
  const res = await call('GET', '/api/auth/me');
  assert.equal(res.status, 401);
  assert.deepEqual(res.body, { error: 'Authentication required' });
});

test('7. protected route with a valid token returns the user', async () => {
  mockFindById(existingUser);
  const res = await call('GET', '/api/auth/me', { token: signToken(existingUser._id) });
  assert.equal(res.status, 200);
  assert.equal(res.body.user.id, String(existingUser._id));
  assert.equal(res.body.user.email, 'jordan.rivera@example.com');
  assert.ok(!('passwordHash' in res.body.user));
});

test('8a. expired token returns 401 "Session expired"', async () => {
  mockFindById(existingUser);
  const expired = jwt.sign(
    { sub: String(existingUser._id), exp: Math.floor(Date.now() / 1000) - 60 },
    process.env.JWT_SECRET,
    { algorithm: 'HS256' },
  );
  const res = await call('GET', '/api/auth/me', { token: expired });
  assert.equal(res.status, 401);
  assert.deepEqual(res.body, { error: 'Session expired. Please log in again.' });
});

test('8b. malformed, forged, "alg: none", and wrong-scheme tokens return 401', async () => {
  mockFindById(existingUser);
  const forged = jwt.sign(
    { sub: String(existingUser._id) },
    'a-different-secret-that-is-32-chars-long!!',
  );
  const algNone = jwt.sign({ sub: String(existingUser._id) }, null, { algorithm: 'none' });

  for (const authorization of [
    'Bearer not-a-real-token',
    `Bearer ${forged}`,
    `Bearer ${algNone}`,
    `Basic ${signToken(existingUser._id)}`,
    'Bearer',
  ]) {
    const res = await call('GET', '/api/auth/me', { headers: { Authorization: authorization } });
    assert.equal(res.status, 401, authorization.slice(0, 30));
    assert.deepEqual(res.body, { error: 'Authentication required' });
  }
});

test('valid token for a deleted user returns 401', async () => {
  mockFindById(null);
  const res = await call('GET', '/api/auth/me', { token: signToken(existingUser._id) });
  assert.equal(res.status, 401);
});
