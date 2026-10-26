import { describe, expect, it } from 'vitest';
import { DAYS_SHOWN, groupByDay, mondayOf } from './week';

describe('mondayOf', () => {
  it('returns the same day for a Monday', () => {
    expect(mondayOf('2026-10-26')).toBe('2026-10-26');
  });

  it('returns the Monday before a mid-week day', () => {
    expect(mondayOf('2026-10-28')).toBe('2026-10-26');
    expect(mondayOf('2026-10-31')).toBe('2026-10-26');
  });

  it('puts Sunday in the week before it', () => {
    expect(mondayOf('2026-11-01')).toBe('2026-10-26');
  });
});

describe('groupByDay', () => {
  const session = (id, startTime, status = 'confirmed') => ({ id, startTime, status });

  it('makes six days, Monday to Saturday', () => {
    const days = groupByDay([], '2026-10-26');
    expect(days).toHaveLength(DAYS_SHOWN);
    expect(days[0].date).toBe('2026-10-26');
    expect(days[5].date).toBe('2026-10-31');
  });

  it('groups sessions by Eastern date and sorts them by time', () => {
    const days = groupByDay(
      [
        session('late', '2026-10-27T22:00:00Z'),
        session('early', '2026-10-27T19:00:00Z'),
        session('mon', '2026-10-26T20:00:00Z'),
      ],
      '2026-10-26',
    );
    expect(days[0].sessions.map((s) => s.id)).toEqual(['mon']);
    expect(days[1].sessions.map((s) => s.id)).toEqual(['early', 'late']);
  });

  it('uses the Eastern day for sessions near midnight UTC', () => {
    // 02:00 UTC on Oct 27 is still Monday evening in New York.
    const days = groupByDay([session('night', '2026-10-27T02:00:00Z')], '2026-10-26');
    expect(days[0].sessions).toHaveLength(1);
    expect(days[1].sessions).toHaveLength(0);
  });

  it('skips cancelled sessions and sessions outside the week', () => {
    const days = groupByDay(
      [
        session('cancelled', '2026-10-27T19:00:00Z', 'cancelled'),
        session('next-week', '2026-11-03T19:00:00Z'),
      ],
      '2026-10-26',
    );
    expect(days.every((day) => day.sessions.length === 0)).toBe(true);
  });
});
