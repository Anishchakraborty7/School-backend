import { Router } from 'express';
import { generateReportCard } from './reportCardController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/student/:id', authenticate, authorize('admin', 'teacher', 'student'), generateReportCard);

export default router;
