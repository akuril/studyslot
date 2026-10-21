// HTTP tests for POST /api/bookings (Step 19).
// Database calls are mocked; auth, validation, and booking rules are real.

import { test, before, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/appointment_platform_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Service } = await import('../src/models/Service.js');
const { Booking } = await import('../src/models/Booking.js');
const { signToken } = await import('../src/services/authService.js');
const { getEasternTime } = await import('../src/services/bookingRules.js');

const parent = new User({ name: 'Jordan Rivera', email: 'jordan@example.com', passwordHash: 'x' });
const mathService = new Service({
  name: 'Middle School Math Boost',
  subject: 'math',
  gradeBand: '6-8',
  summary: 'Math help.',
  description: 'Math help for grades 6-8.',
  tutorName: 'Ms. Avery Lane',
  durationMinutes: 60,
  priceCents: 4500,
});

// A real future Tuesday at 4:00 PM Eastern, 3-9 days from today (works in EDT or EST).
function nextTuesdayAt4pmEastern() {
  for (let daysAhead = 3; daysAhead <= 10; daysAhead += 1) {
    const day = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    for (const offsetHours of [4, 5]) {
      const candidate = new Date(
        Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 16 + offsetHours),
      );
      const eastern = getEasternTime(candidate);
      if (eastern.weekday === 2 && eastern.minutesOfDay === 16 * 60) {
        return candidate;
      }
    }
  }
  throw new Error('No Tuesday found');
}

const SLOT = nextTuesdayAt4pmEastern();
const validBody = () => ({
  serviceId: String(mathService._id),
  studentFirstName: 'Sam',
  studentGrade: 7,
  startTime: SLOT.toISOString(),
  notes: 'Test on fractions next Friday.',
});

let server;
let baseUrl;
let created;

before(async () => {
  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());
afterEach(() => mock.restoreAll());

// Default happy-path mocks; individual tests override what they need.
function mockDatabase({ service = mathService, clash = null } = {}) {
  created = undefined;
  mock.method(User, 'findById', async (id) => (String(parent._id) === id ? parent : null));
  mock.method(Service, 'findOne', async (query) =>
    service && String(query._id) === String(service._id) && query.isActive === true
      ? service
      : null,
  );
  mock.method(Booking, 'findOne', async () => clash);
  mock.method(Booking, 'create', async (data) => {
    created = data;
    const booking = new Booking(data);
    await booking.validate(); // like the real create(): runs hooks and schema checks
    return booking;
  });
}

async function postBooking(body, { token = signToken(parent._id) } = {}) {
  const response = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

test('201: creates a booking with server-controlled fields set by the server', async () => {
  mockDatabase();
  const res = await postBooking({ ...validBody(), studentFirstName: '  Sam  ' });

  assert.equal(res.status, 201);
  assert.equal(res.body.studentFirstName, 'Sam');
  assert.equal(res.body.studentGrade, 7);
  assert.equal(res.body.status, 'confirmed');
  assert.equal(res.body.serviceId, String(mathService._id));
  assert.equal(res.body.startTime, SLOT.toISOString());
  assert.equal(res.body.endTime, new Date(SLOT.getTime() + 60 * 60 * 1000).toISOString());
  assert.equal(res.body.originalStartTime, SLOT.toISOString());
  assert.equal(res.body.rescheduleCount, 0);
  assert.deepEqual(res.body.serviceSnapshot, {
    name: 'Middle School Math Boost',
    tutorName: 'Ms. Avery Lane',
    durationMinutes: 60,
    priceCents: 4500,
  });
  assert.ok(!('user' in res.body));

  // What the server saved: owner from the token.
  assert.ok(created.user.equals(parent._id));
});

test('401 without a token', async () => {
  mockDatabase();
  const res = await postBooking(validBody(), { token: null });
  assert.equal(res.status, 401);
});

test('400: client cannot send user, status, endTime, or serviceSnapshot (mass assignment)', async () => {
  mockDatabase();
  const res = await postBooking({
    ...validBody(),
    user: '665f0c1a2b3c4d5e6f708091',
    status: 'cancelled',
    endTime: SLOT.toISOString(),
    serviceSnapshot: { priceCents: 0 },
  });
  assert.equal(res.status, 400);
  assert.deepEqual(
    res.body.details.map((detail) => detail.field),
    ['user', 'status', 'endTime', 'serviceSnapshot'],
  );
  assert.equal(created, undefined, 'nothing was saved');
});

test('400: all missing required fields are reported together', async () => {
  mockDatabase();
  const res = await postBooking({});
  assert.equal(res.status, 400);
  assert.deepEqual(res.body.details, [
    { field: 'serviceId', message: 'Service is required' },
    { field: 'studentFirstName', message: 'Student first name is required' },
    { field: 'studentGrade', message: 'Student grade is required' },
    { field: 'startTime', message: 'Start time is required' },
  ]);
});

test('400: invalid field values', async () => {
  mockDatabase();
  const res = await postBooking({
    serviceId: 'abc',
    studentFirstName: 'Sam123!',
    studentGrade: 13,
    startTime: '2026-11-03T16:00',
    notes: 'x'.repeat(301),
  });
  assert.equal(res.status, 400);
  assert.deepEqual(
    res.body.details.map((detail) => detail.field),
    ['serviceId', 'studentFirstName', 'studentGrade', 'startTime', 'notes'],
  );
});

test('404: unknown or inactive service', async () => {
  mockDatabase({ service: null });
  const res = await postBooking(validBody());
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error: 'Service not found' });
});

test('400: time outside booking hours (weekday 9:00 AM)', async () => {
  mockDatabase();
  const morning = new Date(SLOT.getTime() - 7 * 60 * 60 * 1000); // same Tuesday, 9:00 AM ET
  const res = await postBooking({ ...validBody(), startTime: morning.toISOString() });
  assert.equal(res.status, 400);
  assert.equal(res.body.details[0].field, 'startTime');
  assert.match(res.body.details[0].message, /3:00 PM/);
});

test('400: a past start time', async () => {
  mockDatabase();
  const res = await postBooking({ ...validBody(), startTime: '2025-01-07T20:00:00.000Z' });
  assert.equal(res.status, 400);
  assert.equal(res.body.details[0].message, 'Start time must be in the future');
});

test('409: the slot overlaps an existing confirmed booking', async () => {
  mockDatabase({ clash: new Booking({}) });
  const res = await postBooking(validBody());
  assert.equal(res.status, 409);
  assert.deepEqual(res.body, {
    error: 'That time is no longer available. Please choose another time.',
  });
  assert.equal(created, undefined, 'nothing was saved');
});
