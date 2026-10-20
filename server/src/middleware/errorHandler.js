// Centralized error handler. Express knows this is an error handler
// because it has FOUR parameters (error, req, res, next).
export function errorHandler(error, req, res, next) {
  // express.json() throws this when the request body is not valid JSON.
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must be valid JSON' });
  }

  // express.json() throws this when the body is bigger than the limit.
  if (error.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Request body is too large' });
  }

  // Anything else is unexpected. Log the details on the server only;
  // never send stack traces or internal messages to the client.
  console.error('Unhandled error:', error);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
