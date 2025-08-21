const express = require('express');
const { authenticateUser } = require('../middleware/auth');
const { uploadImage, validateFileUpload } = require('../middleware/fileUpload');
const { generateFileName } = require('../middleware/fileUpload');
const AzureBlobService = require('../services/azureBlobService');
const { User } = require('../models');
const { successResponse, errorResponse } = require('../utils/responseFormatter');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Upload profile picture
router.post('/profile-picture', 
  authenticateUser,
  uploadImage.single('profilePicture'),
  validateFileUpload,
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { fileName, mimeType, buffer } = req.fileMetadata;

    // Upload to Azure Blob Storage
    const uploadResult = await AzureBlobService.uploadFile(
      'images',
      `profiles/${fileName}`,
      buffer,
      mimeType
    );

    if (!uploadResult.success) {
      return errorResponse(res, 'Failed to upload image', 500);
    }

    // Update user profile with new image URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: uploadResult.url },
      { new: true }
    ).select('-firebaseUID');

    successResponse(res, 'Profile picture uploaded successfully', {
      profilePicture: uploadResult.url,
      user: updatedUser
    });
  })
);

module.exports = router;
