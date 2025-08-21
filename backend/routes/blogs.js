const express = require('express');
const {
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
} = require('../controllers/blogController');

const { authenticateUser, authenticatePastor, requirePermission } = require('../middleware/auth');
const { uploadImage, validateFileUpload } = require('../middleware/fileUpload');
const { uploadLimit } = require('../middleware/security');
const { 
  validateBlog,
  validateObjectId,
  validatePagination,
  validateSearch
} = require('../middleware/validation');

const router = express.Router();

// Public routes (published blogs only)
router.get('/published', [authenticateUser, validatePagination, validateSearch], getPublishedBlogs);
router.get('/search', [authenticateUser, validateSearch], searchBlogs);
router.get('/:id', authenticateUser, getBlogById);

// Pastor-only routes
router.use(authenticatePastor);
router.use(requirePermission('manageContent'));

router.get('/', [validatePagination, validateSearch], getAllBlogs);
router.post('/', validateBlog, createBlog);
router.put('/:id', [validateObjectId, validateBlog], updateBlog);
router.delete('/:id', validateObjectId, deleteBlog);
router.patch('/:id/publish', validateObjectId, publishBlog);

// Image upload
router.post('/upload-featured-image', [
  uploadLimit,
  uploadImage.single('featuredImage'),
  validateFileUpload
], uploadFeaturedImage);

// Statistics
router.get('/stats/overview', getBlogStatistics);

module.exports = router;
