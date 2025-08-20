const express = require('express');
const { 
  universalLogin,
  selectBranch, 
  getUserStatus, 
  registerUser,
  logout 
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Public routes

// Manual user registration (for email/password users)
router.post('/register', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters')
], validateInput, registerUser);

// Protected routes (require Firebase authentication)

// Universal login (handles both Email/Password and Google users)
router.post('/login', authenticateToken, universalLogin);

// Branch selection
router.post('/select-branch', [
  authenticateToken,
  body('branch')
    .isIn(['branch1', 'branch2'])
    .withMessage('Branch must be branch1 or branch2')
], validateInput, selectBranch);

// Get user status
router.get('/status', authenticateToken, getUserStatus);

// Logout
router.post('/logout', authenticateToken, logout);

// Test authentication endpoint
router.get('/test', authenticateToken, (req, res) => {
  res.json({
    status: 'success',
    message: 'Authentication working',
    data: {
      uid: req.uid,
      email: req.firebaseUser.email,
      provider: req.firebaseUser.firebase.sign_in_provider
    }
  });
});

// Health check for auth routes
router.get('/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'Auth routes working',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
