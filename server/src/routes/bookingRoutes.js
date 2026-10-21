import { Router } from 'express';
import { createBooking, listMyBookings, getBooking } from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authenticate.js';
import { allowFields, validateIdParam } from '../utils/validation.js';

const router = Router();

// Every booking route requires login. Applied once here so no route can forget it.
router.use(authenticate);

// Only these fields may be sent when creating a booking. Anything else
// (user, status, endTime, serviceSnapshot...) is rejected with 400.
const CREATE_FIELDS = ['serviceId', 'studentFirstName', 'studentGrade', 'startTime', 'notes'];

router.post('/', allowFields(CREATE_FIELDS), createBooking);

// "/mine" MUST be registered before "/:id", otherwise Express would treat the
// word "mine" as a booking id.
router.get('/mine', listMyBookings);
router.get('/:id', validateIdParam(), getBooking);

// Step 20 adds:  PATCH /:id        (reschedule / notes)
//                POST /:id/cancel  (cancel)

export default router;
