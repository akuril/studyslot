// Authentication API calls.
import { apiRequest } from './client';

/** POST /api/auth/register -> { token, user } */
export function register({ name, email, password }) {
  return apiRequest('/auth/register', { method: 'POST', body: { name, email, password } });
}

/** POST /api/auth/login -> { token, user } */
export function login({ email, password }) {
  return apiRequest('/auth/login', { method: 'POST', body: { email, password } });
}

/** GET /api/auth/me -> { user }  (uses the token set with setAuthToken) */
export function getCurrentUser(options = {}) {
  return apiRequest('/auth/me', { signal: options.signal });
}

/** PATCH /api/auth/me with { name?, bio? } -> { user }  (bio is for tutors only) */
export function updateProfile(changes) {
  return apiRequest('/auth/me', { method: 'PATCH', body: changes });
}

/** POST /api/auth/change-password -> { message } */
export function changePassword({ currentPassword, newPassword }) {
  return apiRequest('/auth/change-password', {
    method: 'POST',
    body: { currentPassword, newPassword },
  });
}

/** GET /api/auth/me/summary -> counts for the account page (shape depends on the role) */
export function getAccountSummary(options = {}) {
  return apiRequest('/auth/me/summary', { signal: options.signal });
}
