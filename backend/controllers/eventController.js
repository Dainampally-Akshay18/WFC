const { Event } = require('../models');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  paginatedResponse
} = require('../utils/responseFormatter');
const {
  getPaginationOptions,
  buildSearchQuery,
  isFutureDate
} = require('../utils/helpers');
const { BRANCHES } = require('../utils/constants');
const { asyncHandler } = require('../middleware/errorHandler');

// Create new event
const createEvent = asyncHandler(async (req, res) => {
  const { title, description, eventDate, endDate, location, branch, maxAttendees } = req.body;
  const creatorId = req.userType === 'pastor' ? req.pastor._id : req.user._id;
  const creatorType = req.userType === 'pastor' ? 'Pastor' : 'User';

  // For regular users, restrict to their branch unless they are pastors
  let eventBranch = branch;
  if (req.userType === 'user') {
    eventBranch = req.user.branch; // Force user's branch
  }

  const event = await Event.create({
    title,
    description,
    eventDate,
    endDate,
    location,
    branch: eventBranch,
    maxAttendees,
    createdBy: creatorId,
    creatorType
  });

  await event.populate('createdBy');
  successResponse(res, 'Event created successfully', event, 201);
});

// Get all events with branch filtering
const getAllEvents = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationOptions(req.query);
  const { branch, upcoming, search, myEvents } = req.query;

  let query = { isActive: true };

  // Apply branch filtering based on user type and permissions
  if (req.userType === 'user') {
    // Apply branch filter from middleware
    if (req.branchFilter) {
      query = { ...query, ...req.branchFilter };
    }
  } else if (branch && branch !== 'all') {
    // Pastor can filter by specific branch
    query.branch = branch;
  }

  // Filter for user's own events
  if (myEvents === 'true' && req.userType === 'user') {
    query.createdBy = req.user._id;
    query.creatorType = 'User';
  } else if (myEvents === 'true' && req.userType === 'pastor') {
    query.createdBy = req.pastor._id;
    query.creatorType = 'Pastor';
  }

  // Filter upcoming events only
  if (upcoming === 'true') {
    query.eventDate = { $gt: new Date() };
  }

  // Search functionality
  if (search) {
    const searchQuery = buildSearchQuery(search, ['title', 'description', 'location']);
    query = { ...query, ...searchQuery };
  }

  const [events, total] = await Promise.all([
    Event.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('createdBy')
      .populate('approvedBy', 'name title'),
    Event.countDocuments(query)
  ]);

  // Add status and attendance info
  const eventsWithStatus = events.map(event => ({
    ...event.toObject(),
    status: event.status,
    attendeeCount: event.attendeeCount,
    availableSpots: event.availableSpots,
    canEdit: req.userType === 'pastor' || 
             (req.userType === 'user' && event.createdBy._id.equals(req.user._id)),
    canDelete: req.userType === 'pastor' || 
               (req.userType === 'user' && event.createdBy._id.equals(req.user._id))
  }));

  paginatedResponse(res, eventsWithStatus, { page, limit, total }, 'Events retrieved successfully');
});

// Get events by branch
const getEventsByBranch = asyncHandler(async (req, res) => {
  const { branch } = req.params;
  const { page, limit, skip, sort } = getPaginationOptions(req.query);

  if (!Object.values(BRANCHES).includes(branch)) {
    return errorResponse(res, 'Invalid branch', 400);
  }

  // Check if user can access this branch
  if (req.userType === 'user' && req.user.branch !== branch && branch !== 'both') {
    return errorResponse(res, 'Access denied for this branch', 403);
  }

  const events = await Event.findByBranch(branch)
    .skip(skip)
    .limit(limit);
  const total = await Event.countDocuments({ branch, isActive: true });

  paginatedResponse(res, events, { page, limit, total }, `Events for ${branch} retrieved successfully`);
});

