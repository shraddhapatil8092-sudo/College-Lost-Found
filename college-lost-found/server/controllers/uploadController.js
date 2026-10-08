import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

export function uploadItemImageHandler(request, response) {
  if (!request.file) {
    throw new ApiError(400, 'Select an image to upload', 'IMAGE_REQUIRED');
  }

  const base64Data = request.file.buffer.toString('base64');
  const imageUrl = `data:${request.file.mimetype};base64,${base64Data}`;
  return sendSuccess(response, 201, 'Item image uploaded successfully', { imageUrl });
}