import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

export function uploadItemImageHandler(request, response) {
  if (!request.file) {
    throw new ApiError(400, 'Select an image to upload', 'IMAGE_REQUIRED');
  }

  const imageUrl = `${request.protocol}://${request.get('host')}/uploads/${request.file.filename}`;
  return sendSuccess(response, 201, 'Item image uploaded successfully', { imageUrl });
}