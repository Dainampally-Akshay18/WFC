const { Sermon } = require('../models');
const AzureBlobService = require('../services/azureBlobService');
const { 
  successResponse, 
  errorResponse, 
  notFoundResponse,
  paginatedResponse 
} = require('../utils/responseFormatter');
const { 
  getPaginationOptions, 
  buildSearchQuery, 
  generateFileName,
  formatDuration,
  formatFileSize
} = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

// Upload sermon with video
const uploadSermon = asyncHandler(async (req, res) => {
  const { title, description, category, tags, downloadable } = req.body;
  const pastorId = req.pastor._id;

  if (!req.fileMetadata) {
    return errorResponse(res, 'Video file is required', 400);
  }

  const { fileName, mimeType, buffer, size } = req.fileMetadata;

  // Upload video to Azure Blob Storage
  const uploadResult = await AzureBlobService.uploadFile(
    'sermons',
    `videos/${fileName}`,
    buffer,
    mimeType
  );

  if (!uploadResult.success) {
    return errorResponse(res, 'Failed to upload sermon video', 500);
  }

  // Create sermon record
  const sermon = await Sermon.create({
    title,
    description,
    category,
    videoURL: uploadResult.url,
    fileSize: size,
    tags: tags ? JSON.parse(tags) : [],
    downloadable: downloadable === 'true',
    uploadedBy: pastorId
  });

  await sermon.populate('uploadedBy', 'name title');

  successResponse(res, 'Sermon uploaded successfully', {
    sermon,
    fileInfo: {
      size: formatFileSize(size),
      url: uploadResult.url
    }
  }, 201);
});

// Get all sermons with filtering and pagination
const getAllSermons = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationOptions(req.query);
  const { category, search, pastor } = req.query;

  let query = { isActive: true };

  // Filter by category
  if (category) {
    query.category = new RegExp(category, 'i');
  }

  // Filter by pastor
  if (pastor) {
    query.uploadedBy = pastor;
  }

  // Search functionality
  if (search) {
    const searchQuery = buildSearchQuery(search, ['title', 'description', 'category', 'tags']);
    query = { ...query, ...searchQuery };
  }

  const [sermons, total] = await Promise.all([
    Sermon.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name title'),
    Sermon.countDocuments(query)
  ]);

  // Add formatted data
  const formattedSermons = sermons.map(sermon => ({
    ...sermon.toObject(),
    formattedDuration: sermon.formattedDuration,
    formattedFileSize: sermon.formattedFileSize
  }));

  paginatedResponse(res, formattedSermons, { page, limit, total }, 'Sermons retrieved successfully');
});

// Get sermons by category
const getSermonsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page, limit, skip, sort } = getPaginationOptions(req.query);

  const query = { category: new RegExp(category, 'i'), isActive: true };

  const [sermons, total] = await Promise.all([
    Sermon.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('uploadedBy', 'name title'),
    Sermon.countDocuments(query)
  ]);

  paginatedResponse(res, sermons, { page, limit, total }, `Sermons in category "${category}" retrieved successfully`);
});

// Get all sermon categories
const getSermonCategories = asyncHandler(async (req, res) => {
  const categories = await Sermon.getCategories();
  
  // Get count for each category
  const categoriesWithCount = await Promise.all(
    categories.map(async (category) => {
      const count = await Sermon.countDocuments({ category, isActive: true });
      return { category, count };
    })
  );

  successResponse(res, 'Sermon categories retrieved successfully', categoriesWithCount);
});

// Get single sermon by ID
const getSermonById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sermon = await Sermon.findById(id)
    .populate('uploadedBy', 'name title bio');

  if (!sermon) {
    return notFoundResponse(res, 'Sermon');
  }

  // Increment view count
  await sermon.incrementViews();

  const sermonData = {
    ...sermon.toObject(),
    formattedDuration: sermon.formattedDuration,
    formattedFileSize: sermon.formattedFileSize
  };

  successResponse(res, 'Sermon retrieved successfully', sermonData);
});

// Update sermon
const updateSermon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, category, tags, downloadable } = req.body;

  const sermon = await Sermon.findById(id);

  if (!sermon) {
    return notFoundResponse(res, 'Sermon');
  }

  // Update fields
  if (title) sermon.title = title;
  if (description) sermon.description = description;
  if (category) sermon.category = category;
  if (tags) sermon.tags = Array.isArray(tags) ? tags : JSON.parse(tags);
  if (downloadable !== undefined) sermon.downloadable = downloadable === 'true';

  await sermon.save();
  await sermon.populate('uploadedBy', 'name title');

  successResponse(res, 'Sermon updated successfully', sermon);
});

// Delete sermon
const deleteSermon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sermon = await Sermon.findById(id);

  if (!sermon) {
    return notFoundResponse(res, 'Sermon');
  }

  // Extract file name from URL for deletion
  const videoUrl = sermon.videoURL;
  const urlParts = new URL(videoUrl);
  const fileName = urlParts.pathname.substring(1); // Remove leading slash

  // Delete video from Azure Blob Storage
  const deleteResult = await AzureBlobService.deleteFile('sermons', fileName);

  if (!deleteResult.success) {
    console.error('Failed to delete video file:', deleteResult.error);
    // Continue with database deletion even if file deletion fails
  }

  // Soft delete (mark as inactive)
  sermon.isActive = false;
  await sermon.save();

  successResponse(res, 'Sermon deleted successfully');
});

// Get popular sermons
const getPopularSermons = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  const sermons = await Sermon.getPopular(parseInt(limit));

  successResponse(res, 'Popular sermons retrieved successfully', sermons);
});

// Toggle sermon downloadable status
const toggleDownloadable = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const sermon = await Sermon.findById(id);

  if (!sermon) {
    return notFoundResponse(res, 'Sermon');
  }

  sermon.downloadable = !sermon.downloadable;
  await sermon.save();

  successResponse(res, `Sermon ${sermon.downloadable ? 'enabled' : 'disabled'} for download`, {
    downloadable: sermon.downloadable
  });
});

module.exports = {
  uploadSermon,
  getAllSermons,
  getSermonsByCategory,
  getSermonCategories,
  getSermonById,
  updateSermon,
  deleteSermon,
  getPopularSermons,
  toggleDownloadable
};
