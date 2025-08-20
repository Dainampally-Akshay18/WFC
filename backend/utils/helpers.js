const crypto = require('crypto');

// Generate random string
const generateRandomString = (length = 16) => {
  return crypto.randomBytes(length).toString('hex');
};

// Pagination helper
const getPaginationOptions = (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  const sort = query.sort || '-createdAt';

  return {
    page,
    limit,
    skip,
    sort
  };
};

// Search helper
const buildSearchQuery = (searchTerm, searchFields) => {
  if (!searchTerm) return {};

  const searchRegex = new RegExp(searchTerm, 'i');
  
  return {
    $or: searchFields.map(field => ({
      [field]: { $regex: searchRegex }
    }))
  };
};

// Sanitize user input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .trim();
};

// Format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format duration (seconds to mm:ss)
const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim('-'); // Remove leading/trailing hyphens
};

// Check if date is in future
const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

// Get date range for queries
const getDateRange = (period) => {
  const now = new Date();
  const ranges = {
    today: {
      start: new Date(now.setHours(0, 0, 0, 0)),
      end: new Date(now.setHours(23, 59, 59, 999))
    },
    week: {
      start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: now
    },
    month: {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    },
    year: {
      start: new Date(now.getFullYear(), 0, 1),
      end: new Date(now.getFullYear(), 11, 31)
    }
  };

  return ranges[period] || null;
};

// Remove sensitive fields from user objects
const sanitizeUserData = (user, userType = 'user') => {
  const sensitiveFields = ['firebaseUID', 'createdAt', 'updatedAt', '__v'];
  
  const sanitized = { ...user.toObject() };
  
  sensitiveFields.forEach(field => {
    delete sanitized[field];
  });

  // Remove additional sensitive fields for regular users
  if (userType === 'user') {
    delete sanitized.approvedBy;
  }

  return sanitized;
};

// Calculate read time for blog posts
const calculateReadTime = (content) => {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate OTP
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
};

module.exports = {
  generateRandomString,
  getPaginationOptions,
  buildSearchQuery,
  sanitizeInput,
  formatFileSize,
  formatDuration,
  generateSlug,
  isFutureDate,
  getDateRange,
  sanitizeUserData,
  calculateReadTime,
  isValidEmail,
  generateOTP
};
