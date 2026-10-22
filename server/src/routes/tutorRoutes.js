import { Router } from 'express';
import { listMySessions, completeSession } from '../controllers/tutorController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { allowFields, validateIdParam } from '../utils/validation.js';

const router = Router();

// Every route here: logged in (401) AND a tutor account (403). Applied once.
router.use(authenticate, requireRole('tutor'));

router.get('/sessions', listMySessions);
router.post('/sessions/:id/complete', validateIdParam(), allowFields(['summary']), completeSession);

export default router;
