const express = require('express');
const {
  uploadSermon,
  getAllSermons,
  getSermonsByCategory,
  getSermonCategories,
  getSermonById,
  updateSermon,
  deleteSermon,
  getPopularSermons,
  toggleDownloadable
} = require('../controllers/sermonController');

const { authenticateUser, authenticatePastor, requirePermission } = require('../middleware/auth');
const { uploadVideo, validateFileUpload } = require('../middleware/fileUpload');
const { uploadLimit } = require('../middleware/security');
const { 
  validateSermon,
  validateObjectId,
  validatePagination,
  validateSearch
} = require('../middleware/validation');

const router = express.Router();

// Public routes (accessible to authenticated users)
router.get('/', [authenticateUser, validatePagination, validateSearch], getAllSermons);
router.get('/categories', authenticateUser, getSermonCategories);
router.get('/popular', [authenticateUser, validatePagination], getPopularSermons);
router.get('/category/:category', [authenticateUser, validatePagination], getSermonsByCategory);
router.get('/:id', [authenticateUser, validateObjectId], getSermonById);

// Pastor-only routes
router.use(authenticatePastor);
router.use(requirePermission('manageSermons'));

router.post('/', [
  uploadLimit,
  uploadVideo.single('video'),
  validateFileUpload,
  validateSermon
], uploadSermon);

router.put('/:id', [validateObjectId, validateSermon], updateSermon);
router.delete('/:id', validateObjectId, deleteSermon);
router.patch('/:id/toggle-download', validateObjectId, toggleDownloadable);

module.exports = router;
