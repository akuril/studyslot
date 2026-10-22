import { Router } from 'express';
import {
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} from '../controllers/studentController.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/requireRole.js';
import { allowFields, validateIdParam } from '../utils/validation.js';

const router = Router();

// Saved students belong to PARENT accounts only.
router.use(authenticate, requireRole('parent'));

const FIELDS = ['firstName', 'grade'];

router.get('/', listStudents);
router.post('/', allowFields(FIELDS), createStudent);
router.patch('/:id', validateIdParam(), allowFields(FIELDS), updateStudent);
router.delete('/:id', validateIdParam(), allowFields([]), deleteStudent);

export default router;
