import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import {
  updateProfile,
  changePassword,
  getAccountSummary,
} from '../controllers/accountController.js';
import { authenticate } from '../middleware/authenticate.js';
import {
  loginLimiter,
  registerLimiter,
  passwordChangeLimiter,
} from '../middleware/rateLimits.js';
import { allowFields } from '../utils/validation.js';

const router = Router();

// Order matters: rate limit first (cheapest), then body shape, then the controller.
router.post('/register', registerLimiter, allowFields(['name', 'email', 'password']), register);
router.post('/login', loginLimiter, allowFields(['email', 'password']), login);
router.get('/me', authenticate, getCurrentUser);
router.patch('/me', authenticate, allowFields(['name', 'bio']), updateProfile);
router.get('/me/summary', authenticate, getAccountSummary);
router.post(
  '/change-password',
  authenticate,
  passwordChangeLimiter,
  allowFields(['currentPassword', 'newPassword']),
  changePassword,
);

export default router;
