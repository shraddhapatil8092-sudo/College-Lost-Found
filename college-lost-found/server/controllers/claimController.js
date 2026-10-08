import Claim from '../models/Claim.js';
import Item from '../models/Item.js';
import ApiError from '../utils/ApiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

async function populateClaim(claim) {
  await claim.populate('item');
  await claim.populate('claimant', 'name email studentId role');
  return claim;
}

export async function createClaim(request, response) {
  const item = await Item.findById(request.validatedClaim.item).select('_id reportedBy status');
  if (!item) throw new ApiError(404, 'Item not found', 'RESOURCE_NOT_FOUND');
  if (item.reportedBy.toString() === request.user._id.toString()) {
    throw new ApiError(403, 'You cannot claim your own item', 'FORBIDDEN');
  }
  if (['Returned', 'Closed'].includes(item.status)) {
    throw new ApiError(409, 'This item is no longer claimable', 'ITEM_NOT_CLAIMABLE');
  }

  const existingClaim = await Claim.exists({ item: item._id, claimant: request.user._id });
  if (existingClaim) {
    throw new ApiError(409, 'You have already submitted a claim for this item', 'DUPLICATE_CLAIM');
  }

  const claim = await Claim.create({
    item: item._id,
    claimant: request.user._id,
    message: request.validatedClaim.message,
    proofDescription: request.validatedClaim.proofDescription,
    status: 'Pending',
  });

  await populateClaim(claim);
  return sendSuccess(response, 201, 'Claim submitted successfully', { claim });
}

export async function getMyClaims(request, response) {
  const claims = await Claim.find({ claimant: request.user._id })
    .populate('item')
    .sort({ createdAt: -1 });
  return sendSuccess(response, 200, 'Claims retrieved successfully', { count: claims.length, claims });
}

export async function getAllClaims(_request, response) {
  const claims = await Claim.find()
    .populate('item')
    .populate('claimant', 'name email studentId role')
    .sort({ createdAt: -1 });
  return sendSuccess(response, 200, 'Claims retrieved successfully', { count: claims.length, claims });
}

export async function approveClaim(request, response) {
  let priorItemStatus;
  let changedItemId;
  let claimApproved = false;

  try {
    const claim = await Claim.findById(request.params.id).select('item status');
    if (!claim) {
      throw new ApiError(404, 'Claim not found', 'RESOURCE_NOT_FOUND');
    }
    const targetItem = await Item.findById(claim.item).select('reportedBy');
    const isReporter = targetItem && targetItem.reportedBy.toString() === request.user._id.toString();
    if (request.user.role !== 'admin' && !isReporter) {
      throw new ApiError(403, 'You are not allowed to approve this claim', 'FORBIDDEN');
    }
    if (claim.status !== 'Pending') {
      throw new ApiError(409, 'Only pending claims can be approved', 'CLAIM_NOT_PENDING');
    }

    const item = await Item.findOneAndUpdate(
      { _id: claim.item, status: { $nin: ['Returned', 'Closed'] } },
      { $set: { status: 'Returned' } },
      { new: false },
    ).select('_id status');

    if (!item) {
      throw new ApiError(409, 'This item is no longer available', 'ITEM_NOT_CLAIMABLE');
    }
    priorItemStatus = item.status;
    changedItemId = item._id;

    const approvedClaim = await Claim.findOneAndUpdate(
      { _id: claim._id, status: 'Pending' },
      { $set: { status: 'Approved' } },
      { new: true },
    );

    if (!approvedClaim) {
      throw new ApiError(409, 'Claim is no longer pending', 'CLAIM_NOT_PENDING');
    }

    claimApproved = true;
    await populateClaim(approvedClaim);
    return sendSuccess(response, 200, 'Claim approved successfully', { claim: approvedClaim });
  } catch (error) {
    if (priorItemStatus && !claimApproved) {
      await Item.updateOne(
        { _id: changedItemId, status: 'Returned' },
        { $set: { status: priorItemStatus } },
      );
    }
    throw error;
  }
}

export async function rejectClaim(request, response) {
  const targetClaim = await Claim.findById(request.params.id).select('item status');
  if (!targetClaim) throw new ApiError(404, 'Claim not found', 'RESOURCE_NOT_FOUND');
  const targetItem = await Item.findById(targetClaim.item).select('reportedBy');
  const isReporter = targetItem && targetItem.reportedBy.toString() === request.user._id.toString();
  if (request.user.role !== 'admin' && !isReporter) {
    throw new ApiError(403, 'You are not allowed to reject this claim', 'FORBIDDEN');
  }

  const claim = await Claim.findOneAndUpdate(
    { _id: request.params.id, status: 'Pending' },
    { $set: { status: 'Rejected' } },
    { new: true },
  );

  if (!claim) {
    throw new ApiError(409, 'Only pending claims can be rejected', 'CLAIM_NOT_PENDING');
  }

  await populateClaim(claim);
  return sendSuccess(response, 200, 'Claim rejected successfully', { claim });
}

export async function getItemClaims(request, response) {
  const item = await Item.findById(request.params.id).select('reportedBy');
  if (!item) throw new ApiError(404, 'Item not found', 'RESOURCE_NOT_FOUND');
  if (request.user.role !== 'admin' && item.reportedBy.toString() !== request.user._id.toString()) {
    throw new ApiError(403, 'You cannot view claims for this item', 'FORBIDDEN');
  }

  const claims = await Claim.find({ item: item._id })
    .populate('claimant', 'name email studentId role')
    .sort({ createdAt: -1 });

  return sendSuccess(response, 200, 'Claims retrieved successfully', { count: claims.length, claims });
}

export async function deleteClaim(request, response) {
  const claim = await Claim.findById(request.params.id);
  if (!claim) {
    throw new ApiError(404, 'Claim not found', 'RESOURCE_NOT_FOUND');
  }
  if (request.user.role !== 'admin' && claim.claimant.toString() !== request.user._id.toString()) {
    throw new ApiError(403, 'You cannot delete this claim', 'FORBIDDEN');
  }

  await claim.deleteOne();
  return sendSuccess(response, 200, 'Claim deleted successfully', {});
}