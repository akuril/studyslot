import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { isValidObjectId } from '../utils/validation.js';
import { verifyToken } from '../services/authService.js';

/**
 * Requires a valid login. Reads "Authorization: Bearer <token>", verifies it,
 * loads the user, and puts it on req.user. Otherwise responds 401.
 *
 * This is AUTHENTICATION (who are you?). Checking whether that user may access a
 * specific booking is AUTHORIZATION, done in the booking controller (Step 18).
 */
export async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Authentication required');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Session expired. Please log in again.');
    }
    throw ApiError.unauthorized('Authentication required'); // forged, malformed, wrong secret
  }

  // The token is valid, but the account might have been deleted since it was issued.
  const user = isValidObjectId(payload.sub) ? await User.findById(payload.sub) : null;
  if (!user) {
    throw ApiError.unauthorized('Authentication required');
  }

  req.user = user;
  next();
}
