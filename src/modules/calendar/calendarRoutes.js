import { Router } from 'express';
import {
  createHoliday,
  getHolidays,
  createEvent,
  getEvents
} from './calendarController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

// Read operations for all authenticated roles
router.get('/holidays', authenticate, authorize('admin', 'teacher', 'student'), getHolidays);
router.get('/events', authenticate, authorize('admin', 'teacher', 'student'), getEvents);

// Write operations (Admin only)
router.post('/holidays', authenticate, authorize('admin'), createHoliday);
router.post('/events', authenticate, authorize('admin'), createEvent);

export default router;
