// Client-side checks for the login and sign-up forms.
// These only make the form friendlier (instant messages). The server checks
// everything again, and its answer is what counts.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The message for a password that breaks the rules, or '' when it is acceptable. */
export function passwordProblem(password) {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters';
  }
  if (new TextEncoder().encode(password).length > 72) {
    return 'Password is too long (maximum 72 characters)';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return 'Password must include at least one letter and one number';
  }
  return '';
}

export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_PATTERN.test(email.trim())) {
    errors.email = 'Enter a valid email address';
  }
  if (!password) {
    errors.password = 'Password is required';
  }
  return errors;
}

export function validateRegistration({ name, email, password, confirmPassword }) {
  const errors = {};
  const trimmedName = name.trim();
  if (!trimmedName) {
    errors.name = 'Name is required';
  } else if (trimmedName.length < 2 || trimmedName.length > 60) {
    errors.name = 'Name must be 2–60 characters';
  }

  Object.assign(errors, validateLogin({ email, password: 'x' }));

  const problem = passwordProblem(password);
  if (problem) {
    errors.password = problem;
  }

  if (confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match';
  }
  return errors;
}
