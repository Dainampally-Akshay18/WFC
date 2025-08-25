const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const sermonRoutes = require('./routes/sermons');
const eventRoutes = require('./routes/events');
const prayerRoutes = require('./routes/prayers');
const pastorAuthRoutes = require('./routes/pastorAuth');
const adminRoutes = require('./routes/admin'); // ADD THIS LINE

const { connectDatabase } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ===========================
// CORS CONFIGURATION
// ===========================

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3001',
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log('🔍 CORS Check - Origin:', origin);
    if (!origin) {
      console.log('✅ CORS: No origin - allowed');
      return callback(null, true);
    }
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

app.use(cors(corsOptions));

app.options('*', (req, res) => {
  console.log('🚁 Preflight OPTIONS request for:', req.path);
  console.log('🎯 Origin:', req.headers.origin);
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-Forwarded-For');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
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

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================
// ROUTES
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
      'POST /api/pastor-auth/login',
      'GET /api/pastor-auth/',
      'GET /api/admin/dashboard/overview'
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

// Routes of Features
app.use('/api/auth', authRoutes);
app.use('/api/sermons', sermonRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/prayers', prayerRoutes);
app.use('/api/pastor-auth', pastorAuthRoutes);
app.use('/api/admin', adminRoutes); // ADD THIS LINE

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

app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.originalUrl);
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

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

app.listen(PORT, '0.0.0.0', async() => {
  await connectDatabase();
  console.log(`
🚀 Server started successfully!
📍 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
🔗 CORS enabled for: ${allowedOrigins.join(', ')}
📋 Available Routes:
   - GET /api/pastor-auth/
   - POST /api/pastor-auth/login
   - GET /api/pastor-auth/profile
  `);
});

module.exports = app;
