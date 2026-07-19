import { Router } from 'express';
import {
  createHomework,
  getHomeworkList,
  submitHomework,
  getSubmissions,
  reviewSubmission
} from './homeworkController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';
import { uploadStudentDoc } from '../../middlewares/uploadMiddleware.js';

const router = Router();

// Retrieve operations
router.get('/', authenticate, authorize('admin', 'teacher', 'student'), getHomeworkList);
router.get('/:id/submissions', authenticate, authorize('admin', 'teacher'), getSubmissions);

// Submissions, creations and reviews
router.post('/', authenticate, authorize('admin', 'teacher'), uploadStudentDoc.single('attachment'), createHomework);
router.post('/:id/submit', authenticate, authorize('student'), uploadStudentDoc.single('file'), submitHomework);
router.patch('/submissions/:sub_id', authenticate, authorize('admin', 'teacher'), reviewSubmission);

export default router;
