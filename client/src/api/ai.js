// AI API calls. Require login (the token is attached by apiRequest).
import { apiRequest } from './client';

/**
 * POST /api/ai/recommend-service with { need, grade? }
 * -> { summary, recommendations: [{ serviceId, name, subject, gradeBand, reason }], disclaimer, source }
 */
export function recommendService({ need, grade }) {
  const body = { need };
  if (grade !== undefined && grade !== '') {
    body.grade = Number(grade);
  }
  return apiRequest('/ai/recommend-service', { method: 'POST', body });
}

/** POST /api/ai/session-prep with { bookingId } -> { tips: string[], disclaimer } (built-in tips, no AI) */
export function getSessionPrepTips(bookingId) {
  return apiRequest('/ai/session-prep', { method: 'POST', body: { bookingId } });
}
