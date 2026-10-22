// HTTP tests for account roles, tutor sessions, and saved students (Steps 34-35).
// Database calls are mocked; auth, roles, validation, and permission rules are real.

import { test, before, after, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/appointment_platform_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
process.env.AI_API_KEY = '';

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Service } = await import('../src/models/Service.js');
const { Booking } = await import('../src/models/Booking.js');
const { Student } = await import('../src/models/Student.js');
const { signToken } = await import('../src/services/authService.js');
const { tutorEmail } = await import('../scripts/seedTutors.js');

const alice = new User({ name: 'Alice Parent', email: 'alice@example.com', passwordHash: 'x' });
const bob = new User({ name: 'Bob Parent', email: 'bob@example.com', passwordHash: 'x' });
const tutorLane = new User({
  name: 'Ms. Avery Lane',
  email: 'avery.lane@tutors.studyslot.example',
  passwordHash: 'x',
  role: 'tutor',
});
const tutorGrant = new User({
  name: 'Mr. Theo Grant',
  email: 'theo.grant@tutors.studyslot.example',
  passwordHash: 'x',
  role: 'tutor',
});
const users = [alice, bob, tutorLane, tutorGrant];

const mathService = new Service({
  name: 'Middle School Math Boost',
  subject: 'math',
  gradeBand: '6-8',
  summary: 'Math help.',
  description: 'Math help for grades 6-8.',
  tutorName: 'Ms. Avery Lane',
  durationMinutes: 60,
  priceCents: 4500,
  tutor: tutorLane._id,
});
const stateTestService = new Service({
  name: 'State Test Review',
  subject: 'test-prep',
  gradeBand: '6-8',
  summary: 'Test review.',
  description: 'Test review for grades 6-8.',
  tutorName: 'Ms. Avery Lane',
  durationMinutes: 45,
  priceCents: 4000,
  tutor: tutorLane._id,
});
const services = [mathService, stateTestService];

const HOUR = 60 * 60 * 1000;
function makeBooking({ owner = alice, startOffset = -2 * HOUR, status = 'confirmed' } = {}) {
  const start = new Date(Date.now() + startOffset);
  return new Booking({
    user: owner._id,
    service: mathService._id,
    serviceSnapshot: {
      name: mathService.name,
      tutorName: mathService.tutorName,
      durationMinutes: 60,
      priceCents: 4500,
    },
    studentFirstName: 'Sam',
    studentGrade: 7,
    startTime: start,
    endTime: new Date(start.getTime() + HOUR),
    notes: 'Sam has a fractions test.',
    status,
    cancelledAt: status === 'cancelled' ? new Date() : null,
  });
}

let server;
let baseUrl;
let bookings;
let students;
let lastBookingQuery;

