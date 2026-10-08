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
import { sendSuccess } from '../utils/apiResponse.js';
import {
  validateCreateItem,
  validateItemFilters,
  validateItemId,
  validateUpdateItem,
} from '../validation/itemValidation.js';

const router = Router();

router.post('/image', authMiddleware, uploadItemImage, uploadItemImageHandler);
router.get('/detect-location', async (_request, response) => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const geoRes = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: controller.signal });
    clearTimeout(timer);
    if (geoRes.ok) {
      const data = await geoRes.json();
      const lat = data.latitude ? parseFloat(data.latitude).toFixed(6) : '17.063583';
      const lon = data.longitude ? parseFloat(data.longitude).toFixed(6) : '74.281837';
      const city = data.city || 'Campus Area';
      const region = data.region ? `, ${data.region}` : '';
      return sendSuccess(response, 200, 'Location detected successfully', {
        location: `${lat}, ${lon} (${city}${region})`,
        latitude: lat,
        longitude: lon,
        city,
        source: 'network',
      });
    }
  } catch {
    // Return college campus default
  }

  return sendSuccess(response, 200, 'Campus location provided', {
    location: '17.063583, 74.281837 (Campus Grounds)',
    latitude: '17.063583',
    longitude: '74.281837',
    city: 'Campus Grounds',
    source: 'preset',
  });
});
router.get('/', validateItemFilters, getItems);
router.get('/:id', validateItemId, getItemById);
router.post('/', authMiddleware, validateCreateItem, createItem);
router.put('/:id', authMiddleware, validateItemId, validateUpdateItem, updateItem);
router.delete('/:id', authMiddleware, validateItemId, deleteItem);

export default router;