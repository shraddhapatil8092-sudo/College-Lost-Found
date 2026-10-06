import { Router } from 'express';
import {
  createItem,
  deleteItem,
  getItemById,
  getItems,
  updateItem,
} from '../controllers/itemController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { uploadItemImage } from '../config/uploads.js';
import { uploadItemImageHandler } from '../controllers/uploadController.js';
import {
  validateCreateItem,
  validateItemFilters,
  validateItemId,
  validateUpdateItem,
} from '../validation/itemValidation.js';

const router = Router();

router.post('/image', authMiddleware, uploadItemImage, uploadItemImageHandler);
router.get('/', validateItemFilters, getItems);
router.get('/:id', validateItemId, getItemById);
router.post('/', authMiddleware, validateCreateItem, createItem);
router.put('/:id', authMiddleware, validateItemId, validateUpdateItem, updateItem);
router.delete('/:id', authMiddleware, validateItemId, deleteItem);

export default router;