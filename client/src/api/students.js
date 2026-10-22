// Saved students (parent accounts only). The token is attached by apiRequest.
import { apiRequest } from './client';

/** GET /api/students -> student[] (A-Z) */
export function getStudents(options = {}) {
  return apiRequest('/students', { signal: options.signal });
}

/** POST /api/students with { firstName, grade } -> student */
export function createStudent({ firstName, grade }) {
  return apiRequest('/students', { method: 'POST', body: { firstName, grade: Number(grade) } });
}

/** PATCH /api/students/:id with { firstName?, grade? } -> student */
export function updateStudent(id, changes) {
  return apiRequest(`/students/${encodeURIComponent(id)}`, { method: 'PATCH', body: changes });
}

/** DELETE /api/students/:id -> nothing (204) */
export function deleteStudent(id) {
  return apiRequest(`/students/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
