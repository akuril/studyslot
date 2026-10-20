// Authorization and ownership tests for bookings (Step 18).
// Run from the server folder:  npm test
//
// Two fake users (Alice and Bob) and one booking that belongs to Alice.
// The database is mocked; tokens and the authenticate middleware are real.

import { test, before, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/appointment_platform_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

const { default: app } = await import('../src/app.js');
const { User } = await import('../src/models/User.js');
const { Booking } = await import('../src/models/Booking.js');
const { signToken } = await import('../src/services/authService.js');

const alice = new User({ name: 'Alice Parent', email: 'alice@example.com', passwordHash: 'x' });
const bob = new User({ name: 'Bob Parent', email: 'bob@example.com', passwordHash: 'x' });
const users = [alice, bob];

const start = new Date('2026-11-03T20:00:00.000Z');
const alicesBooking = new Booking({
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
  endTime: new Date(start.getTime() + 60 * 60 * 1000),
});

let server;
let baseUrl;

before(async () => {
  server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

// Every test: the authenticate middleware can find Alice and Bob by id.
afterEach(() => mock.restoreAll());
function mockUsersAndBookings() {
  mock.method(
    User,
    'findById',
    async (id) => users.find((user) => String(user._id) === id) || null,
  );
  mock.method(Booking, 'findById', async (id) =>
    String(alicesBooking._id) === String(id) ? alicesBooking : null,
  );
}

async function get(path, user) {
  const response = await fetch(baseUrl + path, {
    headers: user ? { Authorization: `Bearer ${signToken(user._id)}` } : {},
  });
  return { status: response.status, body: await response.json() };
}

// ===== Authentication is required (401) =====

test('booking routes return 401 without a token', async () => {
  mockUsersAndBookings();
  for (const path of [
    '/api/bookings/mine',
    `/api/bookings/${alicesBooking._id}`,
    '/api/bookings/not-an-id',
  ]) {
    const res = await get(path);
    assert.equal(res.status, 401, path);
    assert.deepEqual(res.body, { error: 'Authentication required' });
  }
});

// ===== Ownership (403 / 404 / 200) =====

test("owner can read her own booking (200), and the owner id isn't exposed", async () => {
  mockUsersAndBookings();
  const res = await get(`/api/bookings/${alicesBooking._id}`, alice);
  assert.equal(res.status, 200);
  assert.equal(res.body.id, String(alicesBooking._id));
  assert.equal(res.body.studentFirstName, 'Sam');
  assert.ok(!('user' in res.body));
});

test("another logged-in user CANNOT read Alice's booking (403)", async () => {
  mockUsersAndBookings();
  const res = await get(`/api/bookings/${alicesBooking._id}`, bob);
  assert.equal(res.status, 403);
  assert.deepEqual(res.body, { error: 'You do not have access to this booking' });
  assert.ok(!JSON.stringify(res.body).includes('Sam'), 'no booking data leaks in the error');
});

test('a booking that does not exist returns 404', async () => {
  mockUsersAndBookings();
  const res = await get('/api/bookings/665f0c1a2b3c4d5e6f7080ff', alice);
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, { error: 'Booking not found' });
});

test('a malformed booking id returns 400 (after login is checked)', async () => {
  mockUsersAndBookings();
  const res = await get('/api/bookings/not-an-id', alice);
  assert.equal(res.status, 400);
  assert.equal(res.body.details[0].field, 'id');
});

// ===== "My bookings" list =====

test('/mine filters by the token user only, ignoring any ?user= in the URL', async () => {
  mockUsersAndBookings();
  let filter;
  let order;
  mock.method(Booking, 'find', (query) => {
    filter = query;
    return {
      sort: async (sortOrder) => {
        order = sortOrder;
        return [];
      },
    };
  });

  const res = await get(`/api/bookings/mine?user=${alice._id}`, bob);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, []);
  assert.deepEqual(Object.keys(filter), ['user']);
  assert.ok(filter.user.equals(bob._id), "Bob's token -> Bob's bookings, whatever the URL says");
  assert.deepEqual(order, { startTime: 1 });
});

test('"/mine" is not mistaken for a booking id', async () => {
  mockUsersAndBookings();
  mock.method(Booking, 'find', () => ({ sort: async () => [alicesBooking] }));
  const res = await get('/api/bookings/mine', alice);
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 1);
});
