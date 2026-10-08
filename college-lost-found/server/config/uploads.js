import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const allowedImages = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

const storage = multer.memoryStorage();

export const uploadItemImage = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024, files: 1 },
  fileFilter(_request, file, callback) {
    if (!Object.hasOwn(allowedImages, file.mimetype)) {
      callback(new ApiError(400, 'Choose a JPEG, PNG, or WebP image', 'INVALID_IMAGE_TYPE'));
      return;
    }
    callback(null, true);
  },
}).single('image');

export const uploadDirectory = '';