import { Router } from 'express';
import { transferStudent } from './transferController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authenticate, authorize('admin'), transferStudent);

export default router;
