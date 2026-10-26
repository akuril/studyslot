import { describe, expect, it } from 'vitest';
import {
  BIO_MAX,
  isProfileUnchanged,
  validateChangePassword,
  validateProfile,
} from './accountValidation';
import { passwordProblem } from './authValidation';

describe('validateProfile', () => {
  it('accepts a normal name (spaces around it are ignored)', () => {
    expect(validateProfile({ name: '  Jordan Rivera ', bio: '' })).toEqual({});
  });

  it('requires a name of 2 to 60 characters', () => {
    expect(validateProfile({ name: '', bio: '' }).name).toBe('Name is required');
    expect(validateProfile({ name: '   ', bio: '' }).name).toBe('Name is required');
    expect(validateProfile({ name: 'A', bio: '' }).name).toBe('Name must be 2–60 characters');
    expect(validateProfile({ name: 'x'.repeat(61), bio: '' }).name).toBe(
      'Name must be 2–60 characters',
    );
    expect(validateProfile({ name: 'x'.repeat(60), bio: '' })).toEqual({});
  });

  it('checks the bio length for tutors only', () => {
    const longBio = 'x'.repeat(BIO_MAX + 1);
    expect(validateProfile({ name: 'Nora Patel', bio: longBio }, { tutor: true }).bio).toBe(
      'Bio must be at most 300 characters',
    );
    expect(validateProfile({ name: 'Nora Patel', bio: 'x'.repeat(BIO_MAX) }, { tutor: true })).toEqual({});
    // A parent's form has no bio field, so it is never checked.
    expect(validateProfile({ name: 'Jordan Rivera', bio: longBio })).toEqual({});
  });
});

describe('isProfileUnchanged', () => {
  const user = { name: 'Nora Patel', bio: 'I love planning.' };

  it('is true when nothing differs, ignoring surrounding spaces', () => {
    expect(isProfileUnchanged({ name: ' Nora Patel ', bio: 'I love planning. ' }, user, { tutor: true })).toBe(true);
  });

  it('is false when the name or a tutor bio differs', () => {
    expect(isProfileUnchanged({ name: 'Nora P.', bio: user.bio }, user, { tutor: true })).toBe(false);
    expect(isProfileUnchanged({ name: user.name, bio: 'New bio' }, user, { tutor: true })).toBe(false);
  });

  it('ignores the bio for a parent and treats a missing bio as empty', () => {
    expect(isProfileUnchanged({ name: 'Jordan Rivera', bio: 'ignored' }, { name: 'Jordan Rivera' })).toBe(true);
    expect(isProfileUnchanged({ name: 'Nora Patel', bio: '' }, { name: 'Nora Patel' }, { tutor: true })).toBe(true);
  });
});

describe('validateChangePassword', () => {
  const valid = {
    currentPassword: 'Passw0rdOK',
    newPassword: 'NewPassw0rd9',
    confirmPassword: 'NewPassw0rd9',
  };

  it('accepts a valid change', () => {
    expect(validateChangePassword(valid)).toEqual({});
  });

  it('requires the current password', () => {
    expect(validateChangePassword({ ...valid, currentPassword: '' }).currentPassword).toBe(
      'Current password is required',
    );
  });

  it('applies the same new-password rules as sign-up', () => {
    for (const newPassword of ['', 'short1', 'onlyletters', '12345678901', 'a1'.repeat(40)]) {
      const errors = validateChangePassword({ ...valid, newPassword, confirmPassword: newPassword });
      expect(errors.newPassword).toBe(passwordProblem(newPassword));
      expect(errors.newPassword).toBeTruthy();
    }
  });

  it('rejects reusing the current password', () => {
    const errors = validateChangePassword({
      ...valid,
      newPassword: valid.currentPassword,
      confirmPassword: valid.currentPassword,
    });
    expect(errors.newPassword).toBe('Choose a password different from your current one');
  });

  it('requires the confirmation to match', () => {
    expect(validateChangePassword({ ...valid, confirmPassword: 'Different1' }).confirmPassword).toBe(
      'Passwords do not match',
    );
  });
});
