// Service catalog API calls (public: no login needed).
import { apiRequest } from './client';

/**
 * GET /api/services
 * @param {{ subject?: string, grade?: number|string }} [filters]
 * @param {{ signal?: AbortSignal }} [options]
 */
export function getServices(filters = {}, options = {}) {
  return apiRequest('/services', {
    query: { subject: filters.subject, grade: filters.grade },
    signal: options.signal,
  });
}

/** GET /api/services/:id */
export function getService(id, options = {}) {
  return apiRequest(`/services/${encodeURIComponent(id)}`, { signal: options.signal });
}
