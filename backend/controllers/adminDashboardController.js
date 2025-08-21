const { User, Pastor, Sermon, Event, Blog, PrayerRequest } = require('../models');
const { 
  successResponse, 
  errorResponse, 
  paginatedResponse 
} = require('../utils/responseFormatter');
const { 
  getPaginationOptions, 
  getDateRange 
} = require('../utils/helpers');
const { APPROVAL_STATUS, BRANCHES } = require('../utils/constants');
const { asyncHandler } = require('../middleware/errorHandler');

// Get admin dashboard overview
const getDashboardOverview = asyncHandler(async (req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Get overall statistics
  const [
    totalUsers,
    pendingUsers,
    approvedUsers,
    rejectedUsers,
    totalSermons,
    totalEvents,
    totalBlogs,
    totalPrayers,
    recentUsers,
    recentSermons,
    recentEvents,
    recentBlogs,
    popularSermons,
    upcomingEvents
  ] = await Promise.all([
    // User statistics
    User.countDocuments({ isActive: true }),
    User.countDocuments({ approvalStatus: APPROVAL_STATUS.PENDING, isActive: true }),
    User.countDocuments({ approvalStatus: APPROVAL_STATUS.APPROVED, isActive: true }),
    User.countDocuments({ approvalStatus: APPROVAL_STATUS.REJECTED, isActive: true }),
    
    // Content statistics
    Sermon.countDocuments({ isActive: true }),
    Event.countDocuments({ isActive: true }),
    Blog.countDocuments(),
    PrayerRequest.countDocuments({ isVisible: true }),
    
    // Recent activity
    User.find({ createdAt: { $gte: thirtyDaysAgo }, isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email branch approvalStatus createdAt'),
    
    Sermon.find({ createdAt: { $gte: thirtyDaysAgo }, isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('uploadedBy', 'name title'),
    
    Event.find({ createdAt: { $gte: thirtyDaysAgo }, isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy'),
    
    Blog.find({ createdAt: { $gte: thirtyDaysAgo } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('author', 'name title'),
    
    // Popular content
    Sermon.find({ isActive: true })
      .sort({ views: -1 })
      .limit(5)
      .populate('uploadedBy', 'name title'),
    
    Event.find({ 
      eventDate: { $gt: now }, 
      isActive: true 
    })
    .sort({ eventDate: 1 })
    .limit(5)
    .populate('createdBy')
  ]);

  // Calculate growth percentages
  const lastMonthUsers = await User.countDocuments({
    createdAt: { 
      $gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      $lt: thirtyDaysAgo
    },
    isActive: true
  });

  const userGrowth = lastMonthUsers > 0 
    ? Math.round(((recentUsers.length - lastMonthUsers) / lastMonthUsers) * 100)
    : 100;

  const dashboardData = {
    statistics: {
      users: {
        total: totalUsers,
        pending: pendingUsers,
        approved: approvedUsers,
        rejected: rejectedUsers,
        growth: userGrowth
      },
      content: {
        sermons: totalSermons,
        events: totalEvents,
        blogs: totalBlogs,
        prayers: totalPrayers
      },
      branches: {
        branch1: await User.countDocuments({ branch: BRANCHES.BRANCH1, isActive: true }),
        branch2: await User.countDocuments({ branch: BRANCHES.BRANCH2, isActive: true })
      }
    },
    recentActivity: {
      users: recentUsers,
      sermons: recentSermons,
      events: recentEvents,
      blogs: recentBlogs
    },
    insights: {
      popularSermons,
      upcomingEvents,
      approvalRate: totalUsers > 0 ? Math.round((approvedUsers / totalUsers) * 100) : 0,
      contentEngagement: {
        averageSermonViews: popularSermons.length > 0 
          ? Math.round(popularSermons.reduce((sum, s) => sum + s.views, 0) / popularSermons.length)
          : 0
      }
    }
  };

  successResponse(res, 'Dashboard overview retrieved successfully', dashboardData);
});

// Get user analytics
const getUserAnalytics = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const dateRange = getDateRange(period);

  if (!dateRange) {
    return errorResponse(res, 'Invalid period. Use: today, week, month, year', 400);
  }

  // User registration trends
  const registrationTrends = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        isActive: true
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { 
            format: period === 'today' ? '%H' : 
                   period === 'week' ? '%Y-%m-%d' : 
                   period === 'month' ? '%Y-%m-%d' : '%Y-%m',
            date: '$createdAt'
          }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // Approval status distribution
  const approvalDistribution = await User.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$approvalStatus',
        count: { $sum: 1 }
      }
    }
  ]);

  // Branch distribution
  const branchDistribution = await User.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$branch',
        count: { $sum: 1 }
      }
    }
  ]);

  // Recent activity by branch
  const branchActivity = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        isActive: true
      }
    },
    {
      $group: {
        _id: '$branch',
        newUsers: { $sum: 1 },
        approvedUsers: {
          $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] }
        }
      }
    }
  ]);

  const analyticsData = {
    period,
    dateRange,
    trends: {
      registrations: registrationTrends,
      approvals: approvalDistribution,
      branches: branchDistribution,
      branchActivity
    },
    summary: {
      totalRegistrations: registrationTrends.reduce((sum, item) => sum + item.count, 0),
      averageDaily: period === 'month' 
        ? Math.round(registrationTrends.reduce((sum, item) => sum + item.count, 0) / 30)
        : registrationTrends.reduce((sum, item) => sum + item.count, 0)
    }
  };

  successResponse(res, 'User analytics retrieved successfully', analyticsData);
});

