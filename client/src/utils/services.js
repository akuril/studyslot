// Display helpers for tutoring services. The allowed values match the server's lists.

export const SUBJECTS = [
  { value: 'math', label: 'Math', icon: '➗' },
  { value: 'science', label: 'Science', icon: '🔬' },
  { value: 'english', label: 'English', icon: '📖' },
  { value: 'social-studies', label: 'Social Studies', icon: '🌎' },
  { value: 'world-languages', label: 'World Languages', icon: '🗣️' },
  { value: 'computer-science', label: 'Computer Science', icon: '💻' },
  { value: 'study-skills', label: 'Study Skills', icon: '🗂️' },
  { value: 'test-prep', label: 'Test Prep', icon: '📝' },
  { value: 'homework-help', label: 'Homework Help', icon: '✏️' },
];

export const GRADES = [6, 7, 8, 9, 10, 11, 12];

const SUBJECT_BY_VALUE = Object.fromEntries(SUBJECTS.map((subject) => [subject.value, subject]));

export function getSubject(value) {
  return SUBJECT_BY_VALUE[value] || { value, label: value, icon: '📚' };
}

export function isValidSubject(value) {
  return Boolean(SUBJECT_BY_VALUE[value]);
}

export function isValidGrade(value) {
  return GRADES.includes(Number(value));
}

/** "6-8" -> "Grades 6–8" */
export function formatGradeBand(gradeBand) {
  return `Grades ${String(gradeBand).replace('-', '–')}`;
}

const wholeDollars = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const dollarsAndCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** 4500 -> "$45", 4550 -> "$45.50" */
export function formatPrice(priceCents) {
  const dollars = priceCents / 100;
  return Number.isInteger(dollars) ? wholeDollars.format(dollars) : dollarsAndCents.format(dollars);
}
