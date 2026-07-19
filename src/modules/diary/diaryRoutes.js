import { Router } from 'express';
import {
  addTeacherDiary,
  getTeacherDiaries,
  addStudentDiary,
  getStudentDiaries
} from './diaryController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

// Teacher diary endpoints
router.post('/teacher', authenticate, authorize('teacher'), addTeacherDiary);
router.get('/teacher', authenticate, authorize('teacher', 'admin'), getTeacherDiaries);

// Student diary endpoints
router.post('/student', authenticate, authorize('student'), addStudentDiary);
router.get('/student', authenticate, authorize('student', 'admin'), getStudentDiaries);

export default router;
