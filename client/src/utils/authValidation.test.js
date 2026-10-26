import { describe, expect, it } from 'vitest';
import { validateLogin, validateRegistration } from './authValidation';

describe('validateLogin', () => {
  it('accepts an email and a password', () => {
    expect(validateLogin({ email: 'parent@example.com', password: 'x' })).toEqual({});
  });

  it('requires both fields', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'Email is required',
      password: 'Password is required',
    });
  });

  it('rejects malformed emails', () => {
    for (const email of ['parent', 'parent@', '@example.com', 'a b@example.com', 'a@b']) {
      expect(validateLogin({ email, password: 'x' }).email).toBe('Enter a valid email address');
    }
  });
});

describe('validateRegistration', () => {
  const valid = {
    name: 'Sam Parent',
    email: 'sam@example.com',
    password: 'Passw0rdOK',
    confirmPassword: 'Passw0rdOK',
  };

  it('accepts a good registration', () => {
    expect(validateRegistration(valid)).toEqual({});
  });

  it('checks the name length', () => {
    expect(validateRegistration({ ...valid, name: '' }).name).toBe('Name is required');
    expect(validateRegistration({ ...valid, name: 'A' }).name).toMatch(/2–60/);
    expect(validateRegistration({ ...valid, name: 'A'.repeat(61) }).name).toMatch(/2–60/);
  });

  it('requires a password of 8+ characters with a letter and a number', () => {
    const check = (password) =>
      validateRegistration({ ...valid, password, confirmPassword: password }).password;
    expect(check('')).toBe('Password is required');
    expect(check('abc1')).toMatch(/at least 8/);
    expect(check('abcdefgh')).toMatch(/letter and one number/);
    expect(check('12345678')).toMatch(/letter and one number/);
    expect(check('abcdefg1')).toBeUndefined();
  });

  it('limits passwords to 72 bytes (a bcrypt limit), counting multi-byte characters', () => {
    const check = (password) =>
      validateRegistration({ ...valid, password, confirmPassword: password }).password;
    expect(check(`a1${'x'.repeat(70)}`)).toBeUndefined();
    expect(check(`a1${'x'.repeat(71)}`)).toMatch(/too long/);
    expect(check(`a1${'é'.repeat(36)}`)).toMatch(/too long/);
  });

  it('requires the two passwords to match', () => {
    expect(validateRegistration({ ...valid, confirmPassword: 'different1' }).confirmPassword).toBe(
      'Passwords do not match',
    );
  });
});
