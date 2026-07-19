import { Router } from 'express';
import {
  createSubject,
  updateSubject,
  getSubjects,
  assignClassSubjects,
  getClassSubjects
} from './subjectController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authenticate, authorize('admin'), createSubject);
router.patch('/:id', authenticate, authorize('admin'), updateSubject);
router.get('/', authenticate, authorize('admin', 'teacher', 'student'), getSubjects);
router.post('/assign-class', authenticate, authorize('admin'), assignClassSubjects);
router.get('/class/:class_id', authenticate, authorize('admin', 'teacher', 'student'), getClassSubjects);

export default router;
