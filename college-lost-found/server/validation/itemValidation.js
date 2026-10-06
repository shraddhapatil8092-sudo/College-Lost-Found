import { validateRequest } from '../middleware/validateRequest.js';
import { itemCreateSchema, itemFiltersSchema, itemIdSchema, itemUpdateSchema } from './schemas.js';

export const validateCreateItem = validateRequest(itemCreateSchema, { target: 'validatedItem' });
export const validateUpdateItem = validateRequest(itemUpdateSchema, { target: 'validatedItem' });
export const validateItemId = validateRequest(itemIdSchema, { source: 'params', target: 'validatedParams' });
export const validateItemFilters = validateRequest(itemFiltersSchema, { source: 'query', target: 'validatedItemFilters' });