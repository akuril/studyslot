// Account types. The SERVER decides what each role may do (403 otherwise);
// these helpers only choose which pages and links to show.

export function isTutor(user) {
  return Boolean(user && user.role === 'tutor');
}

/** Where each kind of account "lives": parents -> /dashboard, tutors -> /tutor. */
export function homePathFor(user) {
  return isTutor(user) ? '/tutor' : '/dashboard';
}
