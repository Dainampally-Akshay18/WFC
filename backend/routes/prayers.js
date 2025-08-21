const express = require('express');
const {
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
} = require('../controllers/prayerController');

const { authenticateUser, authenticatePastor } = require('../middleware/auth');
const { filterPrayersByBranch, setBranchContext } = require('../middleware/branchFilter');
const { 
  validatePrayerRequest,
  validateObjectId,
  validatePagination,
  validateSearch
} = require('../middleware/validation');
const { body } = require('express-validator');

const router = express.Router();

// All routes require authentication
router.use(authenticateUser);
router.use(setBranchContext);

// Public routes
router.get('/', [filterPrayersByBranch, validatePagination, validateSearch], getAllPrayerRequests);
router.get('/recent-answered', validatePagination, getRecentAnsweredPrayers);
router.get('/my-requests', validatePagination, getUserPrayerRequests);
router.get('/:id', validateObjectId, getPrayerRequestById);

// User actions
router.post('/', validatePrayerRequest, submitPrayerRequest);
router.post('/:id/pray', validateObjectId, addPrayerForRequest);
router.put('/:id', [validateObjectId, validatePrayerRequest], updatePrayerRequest);
router.patch('/:id/answered', [
  validateObjectId,
  body('answeredDescription')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Answer description cannot exceed 500 characters')
], markPrayerAsAnswered);
router.delete('/:id', validateObjectId, deletePrayerRequest);

// Pastor-only routes
router.get('/branch/:branch', [
  authenticatePastor,
  validatePagination
], getPrayerRequestsByBranch);

router.get('/stats/overview', authenticatePastor, getPrayerStatistics);

module.exports = router;
