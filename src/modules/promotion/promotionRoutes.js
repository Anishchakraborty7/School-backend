import { Router } from 'express';
import { promoteSingle, promoteClassBulk } from './promotionController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

router.post('/single', authenticate, authorize('admin'), promoteSingle);
router.post('/bulk', authenticate, authorize('admin'), promoteClassBulk);

export default router;
