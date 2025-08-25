const express = require('express');
const { body } = require('express-validator');
const {
  signup,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/pastorAuthController');
const { authenticatePastor, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Test route
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Pastor Auth Route is working!',
    endpoints: [
      'POST /login',
      'POST /signup',
      'GET /profile',
      'PUT /profile',
      'POST /change-password'
    ]
  });
});

// Pastor signup (protected)
router.post('/signup', [
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  body('name', 'Name must be at least 2 characters').isLength({ min: 2 })
], signup);

// Pastor login (public)
router.post('/login', [
  body('email', 'Enter a valid email').isEmail(),
  body('password', 'Password cannot be blank').isLength({ min: 1 })
], login);

// Protected routes
router.get('/profile', authenticatePastor, getProfile);

router.put('/profile', [
  authenticatePastor,
  body('name', 'Name must be at least 2 characters').optional().isLength({ min: 2 }),
  body('bio', 'Bio cannot exceed 1000 characters').optional().isLength({ max: 1000 }),
  body('title', 'Invalid title').optional().isIn(['Pastor', 'Associate Pastor', 'Admin'])
], updateProfile);

router.post('/change-password', [
  authenticatePastor,
  body('currentPassword', 'Current password is required').notEmpty(),
  body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 })
], changePassword);

router.post('/logout', authenticatePastor, logout);

module.exports = router;
