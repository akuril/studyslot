// Booking times on the client. The rules mirror the server's (server/src/services/bookingRules.js).
// They only decide which time slots to OFFER; the server checks every booking again.
//
// Times are offered in Eastern Time (the business's timezone) and stored/sent as UTC.

export const BUSINESS_TIME_ZONE = 'America/New_York';
const MIN_LEAD_MINUTES = 120;
const MAX_DAYS_AHEAD = 60;
const SLOT_STEP_MINUTES = 30;
const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

// Minutes after midnight, Eastern Time. 0 = Sunday (closed).
const HOURS = {
  1: { open: 15 * 60, close: 20 * 60 },
  2: { open: 15 * 60, close: 20 * 60 },
  3: { open: 15 * 60, close: 20 * 60 },
  4: { open: 15 * 60, close: 20 * 60 },
  5: { open: 15 * 60, close: 20 * 60 },
  6: { open: 9 * 60, close: 15 * 60 },
};

const easternParts = new Intl.DateTimeFormat('en-US', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function getEastern(date) {
  const parts = Object.fromEntries(
    easternParts.formatToParts(date).map((part) => [part.type, part.value]),
  );
  return {
    dateString: `${parts.year}-${parts.month}-${parts.day}`,
    minutesOfDay: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

/** Today's date in Eastern Time as "YYYY-MM-DD" (for the date picker's min). */
export function easternDateString(date = new Date()) {
  return getEastern(date).dateString;
}

/** "YYYY-MM-DD" plus `days`. Works on calendar dates, so DST never shifts it. */
export function addDaysToDateString(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

/** 0 (Sunday) ... 6 (Saturday) for a calendar date. */
export function weekdayOf(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/**
 * The UTC moment for a wall-clock time in Eastern Time on a given date.
 * Eastern Time is UTC-4 (summer) or UTC-5 (winter); we try both and keep the one
 * that really shows that time in New York. Handles daylight saving automatically.
 */
export function easternTimeToDate(dateString, minutesOfDay) {
  const [year, month, day] = dateString.split('-').map(Number);
  for (const offsetHours of [4, 5]) {
    const candidate = new Date(
      Date.UTC(year, month - 1, day, 0, minutesOfDay) + offsetHours * 60 * MINUTE_MS,
    );
    const eastern = getEastern(candidate);
    if (eastern.dateString === dateString && eastern.minutesOfDay === minutesOfDay) {
      return candidate;
    }
  }
  return null;
}

function formatClock(minutesOfDay) {
  const hours24 = Math.floor(minutesOfDay / 60);
  const minutes = String(minutesOfDay % 60).padStart(2, '0');
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes} ${hours24 >= 12 ? 'PM' : 'AM'}`;
}

/** Earliest and latest dates the date picker should allow (Eastern calendar dates). */
export function bookingDateRange(now = new Date()) {
  const min = easternDateString(now);
  return { min, max: addDaysToDateString(min, MAX_DAYS_AHEAD) };
}

/**
 * Start times that follow the booking rules on `dateString` for a session of
 * `durationMinutes`, as [{ value: ISO string, label: '4:00 PM' }].
 * Returns { slots, reason } where reason explains an empty list.
 */
export function listTimeSlots(dateString, durationMinutes, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return { slots: [], reason: 'Choose a date.' };
  }
  const hours = HOURS[weekdayOf(dateString)];
  if (!hours) {
    return { slots: [], reason: 'Tutoring is not available on Sundays. Please pick another day.' };
  }

  const earliest = now.getTime() + MIN_LEAD_MINUTES * MINUTE_MS;
  const latest = now.getTime() + MAX_DAYS_AHEAD * DAY_MS;
  const slots = [];

  for (
    let minutes = hours.open;
    minutes + durationMinutes <= hours.close;
    minutes += SLOT_STEP_MINUTES
  ) {
    const start = easternTimeToDate(dateString, minutes);
    if (start && start.getTime() >= earliest && start.getTime() <= latest) {
      slots.push({ value: start.toISOString(), label: formatClock(minutes) });
    }
  }

  return {
    slots,
    reason:
      slots.length === 0
        ? 'No times left on this day (sessions must be booked at least 2 hours ahead). Please pick another day.'
        : '',
  };
}

/** The Eastern date of an ISO time, e.g. to pre-fill the reschedule form. */
export function easternDateOf(isoString) {
  return easternDateString(new Date(isoString));
}

// ===== Display =====

const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});
const longDateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const zoneFormat = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' });

/** "Tue, Oct 27, 4:00 PM EDT" in the viewer's own timezone. */
export function formatDateTime(isoString) {
  return dateTimeFormat.format(new Date(isoString));
}

/** "Tuesday, October 27, 2026 · 4:00 – 5:00 PM EDT" in the viewer's own timezone. */
export function formatSessionTime(startIso, endIso) {
  const start = new Date(startIso);
  const zone = zoneFormat.formatToParts(start).find((part) => part.type === 'timeZoneName');
  return `${longDateFormat.format(start)} · ${timeFormat.format(start)} – ${timeFormat.format(
    new Date(endIso),
  )}${zone ? ` ${zone.value}` : ''}`;
}

// ===== Booking status (mirrors the server) =====

/**
 * 'upcoming' | 'completed' | 'cancelled'.
 * Completed = the tutor marked it completed, OR its end time has passed.
 */
export function getDisplayStatus(booking, now = new Date()) {
  if (booking.status === 'cancelled') {
    return 'cancelled';
  }
  if (booking.completedAt) {
    return 'completed';
  }
  return new Date(booking.endTime) <= now ? 'completed' : 'upcoming';
}

/** For tutors: confirmed, already started, and not yet marked completed. */
export function needsCompleting(booking, now = new Date()) {
  return (
    booking.status === 'confirmed' && !booking.completedAt && new Date(booking.startTime) <= now
  );
}

/** True if the booking can still be rescheduled, edited, or cancelled. */
export function isChangeable(booking, now = new Date()) {
  const minutesUntilStart = (new Date(booking.startTime) - now) / MINUTE_MS;
  return booking.status === 'confirmed' && minutesUntilStart > MIN_LEAD_MINUTES;
}

/** Whole days until a date ("today" = 0), using the viewer's calendar. */
export function daysUntil(isoString, now = new Date()) {
  const start = new Date(isoString);
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((startDay - today) / DAY_MS);
}
