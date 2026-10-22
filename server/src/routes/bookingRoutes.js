import { Router } from 'express';
import {
  createBooking,
  listMyBookings,
  getBooking,
  updateBooking,
  cancelBooking,
} from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { allowFields, validateIdParam } from '../utils/validation.js';

const router = Router();

// Every booking route requires login. Applied once here so no route can forget it.
router.use(authenticate);

// Booking, listing "mine", rescheduling, and cancelling are for PARENT accounts.
// Tutors use /api/tutor instead. Viewing one booking is allowed for both
// (the controller checks it is the parent's own booking or the tutor's own session).
const parentOnly = requireRole('parent');

// Only these fields may be sent. Anything else (user, status, endTime,
// serviceSnapshot, rescheduleCount...) is rejected with 400.
const CREATE_FIELDS = ['serviceId', 'studentFirstName', 'studentGrade', 'startTime', 'notes'];
const UPDATE_FIELDS = ['startTime', 'notes'];

router.post('/', parentOnly, allowFields(CREATE_FIELDS), createBooking);

// "/mine" MUST be registered before "/:id", otherwise Express would treat the
// word "mine" as a booking id.
router.get('/mine', parentOnly, listMyBookings);
router.get('/:id', validateIdParam(), getBooking);
router.patch('/:id', parentOnly, validateIdParam(), allowFields(UPDATE_FIELDS), updateBooking);
router.post('/:id/cancel', parentOnly, validateIdParam(), allowFields([]), cancelBooking);

export default router;
