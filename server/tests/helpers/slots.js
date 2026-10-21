// Test helper: real future times that satisfy the booking rules on any day the tests run.
import { getEasternTime } from '../../src/services/bookingRules.js';

/**
 * The next date (at least `minDaysAhead` days from now) that falls on `weekday`
 * (0 = Sunday ... 6 = Saturday) at `hour`:00 Eastern Time. Handles EDT and EST.
 */
export function nextEasternSlot(weekday, hour, minDaysAhead = 3) {
  for (let daysAhead = minDaysAhead; daysAhead <= minDaysAhead + 8; daysAhead += 1) {
    const day = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    for (const offsetHours of [4, 5]) {
      const candidate = new Date(
        Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour + offsetHours),
      );
      const eastern = getEasternTime(candidate);
      if (eastern.weekday === weekday && eastern.minutesOfDay === hour * 60) {
        return candidate;
      }
    }
  }
  throw new Error('No matching slot found');
}
