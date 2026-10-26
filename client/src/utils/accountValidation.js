// Client-side checks for the account page forms. They only make the forms friendlier
// (instant messages); the server checks everything again and its answer is what counts.

import { passwordProblem } from './authValidation';

export const NAME_MIN = 2;
export const NAME_MAX = 60;
export const BIO_MAX = 300;

/** { name, bio } -> { name?, bio? } error messages. `bio` is only checked for tutors. */
export function validateProfile({ name, bio }, { tutor = false } = {}) {
  const errors = {};
  const trimmedName = name.trim();
  if (!trimmedName) {
    errors.name = 'Name is required';
  } else if (trimmedName.length < NAME_MIN || trimmedName.length > NAME_MAX) {
    errors.name = `Name must be ${NAME_MIN}–${NAME_MAX} characters`;
  }
  if (tutor && bio.trim().length > BIO_MAX) {
    errors.bio = `Bio must be at most ${BIO_MAX} characters`;
  }
  return errors;
}

/** True when nothing differs from what is already saved (so Save can be skipped). */
export function isProfileUnchanged({ name, bio }, user, { tutor = false } = {}) {
  const sameName = name.trim() === user.name;
  const sameBio = !tutor || bio.trim() === (user.bio || '');
  return sameName && sameBio;
}

export function validateChangePassword({ currentPassword, newPassword, confirmPassword }) {
  const errors = {};
  if (!currentPassword) {
    errors.currentPassword = 'Current password is required';
  }
  const problem = passwordProblem(newPassword);
  if (problem) {
    errors.newPassword = problem;
  } else if (newPassword === currentPassword) {
    errors.newPassword = 'Choose a password different from your current one';
  }
  if (!errors.newPassword && confirmPassword !== newPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }
  return errors;
}
