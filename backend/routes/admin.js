const express = require('express');
const {
  getPendingApprovals,
  getUsersByBranch,
  getAllUsers,
  approveUser,
  rejectUser,
  revokeUserAccess,
  bulkApproveUsers,
  getUserStatistics,
  getUserDetails
} = require('../controllers/pastorUserController');

const {
  getDashboardOverview,
  getUserAnalytics,
  getContentAnalytics,
  getSystemMetrics,
  getAuditLogs,
  exportUserData
} = require('../controllers/adminDashboardController');

const {
  getSermonAnalytics,
  getEventAnalytics,
  getBlogAnalytics,
  getPrayerAnalytics
} = require('../controllers/contentAnalyticsController');

const {
  createSystemBackup,
  cleanupInactiveData,
  resetUserPassword,
  bulkUserOperations,
  setMaintenanceMode,
  getStorageUsage
} = require('../controllers/systemController');

const { authenticatePastor, requirePermission } = require('../middleware/auth');
const { 
  validateObjectId,
  validatePagination,
  handleValidationErrors
} = require('../middleware/validation');
const { authLimit, strictLimit } = require('../middleware/security');
const { body, param, query } = require('express-validator');

const router = express.Router();

// All routes require pastor authentication
router.use(authenticatePastor);

// ===========================================
// DASHBOARD ROUTES
// ===========================================

// Main dashboard overview
router.get('/dashboard/overview', getDashboardOverview);

// User analytics with period filtering
router.get('/dashboard/user-analytics', [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'year'])
    .withMessage('Period must be today, week, month, or year')
], getUserAnalytics);

// Content analytics with period filtering
router.get('/dashboard/content-analytics', [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'year'])
    .withMessage('Period must be today, week, month, or year')
], getContentAnalytics);

// System health and performance metrics
router.get('/dashboard/system-metrics', getSystemMetrics);

// ===========================================
// DETAILED CONTENT ANALYTICS ROUTES
// ===========================================

// Sermon analytics
router.get('/analytics/sermons', [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'year'])
    .withMessage('Invalid period'),
  query('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters')
], getSermonAnalytics);

// Event analytics
router.get('/analytics/events', [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'year'])
    .withMessage('Invalid period'),
  query('branch')
    .optional()
    .isIn(['branch1', 'branch2'])
    .withMessage('Branch must be branch1 or branch2')
], getEventAnalytics);

// Blog analytics
router.get('/analytics/blogs', [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'year'])
    .withMessage('Invalid period'),
  query('author')
    .optional()
    .isMongoId()
    .withMessage('Invalid author ID')
], getBlogAnalytics);

// Prayer request analytics
router.get('/analytics/prayers', [
  query('period')
    .optional()
    .isIn(['today', 'week', 'month', 'year'])
    .withMessage('Invalid period'),
  query('branch')
    .optional()
    .isIn(['branch1', 'branch2'])
    .withMessage('Branch must be branch1 or branch2')
], getPrayerAnalytics);

// ===========================================
// USER MANAGEMENT ROUTES
// ===========================================

// Require user management permission for all user management routes
router.use('/users', requirePermission('manageUsers'));

// Get pending approvals
router.get('/users/pending', [
  validatePagination,
  query('branch')
    .optional()
    .isIn(['branch1', 'branch2'])
    .withMessage('Branch must be branch1 or branch2'),
  handleValidationErrors
], getPendingApprovals);

// Get users by specific branch
router.get('/users/branch/:branch', [
  param('branch')
    .isIn(['branch1', 'branch2'])
    .withMessage('Branch must be branch1 or branch2'),
  validatePagination,
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be pending, approved, or rejected'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  handleValidationErrors
], getUsersByBranch);

// Get all users with filtering
router.get('/users/all', [
  validatePagination,
  query('branch')
    .optional()
    .isIn(['branch1', 'branch2'])
    .withMessage('Branch must be branch1 or branch2'),
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be pending, approved, or rejected'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  handleValidationErrors
], getAllUsers);

// Get specific user details
router.get('/users/:id', [
  validateObjectId,
  handleValidationErrors
], getUserDetails);

// Get user statistics overview
router.get('/users/stats/overview', getUserStatistics);

// ===========================================
// USER APPROVAL ACTIONS (with rate limiting)
// ===========================================

// Apply auth rate limiting to sensitive user operations
router.use(['/users/:id/approve', '/users/:id/reject', '/users/:id/revoke'], authLimit);

// Approve user
router.post('/users/:id/approve', [
  validateObjectId,
  handleValidationErrors
], approveUser);

// Reject user with optional reason
router.post('/users/:id/reject', [
  validateObjectId,
  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Rejection reason cannot exceed 200 characters'),
  handleValidationErrors
], rejectUser);

// Revoke user access
router.post('/users/:id/revoke', [
  validateObjectId,
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters'),
  handleValidationErrors
], revokeUserAccess);

// Bulk approve users
router.post('/users/bulk-approve', [
  body('userIds')
    .isArray({ min: 1, max: 50 })
    .withMessage('User IDs must be an array with 1-50 items'),
  body('userIds.*')
    .isMongoId()
    .withMessage('Each user ID must be valid'),
  handleValidationErrors
], bulkApproveUsers);

// ===========================================
// SYSTEM MANAGEMENT ROUTES (Super Admin Only)
// ===========================================

// Require super admin permissions (using createAdmins permission as proxy)
router.use('/system', requirePermission('createAdmins'));
router.use('/audit', requirePermission('createAdmins'));
router.use('/export', requirePermission('createAdmins'));

// System backup
router.get('/system/backup', [
  strictLimit
], createSystemBackup);

// Get storage usage
router.get('/system/storage', getStorageUsage);

// System cleanup (with dry run option)
router.post('/system/cleanup', [
  strictLimit,
  query('dryRun')
    .optional()
    .isBoolean()
    .withMessage('dryRun must be boolean'),
  handleValidationErrors
], cleanupInactiveData);

// Set maintenance mode
router.post('/system/maintenance', [
  strictLimit,
  body('enabled')
    .isBoolean()
    .withMessage('enabled must be boolean'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Message cannot exceed 200 characters'),
  handleValidationErrors
], setMaintenanceMode);

// Reset user password
router.post('/system/users/:id/reset-password', [
  strictLimit,
  validateObjectId,
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
], resetUserPassword);

// Bulk user operations
router.post('/system/bulk-operations', [
  strictLimit,
  body('operation')
    .isIn(['approve', 'reject', 'activate', 'deactivate'])
    .withMessage('Invalid operation'),
  body('userIds')
    .isArray({ min: 1, max: 100 })
    .withMessage('User IDs must be an array with 1-100 items'),
  body('userIds.*')
    .isMongoId()
    .withMessage('Each user ID must be valid'),
  body('data')
    .optional()
    .isObject()
    .withMessage('Data must be an object'),
  body('data.reason')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Reason cannot exceed 200 characters'),
  handleValidationErrors
], bulkUserOperations);

// ===========================================
// AUDIT AND EXPORT ROUTES
// ===========================================

// Get audit logs
router.get('/audit/logs', [
  validatePagination,
  query('action')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Action must be between 1 and 50 characters'),
  query('user')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID'),
  handleValidationErrors
], getAuditLogs);

// Export user data
router.get('/export/users', [
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be json or csv'),
  handleValidationErrors
], exportUserData);

// ===========================================
// ERROR HANDLING
// ===========================================

// Handle any unmatched admin routes
router.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Admin route ${req.originalUrl} not found`
  });
});

module.exports = router;
