import { Router } from 'express';
import { listServices, getService } from '../controllers/serviceController.js';
import { validateIdParam } from '../utils/validation.js';

// Public routes: anyone can browse the catalog. There are no create/update/delete
// routes because there is no admin role (services come from the seed script).
const router = Router();

router.get('/', listServices);
router.get('/:id', validateIdParam(), getService);

export default router;
