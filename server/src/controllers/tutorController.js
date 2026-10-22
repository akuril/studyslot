import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { FieldErrors, readString } from '../utils/validation.js';
import { findTutorBooking, findTutorServiceIds } from '../services/bookingAccess.js';

export const SUMMARY_MAX = 500;

// GET /api/tutor/sessions
// Every booking (any status) for the services linked to THIS tutor's account,
// soonest first. The tutor comes from the verified login token only.
export async function listMySessions(req, res) {
  const serviceIds = await findTutorServiceIds(req.user);
  const sessions = await Booking.find({ service: { $in: serviceIds } }).sort({ startTime: 1 });
  res.status(200).json(sessions);
}

// POST /api/tutor/sessions/:id/complete   body: { summary? }
// The tutor marks a session as done (once it has started) and can leave a short
// summary for the parent.
export async function completeSession(req, res) {
  const errors = new FieldErrors();
  const summary =
    readString(req.body, 'summary', errors, {
      label: 'Summary',
      required: false,
      max: SUMMARY_MAX,
    }) ?? '';
  errors.throwIfAny();

  const booking = await findTutorBooking(req.params.id, req.user); // 404 / 403

  if (booking.status !== 'confirmed') {
    throw ApiError.conflict('Cancelled sessions cannot be completed');
  }
  if (booking.completedAt) {
    throw ApiError.conflict('This session is already marked completed');
  }
  if (booking.startTime.getTime() > Date.now()) {
    throw ApiError.conflict('A session can be marked completed once it has started');
  }

  booking.completedAt = new Date();
  booking.tutorSummary = summary;
  await booking.save();
  res.status(200).json(booking);
}
