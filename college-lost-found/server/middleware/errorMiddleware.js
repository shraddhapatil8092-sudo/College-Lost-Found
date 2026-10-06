import ApiError from '../utils/ApiError.js';

function normalizeError(error) {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ApiError(413, 'Image must be 5 MB or smaller', 'IMAGE_TOO_LARGE');
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ApiError(400, 'Upload one image using the image field', 'INVALID_IMAGE_FIELD');
  }

  if (error.code === 'VALIDATION_ERROR' && error.details?.length) {
    return new ApiError(400, error.details[0].message, 'VALIDATION_ERROR', error.details);
  }

  if (error.type === 'entity.parse.failed') {
    return new ApiError(400, 'Request body contains invalid JSON', 'INVALID_JSON');
  }

  if (error.type === 'entity.too.large') {
    return new ApiError(413, 'Request body is too large', 'PAYLOAD_TOO_LARGE');
  }

  if (error.isJoi) {
    return new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', error.details);
  }

  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return new ApiError(401, 'Invalid or expired token', 'INVALID_TOKEN');
  }

  if (error.name === 'CastError') {
    return new ApiError(400, 'Invalid MongoDB ObjectId', 'INVALID_OBJECT_ID');
  }

  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors || {}).map((entry) => ({ field: entry.path, message: entry.message }));
    return new ApiError(400, 'Database validation failed', 'DATABASE_VALIDATION_ERROR', details);
  }

  if (error.code === 11000) {
    const fields = Object.keys(error.keyPattern || {});
    if (fields.includes('email')) {
      return new ApiError(409, 'Email is already registered', 'DUPLICATE_EMAIL', { field: 'email' });
    }
    if (fields.includes('studentId')) {
      return new ApiError(409, 'Student ID is already registered', 'DUPLICATE_STUDENT_ID', { field: 'studentId' });
    }
    if (fields.includes('item') && fields.includes('claimant')) {
      return new ApiError(409, 'You have already submitted a claim for this item', 'DUPLICATE_CLAIM');
    }
  }

  return error;
}

export function notFoundHandler(request, _response, next) {
  return next(new ApiError(404, `Route ${request.method} ${request.originalUrl} not found`, 'ROUTE_NOT_FOUND'));
}

function publicDetails(details) {
  if (!Array.isArray(details)) return details;
  return details.map((detail) => ({
    field: Array.isArray(detail.path) ? detail.path.join('.') : detail.field,
    message: detail.message,
    ...(detail.type ? { code: detail.type } : {}),
  }));
}

export function errorHandler(error, _request, response, _next) {
  const normalized = normalizeError(error);
  const statusCode = normalized.statusCode || 500;
  const isServerError = statusCode >= 500;

  if (isServerError) console.error(error);

  return response.status(statusCode).json({
    success: false,
    message: isServerError ? 'Internal server error' : normalized.message,
    error: {
      code: normalized.code || (isServerError ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
      ...(normalized.details ? { details: publicDetails(normalized.details) } : {}),
    },
  });
}