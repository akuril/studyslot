// Logs one line per request when it finishes, for example:
//   POST /api/auth/login 401 84ms
// Deliberately logs ONLY method, path, status, and time: never query strings,
// bodies, headers, or tokens, because those can contain personal data or secrets.
export function requestLogger(req, res, next) {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const path = req.originalUrl.split('?')[0];
    console.log(`${req.method} ${path} ${res.statusCode} ${Math.round(ms)}ms`);
  });

  next();
}
