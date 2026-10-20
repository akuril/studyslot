import { Booking } from '../models/Booking.js';
import { findOwnedBooking } from '../services/bookingAccess.js';

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
