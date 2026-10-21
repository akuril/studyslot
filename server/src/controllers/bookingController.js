import { Booking, FIRST_NAME_PATTERN, MIN_GRADE, MAX_GRADE } from '../models/Booking.js';
import { Service } from '../models/Service.js';
import { ApiError } from '../utils/ApiError.js';
import { FieldErrors, readString, readInteger, isValidObjectId } from '../utils/validation.js';
import { findOwnedBooking } from '../services/bookingAccess.js';
import {
  parseStartTime,
  checkBookingTime,
  calculateEndTime,
  findOverlappingBooking,
} from '../services/bookingRules.js';

const SLOT_TAKEN_MESSAGE = 'That time is no longer available. Please choose another time.';

// POST /api/bookings
// Body: { serviceId, studentFirstName, studentGrade, startTime, notes? }
export async function createBooking(req, res) {
  // 1. Validate the shape and format of every field (all problems reported at once).
  const errors = new FieldErrors();
  const { serviceId } = req.body;
  if (!isValidObjectId(serviceId)) {
    errors.add('serviceId', serviceId === undefined ? 'Service is required' : 'Invalid id');
  }
  const studentFirstName = readString(req.body, 'studentFirstName', errors, {
    label: 'Student first name',
    max: 40,
    pattern: FIRST_NAME_PATTERN,
    patternMessage: 'Student first name can only contain letters, spaces, hyphens, and apostrophes',
  });
  const studentGrade = readInteger(req.body, 'studentGrade', errors, {
    label: 'Student grade',
    min: MIN_GRADE,
    max: MAX_GRADE,
  });
  const start = parseStartTime(req.body.startTime);
  if (!start) {
    errors.add(
      'startTime',
      req.body.startTime === undefined
        ? 'Start time is required'
        : 'Start time must be an ISO 8601 date-time with a timezone, e.g. 2026-11-03T20:00:00.000Z',
    );
  }
  const notes =
    readString(req.body, 'notes', errors, { label: 'Notes', required: false, max: 300 }) ?? '';
  errors.throwIfAny();

  // 2. The service must exist AND be active. Duration and snapshot come from it, not the client.
  const service = await Service.findOne({ _id: serviceId, isActive: true });
  if (!service) {
    throw ApiError.notFound('Service not found');
  }

  // 3. Business rules: future, 2h-60d window, half-hour slots, Eastern Time hours.
  const timeProblem = checkBookingTime(start, service.durationMinutes);
  if (timeProblem) {
    throw ApiError.badRequest('Validation failed', [{ field: 'startTime', message: timeProblem }]);
  }

  // 4. No overlap with another confirmed booking for this service (one tutor per service).
  const end = calculateEndTime(start, service.durationMinutes);
  const clash = await findOverlappingBooking({ serviceId: service._id, start, end });
  if (clash) {
    throw ApiError.conflict(SLOT_TAKEN_MESSAGE);
  }

  // 5. Save. Every server-controlled field is set HERE, never copied from the request.
  const booking = await Booking.create({
    user: req.user._id, // owner = the verified token's user
    service: service._id,
    serviceSnapshot: {
      name: service.name,
      tutorName: service.tutorName,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
    },
    studentFirstName,
    studentGrade,
    startTime: start,
    endTime: end,
    notes,
  });

  res.status(201).json(booking);
}

// GET /api/bookings/mine
// The filter uses ONLY the id from the verified token, never a user id from the request.
export async function listMyBookings(req, res) {
  const bookings = await Booking.find({ user: req.user._id }).sort({ startTime: 1 });
  res.status(200).json(bookings);
}

// GET /api/bookings/:id   (owner only)
export async function getBooking(req, res) {
  const booking = await findOwnedBooking(req.params.id, req.user);
  res.status(200).json(booking);
}
