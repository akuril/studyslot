// StudySlot booking rules (approved in Steps 3, 6, and 19).
// Pure functions where possible, so they're easy to test with fixed dates.

import { Booking } from '../models/Booking.js';

export const BUSINESS_TIME_ZONE = 'America/New_York';
export const MIN_LEAD_MINUTES = 120; // book at least 2 hours ahead
export const MAX_DAYS_AHEAD = 60; // book at most 60 days ahead

// Opening hours in Eastern Time, as minutes after midnight. Day numbers: 0 = Sunday.
// A session must START at or after `open` and END by `close`.
const HOURS = {
  1: { open: 15 * 60, close: 20 * 60 }, // Mon 3:00 PM - 8:00 PM
  2: { open: 15 * 60, close: 20 * 60 },
  3: { open: 15 * 60, close: 20 * 60 },
  4: { open: 15 * 60, close: 20 * 60 },
  5: { open: 15 * 60, close: 20 * 60 }, // Fri
  6: { open: 9 * 60, close: 15 * 60 }, // Sat 9:00 AM - 3:00 PM
  // 0 (Sunday) is missing on purpose: closed.
};

const MINUTE_MS = 60 * 1000;
const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// ISO 8601 date-time WITH an explicit timezone ("Z" or "+hh:mm"/"-hh:mm").
// Without a timezone, "2026-11-03T16:00" would be ambiguous, so it's rejected.
const ISO_WITH_ZONE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

const easternFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: BUSINESS_TIME_ZONE,
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/**
 * The weekday and time-of-day of `date` in Eastern Time. Intl handles daylight saving
 * time for us: the same UTC hour can be 3 PM (EDT, summer) or 2 PM (EST, winter).
 */
export function getEasternTime(date) {
  const parts = Object.fromEntries(
    easternFormatter.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    weekday: WEEKDAYS[parts.weekday],
    minutesOfDay: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function formatClock(minutesOfDay) {
  const hours24 = Math.floor(minutesOfDay / 60);
  const minutes = String(minutesOfDay % 60).padStart(2, '0');
  const suffix = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes} ${suffix}`;
}

/** Parses an ISO 8601 string with a timezone into a Date. Returns null if invalid. */
export function parseStartTime(value) {
  if (typeof value !== 'string' || !ISO_WITH_ZONE.test(value)) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Checks a proposed session against the booking rules.
 * Returns an error message string, or null if the time is allowed.
 * `now` can be passed in so tests can use a fixed "current time".
 */
export function checkBookingTime(start, durationMinutes, now = new Date()) {
  if (start.getUTCSeconds() !== 0 || start.getUTCMilliseconds() !== 0) {
    return 'Start time must be on the hour or half hour';
  }

  const minutesUntilStart = (start.getTime() - now.getTime()) / MINUTE_MS;
  if (minutesUntilStart <= 0) {
    return 'Start time must be in the future';
  }
  if (minutesUntilStart < MIN_LEAD_MINUTES) {
    return 'Sessions must be booked at least 2 hours in advance';
  }
  if (minutesUntilStart > MAX_DAYS_AHEAD * 24 * 60) {
    return `Sessions can be booked at most ${MAX_DAYS_AHEAD} days in advance`;
  }

  const { weekday, minutesOfDay } = getEasternTime(start);
  if (minutesOfDay % 30 !== 0) {
    return 'Start time must be on the hour or half hour';
  }

  const hours = HOURS[weekday];
  if (!hours) {
    return 'Tutoring is not available on Sundays';
  }

  const endMinutesOfDay = minutesOfDay + durationMinutes;
  if (minutesOfDay < hours.open || endMinutesOfDay > hours.close) {
    const dayType = weekday === 6 ? 'Saturday' : 'Weekday';
    return (
      `${dayType} sessions must start at or after ${formatClock(hours.open)} and end by ` +
      `${formatClock(hours.close)} Eastern Time (this session is ${durationMinutes} minutes)`
    );
  }

  return null;
}

/** The end of a session: start + duration (in real elapsed minutes). */
export function calculateEndTime(start, durationMinutes) {
  return new Date(start.getTime() + durationMinutes * MINUTE_MS);
}

/**
 * Finds a CONFIRMED booking for the same service that overlaps [start, end).
 * Two sessions overlap when each one starts before the other ends.
 * `excludeBookingId` lets a reschedule ignore the booking's own current slot (Step 20).
 * Uses the { service, status, startTime } index from Step 12.
 */
export function findOverlappingBooking({ serviceId, start, end, excludeBookingId }) {
  const query = {
    service: serviceId,
    status: 'confirmed',
    startTime: { $lt: end },
    endTime: { $gt: start },
  };
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  return Booking.findOne(query);
}
