const { Event, PrayerRequest } = require('../models');

// Filter events based on user branch
const filterEventsByBranch = (req, res, next) => {
  if (req.userType === 'pastor') {
    return next(); // Pastors see all events
  }

  const userBranch = req.user.branch;
  
  // Add branch filter to query
  req.branchFilter = {
    $or: [
      { branch: userBranch },
      { branch: 'both' },
      { branch: { $ne: userBranch }, crossBranchApproved: true }
    ]
  };

  next();
};

// Filter prayer requests (all users can see all requests)
const filterPrayersByBranch = (req, res, next) => {
  // Prayer requests are visible to all branches
  // but we track submitter branch for reference
  req.userBranch = req.userType === 'user' ? req.user.branch : null;
  next();
};

// General branch context middleware
const setBranchContext = (req, res, next) => {
  req.branchContext = {
    userType: req.userType,
    userBranch: req.userType === 'user' ? req.user.branch : null,
    isPastor: req.userType === 'pastor'
  };
  next();
};

// Filter content by branch for listings
const applyBranchFilter = (baseQuery, req) => {
  if (req.userType === 'pastor') {
    return baseQuery; // Pastors see everything
  }

  if (req.branchFilter) {
    return { ...baseQuery, ...req.branchFilter };
  }

  // Default user branch filter
  const userBranch = req.user.branch;
  return {
    ...baseQuery,
    $or: [
      { branch: userBranch },
      { branch: 'both' },
      { branch: { $ne: userBranch }, crossBranchApproved: true }
    ]
  };
};

module.exports = {
  filterEventsByBranch,
  filterPrayersByBranch,
  setBranchContext,
  applyBranchFilter
};
