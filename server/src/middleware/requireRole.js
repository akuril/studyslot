import { ApiError } from '../utils/ApiError.js';

const ROLE_MESSAGES = {
  parent: 'Only parent accounts can do this',
  tutor: 'Only tutor accounts can do this',
};

/**
 * AUTHORIZATION by account type. Use AFTER `authenticate` (it needs req.user).
 *   router.use(authenticate, requireRole('tutor'));
 * The role comes from the database user loaded by `authenticate`, never from the
 * request, so a parent can't call tutor routes (or the other way round): 403.
 */
export function requireRole(role) {
  return function checkRole(req, res, next) {
    if (!req.user || req.user.role !== role) {
      throw ApiError.forbidden(ROLE_MESSAGES[role] || 'You do not have access to this');
    }
    next();
  };
}
