const requiredEnvVars = [
  'NODE_ENV',
  'MONGODB_URI',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'JWT_SECRET'
];

const optionalEnvVars = [
  'AZURE_STORAGE_CONNECTION_STRING',
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN'
];

const validateEnvironment = () => {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    throw new Error('Environment configuration incomplete');
  }

  // Validate Firebase private key format
  if (!process.env.FIREBASE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY')) {
    throw new Error('Invalid Firebase private key format');
  }

  // Check optional variables and warn if missing
  const missingOptional = optionalEnvVars.filter(varName => !process.env[varName]);
  if (missingOptional.length > 0) {
    console.warn('⚠️  Optional environment variables missing:');
    missingOptional.forEach(varName => console.warn(`   - ${varName}`));
  }
  
  console.log('✅ Environment variables validated');
  return true;
};

const getConfig = () => {
  return {
    node_env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    mongodb_uri: process.env.MONGODB_URI,
    jwt_secret: process.env.JWT_SECRET,
    jwt_expires_in: process.env.JWT_EXPIRES_IN || '7d',
    cors_origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    firebase: {
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      api_key: process.env.FIREBASE_API_KEY,
      auth_domain: process.env.FIREBASE_AUTH_DOMAIN
    },
    azure: {
      connection_string: process.env.AZURE_STORAGE_CONNECTION_STRING
    }
  };
};

module.exports = {
  validateEnvironment,
  getConfig
};
