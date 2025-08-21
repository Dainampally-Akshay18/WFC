const { User, Pastor } = require('../models');
const { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  paginatedResponse 
} = require('../utils/responseFormatter');
const { 
  getPaginationOptions, 
  buildSearchQuery, 
  sanitizeUserData 
} = require('../utils/helpers');
const { APPROVAL_STATUS, BRANCHES } = require('../utils/constants');
const { asyncHandler } = require('../middleware/errorHandler');
const FirebaseService = require('../services/firebaseService');

// Get all pending user approvals
const getPendingApprovals = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationOptions(req.query);
  const { branch } = req.query;

  let query = { 
    approvalStatus: APPROVAL_STATUS.PENDING,
    isActive: true 
  };

  // Filter by branch if specified
  if (branch && Object.values(BRANCHES).includes(branch) && branch !== 'both') {
    query.branch = branch;
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-firebaseUID'),
    User.countDocuments(query)
  ]);

  const sanitizedUsers = users.map(user => sanitizeUserData(user));
  paginatedResponse(res, sanitizedUsers, { page, limit, total }, 'Pending approvals retrieved successfully');
});

// Get users by branch
const getUsersByBranch = asyncHandler(async (req, res) => {
  const { branch } = req.params;
  const { page, limit, skip, sort } = getPaginationOptions(req.query);
  const { search, status } = req.query;

  if (!Object.values(BRANCHES).includes(branch) || branch === 'both') {
    return errorResponse(res, 'Invalid branch', 400);
  }

  let query = { 
    branch,
    isActive: true 
  };

  // Filter by approval status if specified
  if (status && Object.values(APPROVAL_STATUS).includes(status)) {
    query.approvalStatus = status;
  }

  // Add search functionality
  if (search) {
    const searchQuery = buildSearchQuery(search, ['name', 'email']);
    query = { ...query, ...searchQuery };
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-firebaseUID')
      .populate('approvedBy', 'name title'),
    User.countDocuments(query)
  ]);

  const sanitizedUsers = users.map(user => sanitizeUserData(user));
  paginatedResponse(res, sanitizedUsers, { page, limit, total }, `${branch} users retrieved successfully`);
});

// Get all users (with filtering)
const getAllUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationOptions(req.query);
  const { branch, status, search } = req.query;

  let query = { isActive: true };

  // Filter by branch
  if (branch && Object.values(BRANCHES).includes(branch) && branch !== 'both') {
    query.branch = branch;
  }

  // Filter by approval status
  if (status && Object.values(APPROVAL_STATUS).includes(status)) {
    query.approvalStatus = status;
  }

  // Add search functionality
  if (search) {
    const searchQuery = buildSearchQuery(search, ['name', 'email']);
    query = { ...query, ...searchQuery };
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-firebaseUID')
      .populate('approvedBy', 'name title'),
    User.countDocuments(query)
  ]);

  const sanitizedUsers = users.map(user => sanitizeUserData(user));
  paginatedResponse(res, sanitizedUsers, { page, limit, total }, 'All users retrieved successfully');
});

// Approve user
const approveUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const pastorId = req.pastor._id;

  const user = await User.findById(userId);
  
  if (!user) {
    return notFoundResponse(res, 'User');
  }

  if (user.approvalStatus === APPROVAL_STATUS.APPROVED) {
    return errorResponse(res, 'User is already approved', 400);
  }

  // Update user approval status
  user.approvalStatus = APPROVAL_STATUS.APPROVED;
  user.approvedBy = pastorId;
  user.approvedAt = new Date();
  await user.save();

  // Set Firebase custom claims
  if (user.firebaseUID) {
    await FirebaseService.setCustomClaims(user.firebaseUID, {
      userType: 'user',
      branch: user.branch,
      approved: true,
      approvalDate: new Date().toISOString()
    });
  }

  const sanitizedUser = sanitizeUserData(user);
  successResponse(res, 'User approved successfully', sanitizedUser);
});

// Reject user
const rejectUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { rejectionReason } = req.body;
  const pastorId = req.pastor._id;

  const user = await User.findById(userId);
  
  if (!user) {
    return notFoundResponse(res, 'User');
  }

  if (user.approvalStatus === APPROVAL_STATUS.REJECTED) {
    return errorResponse(res, 'User is already rejected', 400);
  }

  // Update user rejection status
  user.approvalStatus = APPROVAL_STATUS.REJECTED;
  user.rejectionReason = rejectionReason || 'No reason provided';
  user.approvedBy = pastorId;
  user.approvedAt = new Date();
  await user.save();

  // Update Firebase custom claims
  if (user.firebaseUID) {
    await FirebaseService.setCustomClaims(user.firebaseUID, {
      userType: 'user',
      branch: user.branch,
      approved: false,
      rejected: true,
      rejectionReason: user.rejectionReason
    });
  }

  const sanitizedUser = sanitizeUserData(user);
  successResponse(res, 'User rejected successfully', sanitizedUser);
});

