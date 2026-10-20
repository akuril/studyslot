// Small, reusable helpers for validating untrusted request data at the API boundary.
// Mongoose schema rules are the safety net; these give clear errors FIRST.

import { ApiError } from './ApiError.js';

// A MongoDB ObjectId written as text: exactly 24 hexadecimal characters.
// (mongoose.isValidObjectId also accepts ANY 12-character string, which is too loose.)
const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

export function isValidObjectId(value) {
  return typeof value === 'string' && OBJECT_ID_PATTERN.test(value);
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Collects field problems, then throws one 400 with all of them. */
export class FieldErrors {
  constructor() {
    this.details = [];
  }

  add(field, message) {
    this.details.push({ field, message });
  }

  get hasErrors() {
    return this.details.length > 0;
  }

  throwIfAny() {
    if (this.hasErrors) {
      throw ApiError.badRequest('Validation failed', this.details);
    }
  }
}

/**
 * Reads a text field: must be a string, is trimmed, and is checked for length/pattern.
 * Returns the cleaned value, or undefined (and records an error) if invalid or missing.
 */
export function readString(body, field, errors, options = {}) {
  const { label = field, required = true, min = 0, max, pattern, patternMessage } = options;
  const raw = body[field];

  if (raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '')) {
    if (required) {
      errors.add(field, `${label} is required`);
    }
    return undefined;
  }
  if (typeof raw !== 'string') {
    errors.add(field, `${label} must be text`);
    return undefined;
  }

  const value = raw.trim();
  if (value.length < min) {
    errors.add(field, `${label} must be at least ${min} characters`);
    return undefined;
  }
  if (max !== undefined && value.length > max) {
    errors.add(field, `${label} must be at most ${max} characters`);
    return undefined;
  }
  if (pattern && !pattern.test(value)) {
    errors.add(field, patternMessage || `${label} is not valid`);
    return undefined;
  }
  return value;
}

/** Reads a whole number in [min, max]. Accepts 7 or "7"; rejects 7.5, "abc", true. */
export function readInteger(body, field, errors, options = {}) {
  const { label = field, required = true, min, max } = options;
  const raw = body[field];

  if (raw === undefined || raw === null || raw === '') {
    if (required) {
      errors.add(field, `${label} is required`);
    }
    return undefined;
  }

  const value = typeof raw === 'string' && raw.trim() !== '' ? Number(raw) : raw;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    errors.add(field, `${label} must be a whole number`);
    return undefined;
  }
  if ((min !== undefined && value < min) || (max !== undefined && value > max)) {
    errors.add(field, `${label} must be between ${min} and ${max}`);
    return undefined;
  }
  return value;
}

/**
 * Middleware: checks that a route parameter (default "id") is a valid ObjectId.
 * Usage: router.get('/:id', validateIdParam(), controller)
 */
export function validateIdParam(paramName = 'id') {
  return function checkIdParam(req, res, next) {
    if (!isValidObjectId(req.params[paramName])) {
      throw ApiError.badRequest('Validation failed', [{ field: paramName, message: 'Invalid id' }]);
    }
    next();
  };
}

/**
 * Middleware: the body must be a JSON object containing ONLY the allowed fields.
 * Blocks mass assignment (e.g. sending "status" or "user") and catches client typos.
 * Usage: router.post('/', allowFields(['email', 'password']), controller)
 */
export function allowFields(allowedFields) {
  return function checkBodyFields(req, res, next) {
    const hasContent =
      Number(req.headers['content-length'] || 0) > 0 || req.headers['transfer-encoding'];

    // express.json() leaves req.body undefined when Content-Type is not application/json.
    if (req.body === undefined && hasContent) {
      throw ApiError.badRequest(
        'Send the request body as JSON with Content-Type: application/json',
      );
    }

    const body = req.body === undefined ? {} : req.body;
    if (!isPlainObject(body)) {
      throw ApiError.badRequest('Request body must be a JSON object');
    }

    const unknown = Object.keys(body).filter((key) => !allowedFields.includes(key));
    if (unknown.length > 0) {
      throw ApiError.badRequest(
        'Validation failed',
        unknown.map((field) => ({ field, message: 'This field is not allowed' })),
      );
    }

    req.body = body;
    next();
  };
}
