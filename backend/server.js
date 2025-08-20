const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import configurations
const { connectDatabase } = require('./config/database');
const { initializeFirebase } = require('./config/firebase');
const { validateEnvironment } = require('./config/environment');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { handleUploadError } = require('./middleware/fileUpload');
const { 
  generalLimit, 
  helmetConfig, 
  corsOptions, 
  securityHeaders, 
  bodySizeLimits,
  requestLogger 
} = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Validate environment variables
try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

// Trust proxy (important for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet(helmetConfig));
app.use(securityHeaders);
app.use(cors(corsOptions));

// Request logging (in development)
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/', generalLimit);

// Body parsing middleware with size limits
app.use(express.json(bodySizeLimits.json));
app.use(express.urlencoded(bodySizeLimits.urlencoded));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running successfully',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Christian Organization Website API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      models_test: '/api/test-models'
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Test database models endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  app.get('/api/test-models', async (req, res) => {
    try {
      const { User, Pastor, Sermon, Event, Blog, PrayerRequest } = require('./models');
      
      const stats = {
        users: await User.countDocuments(),
        pastors: await Pastor.countDocuments(),
        sermons: await Sermon.countDocuments(),
        events: await Event.countDocuments(),
        blogs: await Blog.countDocuments(),
        prayerRequests: await PrayerRequest.countDocuments()
      };
      
      res.json({
        status: 'success',
        message: 'Database models are working',
        data: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Database model test failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
}

// File upload error handler (must be before general error handler)
app.use(handleUploadError);

// 404 handler
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

// Initialize services and start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    console.log('✅ Database connected successfully');

    // Initialize Firebase
    await initializeFirebase();
    console.log('✅ Firebase initialized successfully');

    // Start server
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`🚀 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
      console.log(`🌐 Root endpoint: http://localhost:${PORT}/`);
      console.log(`📊 Security: Rate limiting, CORS, and Helmet enabled`);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log('🔄 Received shutdown signal, closing server gracefully...');
      server.close(() => {
        console.log('✅ Server closed successfully');
        mongoose.connection.close(() => {
          console.log('✅ Database connection closed');
          process.exit(0);
        });
      });
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  console.error('❌ At:', promise);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

startServer();

module.exports = app;
