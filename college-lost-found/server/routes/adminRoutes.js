import { Router } from 'express';
import { deleteUser, getAdminOverview, getUsers, updateUserRole } from '../controllers/adminController.js';
import { authMiddleware, requireAdmin } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { userIdSchema } from '../validation/schemas.js';

const validateUserId = validateRequest(userIdSchema, { source: 'params', target: 'validatedParams' });

const router = Router();

router.use(authMiddleware, requireAdmin);
router.get('/overview', getAdminOverview);
router.get('/users', getUsers);
router.delete('/users/:id', validateUserId, deleteUser);
router.put('/users/:id/role', validateUserId, updateUserRole);

export default router;