import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,  // ⭐ Using popup instead of redirect
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import api from './api';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.userData = null;
  }

  // ==========================================
  // EMAIL/PASSWORD AUTHENTICATION
  // ==========================================

  async loginWithEmail(email, password) {
    try {
      console.log('🔐 Starting email login for:', email);
      
      // Step 1: Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase email login successful:', userCredential.user.uid);
      
      // Step 2: Call backend to sync user data
      const response = await api.post('/auth/login', {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName
      });
      console.log('✅ Backend email login successful:', response.data);
      
      // Step 3: Store user data
      this.currentUser = userCredential.user;
      this.userData = response.data.data;

      return {
        success: true,
        user: userCredential.user,
        data: response.data.data,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('❌ Email login failed:', error);
      throw this.handleAuthError(error);
    }
  }

  async registerWithEmail(email, password, name, bio = '') {
    try {
      console.log('📝 Starting email registration for:', email);
      
      // Step 1: Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase user created:', userCredential.user.uid);
      
      // Step 2: Update Firebase profile
      await updateProfile(userCredential.user, {
        displayName: name
      });
      console.log('✅ Firebase profile updated');

      // Step 3: Register with backend
      const response = await api.post('/auth/register', {
        uid: userCredential.user.uid,
        email,
        name,
        bio
      });
      console.log('✅ Backend registration successful:', response.data);

      this.currentUser = userCredential.user;
      this.userData = response.data.data;

      return {
        success: true,
        user: userCredential.user,
        data: response.data.data,
        message: 'Registration successful'
      };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // ==========================================
  // GOOGLE POPUP AUTHENTICATION (NEW!)
  // ==========================================

  /**
   * Login with Google using popup (no redirect issues)
   * @returns {Promise<Object>} Google login result
   */
  async loginWithGoogle() {
    try {
      console.log('🔐 Starting Google popup login...');
      
      // Use popup for Google sign-in
      const result = await signInWithPopup(auth, googleProvider);
      console.log('✅ Google popup login successful:', result.user.uid);
      
      // Call backend to sync Google user data
      const response = await api.post('/auth/google-login', {
        uid: result.user.uid,
        email: result.user.email,
        name: result.user.displayName,
        photoURL: result.user.photoURL,
        provider: 'google'
      });
      console.log('✅ Backend Google login successful:', response.data);
      
      // Store user data
      this.currentUser = result.user;
      this.userData = response.data.data;

      return {
        success: true,
        user: result.user,
        data: response.data.data,
        message: 'Google login successful'
      };
    } catch (error) {
      console.error('❌ Google popup login failed:', error);
      
      // Handle specific popup errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Google sign-in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup blocked. Please allow popups and try again.');
      }
      
      throw this.handleAuthError(error);
    }
  }

  // ==========================================
  // OTHER METHODS (SAME AS BEFORE)
  // ==========================================

  async selectBranch(branch) {
    try {
      console.log('🏢 Selecting branch:', branch);
      
      const response = await api.post('/auth/select-branch', { branch });
      console.log('✅ Branch selection successful:', response.data);
      
      if (this.userData) {
        this.userData.branch = branch;
        this.userData.approvalStatus = 'pending';
        this.userData.needsBranchSelection = false;
      }

      return response.data;
    } catch (error) {
      console.error('❌ Branch selection failed:', error);
      throw this.handleAuthError(error);
    }
  }

  async getUserStatus() {
    try {
      console.log('👤 Getting user status...');
      
      const response = await api.get('/auth/status');
      console.log('✅ User status retrieved:', response.data);
      
      this.userData = response.data.data;
      return response.data;
    } catch (error) {
      console.error('❌ Get user status failed:', error);
      throw this.handleAuthError(error);
    }
  }

  async logout() {
    try {
      console.log('🚪 Starting logout...');
      
      // Clear local data first
      this.currentUser = null;
      this.userData = null;
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Sign out from Firebase
      await signOut(auth);
      console.log('✅ Firebase logout successful');
      
      // Optional backend logout (ignore errors)
      try {
        await api.post('/auth/logout');
        console.log('✅ Backend logout successful');
      } catch (error) {
        console.warn('⚠️ Backend logout failed (ignoring):', error.message);
      }

      return { 
        success: true, 
        message: 'Logged out successfully' 
      };
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw this.handleAuthError(error);
    }
  }

  async resetPassword(email) {
    try {
      console.log('🔑 Sending password reset email to:', email);
      
      await sendPasswordResetEmail(auth, email);
      console.log('✅ Password reset email sent');
      
      return { 
        success: true, 
        message: 'Password reset email sent successfully' 
      };
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw this.handleAuthError(error);
    }
  }

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  handleAuthError(error) {
    let message = 'An unexpected error occurred';
    let code = 'unknown';

    console.error('🔥 Auth Error Details:', {
      errorCode: error.code,
      errorMessage: error.message,
      errorResponse: error.response?.data,
      errorStatus: error.response?.status
    });

    if (error.code) {
      code = error.code;
      switch (error.code) {
        case 'auth/user-not-found':
          message = 'No account found with this email address';
          break;
        case 'auth/wrong-password':
          message = 'Invalid password. Please try again.';
          break;
        case 'auth/email-already-in-use':
          message = 'An account with this email already exists';
          break;
        case 'auth/weak-password':
          message = 'Password should be at least 6 characters long';
          break;
        case 'auth/invalid-email':
          message = 'Please enter a valid email address';
          break;
        case 'auth/user-disabled':
          message = 'This account has been disabled';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection.';
          break;
        case 'auth/popup-closed-by-user':
          message = 'Google sign-in cancelled';
          break;
        case 'auth/popup-blocked':
          message = 'Popup blocked. Please allow popups and try again.';
          break;
        default:
          message = error.message || 'Authentication failed';
      }
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
      code = error.response.status?.toString() || 'api_error';
    } else if (error.message) {
      if (error.message.includes('Network Error')) {
        message = 'Unable to connect to server. Please check your connection and try again.';
        code = 'network_error';
      } else {
        message = error.message;
      }
    }

    const formattedError = new Error(message);
    formattedError.code = code;
    formattedError.originalError = error;

    return formattedError;
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  isAuthenticated() {
    return !!auth.currentUser;
  }

  getCurrentUser() {
    return auth.currentUser;
  }

  getUserData() {
    return this.userData;
  }

  needsBranchSelection() {
    return this.userData?.needsBranchSelection || !this.userData?.branch;
  }

  isApproved() {
    return this.userData?.approvalStatus === 'approved';
  }

  isPastor() {
    return this.userData?.userType === 'pastor';
  }
}

export default new AuthService();
