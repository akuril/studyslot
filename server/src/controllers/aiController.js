import { recommendServices } from '../services/aiService.js';
import { getSessionPrepTips } from '../services/aiPrepService.js';
import { findViewableBooking } from '../services/bookingAccess.js';
import { Service } from '../models/Service.js';
import { ApiError } from '../utils/ApiError.js';
import { FieldErrors, readString, readInteger, isValidObjectId } from '../utils/validation.js';

export const MAX_NEED_LENGTH = 500;

// Line breaks, tabs, and other invisible control characters become single spaces,
// and runs of spaces collapse, so "  fractions\n\n test " becomes "fractions test".
function normalizeNeed(value) {
  if (typeof value !== 'string') return value; // readString reports the wrong type
  // eslint-disable-next-line no-control-regex
  return value
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// POST /api/ai/recommend-service   body: { need, grade? }
// Login, per-user limits, and the allowed fields are checked by the route first.
export async function recommendService(req, res) {
  const errors = new FieldErrors();
  const need = readString({ need: normalizeNeed(req.body.need) }, 'need', errors, {
    label: 'Description',
    min: 1,
    max: MAX_NEED_LENGTH,
  });
  const grade = readInteger(req.body, 'grade', errors, {
    label: 'Grade',
    required: false,
    min: 6,
    max: 12,
  });
  errors.throwIfAny();

  // Only the description and grade go to the AI. Never req.user (name, email, id).
  const result = await recommendServices({ need, grade });
  res.status(200).json(result);
}

// POST /api/ai/session-prep   body: { bookingId }
// For the parent who booked the session, or the tutor who teaches it.
export async function sessionPrepTips(req, res) {
  const { bookingId } = req.body;
  if (!isValidObjectId(bookingId)) {
    throw ApiError.badRequest('Validation failed', [
      { field: 'bookingId', message: 'A valid booking id is required' },
    ]);
  }

  const booking = await findViewableBooking(bookingId, req.user); // 404 / 403
  if (booking.status !== 'confirmed') {
    throw ApiError.conflict('Prep tips are only available for confirmed sessions');
  }

  // The subject comes from the service (the booking only keeps a snapshot of its name).
  const service = await Service.findById(booking.service).select('subject gradeBand');

  const result = await getSessionPrepTips({
    serviceName: booking.serviceSnapshot.name,
    subject: service ? service.subject : 'homework-help',
    gradeBand: service ? service.gradeBand : '6-12',
    studentGrade: booking.studentGrade,
    studentFirstName: booking.studentFirstName, // used only to REMOVE the name from the notes
    notes: booking.notes,
  });
  res.status(200).json(result);
}
