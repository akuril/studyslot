import { Router } from 'express';
import { recommendService, sessionPrepTips } from '../controllers/aiController.js';
import { authenticate } from '../middleware/authenticate.js';
import { aiMinuteLimiter, aiDayLimiter } from '../middleware/rateLimits.js';
import { allowFields } from '../utils/validation.js';

const router = Router();

// Order matters:
// 1. authenticate: who is asking? (401 if not logged in)
// 2. limiters: has THIS user asked too often? (429). They need req.user from step 1.
// 3. allowFields: only `need` and `grade` may be sent (400 otherwise)
// 4. controller: validates the values, then asks the AI service
router.post(
  '/recommend-service',
  authenticate,
  aiMinuteLimiter,
  aiDayLimiter,
  allowFields(['need', 'grade']),
  recommendService,
);

// Built-in prep tips (no AI call), so the AI limits do not apply. Login and the booking
// access check (parent or tutor of that session) still do.
router.post('/session-prep', authenticate, allowFields(['bookingId']), sessionPrepTips);

export default router;
