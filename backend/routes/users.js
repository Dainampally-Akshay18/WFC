const express = require('express');
const {
  getUserProfile,
  updateUserProfile,
  getUserDashboard,
  getUserEvents,
  getUserPrayerRequests,
  registerForEvent,
  unregisterFromEvent,
  changeBranch,
  deactivateAccount
} = require('../controllers/userController');

const { authenticateUser } = require('../middleware/auth');
const { setBranchContext, filterEventsByBranch } = require('../middleware/branchFilter');
const { 
  validateObjectId,
  validatePagination,
  validateBranchSelection
} = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// All routes require user authentication
router.use(authenticateUser);
router.use(setBranchContext);

// Profile routes
router.get('/profile', getUserProfile);
router.put('/profile', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('profilePicture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL')
], updateUserProfile);

// Dashboard
router.get('/dashboard', getUserDashboard);

// User's content
router.get('/events', validatePagination, getUserEvents);
router.get('/prayers', validatePagination, getUserPrayerRequests);

// Event registration
router.post('/events/:id/register', validateObjectId, registerForEvent);
router.delete('/events/:id/register', validateObjectId, unregisterFromEvent);

// Account management
router.put('/branch', validateBranchSelection, changeBranch);
router.patch('/deactivate', deactivateAccount);

module.exports = router;
