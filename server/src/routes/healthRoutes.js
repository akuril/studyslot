import { Router } from 'express';
import { getDatabaseStatus } from '../config/db.js';

const router = Router();

// GET /api/health
// A quick "is the API alive?" check for us, Postman, and Render.
// Returns 200 when the database is connected, 503 when it isn't.
router.get('/', (req, res) => {
  const database = getDatabaseStatus();
  const isHealthy = database === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    database,
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
