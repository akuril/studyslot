import { Router } from 'express';

const router = Router();

// GET /api/health
// A quick "is the API alive?" check for us, Postman, and Render.
// Step 11 adds the database connection status here.
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

export default router;
