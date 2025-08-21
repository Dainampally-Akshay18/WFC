const { User } = require('../models');
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

// Get user profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-firebaseUID');
  
  if (!user) {
    return notFoundResponse(res, 'User');
  }

  const sanitizedUser = sanitizeUserData(user);
  successResponse(res, 'Profile retrieved successfully', sanitizedUser);
});

// Update user profile
const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, bio, profilePicture } = req.body;
  const userId = req.user._id;

  // Fields that users can update themselves
  const updateFields = {};
  if (name) updateFields.name = name;
  if (bio !== undefined) updateFields.bio = bio;
  if (profilePicture !== undefined) updateFields.profilePicture = profilePicture;

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateFields,
    { new: true, runValidators: true }
  ).select('-firebaseUID');

  if (!updatedUser) {
    return notFoundResponse(res, 'User');
  }

  const sanitizedUser = sanitizeUserData(updatedUser);
  successResponse(res, 'Profile updated successfully', sanitizedUser);
});

// Get user dashboard data
const getUserDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const userBranch = req.user.branch;

  // Get user's created events
  const { Event, PrayerRequest, Blog } = require('../models');
  
  const [userEvents, userPrayers, recentBlogs] = await Promise.all([
    Event.find({ 
      createdBy: userId,
      creatorType: 'User',
      isActive: true 
    })
    .sort({ createdAt: -1 })
    .limit(5),
    
    PrayerRequest.find({ 
      submittedBy: userId,
      isVisible: true 
    })
    .sort({ createdAt: -1 })
    .limit(5),
    
    Blog.find({ status: 'published' })
    .sort({ publishDate: -1 })
    .limit(3)
    .populate('author', 'name title')
  ]);

  const dashboardData = {
    user: sanitizeUserData(req.user),
    stats: {
      eventsCreated: userEvents.length,
      prayersSubmitted: userPrayers.length
    },
    recentEvents: userEvents,
    recentPrayers: userPrayers,
    recentBlogs
  };

  successResponse(res, 'Dashboard data retrieved successfully', dashboardData);
});

// Get user's events
const getUserEvents = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page, limit, skip, sort } = getPaginationOptions(req.query);

  const query = { 
    createdBy: userId,
    creatorType: 'User',
    isActive: true 
  };

  const [events, total] = await Promise.all([
    Event.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('approvedBy', 'name title'),
    Event.countDocuments(query)
  ]);

  paginatedResponse(res, events, { page, limit, total }, 'User events retrieved successfully');
});

// Get user's prayer requests
const getUserPrayerRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page, limit, skip, sort } = getPaginationOptions(req.query);

  const query = { 
    submittedBy: userId,
    isVisible: true 
  };

  const [prayers, total] = await Promise.all([
    PrayerRequest.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit),
    PrayerRequest.countDocuments(query)
  ]);

  paginatedResponse(res, prayers, { page, limit, total }, 'User prayer requests retrieved successfully');
});

// Register for event attendance
const registerForEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user._id;

  const event = await Event.findById(eventId);
  
  if (!event) {
    return notFoundResponse(res, 'Event');
  }

  // Check if user can access this event (branch-based)
  const userBranch = req.user.branch;
  const canAccess = event.branch === userBranch || 
                   event.branch === 'both' || 
                   (event.branch !== userBranch && event.crossBranchApproved);

  if (!canAccess) {
    return errorResponse(res, 'You cannot register for this event', 403);
  }

  try {
    await event.registerAttendee(userId);
    successResponse(res, 'Successfully registered for event');
  } catch (error) {
    return errorResponse(res, error.message, 400);
  }
});

// Unregister from event
const unregisterFromEvent = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user._id;

  const event = await Event.findById(eventId);
  
  if (!event) {
    return notFoundResponse(res, 'Event');
  }

  // Remove user from attendees
  event.attendees = event.attendees.filter(
    attendee => !attendee.user.equals(userId)
  );

  await event.save();
  successResponse(res, 'Successfully unregistered from event');
});

// Change user branch (requires re-approval)
const changeBranch = asyncHandler(async (req, res) => {
  const { branch } = req.body;
  const userId = req.user._id;

  if (!Object.values(BRANCHES).includes(branch) || branch === 'both') {
    return errorResponse(res, 'Invalid branch selection', 400);
  }

  // Update user branch and reset approval status
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { 
      branch,
      approvalStatus: APPROVAL_STATUS.PENDING,
      branchSelectedAt: new Date(),
      approvedAt: null,
      approvedBy: null
    },
    { new: true }
  ).select('-firebaseUID');

  const sanitizedUser = sanitizeUserData(updatedUser);
  successResponse(res, 'Branch changed successfully. Your account is now pending approval again.', sanitizedUser);
});

// Deactivate user account
const deactivateAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await User.findByIdAndUpdate(userId, { isActive: false });
  successResponse(res, 'Account deactivated successfully');
});

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserDashboard,
  getUserEvents,
  getUserPrayerRequests,
  registerForEvent,
  unregisterFromEvent,
  changeBranch,
  deactivateAccount
};
