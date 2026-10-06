import { mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const configDirectory = dirname(fileURLToPath(import.meta.url));
export const uploadDirectory = resolve(configDirectory, '../uploads');
const allowedImages = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDirectory,
  filename(_request, file, callback) {
    callback(null, `${randomUUID()}.${allowedImages[file.mimetype]}`);
  },
});

export const uploadItemImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_request, file, callback) {
    if (!Object.hasOwn(allowedImages, file.mimetype)) {
      callback(new ApiError(400, 'Choose a JPEG, PNG, or WebP image', 'INVALID_IMAGE_TYPE'));
      return;
    }
    callback(null, true);
  },
}).single('image');