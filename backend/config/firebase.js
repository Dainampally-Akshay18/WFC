const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
    }),
    databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
  });
}

// Improved token verification function
const verifyFirebaseToken = async (idToken) => {
  try {
    // Check if token exists
    if (!idToken) {
      throw new Error('No token provided');
    }

    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('✅ Token verified for user:', decodedToken.uid);
    return decodedToken;
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    throw new Error('Invalid Firebase token');
  }
};

module.exports = {
  admin,
  verifyFirebaseToken
};
