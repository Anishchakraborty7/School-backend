import { Router } from 'express';
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  resetUserPassword,
  getAuditLogs
} from './adminController.js';
import { getStudentIdCard, getBulkStudentIdCards } from '../student/studentController.js';
import { getTeacherIdCard, getBulkTeacherIdCards } from '../teacher/teacherController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';
import studentRepository from '../student/studentRepository.js';
import teacherRepository from '../teacher/teacherRepository.js';

const router = Router();

// Phase 2 ID Cards (Allow student/teacher to view their own ID cards)
router.get('/idcard/student/:id', authenticate, (req, res, next) => {
  if (req.user.role_name === 'admin' || req.user.role_name === 'teacher') {
    return next();
  }
  (async () => {
    try {
      const student = await studentRepository.findByUserId(req.user.id);
      if (student && student.id === parseInt(req.params.id, 10)) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: 'Access Denied',
        data: null,
        errors: ['You can only access your own digital ID card']
      });
    } catch (err) {
      next(err);
    }
  })();
}, getStudentIdCard);

router.get('/idcard/teacher/:id', authenticate, (req, res, next) => {
  if (req.user.role_name === 'admin') {
    return next();
  }
  (async () => {
    try {
      const teacher = await teacherRepository.findByUserId(req.user.id);
      if (teacher && teacher.id === parseInt(req.params.id, 10)) {
        return next();
      }
      return res.status(403).json({
        success: false,
        message: 'Access Denied',
        data: null,
        errors: ['You can only access your own digital ID card']
      });
    } catch (err) {
      next(err);
    }
  })();
}, getTeacherIdCard);

router.get('/idcard/bulk/students', authenticate, authorize('admin', 'teacher'), getBulkStudentIdCards);
router.get('/idcard/bulk/teachers', authenticate, authorize('admin'), getBulkTeacherIdCards);

// Protect all other admin endpoints with authentication and role check (admin)
router.use(authenticate, authorize('admin'));

router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/reset-password', resetUserPassword);
router.get('/audit-logs', getAuditLogs);

export default router;
