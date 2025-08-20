const { verifyFirebaseToken } = require('../config/firebase');
const { User, Pastor } = require('../models');

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

// Middleware to get user details and check approval status
const getUserDetails = async (req, res, next) => {
  try {
    const { uid } = req;

    // Try to find user in User collection first
    let user = await User.findOne({ firebaseUID: uid });
    
    if (user) {
      req.user = user;
      req.userType = 'user';
      
      // Check if user is approved
      if (user.approvalStatus !== 'approved') {
        return res.status(403).json({
          status: 'error',
          message: 'Account pending approval',
          data: {
            approvalStatus: user.approvalStatus,
            rejectionReason: user.rejectionReason
          }
        });
      }
    } else {
      // Try to find in Pastor collection
      let pastor = await Pastor.findOne({ firebaseUID: uid });
      
      if (pastor) {
        req.user = pastor;
        req.userType = 'pastor';
      } else {
        return res.status(404).json({
          status: 'error',
          message: 'User not found in database'
        });
      }
    }

    next();
  } catch (error) {
    console.error('User details error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error retrieving user details'
    });
  }
};

// Middleware to check if user is approved (for regular users only)
const requireApproval = (req, res, next) => {
  if (req.userType === 'pastor') {
    return next(); // Pastors don't need approval
  }

  if (!req.user || req.user.approvalStatus !== 'approved') {
    return res.status(403).json({
      status: 'error',
      message: 'Account not approved',
      data: {
        approvalStatus: req.user?.approvalStatus || 'unknown',
        rejectionReason: req.user?.rejectionReason
      }
    });
  }

  next();
};

// Combined middleware for authenticated routes
const authenticateUser = [authenticateToken, getUserDetails, requireApproval];

// Middleware for pastor-only routes
const requirePastor = async (req, res, next) => {
  try {
    const { uid } = req;
    
    const pastor = await Pastor.findOne({ firebaseUID: uid, isActive: true });
    
    if (!pastor) {
      return res.status(403).json({
        status: 'error',
        message: 'Pastor access required'
      });
    }

    req.pastor = pastor;
    next();
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error verifying pastor status'
    });
  }
};

// Middleware to check specific permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (req.userType !== 'pastor') {
      return res.status(403).json({
        status: 'error',
        message: 'Pastor access required'
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        status: 'error',
        message: `Permission required: ${permission}`
      });
    }

    next();
  };
};

// Combined middleware for pastor routes
const authenticatePastor = [authenticateToken, requirePastor];

module.exports = {
  authenticateToken,
  getUserDetails,
  requireApproval,
  authenticateUser,
  requirePastor,
  requirePermission,
  authenticatePastor
};
