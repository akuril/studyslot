// Booking API calls. All require login (the token is attached by apiRequest).
import { apiRequest } from './client';

/** POST /api/bookings -> booking */
export function createBooking({ serviceId, studentFirstName, studentGrade, startTime, notes }) {
  return apiRequest('/bookings', {
    method: 'POST',
    body: { serviceId, studentFirstName, studentGrade, startTime, notes },
  });
}

/** GET /api/bookings/mine -> booking[] (soonest first) */
export function getMyBookings(options = {}) {
  return apiRequest('/bookings/mine', { signal: options.signal });
}

/** GET /api/bookings/:id -> booking */
export function getBooking(id, options = {}) {
  return apiRequest(`/bookings/${encodeURIComponent(id)}`, { signal: options.signal });
}

/** PATCH /api/bookings/:id with { startTime?, notes? } -> booking */
export function updateBooking(id, changes) {
  return apiRequest(`/bookings/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes });
}

/** POST /api/bookings/:id/cancel -> booking */
export function cancelBooking(id) {
  return apiRequest(`/bookings/${encodeURIComponent(id)}/cancel`, { method: 'POST' });
}
