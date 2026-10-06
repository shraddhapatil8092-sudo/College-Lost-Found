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
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

router.post('/register', validateRequest(registerSchema), async (request, response) => {
  const { name, email, studentId, password } = request.validatedBody;
  const existingEmail = await User.exists({ email });
  if (existingEmail) throw new ApiError(409, 'Email is already registered', 'DUPLICATE_EMAIL');

  const existingStudentId = await User.exists({ studentId });
  if (existingStudentId) throw new ApiError(409, 'Student ID is already registered', 'DUPLICATE_STUDENT_ID');

  const user = await User.create({
    name,
    email,
    studentId,
    password: await bcrypt.hash(password, 12),
  });

  return sendSuccess(response, 201, 'Registration successful', { user: safeUser(user) });
});

router.post('/login', validateRequest(loginSchema), async (request, response) => {
  const { email, password } = request.validatedBody;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
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

export default router;