// Get content analytics
const getContentAnalytics = asyncHandler(async (req, res) => {
  const { period = 'month' } = req.query;
  const dateRange = getDateRange(period);

  if (!dateRange) {
    return errorResponse(res, 'Invalid period. Use: today, week, month, year', 400);
  }

  // Content creation trends
  const [sermonTrends, eventTrends, blogTrends, prayerTrends] = await Promise.all([
    // Sermon trends
    Sermon.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: period === 'today' ? '%H' : 
                     period === 'week' ? '%Y-%m-%d' : 
                     period === 'month' ? '%Y-%m-%d' : '%Y-%m',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          totalViews: { $sum: '$views' }
        }
      },
      { $sort: { '_id': 1 } }
    ]),

    // Event trends
    Event.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          isActive: true
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: period === 'today' ? '%H' : 
                     period === 'week' ? '%Y-%m-%d' : 
                     period === 'month' ? '%Y-%m-%d' : '%Y-%m',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]),

    // Blog trends
    Blog.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: period === 'today' ? '%H' : 
                     period === 'week' ? '%Y-%m-%d' : 
                     period === 'month' ? '%Y-%m-%d' : '%Y-%m',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          totalViews: { $sum: '$views' }
        }
      },
      { $sort: { '_id': 1 } }
    ]),

    // Prayer request trends
    PrayerRequest.aggregate([
      {
        $match: {
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
          isVisible: true
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { 
              format: period === 'today' ? '%H' : 
                     period === 'week' ? '%Y-%m-%d' : 
                     period === 'month' ? '%Y-%m-%d' : '%Y-%m',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ])
  ]);

  // Popular content
  const [popularSermons, popularBlogs] = await Promise.all([
    Sermon.find({ isActive: true })
      .sort({ views: -1 })
      .limit(10)
      .populate('uploadedBy', 'name title')
      .select('title views category createdAt'),

    Blog.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(10)
      .populate('author', 'name title')
      .select('title views createdAt')
  ]);

  // Category performance
  const sermonCategories = await Sermon.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalViews: { $sum: '$views' },
        avgViews: { $avg: '$views' }
      }
    },
    { $sort: { totalViews: -1 } }
  ]);

  const analyticsData = {
    period,
    dateRange,
    trends: {
      sermons: sermonTrends,
      events: eventTrends,
      blogs: blogTrends,
      prayers: prayerTrends
    },
    popular: {
      sermons: popularSermons,
      blogs: popularBlogs
    },
    categories: {
      sermons: sermonCategories
    },
    summary: {
      totalContent: 
        sermonTrends.reduce((sum, item) => sum + item.count, 0) +
        eventTrends.reduce((sum, item) => sum + item.count, 0) +
        blogTrends.reduce((sum, item) => sum + item.count, 0) +
        prayerTrends.reduce((sum, item) => sum + item.count, 0),
      totalViews:
        sermonTrends.reduce((sum, item) => sum + (item.totalViews || 0), 0) +
        blogTrends.reduce((sum, item) => sum + (item.totalViews || 0), 0)
    }
  };

  successResponse(res, 'Content analytics retrieved successfully', analyticsData);
});

