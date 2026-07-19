import { Router } from 'express';
import { createYear, updateYear, getYears, deleteYear } from './academicYearController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authenticate, authorize('admin'), createYear);
router.patch('/:id', authenticate, authorize('admin'), updateYear);
router.delete('/:id', authenticate, authorize('admin'), deleteYear);
router.get('/', authenticate, authorize('admin', 'teacher', 'student'), getYears);

export default router;
