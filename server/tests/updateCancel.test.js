// HTTP tests for rescheduling, editing notes, and cancelling (Step 20).
// Database calls are mocked; auth, ownership, validation, and rules are real.

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
const { signToken } = await import('../src/services/authService.js');
const { nextEasternSlot } = await import('./helpers/slots.js');

const HOUR_MS = 60 * 60 * 1000;
const alice = new User({ name: 'Alice Parent', email: 'alice@example.com', passwordHash: 'x' });
const bob = new User({ name: 'Bob Parent', email: 'bob@example.com', passwordHash: 'x' });

const TUESDAY_4PM = nextEasternSlot(2, 16);
const WEDNESDAY_5PM = nextEasternSlot(3, 17);

// A fresh booking owned by Alice before every test (tests change it).
let booking;
function makeBooking(overrides = {}) {
  const start = overrides.startTime || TUESDAY_4PM;
  return new Booking({
    user: alice._id,
    service: new mongoose.Types.ObjectId(),
    serviceSnapshot: {
      name: 'Middle School Math Boost',
      tutorName: 'Ms. Avery Lane',
      durationMinutes: 60,
      priceCents: 4500,
    },
    studentFirstName: 'Sam',
    studentGrade: 7,
    startTime: start,
    endTime: new Date(start.getTime() + HOUR_MS),
    notes: 'Original notes',
    ...overrides,
  });
}

let server;
let baseUrl;
let overlapQuery;
let clash;

