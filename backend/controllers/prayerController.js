const { PrayerRequest } = require('../models');
const { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  paginatedResponse 
} = require('../utils/responseFormatter');
const { 
  getPaginationOptions, 
  buildSearchQuery 
} = require('../utils/helpers');
const { PRAYER_STATUS, PRIORITY_LEVELS } = require('../utils/constants');
const { asyncHandler } = require('../middleware/errorHandler');

// Submit prayer request
const submitPrayerRequest = asyncHandler(async (req, res) => {
  // Destructure all expected fields from the form
  const { title, description, isAnonymous, priority, category, shareWithOtherBranch } = req.body;
  const userId = req.user._id;
  const userBranch = req.user.branch;

  const prayerData = {
    title,
    description,
    submitterBranch: userBranch,
    priority: priority || 'normal',
    category: category || 'Other', // Add category with a fallback
    shareWithOtherBranch: !!shareWithOtherBranch // Add shareWithOtherBranch, ensuring it's a boolean
  };

  if (isAnonymous) {
    prayerData.isAnonymous = true;
    prayerData.submitterName = 'Anonymous';
  } else {
    prayerData.submittedBy = userId;
    prayerData.submitterName = req.user.name;
  }

  const prayerRequest = await PrayerRequest.create(prayerData);

  successResponse(res, 'Prayer request submitted successfully', prayerRequest, 201);
});

// Get all active prayer requests (visible to all users)
const getAllPrayerRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationOptions(req.query);
  const { status, priority, branch, search } = req.query;

  let query = { isVisible: true };

  // Filter by status
  if (status && Object.values(PRAYER_STATUS).includes(status)) {
    query.status = status;
  } else {
    // If no status is provided, default to 'active'.
    // Allow 'all' to bypass this default for the "All Requests" tab.
    if (status !== 'all') {
      query.status = 'active';
    }
  }

  // Filter by priority
  if (priority && Object.values(PRIORITY_LEVELS).includes(priority)) {
    query.priority = priority;
  }

  // Filter by branch (for pastor view)
  if (req.userType === 'pastor' && branch) {
    query.submitterBranch = branch;
  }

  // Search functionality
  if (search) {
    const searchQuery = buildSearchQuery(search, ['title', 'description']);
    query = { ...query, ...searchQuery };
  }

  const [prayers, total] = await Promise.all([
    PrayerRequest.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('submittedBy', 'name'),
    PrayerRequest.countDocuments(query)
  ]);

  // Add computed fields
  const prayersWithMeta = prayers.map(prayer => ({
    ...prayer.toObject(),
    displayName: prayer.displayName,
    daysOld: prayer.daysOld,
    // Explicitly check if the current user has prayed
    isPrayingFor: prayer.prayedBy.some(p => p.user && p.user.equals(req.user._id))
  }));

  paginatedResponse(res, prayersWithMeta, { page, limit, total }, 'Prayer requests retrieved successfully');
});

// Get prayer requests by branch (pastor view)
const getPrayerRequestsByBranch = asyncHandler(async (req, res) => {
  const { branch } = req.params;
  const { page, limit, skip, sort } = getPaginationOptions(req.query);

  const prayers = await PrayerRequest.findByBranch(branch)
    .skip(skip)
    .limit(limit);

  const total = await PrayerRequest.countDocuments({ 
    submitterBranch: branch, 
    status: 'active', 
    isVisible: true 
  });

  paginatedResponse(res, prayers, { page, limit, total }, `Prayer requests for ${branch} retrieved successfully`);
});

// Get single prayer request
const getPrayerRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prayer = await PrayerRequest.findById(id)
    .populate('submittedBy', 'name email')
    .populate('prayedBy.user', 'name');

  if (!prayer) {
    return notFoundResponse(res, 'Prayer request');
  }

  if (!prayer.isVisible) {
    return notFoundResponse(res, 'Prayer request');
  }

  const prayerData = {
    ...prayer.toObject(),
    displayName: prayer.displayName,
    daysOld: prayer.daysOld,
    userHasPrayed: req.userType === 'user' ? 
      prayer.prayedBy.some(p => p.user._id.equals(req.user._id)) : false
  };

  successResponse(res, 'Prayer request retrieved successfully', prayerData);
});

// Add prayer for a request
const addPrayerForRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const prayer = await PrayerRequest.findById(id);

  if (!prayer) {
    return notFoundResponse(res, 'Prayer request');
  }

  if (!prayer.isVisible || prayer.status !== 'active') {
    return errorResponse(res, 'Cannot pray for this request', 400);
  }

  // Toggle prayer status
  const userHasPrayed = prayer.prayedBy.some(p => p.user.equals(userId));

  if (userHasPrayed) {
    await prayer.removePrayer(userId);
    successResponse(res, 'Prayer removed successfully', {
      prayerCount: prayer.prayerCount,
      action: 'removed'
    });
  } else {
    await prayer.addPrayer(userId);
    successResponse(res, 'Prayer added successfully', {
      prayerCount: prayer.prayerCount,
      action: 'added'
    });
  }
});

