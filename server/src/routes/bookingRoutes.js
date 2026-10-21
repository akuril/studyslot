import { Router } from 'express';
import {
  createBooking,
  listMyBookings,
  getBooking,
  updateBooking,
  cancelBooking,
} from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authenticate.js';
import { allowFields, validateIdParam } from '../utils/validation.js';

const router = Router();

// Every booking route requires login. Applied once here so no route can forget it.
router.use(authenticate);

// Only these fields may be sent. Anything else (user, status, endTime,
// serviceSnapshot, rescheduleCount...) is rejected with 400.
const CREATE_FIELDS = ['serviceId', 'studentFirstName', 'studentGrade', 'startTime', 'notes'];
const UPDATE_FIELDS = ['startTime', 'notes'];

router.post('/', allowFields(CREATE_FIELDS), createBooking);

// "/mine" MUST be registered before "/:id", otherwise Express would treat the
// word "mine" as a booking id.
router.get('/mine', listMyBookings);
router.get('/:id', validateIdParam(), getBooking);
router.patch('/:id', validateIdParam(), allowFields(UPDATE_FIELDS), updateBooking);
router.post('/:id/cancel', validateIdParam(), allowFields([]), cancelBooking);

export default router;
