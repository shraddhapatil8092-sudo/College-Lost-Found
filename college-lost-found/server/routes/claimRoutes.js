import { Router } from 'express';
import {
  approveClaim,
  createClaim,
  deleteClaim,
  getAllClaims,
  getItemClaims,
  getMyClaims,
  rejectClaim,
} from '../controllers/claimController.js';
import { authMiddleware, requireAdmin } from '../middleware/authMiddleware.js';
import { validateClaimBody, validateClaimId } from '../validation/claimValidation.js';

const router = Router();

router.post('/', authMiddleware, validateClaimBody, createClaim);
router.get('/my', authMiddleware, getMyClaims);
router.get('/item/:id', authMiddleware, validateClaimId, getItemClaims);
router.get('/', authMiddleware, requireAdmin, getAllClaims);
router.put('/:id/approve', authMiddleware, validateClaimId, approveClaim);
router.put('/:id/reject', authMiddleware, validateClaimId, rejectClaim);
router.delete('/:id', authMiddleware, validateClaimId, deleteClaim);

export default router;