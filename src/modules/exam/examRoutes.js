import { Router } from 'express';
import {
  createExam,
  publishExam,
  lockExam,
  createSchedule,
  getExams,
  getSchedules,
  enterMarks,
  getReportData,
  createGradingScale,
  getGradingScales,
  updateGradingScale,
  deleteGradingScale,
  getMarksBySchedule
} from './examController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

// Read operations for all authenticated roles
router.get('/', authenticate, authorize('admin', 'teacher', 'student'), getExams);
router.get('/schedule', authenticate, authorize('admin', 'teacher', 'student'), getSchedules);
router.get('/report/student/:student_id', authenticate, authorize('admin', 'teacher', 'student'), getReportData);
router.get('/grades', authenticate, authorize('admin', 'teacher', 'student'), getGradingScales);
router.get('/marks/schedule/:scheduleId', authenticate, authorize('admin', 'teacher'), getMarksBySchedule);

// Admin operations for setup
router.post('/', authenticate, authorize('admin'), createExam);
router.patch('/:id/publish', authenticate, authorize('admin'), publishExam);
router.patch('/:id/lock', authenticate, authorize('admin'), lockExam);
router.post('/schedule', authenticate, authorize('admin'), createSchedule);
router.post('/grades', authenticate, authorize('admin'), createGradingScale);
router.put('/grades/:id', authenticate, authorize('admin'), updateGradingScale);
router.delete('/grades/:id', authenticate, authorize('admin'), deleteGradingScale);

// Teacher/Admin marks entry
router.post('/marks', authenticate, authorize('admin', 'teacher'), enterMarks);

export default router;
