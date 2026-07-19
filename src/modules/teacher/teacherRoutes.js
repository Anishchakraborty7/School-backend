import { Router } from 'express';
import {
  addTeacher,
  editTeacher,
  deleteTeacher,
  restoreTeacher,
  getTeacherProfile,
  addQualification,
  addExperience,
  uploadTeacherDocEndpoint,
  assignSubjectsClasses,
  getTeachers
} from './teacherController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';
import { uploadTeacherPhoto, uploadTeacherDoc } from '../../middlewares/uploadMiddleware.js';

const router = Router();

// Protect all teacher endpoints to authenticated admins
router.use(authenticate, authorize('admin'));

router.get('/', getTeachers);
router.post('/', uploadTeacherPhoto.single('photo'), addTeacher);
router.patch('/:id', uploadTeacherPhoto.single('photo'), editTeacher);
router.delete('/:id', deleteTeacher);
router.post('/:id/restore', restoreTeacher);
router.get('/:id', getTeacherProfile);
router.post('/:id/qualification', addQualification);
router.post('/:id/experience', addExperience);
router.post('/:id/document', uploadTeacherDoc.single('document'), uploadTeacherDocEndpoint);
router.post('/:id/assign', assignSubjectsClasses);

export default router;
