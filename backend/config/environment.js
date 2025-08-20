const requiredEnvVars = [
  'NODE_ENV',
  'MONGODB_URI',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'JWT_SECRET',
  'AZURE_STORAGE_CONNECTION_STRING'
];

const validateEnvironment = () => {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:');
    missingVars.forEach(varName => console.error(`- ${varName}`));
    throw new Error('Environment configuration incomplete');
  }
  
  console.log('✅ Environment variables validated');
};

const getConfig = () => {
  return {
    node_env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
    mongodb_uri: process.env.MONGODB_URI,
    jwt_secret: process.env.JWT_SECRET,
    jwt_expires_in: process.env.JWT_EXPIRES_IN || '7d',
    cors_origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  };
};

module.exports = {
  validateEnvironment,
  getConfig
};
