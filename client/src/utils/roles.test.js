import { describe, expect, it } from 'vitest';
import { homePathFor, isTutor, roleOf } from './roles';

describe('roles', () => {
  it('recognizes tutors', () => {
    expect(roleOf({ role: 'tutor' })).toBe('tutor');
    expect(isTutor({ role: 'tutor' })).toBe(true);
    expect(homePathFor({ role: 'tutor' })).toBe('/tutor');
  });

  it('treats parents, missing roles, and unknown roles as parents', () => {
    for (const user of [{ role: 'parent' }, {}, { role: 'admin' }, { role: undefined }]) {
      expect(roleOf(user)).toBe('parent');
      expect(isTutor(user)).toBe(false);
      expect(homePathFor(user)).toBe('/dashboard');
    }
  });

  it('handles a logged-out user', () => {
    expect(roleOf(null)).toBe('parent');
    expect(isTutor(null)).toBe(false);
    expect(isTutor(undefined)).toBe(false);
    expect(homePathFor(null)).toBe('/dashboard');
  });
});
