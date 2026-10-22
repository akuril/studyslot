// Week-view helpers (Eastern Time calendar dates, Monday-Saturday).
import { addDaysToDateString, easternDateString, weekdayOf } from './bookingTime';

export const DAYS_SHOWN = 6;

export function dateFromString(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** The Monday of the week containing `dateString` (Sunday belongs to the week before it). */
export function mondayOf(dateString) {
  const weekday = weekdayOf(dateString); // 0 = Sunday
  return addDaysToDateString(dateString, -((weekday + 6) % 7));
}

/** Groups sessions by Eastern date for the 6 days starting at `monday`. Cancelled are skipped. */
export function groupByDay(sessions, monday) {
  const days = Array.from({ length: DAYS_SHOWN }, (_, index) => ({
    date: addDaysToDateString(monday, index),
    sessions: [],
  }));
  const byDate = new Map(days.map((day) => [day.date, day]));
  for (const session of sessions) {
    if (session.status === 'cancelled') continue;
    const day = byDate.get(easternDateString(new Date(session.startTime)));
    if (day) day.sessions.push(session);
  }
  days.forEach((day) => day.sessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
  return days;
}
