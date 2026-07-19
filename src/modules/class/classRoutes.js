import { Router } from 'express';
import { createClass, updateClass, getClasses, deleteClass } from './classController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authenticate, authorize('admin'), createClass);
router.patch('/:id', authenticate, authorize('admin'), updateClass);
router.delete('/:id', authenticate, authorize('admin'), deleteClass);
router.get('/', authenticate, authorize('admin', 'teacher', 'student'), getClasses);

export default router;
