import { Router } from 'express';
import {
  requestLeave,
  getLeaveRequests,
  processLeaveRequest
} from './leaveController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

// Requests list & request creation for students and teachers
router.get('/', authenticate, authorize('admin', 'teacher', 'student'), getLeaveRequests);
router.post('/', authenticate, authorize('teacher', 'student'), requestLeave);

// Process approval (Admin only)
router.patch('/:id/process', authenticate, authorize('admin'), processLeaveRequest);

export default router;