before(async () => {
  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

beforeEach(() => {
  bookings = [makeBooking()];
  students = [];
  lastBookingQuery = undefined;

  mock.method(User, 'findById', async (id) => users.find((u) => String(u._id) === id) || null);
  mock.method(Service, 'find', (query) => ({
    select: async () =>
      services.filter((s) => query.tutor && s.tutor && s.tutor.equals(query.tutor)),
  }));
  mock.method(Service, 'findById', (id) => ({
    select: async () => services.find((s) => s._id.equals(id)) || null,
  }));
  mock.method(Booking, 'findById', async (id) => bookings.find((b) => b._id.equals(id)) || null);
  mock.method(Booking, 'find', (query) => {
    lastBookingQuery = query;
    return { sort: async () => bookings };
  });
  mock.method(Booking.prototype, 'save', async function save() {
    await this.validate();
    return this;
  });

  mock.method(Student, 'find', (query) => ({
    sort: async () => students.filter((s) => s.parent.equals(query.parent)),
  }));
  mock.method(Student, 'findById', async (id) => students.find((s) => s._id.equals(id)) || null);
  mock.method(
    Student,
    'countDocuments',
    async (query) => students.filter((s) => s.parent.equals(query.parent)).length,
  );
  mock.method(Student.prototype, 'save', async function save() {
    await this.validate();
    const duplicate = students.find(
      (s) =>
        s !== this &&
        s.parent.equals(this.parent) &&
        s.firstName.toLowerCase() === this.firstName.toLowerCase(),
    );
    if (duplicate) {
      const error = new Error('E11000 duplicate key');
      error.code = 11000;
      throw error;
    }
    if (!students.includes(this)) students.push(this);
    return this;
  });
  mock.method(Student.prototype, 'deleteOne', async function deleteOne() {
    students = students.filter((s) => s !== this);
  });
});
afterEach(() => mock.restoreAll());

async function send(method, path, { user, body } = {}) {
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

// ===== Roles =====

test('users default to the parent role, and the role is included in the user JSON', () => {
  const user = new User({ name: 'New Parent', email: 'new@example.com', passwordHash: 'x' });
  assert.equal(user.role, 'parent');
  assert.equal(user.toJSON().role, 'parent');
  assert.equal(tutorLane.toJSON().role, 'tutor');
});

test('accounts saved before roles existed (no role field) count as parents', async () => {
  const oldAccount = User.hydrate({
    _id: '6ad9684884fb0f93e6f31d03',
    name: 'Pat Smith',
    email: 'pat@example.com',
  });
  assert.equal(oldAccount.role, 'parent');
  assert.equal(oldAccount.toJSON().role, 'parent');

  // ...and can use parent routes.
  users.push(oldAccount);
  try {
    const { status } = await send('GET', '/api/students', { user: oldAccount });
    assert.equal(status, 200);
  } finally {
    users.pop();
  }
});

test('sign-up cannot create a tutor: "role" is not an allowed field', async () => {
  const { status, body } = await send('POST', '/api/auth/register', {
    body: { name: 'Sneaky', email: 'sneaky@example.com', password: 'Passw0rd123', role: 'tutor' },
  });
  assert.equal(status, 400);
  assert.equal(body.details[0].field, 'role');
});

test('the role can never change once set', () => {
  const user = new User({ name: 'Parent', email: 'p@example.com', passwordHash: 'x' });
  user.isNew = false; // pretend it was loaded from the database
  user.role = 'tutor';
  assert.equal(user.role, 'parent');
});

test('403: tutors cannot use parent booking routes', async () => {
  assert.equal((await send('GET', '/api/bookings/mine', { user: tutorLane })).status, 403);
  const created = await send('POST', '/api/bookings', { user: tutorLane, body: {} });
  assert.equal(created.status, 403);
  assert.deepEqual(created.body, { error: 'Only parent accounts can do this' });
  const id = String(bookings[0]._id);
  assert.equal((await send('POST', `/api/bookings/${id}/cancel`, { user: tutorLane })).status, 403);
});

test('403: parents cannot use tutor routes; 401 without login', async () => {
  const asParent = await send('GET', '/api/tutor/sessions', { user: alice });
  assert.equal(asParent.status, 403);
  assert.deepEqual(asParent.body, { error: 'Only tutor accounts can do this' });
  assert.equal((await send('GET', '/api/tutor/sessions')).status, 401);
});

// ===== Tutor sessions =====

test("tutor sees ALL their services' sessions, found by the token's tutor only", async () => {
  const { status, body } = await send('GET', '/api/tutor/sessions', { user: tutorLane });
  assert.equal(status, 200);
  assert.equal(body.length, 1);
  assert.deepEqual(lastBookingQuery.service.$in.map(String), [
    String(mathService._id),
    String(stateTestService._id),
  ]);
});

test('a tutor with no linked services gets an empty filter (sees nothing)', async () => {
  await send('GET', '/api/tutor/sessions', { user: tutorGrant });
  assert.deepEqual(lastBookingQuery.service.$in, []);
});

test("tutor can view one of their sessions; another tutor can't", async () => {
  const id = String(bookings[0]._id);
  const own = await send('GET', `/api/bookings/${id}`, { user: tutorLane });
  assert.equal(own.status, 200);
  assert.equal(own.body.studentFirstName, 'Sam');
  assert.equal((await send('GET', `/api/bookings/${id}`, { user: tutorGrant })).status, 403);
  // The parent who booked it still can; another parent can't.
  assert.equal((await send('GET', `/api/bookings/${id}`, { user: alice })).status, 200);
  assert.equal((await send('GET', `/api/bookings/${id}`, { user: bob })).status, 403);
});

test('tutor marks a started session completed, with a summary for the parent', async () => {
  const id = String(bookings[0]._id);
  const { status, body } = await send('POST', `/api/tutor/sessions/${id}/complete`, {
    user: tutorLane,
    body: { summary: '  Practiced adding fractions with unlike denominators.  ' },
  });
  assert.equal(status, 200);
  assert.ok(body.completedAt);
  assert.equal(body.tutorSummary, 'Practiced adding fractions with unlike denominators.');

  const again = await send('POST', `/api/tutor/sessions/${id}/complete`, { user: tutorLane });
  assert.equal(again.status, 409);
  assert.equal(again.body.error, 'This session is already marked completed');
});

test('409: cannot complete a future or cancelled session', async () => {
  bookings = [makeBooking({ startOffset: 24 * HOUR })];
  const future = await send('POST', `/api/tutor/sessions/${bookings[0]._id}/complete`, {
    user: tutorLane,
  });
  assert.equal(future.status, 409);
  assert.equal(future.body.error, 'A session can be marked completed once it has started');

  bookings = [makeBooking({ status: 'cancelled' })];
  const cancelled = await send('POST', `/api/tutor/sessions/${bookings[0]._id}/complete`, {
    user: tutorLane,
  });
  assert.equal(cancelled.status, 409);
});

test("403/404/400: other tutor's session, unknown id, bad input", async () => {
  const id = String(bookings[0]._id);
  assert.equal(
    (await send('POST', `/api/tutor/sessions/${id}/complete`, { user: tutorGrant })).status,
    403,
  );
  assert.equal(
    (await send('POST', `/api/tutor/sessions/${'f'.repeat(24)}/complete`, { user: tutorLane }))
      .status,
    404,
  );
  const tooLong = await send('POST', `/api/tutor/sessions/${id}/complete`, {
    user: tutorLane,
    body: { summary: 'x'.repeat(501) },
  });
  assert.equal(tooLong.status, 400);
  const sneaky = await send('POST', `/api/tutor/sessions/${id}/complete`, {
    user: tutorLane,
    body: { status: 'cancelled' },
  });
  assert.equal(sneaky.status, 400);
  assert.equal(sneaky.body.details[0].field, 'status');
});

test('tutor login emails are made from the tutor name', () => {
  assert.equal(tutorEmail('Ms. Avery Lane'), 'avery.lane@tutors.studyslot.example');
  assert.equal(tutorEmail('Sra. Lucia Fernandez'), 'lucia.fernandez@tutors.studyslot.example');
  assert.equal(tutorEmail('Mme. Élise Laurent'), 'elise.laurent@tutors.studyslot.example');
  assert.equal(tutorEmail('Dr. Priya Nair'), 'priya.nair@tutors.studyslot.example');
});

// ===== Saved students =====

test('parent saves, lists, renames, and deletes a student', async () => {
  const created = await send('POST', '/api/students', {
    user: alice,
    body: { firstName: '  Sam ', grade: '7' },
  });
  assert.equal(created.status, 201);
  // (createdAt is added by the real database; this fake save doesn't set timestamps)
  assert.deepEqual(Object.keys(created.body).sort(), ['firstName', 'grade', 'id']);
  assert.equal(created.body.firstName, 'Sam');
  assert.equal(created.body.grade, 7);

  const list = await send('GET', '/api/students', { user: alice });
  assert.equal(list.status, 200);
  assert.equal(list.body.length, 1);

  const updated = await send('PATCH', `/api/students/${created.body.id}`, {
    user: alice,
    body: { grade: 8 },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.grade, 8);

  const removed = await send('DELETE', `/api/students/${created.body.id}`, { user: alice });
  assert.equal(removed.status, 204);
  assert.equal(students.length, 0);
});

test('parents only see and change their OWN students', async () => {
  const created = await send('POST', '/api/students', {
    user: alice,
    body: { firstName: 'Sam', grade: 7 },
  });
  const id = created.body.id;

  assert.deepEqual((await send('GET', '/api/students', { user: bob })).body, []);
  assert.equal(
    (await send('PATCH', `/api/students/${id}`, { user: bob, body: { grade: 9 } })).status,
    403,
  );
  assert.equal((await send('DELETE', `/api/students/${id}`, { user: bob })).status, 403);
  assert.equal(
    (await send('DELETE', `/api/students/${'a'.repeat(24)}`, { user: alice })).status,
    404,
  );
  assert.equal(students.length, 1);
});

test('409: duplicate first name (any capitalization) and the 10-student limit', async () => {
  await send('POST', '/api/students', { user: alice, body: { firstName: 'Sam', grade: 7 } });
  const duplicate = await send('POST', '/api/students', {
    user: alice,
    body: { firstName: 'sam', grade: 9 },
  });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.error, 'You already saved a student with this first name');

  // Another parent may use the same name.
  const otherParent = await send('POST', '/api/students', {
    user: bob,
    body: { firstName: 'Sam', grade: 9 },
  });
  assert.equal(otherParent.status, 201);

  for (const name of ['Ava', 'Ben', 'Cal', 'Dee', 'Eli', 'Fay', 'Gus', 'Hal', 'Ivy']) {
    await send('POST', '/api/students', { user: alice, body: { firstName: name, grade: 6 } });
  }
  const eleventh = await send('POST', '/api/students', {
    user: alice,
    body: { firstName: 'Jo', grade: 6 },
  });
  assert.equal(eleventh.status, 409);
  assert.equal(eleventh.body.error, 'You can save up to 10 students');
});

test('400: student validation and unknown fields', async () => {
  const cases = [
    [{ grade: 7 }, 'firstName'],
    [{ firstName: 'Sam' }, 'grade'],
    [{ firstName: 'R2-D2', grade: 7 }, 'firstName'],
    [{ firstName: 'Sam', grade: 5 }, 'grade'],
    [{ firstName: 'Sam', grade: 7, parent: String(bob._id) }, 'parent'],
  ];
  for (const [body, field] of cases) {
    const { status, body: json } = await send('POST', '/api/students', { user: alice, body });
    assert.equal(status, 400, JSON.stringify(body));
    assert.equal(json.details[0].field, field);
  }
  const empty = await send('PATCH', `/api/students/${'a'.repeat(24)}`, { user: alice, body: {} });
  assert.equal(empty.status, 400);
});

test('403: tutors have no saved students', async () => {
  assert.equal((await send('GET', '/api/students', { user: tutorLane })).status, 403);
});

// ===== AI session prep (fallback path: no AI key in tests) =====

test('session prep: the parent and the tutor get tips; others are refused', async () => {
  const bookingId = String(bookings[0]._id);

  const asParent = await send('POST', '/api/ai/session-prep', { user: alice, body: { bookingId } });
  assert.equal(asParent.status, 200);
  assert.equal(asParent.body.source, 'fallback');
  assert.ok(asParent.body.tips.length >= 3 && asParent.body.tips.length <= 5);
  assert.match(asParent.body.tips[0], /homework or practice problems/); // math tips
  assert.equal(typeof asParent.body.disclaimer, 'string');

  const asTutor = await send('POST', '/api/ai/session-prep', {
    user: tutorLane,
    body: { bookingId },
  });
  assert.equal(asTutor.status, 200);

  assert.equal(
    (await send('POST', '/api/ai/session-prep', { user: bob, body: { bookingId } })).status,
    403,
  );
  assert.equal(
    (await send('POST', '/api/ai/session-prep', { user: tutorGrant, body: { bookingId } })).status,
    403,
  );
  assert.equal((await send('POST', '/api/ai/session-prep', { body: { bookingId } })).status, 401);
});

test('session prep: 400 bad id, 404 unknown, 409 cancelled', async () => {
  const bad = await send('POST', '/api/ai/session-prep', {
    user: alice,
    body: { bookingId: 'nope' },
  });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.details[0].field, 'bookingId');

  const missing = await send('POST', '/api/ai/session-prep', {
    user: alice,
    body: { bookingId: 'b'.repeat(24) },
  });
  assert.equal(missing.status, 404);

  bookings = [makeBooking({ status: 'cancelled' })];
  const cancelled = await send('POST', '/api/ai/session-prep', {
    user: alice,
    body: { bookingId: String(bookings[0]._id) },
  });
  assert.equal(cancelled.status, 409);
});
