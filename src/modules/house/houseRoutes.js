import { Router } from 'express';
import { createHouse, updateHouse, deleteHouse, getHouses } from './houseController.js';
import { authenticate, authorize } from '../../middlewares/authMiddleware.js';

const router = Router();

router.post('/', authenticate, authorize('admin'), createHouse);
router.patch('/:id', authenticate, authorize('admin'), updateHouse);
router.delete('/:id', authenticate, authorize('admin'), deleteHouse);
router.get('/', authenticate, authorize('admin', 'teacher', 'student'), getHouses);

export default router;
