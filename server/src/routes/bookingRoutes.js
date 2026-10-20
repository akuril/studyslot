import { Router } from 'express';
import { listMyBookings, getBooking } from '../controllers/bookingController.js';
import { authenticate } from '../middleware/authenticate.js';
import { validateIdParam } from '../utils/validation.js';

const router = Router();

// Every booking route requires login. Applied once here so no route can forget it.
router.use(authenticate);

// "/mine" MUST be registered before "/:id", otherwise Express would treat the
// word "mine" as a booking id.
router.get('/mine', listMyBookings);
router.get('/:id', validateIdParam(), getBooking);

// Step 19 adds:  POST /            (create)
// Step 20 adds:  PATCH /:id        (reschedule / notes)
//                POST /:id/cancel  (cancel)

export default router;