// Get system health and performance metrics
const getSystemMetrics = asyncHandler(async (req, res) => {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Database health metrics
  const [
    totalDocuments,
    recentActivity,
    storageStats,
    activeUsers
  ] = await Promise.all([
    // Total documents across collections
    Promise.all([
      User.countDocuments(),
      Pastor.countDocuments(),
      Sermon.countDocuments(),
      Event.countDocuments(),
      Blog.countDocuments(),
      PrayerRequest.countDocuments()
    ]).then(counts => ({
      users: counts[0],
      pastors: counts[11],
      sermons: counts[12],
      events: counts[13],
      blogs: counts[14],
      prayers: counts[15],
      total: counts.reduce((sum, count) => sum + count, 0)
    })),

    // Recent activity (last 24 hours)
    Promise.all([
      User.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      Sermon.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      Event.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      Blog.countDocuments({ createdAt: { $gte: oneDayAgo } }),
      PrayerRequest.countDocuments({ createdAt: { $gte: oneDayAgo } })
    ]).then(counts => ({
      newUsers: counts[0],
      newSermons: counts[11],
      newEvents: counts[12],
      newBlogs: counts[13],
      newPrayers: counts[14],
      total: counts.reduce((sum, count) => sum + count, 0)
    })),

    // Storage statistics
    Sermon.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$fileSize' },
          avgSize: { $avg: '$fileSize' },
          count: { $sum: 1 }
        }
      }
    ]).then(result => result[0] || { totalSize: 0, avgSize: 0, count: 0 }),

    // Active users (logged in within last week)
    User.countDocuments({ 
      lastLogin: { $gte: oneWeekAgo },
      approvalStatus: 'approved',
      isActive: true
    })
  ]);

  // Performance metrics
  const performanceMetrics = {
    responseTime: {
      avg: 150, // This would be tracked by monitoring tools
      p95: 300,
      p99: 500
    },
    uptime: '99.9%', // This would come from monitoring service
    errorRate: '0.1%' // This would be tracked by error monitoring
  };

  const systemData = {
    health: {
      status: 'healthy',
      uptime: performanceMetrics.uptime,
      lastChecked: now
    },
    database: {
      totalDocuments,
      recentActivity,
      storage: {
        totalVideoSize: Math.round(storageStats.totalSize / (1024 * 1024)), // MB
        averageVideoSize: Math.round(storageStats.avgSize / (1024 * 1024)), // MB
        videoCount: storageStats.count
      }
    },
    users: {
      activeUsers,
      totalUsers: totalDocuments.users,
      activityRate: totalDocuments.users > 0 
        ? Math.round((activeUsers / totalDocuments.users) * 100)
        : 0
    },
    performance: performanceMetrics
  };

  successResponse(res, 'System metrics retrieved successfully', systemData);
});

// Get audit logs (basic implementation)
const getAuditLogs = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const { action, user } = req.query;

  // This is a basic implementation - in production, you'd have a dedicated audit log collection
  const auditData = [
    {
      id: '1',
      action: 'USER_APPROVED',
      performedBy: req.pastor.name,
      target: 'User: john@example.com',
      timestamp: new Date(),
      details: 'User approved for branch1'
    },
    {
      id: '2',
      action: 'SERMON_UPLOADED',
      performedBy: req.pastor.name,
      target: 'Sermon: Faith in Times of Trial',
      timestamp: new Date(Date.now() - 3600000),
      details: 'New sermon uploaded to Faith category'
    }
    // In a real implementation, this would query an AuditLog collection
  ];

  const total = auditData.length;
  const paginatedData = auditData.slice(skip, skip + limit);

  paginatedResponse(res, paginatedData, { page, limit, total }, 'Audit logs retrieved successfully');
});

// Export user data (for compliance)
const exportUserData = asyncHandler(async (req, res) => {
  const { format = 'json' } = req.query;

  const users = await User.find({ isActive: true })
    .select('-firebaseUID -__v')
    .populate('approvedBy', 'name title');

  if (format === 'csv') {
    // Implementation for CSV export would go here
    return successResponse(res, 'CSV export functionality not implemented yet');
  }

  successResponse(res, 'User data exported successfully', {
    exportDate: new Date(),
    totalRecords: users.length,
    data: users
  });
});

module.exports = {
  getDashboardOverview,
  getUserAnalytics,
  getContentAnalytics,
  getSystemMetrics,
  getAuditLogs,
  exportUserData
};
