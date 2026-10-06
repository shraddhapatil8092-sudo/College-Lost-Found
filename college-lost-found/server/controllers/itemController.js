import Item from '../models/Item.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

const reporterFields = 'name studentId';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function canManageItem(item, user) {
  return user.role === 'admin' || item.reportedBy.toString() === user._id.toString();
}

export async function getItems(request, response) {
  const filters = {};
  for (const field of ['title', 'category', 'location']) {
    if (request.validatedItemFilters[field]) {
      filters[field] = { $regex: escapeRegex(request.validatedItemFilters[field]), $options: 'i' };
    }
  }
  for (const field of ['type', 'status']) {
    if (request.validatedItemFilters[field]) {
      filters[field] = request.validatedItemFilters[field];
    }
  }

  const items = await Item.find(filters)
    .populate('reportedBy', reporterFields)
    .sort({ createdAt: -1 });

  return sendSuccess(response, 200, 'Items retrieved successfully', { count: items.length, items });
}

export async function getItemById(request, response) {
  const item = await Item.findById(request.params.id).populate('reportedBy', reporterFields);
  if (!item) throw new ApiError(404, 'Item not found', 'RESOURCE_NOT_FOUND');
  return sendSuccess(response, 200, 'Item retrieved successfully', { item });
}

export async function createItem(request, response) {
  const item = await Item.create({
    ...request.validatedItem,
    status: request.validatedItem.type,
    reportedBy: request.user._id,
  });
  await item.populate('reportedBy', reporterFields);
  return sendSuccess(response, 201, 'Item created successfully', { item });
}

export async function updateItem(request, response) {
  const item = await Item.findById(request.params.id);
  if (!item) throw new ApiError(404, 'Item not found', 'RESOURCE_NOT_FOUND');
  if (!canManageItem(item, request.user)) {
    throw new ApiError(403, 'You cannot update this item', 'FORBIDDEN');
  }

  Object.assign(item, request.validatedItem);
  await item.save();
  await item.populate('reportedBy', reporterFields);
  return sendSuccess(response, 200, 'Item updated successfully', { item });
}

export async function deleteItem(request, response) {
  const item = await Item.findById(request.params.id);
  if (!item) throw new ApiError(404, 'Item not found', 'RESOURCE_NOT_FOUND');
  if (!canManageItem(item, request.user)) {
    throw new ApiError(403, 'You cannot delete this item', 'FORBIDDEN');
  }

  await item.deleteOne();
  return sendSuccess(response, 200, 'Item deleted successfully', {});
}