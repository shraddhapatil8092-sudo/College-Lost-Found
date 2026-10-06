import { validateRequest } from '../middleware/validateRequest.js';
import { claimCreateSchema, claimIdSchema } from './schemas.js';

export const validateClaimBody = validateRequest(claimCreateSchema, { target: 'validatedClaim' });
export const validateClaimId = validateRequest(claimIdSchema, { source: 'params', target: 'validatedParams' });