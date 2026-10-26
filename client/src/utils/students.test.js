import { describe, expect, it } from 'vitest';
import { MAX_STUDENTS, validateStudent } from './students';

describe('validateStudent', () => {
  it('accepts a normal student', () => {
    expect(validateStudent({ firstName: 'Maya', grade: 8 })).toEqual({});
  });

  it('accepts a grade sent as text and names with hyphens, apostrophes, and accents', () => {
    expect(validateStudent({ firstName: "Mary-Jane O'Neil", grade: '7' })).toEqual({});
    expect(validateStudent({ firstName: 'José', grade: 12 })).toEqual({});
  });

  it('requires a first name', () => {
    expect(validateStudent({ firstName: '   ', grade: 8 }).firstName).toBe('Enter a first name.');
  });

  it('rejects names that are too long', () => {
    expect(validateStudent({ firstName: 'A'.repeat(41), grade: 8 }).firstName).toMatch(/40/);
    expect(validateStudent({ firstName: 'A'.repeat(40), grade: 8 })).toEqual({});
  });

  it('rejects digits, symbols, and names that start with punctuation', () => {
    for (const bad of ['Maya2', 'Maya!', '-Maya', "'Maya", 'Maya@home']) {
      expect(validateStudent({ firstName: bad, grade: 8 }).firstName).toBeTruthy();
    }
  });

  it('only allows grades 6 to 12', () => {
    expect(validateStudent({ firstName: 'Maya', grade: 5 }).grade).toBe('Choose a grade.');
    expect(validateStudent({ firstName: 'Maya', grade: 13 }).grade).toBe('Choose a grade.');
    expect(validateStudent({ firstName: 'Maya', grade: '' }).grade).toBe('Choose a grade.');
    expect(validateStudent({ firstName: 'Maya', grade: 6 })).toEqual({});
    expect(validateStudent({ firstName: 'Maya', grade: 12 })).toEqual({});
  });

  it('limits each account to 10 saved students', () => {
    expect(MAX_STUDENTS).toBe(10);
  });
});
