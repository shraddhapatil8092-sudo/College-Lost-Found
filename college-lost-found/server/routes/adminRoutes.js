import { Router } from 'express';
import { getAdminOverview, getUsers } from '../controllers/adminController.js';
import { authMiddleware, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware, requireAdmin);
router.get('/overview', getAdminOverview);
router.get('/users', getUsers);

export default router;