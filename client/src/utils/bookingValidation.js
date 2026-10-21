// Instant checks for the booking forms (the server re-checks everything).
const FIRST_NAME_PATTERN = /^\p{L}[\p{L} '-]*$/u;
export const NOTES_MAX = 300;

export function validateBookingForm({ studentFirstName, studentGrade, startTime, notes }) {
  const errors = {};
  const name = studentFirstName.trim();
  if (!name) {
    errors.studentFirstName = "Student's first name is required";
  } else if (name.length > 40) {
    errors.studentFirstName = 'First name must be at most 40 characters';
  } else if (!FIRST_NAME_PATTERN.test(name)) {
    errors.studentFirstName = 'Use letters, spaces, hyphens, and apostrophes only';
  }
  if (!studentGrade) {
    errors.studentGrade = 'Choose a grade';
  }
  if (!startTime) {
    errors.startTime = 'Choose a date and start time';
  }
  if (notes.length > NOTES_MAX) {
    errors.notes = `Notes must be at most ${NOTES_MAX} characters`;
  }
  return errors;
}
