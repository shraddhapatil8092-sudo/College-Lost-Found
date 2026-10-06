import Claim from '../models/Claim.js';
import Item from '../models/Item.js';
import User from '../models/User.js';
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