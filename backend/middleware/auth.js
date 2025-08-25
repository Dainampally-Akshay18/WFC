const jwt = require('jsonwebtoken'); // ADD THIS LINE
const { verifyFirebaseToken } = require('../config/firebase');
const { User, Pastor } = require('../models');
const { errorResponse } = require('../utils/responseFormatter'); // ADD THIS LINE

// Middleware to verify Firebase token (works for both email/password and Google)
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token is required'
      });
    }

    // Verify Firebase token (works for all authentication methods)
    const decodedToken = await verifyFirebaseToken(token);
    // Add decoded token to request
    req.firebaseUser = decodedToken;
    req.uid = decodedToken.uid;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({
      status: 'error',
      message: 'Invalid or expired token'
    });
  }
};

// Authenticate Pastor (JWT-based for pastors)
const authenticatePastor = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access token required', 401);
    }

    const token = authHeader.substring(7);
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.userType !== 'pastor') {
      return errorResponse(res, 'Pastor access required', 403);
    }

    // Find pastor
    const pastor = await Pastor.findById(decoded.id);
    if (!pastor || !pastor.isActive) {
      return errorResponse(res, 'Pastor account not found or inactive', 401);
    }

    req.pastor = pastor;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401);
    }
    return errorResponse(res, 'Authentication failed', 401);
  }
};

// Check specific permission
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.pastor) {
      return errorResponse(res, 'Pastor authentication required', 401);
    }

    if (!req.pastor.hasPermission(permission)) {
      return errorResponse(res, `Permission denied: ${permission} required`, 403);
    }

    next();
  };
};

// Authenticate User (Firebase-based for users)
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access token required', 401);
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.userType !== 'user') {
      return errorResponse(res, 'User access required', 403);
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return errorResponse(res, 'User account not found or inactive', 401);
    }

    if (user.approvalStatus !== 'approved') {
      return errorResponse(res, 'Account pending approval', 403);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401);
    }
    return errorResponse(res, 'Authentication failed', 401);
  }
};

module.exports = {
  authenticateToken,
  authenticatePastor,
  authenticateUser,
  requirePermission
};
