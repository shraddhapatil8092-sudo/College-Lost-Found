import Joi from 'joi';

const itemStatuses = ['Lost', 'Found', 'Claim Requested', 'Claim Approved', 'Returned', 'Closed'];
const itemTypes = ['Lost', 'Found'];

const requiredText = (label, max) => Joi.string().trim().min(1).max(max).required().messages({
  'any.required': `${label} is required`,
  'string.empty': `${label} is required`,
  'string.min': `${label} is required`,
  'string.max': `${label} must be ${max} characters or fewer`,
});

const optionalText = (label, max) => Joi.string().trim().min(1).max(max).messages({
  'string.empty': `${label} cannot be empty`,
  'string.min': `${label} cannot be empty`,
  'string.max': `${label} must be ${max} characters or fewer`,
});

const email = Joi.string().trim().email({ tlds: { allow: false } }).lowercase().required().messages({
  'any.required': 'Email is required',
  'string.empty': 'Email is required',
  'string.email': 'Enter a valid email',
});

const password = Joi.string().min(6).required().messages({
  'any.required': 'Password is required',
  'string.empty': 'Password is required',
  'string.min': 'Password must be at least 6 characters',
});

export const registerSchema = Joi.object({
  name: requiredText('Name', 100),
  email,
  studentId: Joi.string().trim().allow('').max(50).default(''),
  phone: Joi.string().trim().allow('').max(30).default(''),
  password,
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.required': 'Confirm password is required',
    'string.empty': 'Confirm password is required',
    'any.only': 'Passwords do not match',
  }),
}).unknown(true).required();

export const loginSchema = Joi.object({ email, password }).unknown(true).required();

export const itemCreateSchema = Joi.object({
  title: requiredText('Item title', 120),
  description: requiredText('Description', 5000),
  category: requiredText('Category', 80),
  location: requiredText('Location', 200),
  contact: Joi.string().trim().allow('').max(100).default(''),
  date: Joi.date().iso().required().messages({
    'any.required': 'Date is required',
    'date.base': 'Enter a valid date',
    'date.format': 'Enter a valid date',
  }),
  type: Joi.string().valid(...itemTypes).required().messages({
    'any.required': 'Item type is required',
    'any.only': 'Type must be Lost or Found',
  }),
  image: Joi.string().trim().uri({ scheme: ['http', 'https'] }).allow('').max(2048)
    .messages({ 'string.uri': 'Image must be a valid URL', 'string.max': 'Image URL is too long' }),
}).unknown(true).required();

export const itemUpdateSchema = Joi.object({
  title: optionalText('Item title', 120),
  description: optionalText('Description', 5000),
  category: optionalText('Category', 80),
  location: optionalText('Location', 200),
  contact: Joi.string().trim().allow('').max(100),
  date: Joi.date().iso().messages({ 'date.base': 'Enter a valid date', 'date.format': 'Enter a valid date' }),
  type: Joi.string().valid(...itemTypes).messages({ 'any.only': 'Type must be Lost or Found' }),
  status: Joi.string().valid(...itemStatuses).messages({ 'any.only': 'Enter a valid item status' }),
  image: Joi.string().trim().uri({ scheme: ['http', 'https'] }).allow('').max(2048)
    .messages({ 'string.uri': 'Image must be a valid URL', 'string.max': 'Image URL is too long' }),
}).min(1).unknown(true).required().messages({ 'object.min': 'Provide at least one field to update' });

export const itemFiltersSchema = Joi.object({
  title: optionalText('Title filter', 120),
  category: optionalText('Category filter', 80),
  type: Joi.string().valid(...itemTypes).messages({ 'any.only': 'Type must be Lost or Found' }),
  location: optionalText('Location filter', 200),
  status: Joi.string().valid(...itemStatuses).messages({ 'any.only': 'Enter a valid item status' }),
}).unknown(true).required();

const objectId = Joi.string().hex().length(24).required().messages({
  'any.required': 'ID is required',
  'string.hex': 'Invalid MongoDB ObjectId',
  'string.length': 'Invalid MongoDB ObjectId',
});

export const itemIdSchema = Joi.object({ id: objectId }).unknown(false).required();
export const userIdSchema = Joi.object({ id: objectId }).unknown(false).required();

export const claimCreateSchema = Joi.object({
  item: objectId.messages({
    'any.required': 'Item is required',
    'string.hex': 'Enter a valid item ID',
    'string.length': 'Enter a valid item ID',
  }),
  message: requiredText('Message', 2000),
  proofDescription: requiredText('Proof description', 5000),
}).unknown(false).required();

export const claimIdSchema = Joi.object({ id: objectId }).unknown(false).required();