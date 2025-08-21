const express = require('express');
const {
  createEvent,
  getAllEvents,
  getEventsByBranch,
  getEventById,
  updateEvent,
  deleteEvent,
  requestCrossBranchSharing,
  approveCrossBranchSharing,
  getUpcomingEvents
} = require('../controllers/eventController');

const { authenticateUser, authenticatePastor } = require('../middleware/auth');
const { filterEventsByBranch, setBranchContext } = require('../middleware/branchFilter');
const { 
  validateEvent,
  validateObjectId,
  validatePagination,
  validateSearch
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);
router.use(setBranchContext);

// Public routes with branch filtering
router.get('/', [filterEventsByBranch, validatePagination, validateSearch], getAllEvents);
router.get('/upcoming', [filterEventsByBranch, validatePagination], getUpcomingEvents);
router.get('/branch/:branch', [filterEventsByBranch, validatePagination], getEventsByBranch);
router.get('/:id', [filterEventsByBranch, validateObjectId], getEventById);

// User can create events
router.post('/', validateEvent, createEvent);

// User can edit their own events
router.put('/:id', [validateObjectId, validateEvent], updateEvent);
router.delete('/:id', validateObjectId, deleteEvent);

// Cross-branch sharing
router.post('/:id/request-cross-branch', validateObjectId, requestCrossBranchSharing);

// Pastor-only routes
router.post('/:id/approve-cross-branch', [
  authenticatePastor,
  validateObjectId
], approveCrossBranchSharing);

module.exports = router;
