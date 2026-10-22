import { Booking } from '../models/Booking.js';
import { Service } from '../models/Service.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * AUTHORIZATION for a single booking: loads it and makes sure it belongs to `user`.
 *  - no such booking            -> 404 Booking not found
 *  - someone else's booking     -> 403 You do not have access to this booking
 *
 * Ownership is decided ONLY by comparing the booking's stored owner with the user
 * from the verified login token. Nothing the client sends (body, query, headers)
 * can change who the owner is.
 *
 * Every route that CHANGES one booking (PATCH, cancel) uses this, so the rule lives
 * in exactly one place. Only the parent who booked can change a booking.
 */
export async function findOwnedBooking(bookingId, user) {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  if (!booking.user.equals(user._id)) {
    throw ApiError.forbidden('You do not have access to this booking');
  }
  return booking;
}

/** Ids of every service (active or not) linked to this tutor's account. */
export async function findTutorServiceIds(tutor) {
  const services = await Service.find({ tutor: tutor._id }).select('_id');
  return services.map((service) => service._id);
}

/**
 * Loads a booking for one of THIS tutor's services.
 *  - no such booking                       -> 404
 *  - a booking for another tutor's service -> 403
 */
export async function findTutorBooking(bookingId, tutor) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw ApiError.notFound('Booking not found');
  }
  const service = await Service.findById(booking.service).select('tutor');
  if (!service || !service.tutor || !service.tutor.equals(tutor._id)) {
    throw ApiError.forbidden('You do not have access to this booking');
  }
  return booking;
}

/**
 * READ access to one booking: the parent who booked it, or the tutor who teaches it.
 * Used by GET /api/bookings/:id and the AI session-prep tips.
 */
export function findViewableBooking(bookingId, user) {
  return user.role === 'tutor'
    ? findTutorBooking(bookingId, user)
    : findOwnedBooking(bookingId, user);
}
