// Unit tests for the booking rules (Step 19). Pure functions, fixed dates.
// "now" is fixed at Tue Oct 20, 2026, 12:00 PM Eastern (16:00 UTC, daylight time).

import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017/appointment_platform_test';
process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';

const {
  parseStartTime,
  checkBookingTime,
  calculateEndTime,
  findOverlappingBooking,
  getEasternTime,
} = await import('../src/services/bookingRules.js');
const { Booking } = await import('../src/models/Booking.js');

const NOW = new Date('2026-10-20T16:00:00.000Z');
const at = (iso) => new Date(iso);
const check = (iso, minutes = 60) => checkBookingTime(at(iso), minutes, NOW);

afterEach(() => mock.restoreAll());

// ===== Valid times =====

test('weekday 4:00 PM ET (EDT) for 60 minutes is allowed', () => {
  assert.equal(check('2026-10-27T20:00:00.000Z'), null); // Tue Oct 27, 4:00 PM EDT
});

test('weekday session may END exactly at 8:00 PM', () => {
  assert.equal(check('2026-10-27T23:00:00.000Z', 60), null); // 7:00-8:00 PM
  assert.equal(check('2026-10-27T23:30:00.000Z', 30), null); // 7:30-8:00 PM
});

test('Saturday 9:00 AM, and a 90-minute session ending at 3:00 PM, are allowed', () => {
  assert.equal(check('2026-10-24T13:00:00.000Z'), null); // Sat 9:00 AM EDT
  assert.equal(check('2026-10-24T17:30:00.000Z', 90), null); // Sat 1:30-3:00 PM
});

// ===== Hours =====

test('weekday session that would end after 8:00 PM is rejected', () => {
  assert.match(check('2026-10-27T23:30:00.000Z', 60), /end by 8:00 PM Eastern Time/);
});

test('weekday session before 3:00 PM is rejected', () => {
  assert.match(check('2026-10-27T18:30:00.000Z'), /start at or after 3:00 PM/); // 2:30 PM
});

test('Saturday session ending after 3:00 PM is rejected', () => {
  assert.match(check('2026-10-24T18:00:00.000Z', 90), /Saturday sessions .* end by 3:00 PM/);
});

test('Sunday is closed', () => {
  assert.equal(check('2026-10-25T20:00:00.000Z'), 'Tutoring is not available on Sundays');
});

// ===== Daylight saving time (ends Sun Nov 1, 2026) =====

test('DST: 3:00 PM is 19:00 UTC before Nov 1 but 20:00 UTC after', () => {
  assert.equal(check('2026-10-30T19:00:00.000Z'), null); // Fri Oct 30, 3:00 PM EDT
  assert.equal(check('2026-11-02T20:00:00.000Z'), null); // Mon Nov 2, 3:00 PM EST
  assert.match(check('2026-11-02T19:00:00.000Z'), /start at or after 3:00 PM/); // 2:00 PM EST
  assert.deepEqual(getEasternTime(at('2026-11-02T20:00:00.000Z')), {
    weekday: 1,
    minutesOfDay: 900,
  });
});

// ===== Slot alignment =====

test('start must be on :00 or :30 with no seconds', () => {
  assert.equal(check('2026-10-27T20:15:00.000Z'), 'Start time must be on the hour or half hour');
  assert.equal(check('2026-10-27T20:00:30.000Z'), 'Start time must be on the hour or half hour');
});

// ===== Booking window =====

test('past and right-now times are rejected', () => {
  assert.equal(check('2026-10-19T20:00:00.000Z'), 'Start time must be in the future');
  assert.equal(check('2026-10-20T16:00:00.000Z'), 'Start time must be in the future');
});

test('less than 2 hours ahead is rejected; exactly 2 hours is allowed by the window', () => {
  // Today 3:30 PM ET is 3.5 hours away -> fine; build "now" 1.5 hours before 4:00 PM.
  const soon = new Date('2026-10-20T20:00:00.000Z'); // 4:00 PM EDT today
  assert.equal(
    checkBookingTime(soon, 60, new Date('2026-10-20T18:30:00.000Z')),
    'Sessions must be booked at least 2 hours in advance',
  );
  assert.equal(checkBookingTime(soon, 60, new Date('2026-10-20T18:00:00.000Z')), null);
});

test('more than 60 days ahead is rejected', () => {
  assert.equal(
    check('2026-12-22T20:00:00.000Z'),
    'Sessions can be booked at most 60 days in advance',
  );
});

// ===== Parsing =====

test('parseStartTime accepts ISO 8601 with Z or an offset', () => {
  assert.equal(
    parseStartTime('2026-10-27T20:00:00.000Z').toISOString(),
    '2026-10-27T20:00:00.000Z',
  );
  assert.equal(
    parseStartTime('2026-10-27T16:00:00-04:00').toISOString(),
    '2026-10-27T20:00:00.000Z',
  );
});

test('parseStartTime rejects missing timezones, nonsense, and non-strings', () => {
  for (const value of [
    '2026-10-27T16:00',
    '2026-10-27',
    'tomorrow at 4',
    1793131200000,
    null,
    '2026-13-40T20:00:00Z',
  ]) {
    assert.equal(parseStartTime(value), null, String(value));
  }
});

test('calculateEndTime adds the duration', () => {
  assert.equal(
    calculateEndTime(at('2026-10-27T20:00:00.000Z'), 90).toISOString(),
    '2026-10-27T21:30:00.000Z',
  );
});

// ===== Overlap query =====

test("overlap query: same tutor's services, confirmed only, start < newEnd and end > newStart", async () => {
  let query;
  mock.method(Booking, 'findOne', async (q) => {
    query = q;
    return null;
  });
  const start = at('2026-10-27T20:00:00.000Z');
  const end = at('2026-10-27T21:00:00.000Z');
  await findOverlappingBooking({ serviceIds: ['service-1', 'service-2'], start, end });
  assert.deepEqual(query, {
    service: { $in: ['service-1', 'service-2'] },
    status: 'confirmed',
    startTime: { $lt: end },
    endTime: { $gt: start },
  });

  await findOverlappingBooking({
    serviceIds: ['service-1'],
    start,
    end,
    excludeBookingId: 'booking-9',
  });
  assert.deepEqual(query._id, { $ne: 'booking-9' });
});
