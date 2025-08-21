const { Blog } = require('../models');
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
  generateSlug,
  calculateReadTime 
} = require('../utils/helpers');
const { asyncHandler } = require('../middleware/errorHandler');

// Create new blog post
const createBlog = asyncHandler(async (req, res) => {
  const { title, content, excerpt, tags, status } = req.body;
  const authorId = req.pastor._id;

  // Calculate read time
  const readTime = calculateReadTime(content);

  const blog = await Blog.create({
    title,
    content,
    excerpt,
    tags: tags || [],
    status: status || 'draft',
    author: authorId,
    readTime
  });

  await blog.populate('author', 'name title');

  successResponse(res, 'Blog post created successfully', blog, 201);
});

// Get all published blogs (public)
const getPublishedBlogs = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationOptions(req.query);
  const { search, tag } = req.query;

  let query = { status: 'published' };

  // Search functionality
  if (search) {
    const searchQuery = buildSearchQuery(search, ['title', 'excerpt', 'tags']);
    query = { ...query, ...searchQuery };
  }

  // Filter by tag
  if (tag) {
    query.tags = { $in: [tag] };
  }

  const [blogs, total] = await Promise.all([
    Blog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name title'),
    Blog.countDocuments(query)
  ]);

  // Add formatted data
  const blogsWithMeta = blogs.map(blog => ({
    ...blog.toObject(),
    slug: blog.slug
  }));

  paginatedResponse(res, blogsWithMeta, { page, limit, total }, 'Published blogs retrieved successfully');
});

// Get all blogs for pastor (including drafts)
const getAllBlogs = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = getPaginationOptions(req.query);
  const { status, search, author } = req.query;

  let query = {};

  // Filter by status
  if (status) {
    query.status = status;
  }

  // Filter by author
  if (author) {
    query.author = author;
  }

  // Search functionality
  if (search) {
    const searchQuery = buildSearchQuery(search, ['title', 'excerpt', 'tags']);
    query = { ...query, ...searchQuery };
  }

  const [blogs, total] = await Promise.all([
    Blog.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('author', 'name title'),
    Blog.countDocuments(query)
  ]);

  paginatedResponse(res, blogs, { page, limit, total }, 'Blogs retrieved successfully');
});

// Get single blog by ID
const getBlogById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id)
    .populate('author', 'name title bio');

  if (!blog) {
    return notFoundResponse(res, 'Blog post');
  }

  // Only allow published blogs for non-pastors
  if (req.userType !== 'pastor' && blog.status !== 'published') {
    return notFoundResponse(res, 'Blog post');
  }

  // Increment view count for published blogs
  if (blog.status === 'published') {
    await blog.incrementViews();
  }

  const blogData = {
    ...blog.toObject(),
    slug: blog.slug
  };

  successResponse(res, 'Blog post retrieved successfully', blogData);
});

// Update blog post
const updateBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, content, excerpt, tags, status, featuredImage } = req.body;

  const blog = await Blog.findById(id);

  if (!blog) {
    return notFoundResponse(res, 'Blog post');
  }

  // Check if pastor owns this blog or is admin
  if (!blog.author.equals(req.pastor._id) && !req.pastor.isSuperAdmin()) {
    return errorResponse(res, 'Not authorized to edit this blog post', 403);
  }

  // Update fields
  if (title) blog.title = title;
  if (content) {
    blog.content = content;
    blog.readTime = calculateReadTime(content);
  }
  if (excerpt) blog.excerpt = excerpt;
  if (tags) blog.tags = tags;
  if (status) blog.status = status;
  if (featuredImage) blog.featuredImage = featuredImage;

  // Update publish date if publishing for first time
  if (status === 'published' && blog.status !== 'published') {
    blog.publishDate = new Date();
  }

  await blog.save();
  await blog.populate('author', 'name title');

  successResponse(res, 'Blog post updated successfully', blog);
});

// Delete blog post
const deleteBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);

  if (!blog) {
    return notFoundResponse(res, 'Blog post');
  }

  // Check permissions
  if (!blog.author.equals(req.pastor._id) && !req.pastor.isSuperAdmin()) {
    return errorResponse(res, 'Not authorized to delete this blog post', 403);
  }

  // Delete featured image from Azure if exists
  if (blog.featuredImage) {
    const urlParts = new URL(blog.featuredImage);
    const fileName = urlParts.pathname.substring(1);
    await AzureBlobService.deleteFile('images', fileName);
  }

  await blog.deleteOne();

  successResponse(res, 'Blog post deleted successfully');
});

// Publish blog post
const publishBlog = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const blog = await Blog.findById(id);

  if (!blog) {
    return notFoundResponse(res, 'Blog post');
  }

  if (!blog.author.equals(req.pastor._id) && !req.pastor.isSuperAdmin()) {
    return errorResponse(res, 'Not authorized to publish this blog post', 403);
  }

  await blog.publish();
  await blog.populate('author', 'name title');

  successResponse(res, 'Blog post published successfully', blog);
});

// Upload featured image for blog
const uploadFeaturedImage = asyncHandler(async (req, res) => {
  if (!req.fileMetadata) {
    return errorResponse(res, 'Image file is required', 400);
  }

  const { fileName, mimeType, buffer } = req.fileMetadata;

  // Upload image to Azure Blob Storage
  const uploadResult = await AzureBlobService.uploadFile(
    'images',
    `blog-featured/${fileName}`,
    buffer,
    mimeType
  );

  if (!uploadResult.success) {
    return errorResponse(res, 'Failed to upload featured image', 500);
  }

  successResponse(res, 'Featured image uploaded successfully', {
    imageUrl: uploadResult.url
  });
});

// Get blog statistics
const getBlogStatistics = asyncHandler(async (req, res) => {
  const [
    totalBlogs,
    publishedBlogs,
    draftBlogs,
    totalViews
  ] = await Promise.all([
    Blog.countDocuments(),
    Blog.countDocuments({ status: 'published' }),
    Blog.countDocuments({ status: 'draft' }),
    Blog.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ])
  ]);

  const stats = {
    totalBlogs,
    publishedBlogs,
    draftBlogs,
    totalViews: totalViews[0]?.totalViews || 0
  };

  successResponse(res, 'Blog statistics retrieved successfully', stats);
});

// Search blogs
const searchBlogs = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10 } = req.query;

  if (!q) {
    return errorResponse(res, 'Search query is required', 400);
  }

  const { skip } = getPaginationOptions({ page, limit });

  const [blogs, total] = await Promise.all([
    Blog.search(q)
      .skip(skip)
      .limit(parseInt(limit)),
    Blog.search(q).countDocuments()
  ]);

  paginatedResponse(res, blogs, { page: parseInt(page), limit: parseInt(limit), total }, 'Search results retrieved successfully');
});

module.exports = {
  createBlog,
  getPublishedBlogs,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  publishBlog,
  uploadFeaturedImage,
  getBlogStatistics,
  searchBlogs
};
