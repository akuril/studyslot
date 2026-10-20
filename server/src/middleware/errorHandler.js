import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

// Centralized error handler. Express knows this is an error handler
// because it has FOUR parameters (error, req, res, next).
// Every error response has the same shape: { error, details? }.
export function errorHandler(error, req, res, next) {
  // If a response was already started, let Express close the connection.
  if (res.headersSent) {
    return next(error);
  }

  // 1. Errors we created on purpose (validation, not found, forbidden, conflict...).
  if (error instanceof ApiError) {
    const body = { error: error.message };
    if (error.details && error.details.length > 0) {
      body.details = error.details;
    }
    return res.status(error.status).json(body);
  }

  // 2. Body-parser problems from express.json().
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON' });
  }
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }

  // 3. Mongoose schema validation (the safety net caught something the API layer missed).
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((fieldError) => ({
      field: fieldError.path,
      message: fieldError.message,
    }));
    return res.status(400).json({ error: 'Validation failed', details });
  }

  // 4. A value that couldn't be converted to the schema type (e.g. a bad id).
  if (error instanceof mongoose.Error.CastError) {
    return res
      .status(400)
      .json({
        error: 'Validation failed',
        details: [{ field: error.path, message: 'Invalid value' }],
      });
  }

  // 5. Unique index violation. Routes that expect this (register) send a friendlier message.
  if (error.code === 11000) {
    return res.status(409).json({ error: 'That value is already in use' });
  }

  // 6. Anything else is a bug or an outage. Log details on the SERVER only
  //    (method and path, never bodies, tokens, or passwords) and send a generic message.
  console.error(`Unhandled error on ${req.method} ${req.path}:`, error);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
