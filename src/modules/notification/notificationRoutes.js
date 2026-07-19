import { Router } from 'express';
import { getNotifications, markRead } from './notificationController.js';
import { authenticate } from '../../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticate, getNotifications);
router.patch('/:id/read', authenticate, markRead);

export default router;
