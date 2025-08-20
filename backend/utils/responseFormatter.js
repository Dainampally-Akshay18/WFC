// Success response formatter
const successResponse = (res, message, data = null, statusCode = 200) => {
  const response = {
    status: 'success',
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

// Error response formatter
const errorResponse = (res, message, statusCode = 500, errors = null) => {
  const response = {
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

// Paginated response formatter
const paginatedResponse = (res, data, pagination, message = 'Data retrieved successfully') => {
  return res.json({
    status: 'success',
    message,
    data,
    pagination: {
      current_page: pagination.page,
      total_pages: Math.ceil(pagination.total / pagination.limit),
      per_page: pagination.limit,
      total_count: pagination.total,
      has_next: pagination.page < Math.ceil(pagination.total / pagination.limit),
      has_prev: pagination.page > 1
    },
    timestamp: new Date().toISOString()
  });
};

// Validation error formatter
const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    status: 'error',
    message: 'Validation failed',
    errors: errors.map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    })),
    timestamp: new Date().toISOString()
  });
};

// Not found response
const notFoundResponse = (res, resource = 'Resource') => {
  return res.status(404).json({
    status: 'error',
    message: `${resource} not found`,
    timestamp: new Date().toISOString()
  });
};

// Unauthorized response
const unauthorizedResponse = (res, message = 'Authentication required') => {
  return res.status(401).json({
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  });
};

// Forbidden response
const forbiddenResponse = (res, message = 'Access forbidden') => {
  return res.status(403).json({
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  });
};

// Server error response
const serverErrorResponse = (res, message = 'Internal server error') => {
  return res.status(500).json({
    status: 'error',
    message,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  successResponse,
  errorResponse,
  paginatedResponse,
  validationErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  serverErrorResponse
};
