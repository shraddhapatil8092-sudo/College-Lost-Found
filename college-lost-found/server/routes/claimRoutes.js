import { Router } from 'express';
import {
  approveClaim,
  createClaim,
  getAllClaims,
  getMyClaims,
  rejectClaim,
} from '../controllers/claimController.js';
import { authMiddleware, requireAdmin } from '../middleware/authMiddleware.js';
import { validateClaimBody, validateClaimId } from '../validation/claimValidation.js';

const router = Router();

router.post('/', authMiddleware, validateClaimBody, createClaim);
router.get('/my', authMiddleware, getMyClaims);
router.get('/', authMiddleware, requireAdmin, getAllClaims);
router.put('/:id/approve', authMiddleware, requireAdmin, validateClaimId, approveClaim);
router.put('/:id/reject', authMiddleware, requireAdmin, validateClaimId, rejectClaim);

export default router;