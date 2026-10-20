// Calendar-date helpers. A calendar date is stored as text in "YYYY-MM-DD" format.
// These helpers always work in the student's LOCAL time zone.

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** Turns a Date object into "YYYY-MM-DD" using local time. */
export function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Turns "YYYY-MM-DD" into a Date at local midnight (avoids the UTC bug). */
export function parseDateString(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Today's date as "YYYY-MM-DD". */
export function todayString() {
  return toDateString(new Date());
}

/** Adds (or subtracts) days from a "YYYY-MM-DD" string. */
export function addDays(dateString, days) {
  const date = parseDateString(dateString);
  date.setDate(date.getDate() + days);
  return toDateString(date);
}

/** A date relative to today. daysFromToday(1) = tomorrow, daysFromToday(-1) = yesterday. */
export function daysFromToday(days) {
  return addDays(todayString(), days);
}

/** How many days until a date. 0 = today, 1 = tomorrow, -2 = two days ago. */
export function daysUntil(dateString) {
  const difference = parseDateString(dateString) - parseDateString(todayString());
  return Math.round(difference / MS_PER_DAY);
}

/** A friendly label: "Today", "Tomorrow", "Yesterday", or "Mon, Oct 12". */
export function formatDueDate(dateString) {
  const days = daysUntil(dateString);

  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';

  return parseDateString(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

// ===== Week helpers (weeks start on Monday) =====

/** The Monday of the week containing this date, as "YYYY-MM-DD". */
export function getWeekStart(dateString) {
  const date = parseDateString(dateString);
  const daysSinceMonday = (date.getDay() + 6) % 7;
  return addDays(dateString, -daysSinceMonday);
}

/** The 7 dates (Monday to Sunday) of the week starting on `weekStart`. */
export function getWeekDays(weekStart) {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

/** A label like "Oct 5 – Oct 11, 2026". */
export function formatWeekRange(weekStart) {
  const start = parseDateString(weekStart);
  const end = parseDateString(addDays(weekStart, 6));

  const startText = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endText = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startText} – ${endText}`;
}


/** "This week", "Last week", "Next week", "3 weeks ago", or "In 2 weeks" for a week's Monday. */
export function getRelativeWeekLabel(weekStart) {
  const thisWeekStart = getWeekStart(todayString());
  const weeksAway = Math.round((daysUntil(weekStart) - daysUntil(thisWeekStart)) / 7);

  if (weeksAway === 0) return 'This week';
  if (weeksAway === 1) return 'Next week';
  if (weeksAway === -1) return 'Last week';
  if (weeksAway > 1) return `In ${weeksAway} weeks`;
  return `${Math.abs(weeksAway)} weeks ago`;
}
// ===== Month helpers =====

/** The first day of the month: "2026-10-07" → "2026-10-01". */
export function getMonthStart(dateString) {
  return `${dateString.slice(0, 7)}-01`;
}

/** Moves a month start forward or back by whole months: addMonths("2026-12-01", 1) → "2027-01-01". */
export function addMonths(monthStart, months) {
  const date = parseDateString(monthStart);
  return toDateString(new Date(date.getFullYear(), date.getMonth() + months, 1));
}

/** Every date shown in a month grid: full Monday–Sunday weeks covering the whole month. */
export function getMonthGridDays(monthStart) {
  const date = parseDateString(monthStart);
  const lastDayOfMonth = toDateString(new Date(date.getFullYear(), date.getMonth() + 1, 0));

  const gridStart = getWeekStart(monthStart);
  const gridEnd = addDays(getWeekStart(lastDayOfMonth), 6);

  const days = [];
  let day = gridStart;

  while (day <= gridEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  return days;
}

/** A label like "October 2026". */
export function formatMonthYear(monthStart) {
  return parseDateString(monthStart).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}