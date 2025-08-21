const { User, Pastor, Sermon, Event, Blog, PrayerRequest } = require('../models');
const AzureBlobService = require('../services/azureBlobService');
const FirebaseService = require('../services/firebaseService');
const { 
  successResponse, 
  errorResponse,
  paginatedResponse 
} = require('../utils/responseFormatter');
const { asyncHandler } = require('../middleware/errorHandler');

// System backup (metadata only)
const createSystemBackup = asyncHandler(async (req, res) => {
  const backupData = {
    timestamp: new Date(),
    version: '1.0.0',
    collections: {}
  };

  try {
    // Export all collection data (excluding sensitive information)
    const [users, pastors, sermons, events, blogs, prayers] = await Promise.all([
      User.find({ isActive: true }).select('-firebaseUID'),
      Pastor.find({ isActive: true }).select('-firebaseUID'),
      Sermon.find({ isActive: true }),
      Event.find({ isActive: true }),
      Blog.find(),
      PrayerRequest.find({ isVisible: true })
    ]);

    backupData.collections = {
      users: users.length,
      pastors: pastors.length,
      sermons: sermons.length,
      events: events.length,
      blogs: blogs.length,
      prayers: prayers.length
    };

    backupData.data = {
      users,
      pastors,
      sermons,
      events,
      blogs,
      prayers
    };

    successResponse(res, 'System backup created successfully', backupData);
  } catch (error) {
    return errorResponse(res, 'Failed to create system backup', 500);
  }
});

// Clean up inactive data
const cleanupInactiveData = asyncHandler(async (req, res) => {
  const { dryRun = true } = req.query;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const cleanupResults = {
    dryRun: dryRun === 'true',
    timestamp: new Date(),
    cleaned: {}
  };

  try {
    if (dryRun === 'true') {
      // Dry run - just count what would be cleaned
      const [rejectedUsers, inactiveSermons, oldEvents, hiddenPrayers] = await Promise.all([
        User.countDocuments({ 
          approvalStatus: 'rejected', 
          updatedAt: { $lt: thirtyDaysAgo } 
        }),
        Sermon.countDocuments({ 
          isActive: false, 
          updatedAt: { $lt: thirtyDaysAgo } 
        }),
        Event.countDocuments({ 
          isActive: false, 
          updatedAt: { $lt: thirtyDaysAgo } 
        }),
        PrayerRequest.countDocuments({ 
          isVisible: false, 
          updatedAt: { $lt: thirtyDaysAgo } 
        })
      ]);

      cleanupResults.wouldClean = {
        rejectedUsers,
        inactiveSermons,
        oldEvents,
        hiddenPrayers,
        total: rejectedUsers + inactiveSermons + oldEvents + hiddenPrayers
      };
    } else {
      // Actual cleanup
      const [rejectedUsers, inactiveSermons, oldEvents, hiddenPrayers] = await Promise.all([
        User.deleteMany({ 
          approvalStatus: 'rejected', 
          updatedAt: { $lt: thirtyDaysAgo } 
        }),
        Sermon.deleteMany({ 
          isActive: false, 
          updatedAt: { $lt: thirtyDaysAgo } 
        }),
        Event.deleteMany({ 
          isActive: false, 
          updatedAt: { $lt: thirtyDaysAgo } 
        }),
        PrayerRequest.deleteMany({ 
          isVisible: false, 
          updatedAt: { $lt: thirtyDaysAgo } 
        })
      ]);

      cleanupResults.cleaned = {
        rejectedUsers: rejectedUsers.deletedCount,
        inactiveSermons: inactiveSermons.deletedCount,
        oldEvents: oldEvents.deletedCount,
        hiddenPrayers: hiddenPrayers.deletedCount,
        total: rejectedUsers.deletedCount + inactiveSermons.deletedCount + 
               oldEvents.deletedCount + hiddenPrayers.deletedCount
      };
    }

    const message = dryRun === 'true' 
      ? 'Cleanup simulation completed'
      : 'System cleanup completed successfully';

    successResponse(res, message, cleanupResults);
  } catch (error) {
    return errorResponse(res, 'Failed to perform system cleanup', 500);
  }
});

// Reset user password (admin function)
const resetUserPassword = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return errorResponse(res, 'Password must be at least 6 characters long', 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    return errorResponse(res, 'User not found', 404);
  }

  if (!user.firebaseUID) {
    return errorResponse(res, 'User does not have Firebase account', 400);
  }

  try {
    // Update password in Firebase
    const result = await FirebaseService.updateUser(user.firebaseUID, {
      password: newPassword
    });

    if (!result.success) {
      return errorResponse(res, 'Failed to reset password', 500);
    }

    successResponse(res, 'Password reset successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to reset password', 500);
  }
});

