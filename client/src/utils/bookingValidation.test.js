import { describe, expect, it } from 'vitest';
import { NOTES_MAX, validateBookingForm } from './bookingValidation';

const valid = {
  studentFirstName: 'Maya',
  studentGrade: '8',
  startTime: '2026-10-26T19:00:00.000Z',
  notes: '',
};

describe('validateBookingForm', () => {
  it('accepts a complete form', () => {
    expect(validateBookingForm(valid)).toEqual({});
  });

  it('requires every field except notes', () => {
    const errors = validateBookingForm({
      studentFirstName: ' ',
      studentGrade: '',
      startTime: '',
      notes: '',
    });
    expect(Object.keys(errors).sort()).toEqual(['startTime', 'studentFirstName', 'studentGrade']);
  });

  it('checks the first-name rules', () => {
    expect(validateBookingForm({ ...valid, studentFirstName: 'Maya2' }).studentFirstName).toBeTruthy();
    expect(
      validateBookingForm({ ...valid, studentFirstName: 'A'.repeat(41) }).studentFirstName,
    ).toBeTruthy();
    expect(validateBookingForm({ ...valid, studentFirstName: "D'Arcy-Lee" })).toEqual({});
  });

  it('limits notes to 300 characters', () => {
    expect(NOTES_MAX).toBe(300);
    expect(validateBookingForm({ ...valid, notes: 'x'.repeat(300) })).toEqual({});
    expect(validateBookingForm({ ...valid, notes: 'x'.repeat(301) }).notes).toMatch(/300/);
  });
});