before(async () => {
  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
after(() => server.close());

beforeEach(async () => {
  booking = makeBooking();
  await booking.validate(); // sets originalStartTime, like a real saved booking
  clash = null;
  overlapQuery = undefined;
  mock.method(
    User,
    'findById',
    async (id) => [alice, bob].find((u) => String(u._id) === id) || null,
  );
  mock.method(Booking, 'findById', async (id) =>
    String(booking._id) === String(id) ? booking : null,
  );
  mock.method(Booking, 'findOne', async (query) => {
    overlapQuery = query;
    return clash;
  });
  // The booked service has no linked tutor account, so only its own slots are checked.
  mock.method(Service, 'findById', () => ({ select: async () => null }));
  // Like the real save(): run schema validation, then "store" it.
  mock.method(Booking.prototype, 'save', async function save() {
    await this.validate();
    return this;
  });
});
afterEach(() => mock.restoreAll());

async function send(method, path, { user = alice, body } = {}) {
  const response = await fetch(baseUrl + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(user ? { Authorization: `Bearer ${signToken(user._id)}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
}
const patch = (body, options) =>
  send('PATCH', `/api/bookings/${booking._id}`, { body, ...options });
const cancel = (options) => send('POST', `/api/bookings/${booking._id}/cancel`, options);

// ===== PATCH: notes =====

test('owner can edit notes only (no reschedule recorded)', async () => {
  const res = await patch({ notes: '  Bring the worksheet.  ' });
  assert.equal(res.status, 200);
  assert.equal(res.body.notes, 'Bring the worksheet.');
  assert.equal(res.body.rescheduleCount, 0);
  assert.equal(res.body.startTime, TUESDAY_4PM.toISOString());
});

test('empty notes clears them', async () => {
  const res = await patch({ notes: '' });
  assert.equal(res.status, 200);
  assert.equal(res.body.notes, '');
});

// ===== PATCH: reschedule =====

test('owner can reschedule: new start/end, count +1, original time kept', async () => {
  const res = await patch({ startTime: WEDNESDAY_5PM.toISOString() });
  assert.equal(res.status, 200);
  assert.equal(res.body.startTime, WEDNESDAY_5PM.toISOString());
  assert.equal(res.body.endTime, new Date(WEDNESDAY_5PM.getTime() + HOUR_MS).toISOString());
  assert.equal(res.body.rescheduleCount, 1);
  assert.ok(res.body.lastRescheduledAt);
  assert.equal(res.body.originalStartTime, TUESDAY_4PM.toISOString());
  assert.equal(res.body.status, 'confirmed');
  // The overlap check ignored this booking's own slot.
  assert.deepEqual(overlapQuery._id, { $ne: booking._id });
});

test('"rescheduling" to the same time does not count as a reschedule', async () => {
  const res = await patch({ startTime: TUESDAY_4PM.toISOString(), notes: 'Same time' });
  assert.equal(res.status, 200);
  assert.equal(res.body.rescheduleCount, 0);
  assert.equal(overlapQuery, undefined, 'no overlap query needed');
});

test('409: new time overlaps another confirmed booking', async () => {
  clash = makeBooking();
  const res = await patch({ startTime: WEDNESDAY_5PM.toISOString() });
  assert.equal(res.status, 409);
  assert.equal(res.body.error, 'That time is no longer available. Please choose another time.');
  assert.equal(booking.rescheduleCount, 0, 'nothing changed');
});

test('400: new time breaks the booking rules (Sunday)', async () => {
  const sunday = nextEasternSlot(0, 16);
  const res = await patch({ startTime: sunday.toISOString() });
  assert.equal(res.status, 400);
  assert.equal(res.body.details[0].message, 'Tutoring is not available on Sundays');
});

// ===== PATCH: what can't be changed =====

test('400: empty body, bad values, and forbidden fields', async () => {
  const empty = await patch({});
  assert.equal(empty.status, 400);
  assert.equal(empty.body.error, 'Provide startTime and/or notes to update');

  const bad = await patch({ startTime: 'next tuesday', notes: 'x'.repeat(301) });
  assert.equal(bad.status, 400);
  assert.deepEqual(
    bad.body.details.map((d) => d.field),
    ['startTime', 'notes'],
  );

  const forbidden = await patch({ status: 'cancelled', rescheduleCount: 0, studentGrade: 8 });
  assert.equal(forbidden.status, 400);
  assert.deepEqual(
    forbidden.body.details.map((d) => d.field),
    ['status', 'rescheduleCount', 'studentGrade'],
  );
});

test("403: Bob cannot change Alice's booking; 401 without login", async () => {
  const asBob = await patch({ notes: 'hacked' }, { user: bob });
  assert.equal(asBob.status, 403);
  assert.equal(booking.notes, 'Original notes');

  const anonymous = await patch({ notes: 'hacked' }, { user: null });
  assert.equal(anonymous.status, 401);
});

test('409: cannot change a cancelled booking', async () => {
  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  const res = await patch({ notes: 'too late' });
  assert.equal(res.status, 409);
  assert.equal(res.body.error, 'This booking can no longer be changed');
});

test('409: cannot change a booking that starts within 2 hours', async () => {
  booking = makeBooking({ startTime: new Date(Date.now() + HOUR_MS) });
  const res = await patch({ notes: 'too late' });
  assert.equal(res.status, 409);
});

// ===== Cancel =====

test('owner can cancel: status cancelled, cancelledAt set, booking kept', async () => {
  const res = await cancel();
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'cancelled');
  assert.ok(res.body.cancelledAt);
  assert.equal(res.body.id, String(booking._id));
});

test('409: cancelling twice', async () => {
  await cancel();
  const second = await cancel();
  assert.equal(second.status, 409);
  assert.equal(second.body.error, 'This booking is already cancelled');
});

test("403: Bob cannot cancel Alice's booking", async () => {
  const res = await cancel({ user: bob });
  assert.equal(res.status, 403);
  assert.equal(booking.status, 'confirmed');
});

test('409: cannot cancel within 2 hours of the start (or after it started)', async () => {
  booking = makeBooking({ startTime: new Date(Date.now() + 30 * 60 * 1000) });
  const res = await cancel();
  assert.equal(res.status, 409);
  assert.equal(res.body.error, 'This booking can no longer be changed');
});

test('400: cancel accepts no body fields (cannot sneak in a status change)', async () => {
  const res = await send('POST', `/api/bookings/${booking._id}/cancel`, {
    body: { status: 'confirmed' },
  });
  assert.equal(res.status, 400);
});

test('404: unknown booking id for PATCH and cancel', async () => {
  const missing = '665f0c1a2b3c4d5e6f7080ff';
  assert.equal(
    (await send('PATCH', `/api/bookings/${missing}`, { body: { notes: 'x' } })).status,
    404,
  );
  assert.equal((await send('POST', `/api/bookings/${missing}/cancel`)).status, 404);
});
