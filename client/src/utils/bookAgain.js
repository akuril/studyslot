// "Book again": starts a new booking for the same service and student.
// The link only carries the student's first name and grade (never a time or notes),
// and the booking form checks them again, so a hand-edited link can't put bad data in the form.

import { getDisplayStatus } from './bookingTime';
import { FIRST_NAME_PATTERN } from './bookingValidation';

const NAME_MAX = 40;

/** Past (completed) and cancelled sessions can be booked again. Upcoming ones can't. */
export function canBookAgain(booking, now = new Date()) {
  return getDisplayStatus(booking, now) !== 'upcoming';
}

/** The booking page for the same service, with the student pre-filled. */
export function bookAgainPath(booking) {
  const query = new URLSearchParams({
    student: booking.studentFirstName,
    grade: String(booking.studentGrade),
  });
  return `/services/${encodeURIComponent(booking.serviceId)}/book?${query.toString()}`;
}

/**
 * Reads the pre-filled student from the page address.
 * `grades` = the grades this service covers (e.g. [6, 7, 8]).
 * Returns { studentFirstName, studentGrade } as strings; anything invalid becomes ''.
 */
export function readBookAgain(searchParams, grades) {
  const rawName = (searchParams.get('student') || '').trim();
  const isValidName =
    rawName !== '' && rawName.length <= NAME_MAX && FIRST_NAME_PATTERN.test(rawName);

  const rawGrade = searchParams.get('grade') || '';
  const gradeNumber = /^\d{1,2}$/.test(rawGrade) ? Number(rawGrade) : NaN;
  const isValidGrade = grades.includes(gradeNumber);

  return {
    studentFirstName: isValidName ? rawName : '',
    studentGrade: isValidGrade ? String(gradeNumber) : '',
  };
}
