import { Router } from 'express';
import { createAnnouncement, getAnnouncements } from './announcementController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticate, authorize('admin', 'teacher', 'student'), getAnnouncements);
router.post('/', authenticate, authorize('admin', 'teacher'), createAnnouncement);

export default router;
