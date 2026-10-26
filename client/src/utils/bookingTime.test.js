import { describe, expect, it } from 'vitest';
import {
  addDaysToDateString,
  bookingDateRange,
  daysUntil,
  easternDateOf,
  easternDateString,
  easternTimeToDate,
  getDisplayStatus,
  isChangeable,
  listTimeSlots,
  needsCompleting,
  weekdayOf,
} from './bookingTime';

const MINUTE = 60 * 1000;

describe('calendar-date helpers', () => {
  it('adds days across month and year ends', () => {
    expect(addDaysToDateString('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDaysToDateString('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDaysToDateString('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('is not shifted by daylight saving changes', () => {
    expect(addDaysToDateString('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDaysToDateString('2026-10-31', 2)).toBe('2026-11-02');
  });

  it('finds the weekday (0 = Sunday)', () => {
    expect(weekdayOf('2026-10-25')).toBe(0);
    expect(weekdayOf('2026-10-26')).toBe(1);
    expect(weekdayOf('2026-10-31')).toBe(6);
  });
});

describe('easternTimeToDate', () => {
  it('uses UTC-4 in summer', () => {
    expect(easternTimeToDate('2026-07-01', 16 * 60).toISOString()).toBe('2026-07-01T20:00:00.000Z');
  });

  it('uses UTC-5 in winter', () => {
    expect(easternTimeToDate('2026-01-15', 16 * 60).toISOString()).toBe('2026-01-15T21:00:00.000Z');
  });

  it('returns null for a time that does not exist (spring-forward gap)', () => {
    expect(easternTimeToDate('2026-03-08', 2 * 60 + 30)).toBeNull();
  });
});

describe('Eastern date helpers', () => {
  it('uses the Eastern calendar day, not the UTC day', () => {
    // 02:00 UTC on Oct 27 is 10:00 PM on Oct 26 in New York.
    expect(easternDateString(new Date('2026-10-27T02:00:00Z'))).toBe('2026-10-26');
    expect(easternDateOf('2026-10-27T02:00:00Z')).toBe('2026-10-26');
  });

  it('allows booking from today up to 60 days ahead', () => {
    expect(bookingDateRange(new Date('2026-10-26T12:00:00Z'))).toEqual({
      min: '2026-10-26',
      max: '2026-12-25',
    });
  });
});

describe('listTimeSlots', () => {
  const now = new Date('2026-10-20T12:00:00Z');

  it('asks for a date when the value is not a date', () => {
    expect(listTimeSlots('', 60, now)).toEqual({ slots: [], reason: 'Choose a date.' });
    expect(listTimeSlots('10/26/2026', 60, now).slots).toEqual([]);
  });

  it('offers nothing on Sundays', () => {
    const result = listTimeSlots('2026-10-25', 60, new Date('2026-10-20T12:00:00Z'));
    expect(result.slots).toEqual([]);
    expect(result.reason).toMatch(/Sundays/);
  });

  it('offers 3:00 PM to a 7:00 PM start for a 60-minute weekday session', () => {
    const { slots } = listTimeSlots('2026-10-26', 60, now);
    expect(slots).toHaveLength(9);
    expect(slots[0].label).toBe('3:00 PM');
    expect(slots[slots.length - 1].label).toBe('7:00 PM');
    expect(slots[0].value).toBe('2026-10-26T19:00:00.000Z');
  });

  it('never lets a session run past closing time', () => {
    const { slots } = listTimeSlots('2026-10-26', 90, now);
    expect(slots[slots.length - 1].label).toBe('6:30 PM');
  });

  it('uses Saturday hours (9 AM to 3 PM)', () => {
    const { slots } = listTimeSlots('2026-10-31', 90, now);
    expect(slots[0].label).toBe('9:00 AM');
    expect(slots[slots.length - 1].label).toBe('1:30 PM');
    expect(slots).toHaveLength(10);
  });

  it('requires at least 2 hours of notice', () => {
    // 3:00 PM EDT Monday. The earliest allowed start is 5:00 PM.
    const { slots } = listTimeSlots('2026-10-26', 60, new Date('2026-10-26T19:00:00Z'));
    expect(slots[0].label).toBe('5:00 PM');
    expect(slots).toHaveLength(5);
  });

  it('explains an empty day', () => {
    const result = listTimeSlots('2026-10-26', 60, new Date('2026-10-26T23:30:00Z'));
    expect(result.slots).toEqual([]);
    expect(result.reason).toMatch(/2 hours/);
  });

  it('does not offer dates more than 60 days ahead', () => {
    expect(listTimeSlots('2026-12-31', 60, new Date('2026-10-26T12:00:00Z')).slots).toEqual([]);
  });

  it('gives the right UTC time after daylight saving ends', () => {
    const { slots } = listTimeSlots('2026-11-02', 60, now);
    expect(slots[0].label).toBe('3:00 PM');
    expect(slots[0].value).toBe('2026-11-02T20:00:00.000Z');
  });
});

describe('booking status', () => {
  const now = new Date('2026-10-26T20:00:00Z');
  const at = (minutesFromNow) => new Date(now.getTime() + minutesFromNow * MINUTE).toISOString();

  it('treats cancelled bookings as cancelled', () => {
    expect(getDisplayStatus({ status: 'cancelled', endTime: at(-60) }, now)).toBe('cancelled');
  });

  it('is completed when marked or when its end time has passed', () => {
    expect(getDisplayStatus({ status: 'confirmed', completedAt: at(-5), endTime: at(60) }, now)).toBe(
      'completed',
    );
    expect(getDisplayStatus({ status: 'confirmed', endTime: at(-1) }, now)).toBe('completed');
  });

  it('is upcoming before the end time', () => {
    expect(getDisplayStatus({ status: 'confirmed', endTime: at(30) }, now)).toBe('upcoming');
  });

  it('flags started, unmarked, confirmed sessions for tutors to complete', () => {
    expect(needsCompleting({ status: 'confirmed', startTime: at(-10) }, now)).toBe(true);
    expect(needsCompleting({ status: 'confirmed', startTime: at(10) }, now)).toBe(false);
    expect(needsCompleting({ status: 'confirmed', startTime: at(-10), completedAt: at(-1) }, now)).toBe(
      false,
    );
    expect(needsCompleting({ status: 'cancelled', startTime: at(-10) }, now)).toBe(false);
  });

  it('allows changes only more than 2 hours before the start', () => {
    expect(isChangeable({ status: 'confirmed', startTime: at(121) }, now)).toBe(true);
    expect(isChangeable({ status: 'confirmed', startTime: at(120) }, now)).toBe(false);
    expect(isChangeable({ status: 'cancelled', startTime: at(600) }, now)).toBe(false);
  });

  it('counts whole calendar days until a session', () => {
    const local = new Date(2026, 9, 26, 12, 0);
    expect(daysUntil(new Date(2026, 9, 26, 18, 0).toISOString(), local)).toBe(0);
    expect(daysUntil(new Date(2026, 9, 27, 9, 0).toISOString(), local)).toBe(1);
    expect(daysUntil(new Date(2026, 9, 25, 9, 0).toISOString(), local)).toBe(-1);
  });
});
