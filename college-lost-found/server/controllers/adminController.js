import Claim from '../models/Claim.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function getAdminOverview(_request, response) {
  const [totalUsers, lostItems, foundItems, pendingClaims, returnedItems] = await Promise.all([
    User.countDocuments(),
    Item.countDocuments({ type: 'Lost' }),
    Item.countDocuments({ type: 'Found' }),
    Claim.countDocuments({ status: 'Pending' }),
    Item.countDocuments({ status: 'Returned' }),
  ]);

  return sendSuccess(response, 200, 'Admin overview retrieved successfully', {
    stats: { totalUsers, lostItems, foundItems, pendingClaims, returnedItems },
  });
}

export async function getUsers(_request, response) {
  const users = await User.find()
    .select('name email studentId role createdAt updatedAt')
    .sort({ createdAt: -1 })
    .lean();

  return sendSuccess(response, 200, 'Users retrieved successfully', { count: users.length, users });
}

export async function deleteUser(request, response) {
  const user = await User.findById(request.params.id);
  if (!user) {
    throw new ApiError(404, 'User not found', 'RESOURCE_NOT_FOUND');
  }
  if (user._id.toString() === request.user._id.toString()) {
    throw new ApiError(400, 'You cannot delete your own account', 'BAD_REQUEST');
  }

  // Delete all items reported by this user and all claims on those items
  const userItems = await Item.find({ reportedBy: user._id }).select('_id');
  const userItemIds = userItems.map((item) => item._id);
  if (userItemIds.length > 0) {
    await Claim.deleteMany({ item: { $in: userItemIds } });
    await Item.deleteMany({ _id: { $in: userItemIds } });
  }

  // Delete all claims submitted by this user
  await Claim.deleteMany({ claimant: user._id });

  // Delete the user document immediately
  await user.deleteOne();

  return sendSuccess(response, 200, 'User deleted successfully', {});
}

export async function updateUserRole(request, response) {
  const { role } = request.body;
  if (!['student', 'admin'].includes(role)) {
    throw new ApiError(400, 'Role must be student or admin', 'INVALID_ROLE');
  }
  const user = await User.findById(request.params.id);
  if (!user) throw new ApiError(404, 'User not found', 'RESOURCE_NOT_FOUND');
  if (user._id.toString() === request.user._id.toString()) {
    throw new ApiError(400, 'You cannot change your own role', 'BAD_REQUEST');
  }
  user.role = role;
  await user.save();
  return sendSuccess(response, 200, `User role updated to ${role}`, { user });
}