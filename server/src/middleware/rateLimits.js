import { rateLimit } from 'express-rate-limit';
import { config } from '../config/env.js';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Local development only: Postman runs and manual testing create many accounts and
// logins from one computer, so the auth limits are much higher there. Production
// (Render) and the automated tests use the real limit of 10.
const AUTH_ATTEMPT_LIMIT = config.nodeEnv === 'development' ? 200 : 10;

// Sends our standard error shape when a limit is hit.
function tooManyRequests(message) {
  return (req, res) => res.status(429).json({ error: message });
}

// Login (production): at most 10 FAILED attempts per IP address per 15 minutes.
// Successful logins don't count, so a real user is never locked out by logging in normally.
export const loginLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: AUTH_ATTEMPT_LIMIT,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8', // tells clients their remaining attempts (RateLimit headers)
  legacyHeaders: false,
  handler: tooManyRequests('Too many login attempts. Please try again in 15 minutes.'),
});

// Register (production): at most 10 attempts (successful or not) per IP address per 15 minutes.
// Slows down scripts that create many accounts or probe which emails are registered.
export const registerLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: AUTH_ATTEMPT_LIMIT,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyRequests('Too many sign-up attempts. Please try again in 15 minutes.'),
});

// Change password: at most 10 FAILED attempts per logged-in user per 15 minutes, so a stolen
// login token can't be used to guess the current password. Runs after `authenticate`.
// Successful changes don't count.
export const passwordChangeLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: AUTH_ATTEMPT_LIMIT,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => String(req.user._id),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyRequests('Too many password attempts. Please try again in 15 minutes.'),
});

// AI suggestions: limited PER LOGGED-IN USER (not per IP), to protect the free AI
// allowance and stop one account from using it all. These run after `authenticate`,
// so req.user is always set. Requests rejected with 4xx (e.g. an empty description)
// don't count, so a typo never uses up someone's suggestions.
const ONE_MINUTE = 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;
export const AI_LIMITS = Object.freeze({ perMinute: 5, perDay: 20 });
const AI_LIMIT_MESSAGE = "You've reached the suggestion limit. Please try again later.";

function aiLimiter(windowMs, limit) {
  return rateLimit({
    windowMs,
    limit,
    keyGenerator: (req) => String(req.user._id),
    skipFailedRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: tooManyRequests(AI_LIMIT_MESSAGE),
  });
}

export const aiMinuteLimiter = aiLimiter(ONE_MINUTE, AI_LIMITS.perMinute);
export const aiDayLimiter = aiLimiter(ONE_DAY, AI_LIMITS.perDay);

// Everything else under /api: a generous per-IP ceiling that normal use never reaches
// (about 33 requests a minute, sustained for 15 minutes), but that stops a script from
// hammering bookings, students, or tutor routes. /api/health is mounted before this,
// so the hosting platform's health checks are never limited.
export const GENERAL_API_LIMIT = config.nodeEnv === 'development' ? 5000 : 500;

export const apiLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  limit: GENERAL_API_LIMIT,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: tooManyRequests('Too many requests. Please slow down and try again in a few minutes.'),
});
