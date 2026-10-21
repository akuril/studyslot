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
