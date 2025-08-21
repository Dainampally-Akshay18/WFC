const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// ===========================
// CORS CONFIGURATION (FIXED)
// ===========================

// Define allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3001',
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔍 CORS Check - Origin:', origin);
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) {
      console.log('✅ CORS: No origin - allowed');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Origin allowed -', origin);
      return callback(null, true);
    } else {
      console.log('❌ CORS: Origin blocked -', origin);
      return callback(new Error(`CORS policy violation: ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Forwarded-For'
  ],
  exposedHeaders: ['set-cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  console.log('🚁 Preflight OPTIONS request for:', req.path);
  console.log('🎯 Origin:', req.headers.origin);
  
  const origin = req.headers.origin;
  
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-Forwarded-For');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    console.log('✅ Preflight: Headers set for', origin);
    return res.sendStatus(204);
  } else {
    console.log('❌ Preflight: Origin not allowed', origin);
    return res.status(403).json({ error: 'CORS policy violation' });
  }
});

// ===========================
// MIDDLEWARE SETUP
// ===========================

// Trust proxy
app.set('trust proxy', 1);

// Helmet with relaxed settings for development
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================
// TEST ROUTES
// ===========================

// Root route
app.get('/', (req, res) => {
  console.log('🏠 Root endpoint accessed from:', req.headers.origin);
  res.json({
    status: 'success',
    message: 'Christian Organization API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/test-cors',
      'POST /api/auth/login',
      'GET /api/auth/status',
    ]
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  console.log('💊 Health check from:', req.headers.origin);
  res.json({
    status: 'success',
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: 'enabled'
  });
});

app.use('/api/auth', authRoutes);
// CORS test endpoint
app.get('/api/test-cors', (req, res) => {
  console.log('🧪 CORS test from:', req.headers.origin);
  res.json({
    status: 'success',
    message: 'CORS is working correctly!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    headers: req.headers
  });
});

// ===========================
// AUTH ROUTES (MOCK)
// ===========================

// Mock auth status endpoint
app.get('/api/auth/status', (req, res) => {
  console.log('🔐 Auth status check from:', req.headers.origin);
  res.json({
    status: 'success',
    message: 'Auth status retrieved',
    data: {
      needsSetup: true,
      user: null
    },
    timestamp: new Date().toISOString()
  });
});

// Mock auth login endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('📝 Auth login attempt from:', req.headers.origin);
  res.json({
    status: 'success',
    message: 'Login endpoint working',
    data: {
      user: {
        id: 'mock-user-id',
        name: 'Mock User',
        email: 'mock@example.com'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// ===========================
// ERROR HANDLING
// ===========================

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.originalUrl);
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('💥 Server Error:', error);
  res.status(500).json({
    status: 'error',
    message: error.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// ===========================
// START SERVER
// ===========================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Server started successfully!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 CORS enabled for: ${allowedOrigins.join(', ')}

📊 Test endpoints:
   GET  http://localhost:${PORT}/
   GET  http://localhost:${PORT}/api/health
   GET  http://localhost:${PORT}/api/test-cors
   GET  http://localhost:${PORT}/api/auth/status
   POST http://localhost:${PORT}/api/auth/login

🧪 Test CORS in browser console:
   fetch('http://localhost:${PORT}/api/health')
     .then(r => r.json())
     .then(d => console.log('✅ CORS working:', d))
  `);
});

module.exports = app;
