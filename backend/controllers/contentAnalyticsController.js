const { Sermon, Event, Blog, PrayerRequest } = require('../models');
const { 
  successResponse, 
  paginatedResponse 
} = require('../utils/responseFormatter');
const { 
  getPaginationOptions, 
  getDateRange 
} = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

// Get detailed sermon analytics
const getSermonAnalytics = asyncHandler(async (req, res) => {
  const { period = 'month', category } = req.query;
  const dateRange = getDateRange(period);

  let matchQuery = { isActive: true };
  if (dateRange) {
    matchQuery.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
  }
  if (category) {
    matchQuery.category = new RegExp(category, 'i');
  }

  // View analytics
  const viewAnalytics = await Sermon.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalViews: { $sum: '$views' },
        avgViews: { $avg: '$views' },
        totalSermons: { $sum: 1 },
        totalDuration: { $sum: '$duration' },
        totalFileSize: { $sum: '$fileSize' }
      }
    }
  ]);

  // Category performance
  const categoryPerformance = await Sermon.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalViews: { $sum: '$views' },
        avgViews: { $avg: '$views' },
        totalDuration: { $sum: '$duration' }
      }
    },
    { $sort: { totalViews: -1 } }
  ]);

  // Top performing sermons
  const topSermons = await Sermon.find({ isActive: true })
    .sort({ views: -1 })
    .limit(10)
    .populate('uploadedBy', 'name title')
    .select('title views category duration createdAt');

  // Upload trends
  const uploadTrends = await Sermon.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          $dateToString: { 
            format: period === 'week' ? '%Y-%m-%d' : '%Y-%m',
            date: '$createdAt'
          }
        },
        count: { $sum: 1 },
        totalViews: { $sum: '$views' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  const analytics = {
    overview: viewAnalytics[0] || {
      totalViews: 0,
      avgViews: 0,
      totalSermons: 0,
      totalDuration: 0,
      totalFileSize: 0
    },
    categories: categoryPerformance,
    topPerforming: topSermons,
    trends: uploadTrends,
    insights: {
      mostPopularCategory: categoryPerformance?._id || 'N/A',
      averageViewsPerSermon: viewAnalytics?.avgViews || 0,
      totalStorageUsed: Math.round((viewAnalytics?.totalFileSize || 0) / (1024 * 1024 * 1024 * 1024)), // GB
      engagementRate: viewAnalytics?.totalSermons > 0 
        ? Math.round((viewAnalytics?.totalViews / viewAnalytics?.totalSermons) * 100) / 100
        : 0
    }
  };

  successResponse(res, 'Sermon analytics retrieved successfully', analytics);
});

// Get event analytics
const getEventAnalytics = asyncHandler(async (req, res) => {
  const { period = 'month', branch } = req.query;
  const dateRange = getDateRange(period);

  let matchQuery = { isActive: true };
  if (dateRange) {
    matchQuery.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
  }
  if (branch && ['branch1', 'branch2'].includes(branch)) {
    matchQuery.branch = branch;
  }

  // Event statistics
  const eventStats = await Event.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalEvents: { $sum: 1 },
        totalAttendees: { $sum: { $size: '$attendees' } },
        avgAttendeesPerEvent: { $avg: { $size: '$attendees' } }
      }
    }
  ]);

  // Branch distribution
  const branchDistribution = await Event.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$branch',
        count: { $sum: 1 },
        totalAttendees: { $sum: { $size: '$attendees' } }
      }
    }
  ]);

  // Upcoming vs past events
  const now = new Date();
  const eventsByTime = await Event.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: {
          $cond: [
            { $gt: ['$eventDate', now] },
            'upcoming',
            'past'
          ]
        },
        count: { $sum: 1 }
      }
    }
  ]);

  // Monthly event trends
  const monthlyTrends = await Event.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$createdAt' }
        },
        count: { $sum: 1 },
        totalAttendees: { $sum: { $size: '$attendees' } }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // Cross-branch sharing statistics
  const crossBranchStats = await Event.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        requested: { $sum: { $cond: ['$crossBranchRequested', 1, 0] } },
        approved: { $sum: { $cond: ['$crossBranchApproved', 1, 0] } }
      }
    }
  ]);

  const analytics = {
    overview: eventStats[0] || {
      totalEvents: 0,
      totalAttendees: 0,
      avgAttendeesPerEvent: 0
    },
    distribution: {
      branches: branchDistribution,
      timeStatus: eventsByTime
    },
    trends: monthlyTrends,
    crossBranch: crossBranchStats || { requested: 0, approved: 0 },
    insights: {
      approvalRate: crossBranchStats?.requested > 0 
        ? Math.round((crossBranchStats?.approved / crossBranchStats?.requested) * 100)
        : 0,
      averageAttendance: eventStats?.avgAttendeesPerEvent || 0
    }
  };

  successResponse(res, 'Event analytics retrieved successfully', analytics);
});