// Revoke user access
const revokeUserAccess = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  const user = await User.findById(userId);
  
  if (!user) {
    return notFoundResponse(res, 'User');
  }

  // Revert to pending status
  user.approvalStatus = APPROVAL_STATUS.REJECTED;
  user.rejectionReason = reason || 'Access revoked by pastor';
  user.approvedAt = new Date();
  user.approvedBy = req.pastor._id;
  await user.save();

  // Update Firebase custom claims
  if (user.firebaseUID) {
    await FirebaseService.setCustomClaims(user.firebaseUID, {
      userType: 'user',
      branch: user.branch,
      approved: false,
      revoked: true,
      revocationReason: reason
    });
  }

  const sanitizedUser = sanitizeUserData(user);
  successResponse(res, 'User access revoked successfully', sanitizedUser);
});

// Bulk approve users
const bulkApproveUsers = asyncHandler(async (req, res) => {
  const { userIds } = req.body;
  const pastorId = req.pastor._id;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return errorResponse(res, 'User IDs array is required', 400);
  }

  const updateResult = await User.updateMany(
    { 
      _id: { $in: userIds },
      approvalStatus: APPROVAL_STATUS.PENDING
    },
    {
      approvalStatus: APPROVAL_STATUS.APPROVED,
      approvedBy: pastorId,
      approvedAt: new Date()
    }
  );

  // Update Firebase custom claims for each user
  const users = await User.find({ _id: { $in: userIds } }).select('firebaseUID branch');
  for (const user of users) {
    if (user.firebaseUID) {
      await FirebaseService.setCustomClaims(user.firebaseUID, {
        userType: 'user',
        branch: user.branch,
        approved: true,
        approvalDate: new Date().toISOString()
      });
    }
  }

  successResponse(res, `${updateResult.modifiedCount} users approved successfully`, {
    approvedCount: updateResult.modifiedCount
  });
});

// Get user statistics
const getUserStatistics = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    pendingUsers,
    approvedUsers,
    rejectedUsers,
    branch1Users,
    branch2Users
  ] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ approvalStatus: APPROVAL_STATUS.PENDING, isActive: true }),
    User.countDocuments({ approvalStatus: APPROVAL_STATUS.APPROVED, isActive: true }),
    User.countDocuments({ approvalStatus: APPROVAL_STATUS.REJECTED, isActive: true }),
    User.countDocuments({ branch: BRANCHES.BRANCH1, isActive: true }),
    User.countDocuments({ branch: BRANCHES.BRANCH2, isActive: true })
  ]);

  const statistics = {
    total: totalUsers,
    pending: pendingUsers,
    approved: approvedUsers,
    rejected: rejectedUsers,
    branches: {
      branch1: branch1Users,
      branch2: branch2Users
    },
    approvalRate: totalUsers > 0 ? Math.round((approvedUsers / totalUsers) * 100) : 0
  };

  successResponse(res, 'User statistics retrieved successfully', statistics);
});

// Get specific user details (pastor view)
const getUserDetails = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId)
    .select('-firebaseUID')
    .populate('approvedBy', 'name title');
  
  if (!user) {
    return notFoundResponse(res, 'User');
  }

  // Get user's activity data
  const { Event, PrayerRequest } = require('../models');
  
  const [userEvents, userPrayers] = await Promise.all([
    Event.find({ createdBy: userId, creatorType: 'User' })
      .sort({ createdAt: -1 })
      .limit(10),
    PrayerRequest.find({ submittedBy: userId })
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  const userDetails = {
    user: sanitizeUserData(user),
    activity: {
      eventsCreated: userEvents,
      prayersSubmitted: userPrayers
    }
  };

  successResponse(res, 'User details retrieved successfully', userDetails);
});

module.exports = {
  getPendingApprovals,
  getUsersByBranch,
  getAllUsers,
  approveUser,
  rejectUser,
  revokeUserAccess,
  bulkApproveUsers,
  getUserStatistics,
  getUserDetails
};
