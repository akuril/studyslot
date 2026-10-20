import { Booking } from '../models/Booking.js';
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
 * Every route that reads or changes ONE booking (GET, PATCH, cancel) uses this,
 * so the rule lives in exactly one place.
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
