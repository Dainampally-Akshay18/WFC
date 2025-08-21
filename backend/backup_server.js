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
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');
const sermonRoutes = require('./routes/sermons');
const eventRoutes = require('./routes/events');
const blogRoutes = require('./routes/blogs');
const prayerRoutes = require('./routes/prayers');

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


// Replace the existing CORS configuration with this:

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));



// Request logging (in development)
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
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
      users: '/api/users',
      admin: '/api/admin',
      sermons: '/api/sermons',
      events: '/api/events',
      blogs: '/api/blogs',
      prayers: '/api/prayers',
      upload: '/api/upload'
    },
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/sermons', sermonRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/prayers', prayerRoutes);

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

  // Test Azure Blob Storage (development only)
  app.get('/api/test-azure', async (req, res) => {
    try {
      const AzureBlobService = require('./services/azureBlobService');
      
      // Test listing containers
      const testResult = await AzureBlobService.listFiles('images');
      
      res.json({
        status: 'success',
        message: 'Azure Blob Storage connection successful',
        data: {
          connectionTest: testResult.success,
          containers: ['sermons', 'images', 'documents']
        }
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Azure Blob Storage connection failed',
        error: error.message
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
      console.log(`👤 User routes: http://localhost:${PORT}/api/users`);
      console.log(`👨‍💼 Admin routes: http://localhost:${PORT}/api/admin`);
      console.log(`🎵 Sermon routes: http://localhost:${PORT}/api/sermons`);
      console.log(`📅 Event routes: http://localhost:${PORT}/api/events`);
      console.log(`📝 Blog routes: http://localhost:${PORT}/api/blogs`);
      console.log(`🙏 Prayer routes: http://localhost:${PORT}/api/prayers`);
      console.log(`📁 Upload routes: http://localhost:${PORT}/api/upload`);
      console.log(`🌐 Root endpoint: http://localhost:${PORT}/`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`🔄 Received ${signal}, shutting down gracefully...`);
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
