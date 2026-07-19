import { Router } from 'express';
import { assignClassTeacher, removeClassTeacher } from './classTeacherController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

router.post('/assign', authenticate, authorize('admin'), assignClassTeacher);
router.post('/remove', authenticate, authorize('admin'), removeClassTeacher);

export default router;
