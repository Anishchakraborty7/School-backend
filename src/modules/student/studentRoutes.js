import { Router } from 'express';
import {
  admitStudent,
  editStudent,
  deleteStudent,
  restoreStudent,
  getStudentProfile,
  uploadStudentDocEndpoint,
  getStudents,
  getNextAdmissionNumber
} from './studentController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';
import { uploadStudentPhoto, uploadStudentDoc } from '../../middlewares/uploadMiddleware.js';

const router = Router();

// Retrieve operations
router.get('/', authenticate, authorize('admin', 'teacher'), getStudents);
router.get('/next-admission-number', authenticate, authorize('admin'), getNextAdmissionNumber);
router.get('/:id', authenticate, authorize('admin', 'teacher'), getStudentProfile);

// Write operations restricted to Admins only
router.post('/', authenticate, authorize('admin'), uploadStudentPhoto.single('photo'), admitStudent);
router.patch('/:id', authenticate, authorize('admin'), uploadStudentPhoto.single('photo'), editStudent);
router.delete('/:id', authenticate, authorize('admin'), deleteStudent);
router.post('/:id/restore', authenticate, authorize('admin'), restoreStudent);
router.post('/:id/document', authenticate, authorize('admin'), uploadStudentDoc.single('document'), uploadStudentDocEndpoint);

export default router;