// Bulk user operations
const bulkUserOperations = asyncHandler(async (req, res) => {
  const { operation, userIds, data } = req.body;

  if (!operation || !Array.isArray(userIds) || userIds.length === 0) {
    return errorResponse(res, 'Invalid operation or user IDs', 400);
  }

  if (userIds.length > 100) {
    return errorResponse(res, 'Cannot process more than 100 users at once', 400);
  }

  let result = {};

  try {
    switch (operation) {
      case 'approve':
        result = await User.updateMany(
          { _id: { $in: userIds }, approvalStatus: 'pending' },
          { 
            approvalStatus: 'approved', 
            approvedBy: req.pastor._id,
            approvedAt: new Date()
          }
        );
        break;

      case 'reject':
        result = await User.updateMany(
          { _id: { $in: userIds }, approvalStatus: 'pending' },
          { 
            approvalStatus: 'rejected', 
            rejectionReason: data?.reason || 'Bulk rejection',
            approvedBy: req.pastor._id,
            approvedAt: new Date()
          }
        );
        break;

      case 'deactivate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: false }
        );
        break;

      case 'activate':
        result = await User.updateMany(
          { _id: { $in: userIds } },
          { isActive: true }
        );
        break;

      default:
        return errorResponse(res, 'Invalid operation', 400);
    }

    successResponse(res, `Bulk ${operation} completed successfully`, {
      operation,
      affected: result.modifiedCount,
      total: userIds.length
    });
  } catch (error) {
    return errorResponse(res, `Failed to perform bulk ${operation}`, 500);
  }
});

// System maintenance mode
const setMaintenanceMode = asyncHandler(async (req, res) => {
  const { enabled, message } = req.body;

  // In a real application, this would update a system configuration
  // For now, we'll just simulate the response
  const maintenanceStatus = {
    enabled: enabled === true,
    message: message || 'System under maintenance',
    setBy: req.pastor.name,
    setAt: new Date()
  };

  // This would typically be stored in a configuration collection or Redis
  successResponse(res, 'Maintenance mode updated successfully', maintenanceStatus);
});

// Get storage usage
const getStorageUsage = asyncHandler(async (req, res) => {
  try {
    // Get sermon storage usage
    const sermonStorage = await Sermon.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalSize: { $sum: '$fileSize' },
          count: { $sum: 1 }
        }
      }
    ]);

    // List files in Azure containers (sample implementation)
    const [sermonFiles, imageFiles] = await Promise.all([
      AzureBlobService.listFiles('sermons'),
      AzureBlobService.listFiles('images')
    ]);

    const storageData = {
      database: {
        sermons: {
          totalSize: sermonStorage[0]?.totalSize || 0,
          count: sermonStorage?.count || 0,
          averageSize: sermonStorage?.count > 0 
            ? Math.round(sermonStorage.totalSize / sermonStorage.count)
            : 0
        }
      },
      azure: {
        sermons: {
          files: sermonFiles.success ? sermonFiles.files.length : 0,
          totalSize: sermonFiles.success 
            ? sermonFiles.files.reduce((sum, file) => sum + (file.contentLength || 0), 0)
            : 0
        },
        images: {
          files: imageFiles.success ? imageFiles.files.length : 0,
          totalSize: imageFiles.success 
            ? imageFiles.files.reduce((sum, file) => sum + (file.contentLength || 0), 0)
            : 0
        }
      },
      summary: {
        totalFiles: (sermonFiles.success ? sermonFiles.files.length : 0) + 
                   (imageFiles.success ? imageFiles.files.length : 0),
        totalSize: (sermonFiles.success 
          ? sermonFiles.files.reduce((sum, file) => sum + (file.contentLength || 0), 0)
          : 0) + 
          (imageFiles.success 
            ? imageFiles.files.reduce((sum, file) => sum + (file.contentLength || 0), 0)
            : 0)
      }
    };

    successResponse(res, 'Storage usage retrieved successfully', storageData);
  } catch (error) {
    return errorResponse(res, 'Failed to retrieve storage usage', 500);
  }
});

module.exports = {
  createSystemBackup,
  cleanupInactiveData,
  resetUserPassword,
  bulkUserOperations,
  setMaintenanceMode,
  getStorageUsage
};
