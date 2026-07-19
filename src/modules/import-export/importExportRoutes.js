import { Router } from 'express';
import {
  importStudents,
  importTeachers,
  exportStudentsCSV,
  exportTeachersCSV
} from './importExportController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';
import multer from 'multer';
import path from 'path';

const uploadTemp = multer({
  dest: 'uploads/temp/',
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'), false);
    }
  }
});

const router = Router();

router.post('/import/students', authenticate, authorize('admin'), uploadTemp.single('file'), importStudents);
router.post('/import/teachers', authenticate, authorize('admin'), uploadTemp.single('file'), importTeachers);
router.get('/export/students', authenticate, authorize('admin'), exportStudentsCSV);
router.get('/export/teachers', authenticate, authorize('admin'), exportTeachersCSV);

export default router;
