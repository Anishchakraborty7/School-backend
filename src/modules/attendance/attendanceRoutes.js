import { Router } from 'express';
import {
  takeStudentAttendance,
  getStudentAttendance,
  lockAttendance,
  unlockAttendance,
  getAttendanceAnalytics,
  takeTeacherAttendance,
  getTeacherAttendance,
  getStudentMonthlyAttendance,
  getTeacherMonthlyAttendance,
  patchStudentAttendance,
  patchTeacherAttendance
} from './attendanceController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

// Retrieve operations
router.get('/student', authenticate, authorize('admin', 'teacher', 'student'), getStudentAttendance);
router.get('/student/monthly', authenticate, authorize('admin'), getStudentMonthlyAttendance);
router.get('/analytics', authenticate, authorize('admin', 'teacher', 'student'), getAttendanceAnalytics);

// Student attendance submit/edit
router.post('/student', authenticate, authorize('admin', 'teacher'), takeStudentAttendance);
router.patch('/student/:id', authenticate, authorize('admin'), patchStudentAttendance);

// Locks and Teacher attendance (Admin only)
router.post('/student/lock', authenticate, authorize('admin'), lockAttendance);
router.post('/student/unlock', authenticate, authorize('admin'), unlockAttendance);
router.post('/teacher', authenticate, authorize('admin'), takeTeacherAttendance);
router.patch('/teacher/:id', authenticate, authorize('admin'), patchTeacherAttendance);
router.get('/teacher', authenticate, authorize('admin'), getTeacherAttendance);
router.get('/teacher/monthly', authenticate, authorize('admin'), getTeacherMonthlyAttendance);

export default router;
