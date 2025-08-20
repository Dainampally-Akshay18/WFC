const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error details
  console.error('Error Stack:', err.stack);
  console.error('Request URL:', req.originalUrl);
  console.error('Request Method:', req.method);
  console.error('Request IP:', req.ip);
  console.error('User Agent:', req.get('User-Agent'));

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate value for field: ${field}`;
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Firebase authentication errors
  if (err.code && err.code.startsWith('auth/')) {
    let message = 'Authentication failed';
    
    switch (err.code) {
      case 'auth/invalid-email':
        message = 'Invalid email address';
        break;
      case 'auth/user-disabled':
        message = 'User account has been disabled';
        break;
      case 'auth/user-not-found':
        message = 'User not found';
        break;
      case 'auth/wrong-password':
        message = 'Invalid password';
        break;
      case 'auth/id-token-expired':
        message = 'Authentication token expired';
        break;
      case 'auth/id-token-revoked':
        message = 'Authentication token revoked';
        break;
      case 'auth/invalid-id-token':
        message = 'Invalid authentication token';
        break;
    }
    
    error = { message, statusCode: 401 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // MongoDB connection errors
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    const message = 'Database connection error';
    error = { message, statusCode: 500 };
  }

  // Azure Storage errors
  if (err.code && err.code.startsWith('Azure')) {
    const message = 'File storage error';
    error = { message, statusCode: 500 };
  }

  // Rate limiting errors
  if (err.status === 429) {
    const message = 'Too many requests, please slow down';
    error = { message, statusCode: 429 };
  }

  // Permission errors
  if (err.message && err.message.includes('Permission')) {
    error = { message: err.message, statusCode: 403 };
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    }),
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};
