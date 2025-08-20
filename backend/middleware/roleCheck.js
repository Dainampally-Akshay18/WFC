// Check if user belongs to specific branch
const checkBranch = (allowedBranches) => {
  return (req, res, next) => {
    if (req.userType === 'pastor') {
      return next(); // Pastors can access all branches
    }

    const userBranch = req.user.branch;
    const branches = Array.isArray(allowedBranches) ? allowedBranches : [allowedBranches];
    
    if (!branches.includes(userBranch) && !branches.includes('both')) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied for your branch'
      });
    }

    next();
  };
};

// Check if user can access cross-branch content
const checkCrossBranchAccess = (req, res, next) => {
  if (req.userType === 'pastor') {
    return next(); // Pastors have full access
  }

  // Add branch to request for filtering
  req.userBranch = req.user.branch;
  next();
};

// Admin level checks
const requireSuperAdmin = (req, res, next) => {
  if (req.userType !== 'pastor' || !req.user.isSuperAdmin()) {
    return res.status(403).json({
      status: 'error',
      message: 'Super admin access required'
    });
  }
  next();
};

// Check if user owns the resource or is pastor
const checkOwnershipOrPastor = (resourceField = 'createdBy') => {
  return (req, res, next) => {
    if (req.userType === 'pastor') {
      return next(); // Pastors can access all
    }

    // Check if user owns the resource (will be used in route handlers)
    req.checkOwnership = {
      userId: req.user._id,
      resourceField
    };
    
    next();
  };
};

module.exports = {
  checkBranch,
  checkCrossBranchAccess,
  requireSuperAdmin,
  checkOwnershipOrPastor
};