// Get blog analytics
const getBlogAnalytics = asyncHandler(async (req, res) => {
  const { period = 'month', author } = req.query;
  const dateRange = getDateRange(period);

  let matchQuery = {};
  if (dateRange) {
    matchQuery.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
  }
  if (author) {
    matchQuery.author = author;
  }

  // Blog statistics
  const blogStats = await Blog.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalBlogs: { $sum: 1 },
        totalViews: { $sum: '$views' },
        avgViews: { $avg: '$views' },
        avgReadTime: { $avg: '$readTime' },
        publishedBlogs: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } },
        draftBlogs: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } }
      }
    }
  ]);

  // Author performance
  const authorPerformance = await Blog.aggregate([
    { $match: { status: 'published' } },
    {
      $group: {
        _id: '$author',
        blogCount: { $sum: 1 },
        totalViews: { $sum: '$views' },
        avgViews: { $avg: '$views' }
      }
    },
    { $sort: { totalViews: -1 } },
    {
      $lookup: {
        from: 'pastors',
        localField: '_id',
        foreignField: '_id',
        as: 'authorInfo'
      }
    },
    {
      $project: {
        blogCount: 1,
        totalViews: 1,
        avgViews: 1,
        authorName: { $arrayElemAt: ['$authorInfo.name', 0] }
      }
    }
  ]);

  // Top performing blogs
  const topBlogs = await Blog.find({ status: 'published' })
    .sort({ views: -1 })
    .limit(10)
    .populate('author', 'name title')
    .select('title views readTime createdAt publishDate');

  // Publishing trends
  const publishingTrends = await Blog.aggregate([
    { $match: { status: 'published', ...matchQuery } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$publishDate' }
        },
        count: { $sum: 1 },
        totalViews: { $sum: '$views' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  const analytics = {
    overview: blogStats[0] || {
      totalBlogs: 0,
      totalViews: 0,
      avgViews: 0,
      avgReadTime: 0,
      publishedBlogs: 0,
      draftBlogs: 0
    },
    authors: authorPerformance,
    topPerforming: topBlogs,
    trends: publishingTrends,
    insights: {
      publishRate: blogStats?.totalBlogs > 0 
        ? Math.round((blogStats?.publishedBlogs / blogStats?.totalBlogs) * 100)
        : 0,
      averageEngagement: blogStats?.avgViews || 0
    }
  };

  successResponse(res, 'Blog analytics retrieved successfully', analytics);
});

// Get prayer request analytics
const getPrayerAnalytics = asyncHandler(async (req, res) => {
  const { period = 'month', branch } = req.query;
  const dateRange = getDateRange(period);

  let matchQuery = { isVisible: true };
  if (dateRange) {
    matchQuery.createdAt = { $gte: dateRange.start, $lte: dateRange.end };
  }
  if (branch && ['branch1', 'branch2'].includes(branch)) {
    matchQuery.submitterBranch = branch;
  }

  // Prayer statistics
  const prayerStats = await PrayerRequest.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalPrayers: { $sum: 1 },
        totalPrayerCount: { $sum: '$prayerCount' },
        avgPrayerCount: { $avg: '$prayerCount' },
        activePrayers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        answeredPrayers: { $sum: { $cond: [{ $eq: ['$status', 'answered'] }, 1, 0] } },
        anonymousPrayers: { $sum: { $cond: ['$isAnonymous', 1, 0] } }
      }
    }
  ]);

  // Branch distribution
  const branchDistribution = await PrayerRequest.aggregate([
    { $match: { isVisible: true } },
    {
      $group: {
        _id: '$submitterBranch',
        count: { $sum: 1 },
        totalPrayerCount: { $sum: '$prayerCount' }
      }
    }
  ]);

  // Priority distribution
  const priorityDistribution = await PrayerRequest.aggregate([
    { $match: { isVisible: true, status: 'active' } },
    {
      $group: {
        _id: '$priority',
        count: { $sum: 1 }
      }
    }
  ]);

  // Monthly trends
  const monthlyTrends = await PrayerRequest.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m', date: '$createdAt' }
        },
        submissions: { $sum: 1 },
        totalPrayers: { $sum: '$prayerCount' }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  const analytics = {
    overview: prayerStats[0] || {
      totalPrayers: 0,
      totalPrayerCount: 0,
      avgPrayerCount: 0,
      activePrayers: 0,
      answeredPrayers: 0,
      anonymousPrayers: 0
    },
    distribution: {
      branches: branchDistribution,
      priorities: priorityDistribution
    },
    trends: monthlyTrends,
    insights: {
      answerRate: prayerStats[0]?.totalPrayers > 0 
        ? Math.round((prayerStats?.answeredPrayers / prayerStats?.totalPrayers) * 100)
        : 0,
      anonymousRate: prayerStats?.totalPrayers > 0 
        ? Math.round((prayerStats?.anonymousPrayers / prayerStats?.totalPrayers) * 100)
        : 0,
      communityEngagement: prayerStats?.avgPrayerCount || 0
    }
  };

  successResponse(res, 'Prayer analytics retrieved successfully', analytics);
});

module.exports = {
  getSermonAnalytics,
  getEventAnalytics,
  getBlogAnalytics,
  getPrayerAnalytics
};
