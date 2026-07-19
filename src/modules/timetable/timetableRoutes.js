import { Router } from 'express';
import {
  createPeriod,
  getPeriods,
  createTimetableEntry,
  getTimetableForSection,
  getTimetableForTeacher,
  updateTimetableEntry,
  deleteTimetableEntry,
  getTimetableEntry,
  updatePeriod,
  deletePeriod
} from './timetableController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

// Read operations for all authenticated roles (Admin, Teacher, Student)
router.get('/periods', authenticate, authorize('admin', 'teacher', 'student'), getPeriods);
router.get('/section', authenticate, authorize('admin', 'teacher', 'student'), getTimetableForSection);
router.get('/teacher', authenticate, authorize('admin', 'teacher', 'student'), getTimetableForTeacher);
router.get('/:id', authenticate, authorize('admin', 'teacher', 'student'), getTimetableEntry);

// Write operations (Admin only)
router.post('/periods', authenticate, authorize('admin'), createPeriod);
router.patch('/periods/:id', authenticate, authorize('admin'), updatePeriod);
router.delete('/periods/:id', authenticate, authorize('admin'), deletePeriod);
router.post('/', authenticate, authorize('admin'), createTimetableEntry);
router.patch('/:id', authenticate, authorize('admin'), updateTimetableEntry);
router.delete('/:id', authenticate, authorize('admin'), deleteTimetableEntry);

export default router;