// Update prayer request (owner or pastor)
const updatePrayerRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, priority } = req.body;

  const prayer = await PrayerRequest.findById(id);

  if (!prayer) {
    return notFoundResponse(res, 'Prayer request');
  }

  // Check permissions
  const canEdit = req.userType === 'pastor' || 
                 (req.userType === 'user' && prayer.submittedBy && prayer.submittedBy.equals(req.user._id));

  if (!canEdit) {
    return errorResponse(res, 'Not authorized to edit this prayer request', 403);
  }

  // Update fields
  if (title) prayer.title = title;
  if (description) prayer.description = description;
  if (priority) prayer.priority = priority;

  await prayer.save();

  successResponse(res, 'Prayer request updated successfully', prayer);
});

// Mark prayer request as answered
const markPrayerAsAnswered = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { answeredDescription } = req.body;

  const prayer = await PrayerRequest.findById(id);

  if (!prayer) {
    return notFoundResponse(res, 'Prayer request');
  }

  // Check permissions (owner or pastor)
  const canAnswer = req.userType === 'pastor' || 
                   (req.userType === 'user' && prayer.submittedBy && prayer.submittedBy.equals(req.user._id));

  if (!canAnswer) {
    return errorResponse(res, 'Not authorized to mark this prayer as answered', 403);
  }

  await prayer.markAsAnswered(answeredDescription);

  successResponse(res, 'Prayer request marked as answered', prayer);
});

// Delete prayer request
const deletePrayerRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const prayer = await PrayerRequest.findById(id);

  if (!prayer) {
    return notFoundResponse(res, 'Prayer request');
  }

  // Check permissions
  const canDelete = req.userType === 'pastor' || 
                   (req.userType === 'user' && prayer.submittedBy && prayer.submittedBy.equals(req.user._id));

  if (!canDelete) {
    return errorResponse(res, 'Not authorized to delete this prayer request', 403);
  }

  // Soft delete (hide from view)
  prayer.isVisible = false;
  await prayer.save();

  successResponse(res, 'Prayer request deleted successfully');
});

// Get user's prayer requests
const getUserPrayerRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationOptions(req.query);
  const userId = req.user._id;

  const [prayers, total] = await Promise.all([
    PrayerRequest.find({ 
      submittedBy: userId,
      isVisible: true 
    })
    .sort(sort)
    .skip(skip)
    .limit(limit),
    PrayerRequest.countDocuments({ 
      submittedBy: userId,
      isVisible: true 
    })
  ]);

  paginatedResponse(res, prayers, { page, limit, total }, 'Your prayer requests retrieved successfully');
});

// Get recent answered prayers
const getRecentAnsweredPrayers = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const prayers = await PrayerRequest.findRecentAnswered(parseInt(limit));

  successResponse(res, 'Recent answered prayers retrieved successfully', prayers);
});

// Get prayer statistics (pastor only)
const getPrayerStatistics = asyncHandler(async (req, res) => {
  const [
    totalPrayers,
    activePrayers,
    answeredPrayers,
    branch1Prayers,
    branch2Prayers
  ] = await Promise.all([
    PrayerRequest.countDocuments({ isVisible: true }),
    PrayerRequest.countDocuments({ status: 'active', isVisible: true }),
    PrayerRequest.countDocuments({ status: 'answered', isVisible: true }),
    PrayerRequest.countDocuments({ submitterBranch: 'branch1', isVisible: true }),
    PrayerRequest.countDocuments({ submitterBranch: 'branch2', isVisible: true })
  ]);

  const stats = {
    total: totalPrayers,
    active: activePrayers,
    answered: answeredPrayers,
    branches: {
      branch1: branch1Prayers,
      branch2: branch2Prayers
    },
    answerRate: totalPrayers > 0 ? Math.round((answeredPrayers / totalPrayers) * 100) : 0
  };

  successResponse(res, 'Prayer statistics retrieved successfully', stats);
});

module.exports = {
  submitPrayerRequest,
  getAllPrayerRequests,
  getPrayerRequestsByBranch,
  getPrayerRequestById,
  addPrayerForRequest,
  updatePrayerRequest,
  markPrayerAsAnswered,
  deletePrayerRequest,
  getUserPrayerRequests,
  getRecentAnsweredPrayers,
  getPrayerStatistics
};