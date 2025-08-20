// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

// User Roles
const USER_ROLES = {
  USER: 'user',
  PASTOR: 'pastor'
};

// User Approval Status
const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Branch Types
const BRANCHES = {
  BRANCH1: 'branch1',
  BRANCH2: 'branch2',
  BOTH: 'both'
};

// Content Status
const CONTENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

// Prayer Request Status
const PRAYER_STATUS = {
  ACTIVE: 'active',
  ANSWERED: 'answered',
  ARCHIVED: 'archived'
};

// Priority Levels
const PRIORITY_LEVELS = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
};

// File Types
const FILE_TYPES = {
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document'
};

// Permission Types
const PERMISSIONS = {
  MANAGE_USERS: 'manageUsers',
  MANAGE_BOTH_BRANCHES: 'manageBothBranches',
  MANAGE_CONTENT: 'manageContent',
  MANAGE_SERMONS: 'manageSermons',
  CREATE_ADMINS: 'createAdmins'
};

// Azure Blob Containers
const AZURE_CONTAINERS = {
  SERMONS: 'sermons',
  IMAGES: 'images',
  DOCUMENTS: 'documents'
};

// Default Pagination
const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100
};

// Rate Limit Windows (in milliseconds)
const RATE_LIMITS = {
  GENERAL: 15 * 60 * 1000, // 15 minutes
  AUTH: 15 * 60 * 1000,    // 15 minutes
  UPLOAD: 60 * 60 * 1000,  // 1 hour
  STRICT: 15 * 60 * 1000   // 15 minutes
};

// Error Messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  VALIDATION_FAILED: 'Validation failed',
  SERVER_ERROR: 'Internal server error',
  FILE_UPLOAD_ERROR: 'File upload failed',
  RATE_LIMIT_EXCEEDED: 'Too many requests',
  INVALID_TOKEN: 'Invalid or expired token',
  USER_NOT_APPROVED: 'Account not approved',
  PASTOR_ACCESS_REQUIRED: 'Pastor access required'
};

// Success Messages
const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  BRANCH_SELECTED: 'Branch selected successfully',
  FILE_UPLOADED: 'File uploaded successfully'
};

// Email Templates
const EMAIL_TEMPLATES = {
  USER_APPROVED: 'user_approved',
  USER_REJECTED: 'user_rejected',
  NEW_USER_REGISTRATION: 'new_user_registration',
  PASSWORD_RESET: 'password_reset'
};

// Regex Patterns
const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-()]{10,}$/,
  URL: /^https?:\/\/.+/,
  MONGO_ID: /^[0-9a-fA-F]{24}$/
};

module.exports = {
  HTTP_STATUS,
  USER_ROLES,
  APPROVAL_STATUS,
  BRANCHES,
  CONTENT_STATUS,
  PRAYER_STATUS,
  PRIORITY_LEVELS,
  FILE_TYPES,
  PERMISSIONS,
  AZURE_CONTAINERS,
  DEFAULT_PAGINATION,
  RATE_LIMITS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  EMAIL_TEMPLATES,
  REGEX_PATTERNS
};
