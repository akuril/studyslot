import express from 'express';
import helmet from 'helmet';

import { config } from './config/env.js';
import healthRoutes from './routes/healthRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import { requestLogger } from './middleware/requestLogger.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

// Builds and configures the Express app. It does NOT start listening;
// server.js does that. Keeping them separate makes the app easier to test.
const app = express();

// Security headers (and hides the "X-Powered-By: Express" header).
app.use(helmet());

// One safe log line per request (skipped during automated tests to keep output readable).
if (config.nodeEnv !== 'test') {
  app.use(requestLogger);
}

// Parse JSON request bodies into req.body. The size limit blocks huge payloads.
app.use(express.json({ limit: '10kb' }));

// ===== Routes =====
app.use('/api/health', healthRoutes);
app.use('/api/services', serviceRoutes);

// ===== Must come LAST =====
// 1. Any request that didn't match a route above gets a 404.
app.use(notFound);
// 2. Any error thrown or passed to next(error) ends up here.
app.use(errorHandler);

export default app;