// Get single event by ID
const getEventById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const event = await Event.findById(id)
    .populate('createdBy')
    .populate('approvedBy', 'name title')
    .populate('attendees.user', 'name email');

  if (!event) {
    return notFoundResponse(res, 'Event');
  }

  // Check if user can access this event
  if (req.userType === 'user') {
    const userBranch = req.user.branch;
    const canAccess = event.branch === userBranch ||
      event.branch === 'both' ||
      (event.branch !== userBranch && event.crossBranchApproved);

    if (!canAccess) {
      return errorResponse(res, 'Access denied for this event', 403);
    }
  }

  const eventData = {
    ...event.toObject(),
    status: event.status,
    attendeeCount: event.attendeeCount,
    availableSpots: event.availableSpots,
    userRegistered: req.userType === 'user' ?
      event.attendees.some(a => a.user._id.equals(req.user._id)) : false,
    canEdit: req.userType === 'pastor' || 
             (req.userType === 'user' && event.createdBy._id.equals(req.user._id)),
    canDelete: req.userType === 'pastor' || 
               (req.userType === 'user' && event.createdBy._id.equals(req.user._id))
  };

  successResponse(res, 'Event retrieved successfully', eventData);
});

// Update event
const updateEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const event = await Event.findById(id);
  if (!event) {
    return notFoundResponse(res, 'Event');
  }

  // Check permissions
  const canEdit = req.userType === 'pastor' ||
    (req.userType === 'user' && event.createdBy.equals(req.user._id));

  if (!canEdit) {
    return errorResponse(res, 'Not authorized to edit this event', 403);
  }

  // For regular users, don't allow branch changes
  if (req.userType === 'user') {
    delete updates.branch;
    delete updates.crossBranchApproved;
  }

  Object.assign(event, updates);
  await event.save();
  await event.populate('createdBy');

  successResponse(res, 'Event updated successfully', event);
});

// Delete event (soft delete)
const deleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const event = await Event.findById(id);
  if (!event) {
    return notFoundResponse(res, 'Event');
  }

  // Check permissions
  const canDelete = req.userType === 'pastor' ||
    (req.userType === 'user' && event.createdBy.equals(req.user._id));

  if (!canDelete) {
    return errorResponse(res, 'Not authorized to delete this event', 403);
  }

  // Soft delete
  event.isActive = false;
  event.deletedAt = new Date();
  await event.save();

  successResponse(res, 'Event deleted successfully', { deletedEventId: id });
});

// Hard delete event (permanently remove - admin only)
const hardDeleteEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const event = await Event.findById(id);
  if (!event) {
    return notFoundResponse(res, 'Event');
  }

  // Only pastors can hard delete
  if (req.userType !== 'pastor') {
    return errorResponse(res, 'Not authorized to permanently delete this event', 403);
  }

  await Event.findByIdAndDelete(id);
  successResponse(res, 'Event permanently deleted successfully', { deletedEventId: id });
});

// Request cross-branch sharing
const requestCrossBranchSharing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const event = await Event.findById(id);
  if (!event) {
    return notFoundResponse(res, 'Event');
  }

  // Check if user owns the event
  if (req.userType === 'user' && !event.createdBy.equals(req.user._id)) {
    return errorResponse(res, 'Not authorized to modify this event', 403);
  }

  if (event.crossBranchRequested) {
    return errorResponse(res, 'Cross-branch sharing already requested', 400);
  }

  event.crossBranchRequested = true;
  await event.save();

  successResponse(res, 'Cross-branch sharing requested successfully');
});

// Approve cross-branch sharing (Pastor only)
const approveCrossBranchSharing = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const event = await Event.findById(id);
  if (!event) {
    return notFoundResponse(res, 'Event');
  }

  if (!event.crossBranchRequested) {
    return errorResponse(res, 'No cross-branch sharing request found', 400);
  }

  event.crossBranchApproved = true;
  event.approvedBy = req.pastor._id;
  await event.save();

  successResponse(res, 'Cross-branch sharing approved successfully');
});

// Get upcoming events
const getUpcomingEvents = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  let query = { isActive: true };

  // Apply branch filtering for users
  if (req.userType === 'user' && req.branchFilter) {
    query = { ...query, ...req.branchFilter };
  }

  const events = await Event.findUpcoming(parseInt(limit))
    .where(query);

  successResponse(res, 'Upcoming events retrieved successfully', events);
});

module.exports = {
  createEvent,
  getAllEvents,
  getEventsByBranch,
  getEventById,
  updateEvent,
  deleteEvent,
  hardDeleteEvent,
  requestCrossBranchSharing,
  approveCrossBranchSharing,
  getUpcomingEvents
};
