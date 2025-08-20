const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// File type configurations
const fileTypes = {
  image: {
    mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  },
  video: {
    mimeTypes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    maxSize: 500 * 1024 * 1024, // 500MB
    extensions: ['.mp4', '.mpeg', '.mov', '.avi', '.webm']
  },
  document: {
    mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    maxSize: 10 * 1024 * 1024, // 10MB
    extensions: ['.pdf', '.doc', '.docx']
  }
};

// Storage configuration (memory storage for Azure upload)
const storage = multer.memoryStorage();

// File filter function
const createFileFilter = (allowedType) => {
  return (req, file, cb) => {
    const config = fileTypes[allowedType];
    
    if (!config) {
      return cb(new Error(`Invalid file type configuration: ${allowedType}`), false);
    }

    // Check MIME type
    if (!config.mimeTypes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type. Allowed types: ${config.mimeTypes.join(', ')}`), false);
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!config.extensions.includes(ext)) {
      return cb(new Error(`Invalid file extension. Allowed extensions: ${config.extensions.join(', ')}`), false);
    }

    cb(null, true);
  };
};

// Generate unique filename
const generateFileName = (originalname) => {
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(6).toString('hex');
  const extension = path.extname(originalname);
  return `${timestamp}_${randomBytes}${extension}`;
};

// Create upload middleware for different file types
const createUploadMiddleware = (fieldName, allowedType, maxCount = 1) => {
  const config = fileTypes[allowedType];
  
  return multer({
    storage: storage,
    limits: {
      fileSize: config.maxSize,
      files: maxCount
    },
    fileFilter: createFileFilter(allowedType)
  });
};

// Specific upload middlewares
const uploadImage = createUploadMiddleware('image', 'image');
const uploadVideo = createUploadMiddleware('video', 'video');
const uploadDocument = createUploadMiddleware('document', 'document');

// Multiple file upload middlewares
const uploadMultipleImages = (maxCount = 5) => createUploadMiddleware('images', 'image', maxCount);
const uploadMultipleVideos = (maxCount = 3) => createUploadMiddleware('videos', 'video', maxCount);

// File validation middleware
const validateFileUpload = (req, res, next) => {
  if (!req.file && !req.files) {
    return res.status(400).json({
      status: 'error',
      message: 'No file uploaded'
    });
  }

  // Add file metadata to request
  if (req.file) {
    req.fileMetadata = {
      originalName: req.file.originalname,
      fileName: generateFileName(req.file.originalname),
      mimeType: req.file.mimetype,
      size: req.file.size,
      buffer: req.file.buffer
    };
  }

  if (req.files) {
    req.filesMetadata = req.files.map(file => ({
      originalName: file.originalname,
      fileName: generateFileName(file.originalname),
      mimeType: file.mimetype,
      size: file.size,
      buffer: file.buffer
    }));
  }

  next();
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: 'File too large'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        status: 'error',
        message: 'Too many files uploaded'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        status: 'error',
        message: 'Unexpected file field'
      });
    }
  }

  if (error.message.includes('Invalid file type') || error.message.includes('Invalid file extension')) {
    return res.status(400).json({
      status: 'error',
      message: error.message
    });
  }

  next(error);
};

module.exports = {
  uploadImage,
  uploadVideo,
  uploadDocument,
  uploadMultipleImages,
  uploadMultipleVideos,
  validateFileUpload,
  handleUploadError,
  generateFileName,
  fileTypes
};
