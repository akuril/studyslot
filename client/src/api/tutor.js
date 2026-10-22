// Tutor account API calls. The server checks the account really is a tutor (403 otherwise).
import { apiRequest } from './client';

/** GET /api/tutor/sessions -> booking[] for the tutor's services (soonest first) */
export function getTutorSessions(options = {}) {
  return apiRequest('/tutor/sessions', { signal: options.signal });
}

/** POST /api/tutor/sessions/:id/complete with { summary? } -> booking */
export function completeSession(id, summary) {
  return apiRequest(`/tutor/sessions/${encodeURIComponent(id)}/complete`, {
    method: 'POST',
    body: summary ? { summary } : {},
  });
}
