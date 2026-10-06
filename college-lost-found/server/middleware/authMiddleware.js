import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';

export async function authMiddleware(request, _response, next) {
  const authorization = request.headers.authorization;
  const [scheme, token] = authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'A Bearer token is required', 'UNAUTHORIZED');
  }

  const payload = jwt.verify(token, process.env.JWT_SECRET);

  if (typeof payload !== 'object' || typeof payload.userId !== 'string') {
    throw new ApiError(401, 'Invalid or expired token', 'INVALID_TOKEN');
  }

  const user = await User.findById(payload.userId);
  if (!user) {
    throw new ApiError(401, 'User not found', 'UNAUTHORIZED');
  }

  request.user = user;
  return next();
}

export function requireAdmin(request, _response, next) {
  if (request.user?.role !== 'admin') {
    throw new ApiError(403, 'Admin access required', 'FORBIDDEN');
  }

  return next();
}