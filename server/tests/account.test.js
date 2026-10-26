// Automated tests for the account page API: edit profile, change password, summary.
// Run from the server folder:  npm test
//
// No database: model calls are mocked. Authentication, validation, password hashing and
// the rules are REAL.

import { test, before, after, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/appointment_platform_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Booking } = await import('../src/models/Booking.js');
const { Service } = await import('../src/models/Service.js');
const { Student } = await import('../src/models/Student.js');
const { hashPassword, verifyPassword, signToken } = await import('../src/services/authService.js');
const { countBookings } = await import('../src/controllers/accountController.js');

const PASSWORD = 'Passw0rd123';
const HOUR = 60 * 60 * 1000;

let server;
let baseUrl;
let passwordHash;

before(async () => {
  passwordHash = await hashPassword(PASSWORD);
  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

let users;
let saves;

function makeUser(role = 'parent', name = 'Jordan Rivera') {
  const user = new User({
    name,
    email: `${name.toLowerCase().replace(/\W+/g, '.')}.${new mongoose.Types.ObjectId()}@example.com`,
    role,
    passwordHash,
  });
  users.push(user);
  return user;
}

beforeEach(() => {
  users = [];
  saves = 0;
  // findById works both as `await findById(id)` and `findById(id).select('+passwordHash')`.
  mock.method(User, 'findById', (id) => {
    const found = users.find((u) => String(u._id) === String(id)) || null;
    const query = Promise.resolve(found);
    query.select = async () => found;
    return query;
  });
  mock.method(User.prototype, 'save', async function save() {
    saves += 1;
    return this;
  });
});
afterEach(() => mock.restoreAll());

async function call(method, path, { body, user } = {}) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(user ? { Authorization: `Bearer ${signToken(user._id)}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

function fieldMessage(res, field) {
  return (res.body.details || []).find((d) => d.field === field)?.message;
}

// ===== PATCH /api/auth/me =====

test('a parent can change their name (trimmed); email and role are untouched', async () => {
  const user = makeUser('parent');
  const email = user.email;
  const res = await call('PATCH', '/api/auth/me', { user, body: { name: '  Jordan R. Rivera ' } });

  assert.equal(res.status, 200);
  assert.equal(res.body.user.name, 'Jordan R. Rivera');
  assert.equal(res.body.user.email, email);
  assert.equal(res.body.user.role, 'parent');
  assert.ok(!('bio' in res.body.user), 'parents have no bio');
  assert.ok(!('passwordHash' in res.body.user));
  assert.equal(saves, 1);
});

test('name must be 2 to 60 characters', async () => {
  const user = makeUser('parent');
  for (const name of ['A', ' ', 'x'.repeat(61), 42]) {
    const res = await call('PATCH', '/api/auth/me', { user, body: { name } });
    assert.equal(res.status, 400, `name ${JSON.stringify(name)}`);
    assert.ok(fieldMessage(res, 'name'));
  }
  assert.equal(saves, 0);
});

test('email, role, and unknown fields cannot be sent (mass assignment)', async () => {
  const user = makeUser('parent');
  for (const body of [
    { name: 'Jordan Rivera', email: 'other@example.com' },
    { name: 'Jordan Rivera', role: 'tutor' },
    { name: 'Jordan Rivera', passwordHash: 'x' },
  ]) {
    const res = await call('PATCH', '/api/auth/me', { user, body });
    assert.equal(res.status, 400);
  }
  assert.equal(user.role, 'parent');
  assert.equal(saves, 0);
});

test('an empty change is refused', async () => {
  const user = makeUser('parent');
  const res = await call('PATCH', '/api/auth/me', { user, body: {} });
  assert.equal(res.status, 400);
  assert.equal(saves, 0);
});

test('a parent cannot add a bio', async () => {
  const user = makeUser('parent');
  const res = await call('PATCH', '/api/auth/me', { user, body: { bio: 'Hello' } });
  assert.equal(res.status, 400);
  assert.equal(fieldMessage(res, 'bio'), 'Only tutors can add a bio');
  assert.equal(saves, 0);
});

test('a tutor can set and clear their bio', async () => {
  const user = makeUser('tutor', 'Nora Patel');
  const set = await call('PATCH', '/api/auth/me', { user, body: { bio: '  I love helping students plan.  ' } });
  assert.equal(set.status, 200);
  assert.equal(set.body.user.bio, 'I love helping students plan.');

  const cleared = await call('PATCH', '/api/auth/me', { user, body: { bio: '' } });
  assert.equal(cleared.status, 200);
  assert.equal(cleared.body.user.bio, '');
});

test('a bio over 300 characters or not text is refused', async () => {
  const user = makeUser('tutor', 'Nora Patel');
  for (const bio of ['x'.repeat(301), 123, ['a']]) {
    const res = await call('PATCH', '/api/auth/me', { user, body: { bio } });
    assert.equal(res.status, 400);
    assert.ok(fieldMessage(res, 'bio'));
  }
});

test('profile and summary and change-password need a login (401)', async () => {
  assert.equal((await call('PATCH', '/api/auth/me', { body: { name: 'Jordan Rivera' } })).status, 401);
  assert.equal((await call('GET', '/api/auth/me/summary')).status, 401);
  assert.equal(
    (await call('POST', '/api/auth/change-password', { body: { currentPassword: 'a', newPassword: 'b' } })).status,
    401,
  );
});

// ===== POST /api/auth/change-password =====

test('change password: stores a new bcrypt hash that only the new password matches', async () => {
  const user = makeUser('parent');
  const res = await call('POST', '/api/auth/change-password', {
    user,
    body: { currentPassword: PASSWORD, newPassword: 'NewPassw0rd456' },
  });

  assert.equal(res.status, 200);
  assert.equal(res.body.message, 'Password updated');
  assert.equal(saves, 1);
  assert.notEqual(user.passwordHash, 'NewPassw0rd456');
  assert.equal(await verifyPassword('NewPassw0rd456', user.passwordHash), true);
  assert.equal(await verifyPassword(PASSWORD, user.passwordHash), false);
});

test('a wrong current password is a 400 with a field message, never a 401', async () => {
  const user = makeUser('parent');
  const before = user.passwordHash;
  const res = await call('POST', '/api/auth/change-password', {
    user,
    body: { currentPassword: 'WrongPassw0rd', newPassword: 'NewPassw0rd456' },
  });

  assert.equal(res.status, 400); // 401 would log the person out in the browser
  assert.equal(fieldMessage(res, 'currentPassword'), 'Current password is incorrect');
  assert.equal(user.passwordHash, before);
  assert.equal(saves, 0);
});

test('the new password must be strong and different', async () => {
  const user = makeUser('parent');
  const cases = [
    [{ currentPassword: PASSWORD, newPassword: 'short1' }, 'newPassword'],
    [{ currentPassword: PASSWORD, newPassword: 'onlyletters' }, 'newPassword'],
    [{ currentPassword: PASSWORD, newPassword: '12345678901' }, 'newPassword'],
    [{ currentPassword: PASSWORD, newPassword: 'a1'.repeat(40) }, 'newPassword'],
    [{ currentPassword: PASSWORD, newPassword: PASSWORD }, 'newPassword'],
    [{ currentPassword: '', newPassword: 'NewPassw0rd456' }, 'currentPassword'],
    [{ newPassword: 'NewPassw0rd456' }, 'currentPassword'],
    [{ currentPassword: PASSWORD }, 'newPassword'],
  ];
  for (const [body, field] of cases) {
    const res = await call('POST', '/api/auth/change-password', { user, body });
    assert.equal(res.status, 400, JSON.stringify(body));
    assert.ok(fieldMessage(res, field), `${field} for ${JSON.stringify(body)}`);
  }
  assert.equal(saves, 0);
});

test('change password rejects extra fields', async () => {
  const user = makeUser('parent');
  const res = await call('POST', '/api/auth/change-password', {
    user,
    body: { currentPassword: PASSWORD, newPassword: 'NewPassw0rd456', email: 'x@example.com' },
  });
  assert.equal(res.status, 400);
  assert.equal(saves, 0);
});

test('too many wrong current passwords are rate limited (429)', async () => {
  const user = makeUser('parent', 'Limit Tester');
  let last;
  for (let attempt = 0; attempt < 11; attempt += 1) {
    last = await call('POST', '/api/auth/change-password', {
      user,
      body: { currentPassword: 'WrongPassw0rd', newPassword: 'NewPassw0rd456' },
    });
  }
  assert.equal(last.status, 429);
  assert.equal(saves, 0);
});

// ===== GET /api/auth/me/summary =====

test('countBookings: cancelled, completed (marked or ended), upcoming', () => {
  const now = new Date();
  const at = (hours) => new Date(now.getTime() + hours * HOUR);
  const counts = countBookings(
    [
      { status: 'confirmed', completedAt: null, endTime: at(24) }, // upcoming
      { status: 'confirmed', completedAt: null, endTime: at(-2) }, // ended -> completed
      { status: 'confirmed', completedAt: at(-1), endTime: at(1) }, // marked -> completed
      { status: 'cancelled', completedAt: null, endTime: at(24) }, // cancelled
      { status: 'cancelled', completedAt: null, endTime: at(-24) }, // cancelled (not completed)
    ],
    now,
  );
  assert.deepEqual(counts, { upcoming: 1, completed: 2, cancelled: 2 });
});

test('parent summary: own booking counts and saved students only', async () => {
  const user = makeUser('parent');
  const now = Date.now();
  let bookingQuery;
  let studentQuery;
  mock.method(Booking, 'find', (query) => {
    bookingQuery = query;
    return {
      select: async () => [
        { status: 'confirmed', completedAt: null, endTime: new Date(now + 24 * HOUR) },
        { status: 'confirmed', completedAt: new Date(now - HOUR), endTime: new Date(now - HOUR) },
        { status: 'cancelled', completedAt: null, endTime: new Date(now + 48 * HOUR) },
      ],
    };
  });
  mock.method(Student, 'countDocuments', async (query) => {
    studentQuery = query;
    return 3;
  });

  const res = await call('GET', '/api/auth/me/summary', { user });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, {
    role: 'parent',
    bookings: { upcoming: 1, completed: 1, cancelled: 1 },
    students: 3,
  });
  assert.equal(String(bookingQuery.user), String(user._id));
  assert.equal(String(studentQuery.parent), String(user._id));
});

test('tutor summary: their services, counts, and sessions waiting to be completed', async () => {
  const user = makeUser('tutor', 'Nora Patel');
  const now = Date.now();
  const serviceId = new mongoose.Types.ObjectId();
  let serviceQuery;
  let bookingQuery;
  mock.method(Service, 'find', (query) => {
    serviceQuery = query;
    return {
      sort: async () => [
        {
          _id: serviceId,
          name: 'Study Skills Coaching',
          subject: 'study-skills',
          gradeBand: '6-12',
          durationMinutes: 45,
          priceCents: 4000,
          isActive: true,
          tutor: user._id,
          description: 'internal text that must not be sent',
        },
      ],
    };
  });
  mock.method(Booking, 'find', (query) => {
    bookingQuery = query;
    return {
      select: async () => [
        { status: 'confirmed', completedAt: null, startTime: new Date(now + 24 * HOUR), endTime: new Date(now + 25 * HOUR) },
        { status: 'confirmed', completedAt: null, startTime: new Date(now - 2 * HOUR), endTime: new Date(now - HOUR) }, // needs completing
        { status: 'confirmed', completedAt: new Date(now - HOUR), startTime: new Date(now - 3 * HOUR), endTime: new Date(now - 2 * HOUR) },
        { status: 'cancelled', completedAt: null, startTime: new Date(now + 48 * HOUR), endTime: new Date(now + 49 * HOUR) },
      ],
    };
  });

  const res = await call('GET', '/api/auth/me/summary', { user });
  assert.equal(res.status, 200);
  assert.equal(res.body.role, 'tutor');
  assert.deepEqual(res.body.bookings, { upcoming: 1, completed: 2, cancelled: 1, needsCompleting: 1 });
  assert.deepEqual(res.body.services, [
    {
      id: String(serviceId),
      name: 'Study Skills Coaching',
      subject: 'study-skills',
      gradeBand: '6-12',
      durationMinutes: 45,
      priceCents: 4000,
      isActive: true,
    },
  ]);
  assert.equal(String(serviceQuery.tutor), String(user._id));
  assert.deepEqual(bookingQuery.service.$in.map(String), [String(serviceId)]);
});
