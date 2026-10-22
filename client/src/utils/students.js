// Saved-student rules, mirroring the server's (server/src/models/Student.js).
import { GRADES } from './services';

export const MAX_STUDENTS = 10;
const NAME_PATTERN = /^\p{L}[\p{L} '-]*$/u;

/** Same rules as the server: first name only (letters, spaces, - and '), grade 6-12. */
export function validateStudent({ firstName, grade }) {
  const errors = {};
  const name = firstName.trim();
  if (name === '') errors.firstName = 'Enter a first name.';
  else if (name.length > 40) errors.firstName = 'Use at most 40 characters.';
  else if (!NAME_PATTERN.test(name)) {
    errors.firstName = 'Use letters, spaces, hyphens, and apostrophes only.';
  }
  if (!GRADES.includes(Number(grade))) errors.grade = 'Choose a grade.';
  return errors;
}
