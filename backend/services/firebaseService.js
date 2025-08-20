const admin = require('firebase-admin');

class FirebaseService {
  // Create user in Firebase Auth
  static async createUser(email, password, displayName) {
    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
        emailVerified: false
      });

      return {
        success: true,
        user: userRecord
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update user in Firebase Auth
  static async updateUser(uid, updates) {
    try {
      const userRecord = await admin.auth().updateUser(uid, updates);
      
      return {
        success: true,
        user: userRecord
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Set custom claims
  static async setCustomClaims(uid, claims) {
    try {
      await admin.auth().setCustomUserClaims(uid, claims);
      
      return {
        success: true,
        message: 'Custom claims set successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user by UID
  static async getUserByUID(uid) {
    try {
      const userRecord = await admin.auth().getUser(uid);
      
      return {
        success: true,
        user: userRecord
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user by email
  static async getUserByEmail(email) {
    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      
      return {
        success: true,
        user: userRecord
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete user from Firebase Auth
  static async deleteUser(uid) {
    try {
      await admin.auth().deleteUser(uid);
      
      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Verify ID token
  static async verifyIdToken(idToken) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      return {
        success: true,
        decodedToken
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Generate custom token
  static async createCustomToken(uid, additionalClaims = {}) {
    try {
      const customToken = await admin.auth().createCustomToken(uid, additionalClaims);
      
      return {
        success: true,
        customToken
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // List users (for admin purposes)
  static async listUsers(maxResults = 1000) {
    try {
      const listUsersResult = await admin.auth().listUsers(maxResults);
      
      return {
        success: true,
        users: listUsersResult.users,
        pageToken: listUsersResult.pageToken
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Disable user account
  static async disableUser(uid) {
    try {
      await admin.auth().updateUser(uid, { disabled: true });
      
      return {
        success: true,
        message: 'User disabled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Enable user account
  static async enableUser(uid) {
    try {
      await admin.auth().updateUser(uid, { disabled: false });
      
      return {
        success: true,
        message: 'User enabled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = FirebaseService;
