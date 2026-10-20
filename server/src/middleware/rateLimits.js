import { rateLimit } from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Sends our standard error shape when a limit is hit.
function tooManyRequests(message) {
  return (req, res) => res.status(429).json({ error: message });
}

// Login: at most 10 FAILED attempts per IP address per 15 minutes.
// Successful logins don't count, so a real user is never locked out by logging in normally.
export const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8', // tells clients their remaining attempts (RateLimit headers)
  legacyHeaders: false,
  handler: tooManyRequests('Too many login attempts. Please try again in 15 minutes.'),
});

// Register: at most 10 attempts (successful or not) per IP address per 15 minutes.
// Slows down scripts that create many accounts or probe which emails are registered.
export const registerLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyRequests('Too many sign-up attempts. Please try again in 15 minutes.'),
});
