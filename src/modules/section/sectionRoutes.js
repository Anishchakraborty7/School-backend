import { Router } from 'express';
import { createSection, updateSection, getSections, deleteSection } from './sectionController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authenticate, authorize('admin'), createSection);
router.patch('/:id', authenticate, authorize('admin'), updateSection);
router.delete('/:id', authenticate, authorize('admin'), deleteSection);
router.get('/', authenticate, authorize('admin', 'teacher', 'student'), getSections);

export default router;
