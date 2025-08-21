const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Compression middleware
const compressionMiddleware = compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
});

// Cache middleware for static responses
const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${duration}`);
    }
    next();
  };
};

// Request timing middleware
const timingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });
  
  next();
};

// Memory usage middleware
const memoryMiddleware = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const mbUsage = {
    rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100,
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100
  };
  
  // Log if memory usage is high
  if (mbUsage.heapUsed > 100) {
    console.warn(`High memory usage: ${JSON.stringify(mbUsage)} MB`);
  }
  
  next();
};

module.exports = {
  compressionMiddleware,
  cacheMiddleware,
  timingMiddleware,
  memoryMiddleware
};
