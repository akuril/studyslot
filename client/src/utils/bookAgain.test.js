import { describe, expect, it } from 'vitest';
import { bookAgainPath, canBookAgain, readBookAgain } from './bookAgain';

const NOW = new Date('2026-10-26T15:00:00Z');
const base = {
  serviceId: '6adfa50639beced60cc8da97',
  studentFirstName: 'Sam',
  studentGrade: 7,
  status: 'confirmed',
  completedAt: null,
  startTime: '2026-10-20T20:00:00Z',
  endTime: '2026-10-20T21:00:00Z',
};

describe('canBookAgain', () => {
  it('is true for finished sessions, marked completed or already over', () => {
    expect(canBookAgain(base, NOW)).toBe(true);
    expect(
      canBookAgain({ ...base, endTime: '2026-11-20T21:00:00Z', completedAt: '2026-10-25T00:00:00Z' }, NOW),
    ).toBe(true);
  });

  it('is true for cancelled sessions, even future ones', () => {
    expect(canBookAgain({ ...base, status: 'cancelled', endTime: '2026-11-20T21:00:00Z' }, NOW)).toBe(true);
  });

  it('is false for upcoming sessions', () => {
    expect(canBookAgain({ ...base, startTime: '2026-11-20T20:00:00Z', endTime: '2026-11-20T21:00:00Z' }, NOW)).toBe(false);
  });
});

describe('bookAgainPath', () => {
  it('points at the same service with the student pre-filled', () => {
    expect(bookAgainPath(base)).toBe('/services/6adfa50639beced60cc8da97/book?student=Sam&grade=7');
  });

  it('encodes names with spaces and apostrophes', () => {
    const path = bookAgainPath({ ...base, studentFirstName: "Mary Jo O'Neil" });
    expect(path).toContain('student=Mary+Jo+O%27Neil');
    expect(readBookAgain(new URL(`http://x${path}`).searchParams, [7])).toEqual({
      studentFirstName: "Mary Jo O'Neil",
      studentGrade: '7',
    });
  });
});

describe('readBookAgain', () => {
  const read = (query, grades = [6, 7, 8]) => readBookAgain(new URLSearchParams(query), grades);

  it('reads a valid student and grade', () => {
    expect(read('student=Sam&grade=7')).toEqual({ studentFirstName: 'Sam', studentGrade: '7' });
  });

  it('returns empty values when nothing is given', () => {
    expect(read('')).toEqual({ studentFirstName: '', studentGrade: '' });
  });

  it('drops a grade the service does not cover but keeps the name', () => {
    expect(read('student=Sam&grade=11')).toEqual({ studentFirstName: 'Sam', studentGrade: '' });
  });

  it('drops grades that are not plain whole numbers', () => {
    for (const grade of ['7.5', 'abc', '-7', '07x', '', '1e1']) {
      expect(read(`student=Sam&grade=${grade}`).studentGrade).toBe('');
    }
  });

  it('drops names that break the booking rules', () => {
    for (const student of ['<script>', '123', 'Sam<b>', 'x'.repeat(41), '   ']) {
      expect(read(`student=${encodeURIComponent(student)}&grade=7`).studentFirstName).toBe('');
    }
  });
});
