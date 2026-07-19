import { Router } from 'express';
import { getMe, getDashboard, updateMyPhoto } from './userController.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { uploadTeacherPhoto, uploadStudentPhoto } from '../../middlewares/uploadMiddleware.js';

const router = Router();

router.get('/me', authenticate, getMe);
router.get('/dashboard', authenticate, getDashboard);
router.patch('/me/photo', authenticate, (req, res, next) => {
  if (req.user.role_name === 'teacher') {
    uploadTeacherPhoto.single('photo')(req, res, next);
  } else if (req.user.role_name === 'student') {
    uploadStudentPhoto.single('photo')(req, res, next);
  } else {
    return res.status(400).json({ success: false, message: 'Invalid role for profile photo' });
  }
}, updateMyPhoto);

export default router;
