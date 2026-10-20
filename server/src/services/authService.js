import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

// bcrypt "cost": each +1 doubles the work. 12 takes a few hundred milliseconds,
// which is unnoticeable for one login but makes guessing millions of passwords impractical.
const BCRYPT_COST = 12;
const JWT_ALGORITHM = 'HS256';

// A real bcrypt hash of a random value. Used when a login email doesn't exist, so the
// response takes the same time either way (timing can't reveal which emails are registered).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing-only', BCRYPT_COST);

/** Turns a plain password into a one-way bcrypt hash (includes a random salt). */
export function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_COST);
}

/**
 * True if `password` matches `passwordHash`. Pass `null` as the hash when the
 * user wasn't found: it still does the same amount of work, then returns false.
 */
export async function verifyPassword(password, passwordHash) {
  const matches = await bcrypt.compare(password, passwordHash || DUMMY_HASH);
  return Boolean(passwordHash) && matches;
}

/** Creates a signed login token. `sub` (subject) = the user's id. No personal data inside. */
export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, config.jwtSecret, {
    algorithm: JWT_ALGORITHM,
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Checks a token's signature and expiry. Returns its payload, or throws
 * (jwt.TokenExpiredError, jwt.JsonWebTokenError) if it's expired, forged, or malformed.
 */
export function verifyToken(token) {
  // Only accept our algorithm. This blocks "alg: none" and algorithm-swap attacks.
  return jwt.verify(token, config.jwtSecret, { algorithms: [JWT_ALGORITHM] });
}
