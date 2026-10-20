import { Router } from 'express';
import { register, login, getCurrentUser } from '../controllers/authController.js';
import { authenticate } from '../middleware/authenticate.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimits.js';
import { allowFields } from '../utils/validation.js';

const router = Router();

// Order matters: rate limit first (cheapest), then body shape, then the controller.
router.post('/register', registerLimiter, allowFields(['name', 'email', 'password']), register);
router.post('/login', loginLimiter, allowFields(['email', 'password']), login);
router.get('/me', authenticate, getCurrentUser);

export default router;
