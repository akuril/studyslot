// Account types. The SERVER decides what each role may do (403 otherwise);
// these helpers only choose which pages and links to show.

/** 'tutor' or 'parent'. Anything else (e.g. an account saved before roles existed) is a parent. */
export function roleOf(user) {
  return user && user.role === 'tutor' ? 'tutor' : 'parent';
}

export function isTutor(user) {
  return Boolean(user) && roleOf(user) === 'tutor';
}

/** Where each kind of account "lives": parents -> /dashboard, tutors -> /tutor. */
export function homePathFor(user) {
  return isTutor(user) ? '/tutor' : '/dashboard';
}
