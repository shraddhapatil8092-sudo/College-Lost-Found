import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { loginSchema, registerSchema } from '../validation/schemas.js';

const router = Router();

function safeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    studentId: user.studentId,
    phone: user.phone || '',
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

router.post('/register', validateRequest(registerSchema), async (request, response) => {
  const { name, email, studentId, phone, password } = request.validatedBody;
  const normalizedEmail = (email || '').toLowerCase().trim();

  const existingEmail = await User.exists({ email: normalizedEmail });
  if (existingEmail) {
    throw new ApiError(409, 'This email is already registered. Please sign in instead.', 'DUPLICATE_EMAIL');
  }

  let finalStudentId = (studentId || '').trim();
  if (!finalStudentId) {
    finalStudentId = `STU-${Math.floor(100000 + Math.random() * 900000)}`;
  } else {
    const existingStudentId = await User.exists({
      studentId: { $regex: new RegExp(`^${finalStudentId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    });
    if (existingStudentId) {
      throw new ApiError(409, `Student ID '${finalStudentId}' is already registered. Please use your unique student ID.`, 'DUPLICATE_STUDENT_ID');
    }
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    studentId: finalStudentId,
    phone: (phone || '').trim(),
    password: await bcrypt.hash(password, 12),
  });

  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '1d' },
  );

  return sendSuccess(response, 201, 'Registration successful', { token, user: safeUser(user) });
});

router.post('/login', validateRequest(loginSchema), async (request, response) => {
  const { email, password } = request.validatedBody;
  const normalizedEmail = (email || '').toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    throw new ApiError(404, 'No account found with this email. Please register first to create an account.', 'USER_NOT_FOUND');
  }
  if (!(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, 'Incorrect password. Please check your credentials and try again.', 'INVALID_CREDENTIALS');
  }

  const token = jwt.sign(
    { userId: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: '1d' },
  );

  return sendSuccess(response, 200, 'Login successful', { token, user: safeUser(user) });
});

router.get('/me', authMiddleware, (request, response) => {
  return sendSuccess(response, 200, 'Current user retrieved', { user: safeUser(request.user) });
});

router.put('/profile', authMiddleware, async (request, response) => {
  const { name } = request.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new ApiError(400, 'Name is required', 'INVALID_NAME');
  }
  const user = await User.findById(request.user._id);
  if (!user) throw new ApiError(404, 'User not found', 'RESOURCE_NOT_FOUND');
  user.name = name.trim();
  await user.save();
  return sendSuccess(response, 200, 'Profile updated successfully', { user: safeUser(user) });
});

router.put('/password', authMiddleware, async (request, response) => {
  const { currentPassword, newPassword } = request.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current and new password are required', 'MISSING_FIELDS');
  }
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters', 'PASSWORD_TOO_SHORT');
  }
  const user = await User.findById(request.user._id).select('+password');
  if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
    throw new ApiError(400, 'Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
  }
  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  return sendSuccess(response, 200, 'Password updated successfully', {});
});

export default router;