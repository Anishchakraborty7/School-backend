import { Router } from 'express';
import {
  createAssignment,
  getAssignments,
  submitAssignment,
  getSubmissions,
  reviewSubmission
} from './assignmentController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';
import { uploadStudentDoc } from '../../middlewares/uploadMiddleware.js';

const router = Router();

// Retrieve operations
router.get('/', authenticate, authorize('admin', 'teacher', 'student'), getAssignments);
router.get('/:id/submissions', authenticate, authorize('admin', 'teacher'), getSubmissions);

// Creations, multiple files submissions, and reviews
router.post('/', authenticate, authorize('admin', 'teacher'), uploadStudentDoc.single('attachment'), createAssignment);
router.post('/:id/submit', authenticate, authorize('student'), uploadStudentDoc.array('files', 5), submitAssignment);
router.patch('/submissions/:sub_id', authenticate, authorize('admin', 'teacher'), reviewSubmission);

export default router;
