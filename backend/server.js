const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import configurations
const { connectDatabase } = require('./config/database');
const { initializeFirebase } = require('./config/firebase');
const { validateEnvironment } = require('./config/environment');

// Import middleware
const errorHandler = require('./middleware/errorHandler');

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

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running successfully',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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
    }
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
        error: error.message
      });
    }
  });
}

// 404 handler - MUST be last before error handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler - MUST be after 404 handler
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
      console.log(`🚀 Health check available at: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Authentication routes at: http://localhost:${PORT}/api/auth`);
      console.log(`🌐 Root endpoint available at: http://localhost:${PORT}/`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Process terminated');
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log('❌ Unhandled Rejection at:', promise, 'reason:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log('❌ Uncaught Exception thrown:', err);
  process.exit(1);
});

startServer();

module.exports = app;
