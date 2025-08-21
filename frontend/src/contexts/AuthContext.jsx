import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import authService from '../services/authService';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Memoized auth state handler
const handleAuthStateChange = useCallback(async (user) => {
  console.log('🔐 Auth state changed:', user ? `User: ${user.uid} (${user.email})` : 'No user');
  
  try {
    setCurrentUser(user);
    
    if (user) {
      console.log('👤 User found, getting complete user data...');
      
      try {
        // ⭐ ALWAYS get fresh user data from database
        const response = await authService.getUserStatus();
        console.log('✅ Complete user data retrieved:', response.data);
        
        if (response.data.user) {
          // ⭐ User exists in database - use their complete data
          console.log('🔄 Existing user with complete data');
          setUserData(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          // ⭐ New user - needs branch selection
          console.log('🆕 New user detected');
          setUserData({ 
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            isNewUser: true
          });
        }
      } catch (statusError) {
        console.warn('⚠️ User status failed:', statusError.message);
        
        // Handle error cases
        if (statusError.message.includes('Network Error')) {
          setUserData({ 
            error: 'Network connection issue.',
            uid: user.uid,
            email: user.email,
            name: user.displayName
          });
        } else {
          // Assume new user if status check fails
          setUserData({ 
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            isNewUser: true
          });
        }
      }
    } else {
      console.log('🚪 User logged out, clearing data');
      setUserData(null);
      localStorage.removeItem('user');
    }
  } catch (error) {
    console.error('❌ Error in auth state change:', error);
    
    if (user) {
      setUserData({ 
        error: error.message || 'Authentication setup required',
        uid: user.uid,
        email: user.email,
        name: user.displayName
      });
    } else {
      setUserData(null);
    }
  } finally {
    setLoading(false);
    setInitialized(true);
  }
}, []);


  // Initialize auth state listener
  useEffect(() => {
    console.log('🔄 Initializing AuthContext...');
    
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);

    return () => {
      console.log('🧹 Cleaning up AuthContext');
      unsubscribe();
    };
  }, [handleAuthStateChange]);

  // Auth methods
  const register = async (email, password, name, bio = '') => {
    try {
      console.log('📝 Starting registration process...');
      setLoading(true);
      
      const result = await authService.registerWithEmail(email, password, name, bio);
      console.log('✅ Registration successful:', result);
      
      toast.success('Registration successful! Please select your branch.');
      return result;
    } catch (error) {
      console.error('❌ Registration failed:', error);
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Starting email login...');
      setLoading(true);
      
      const result = await authService.loginWithEmail(email, password);
      console.log('✅ Login successful:', result);
      
      toast.success('Login successful!');
      return result;
    } catch (error) {
      console.error('❌ Login failed:', error);
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Updated Google login with popup
  const loginWithGoogle = async () => {
    try {
      console.log('🔐 Starting Google popup login...');
      setLoading(true);
      
      const result = await authService.loginWithGoogle();
      console.log('✅ Google login successful:', result);
      
      toast.success('Google login successful!');
      return result;
    } catch (error) {
      console.error('❌ Google login failed:', error);
      
      if (error.message !== 'Google sign-in cancelled') {
        toast.error(error.message || 'Google login failed');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const selectBranch = async (branch) => {
    try {
      console.log('🏢 Selecting branch:', branch);
      setLoading(true);
      
      const result = await authService.selectBranch(branch);
      console.log('✅ Branch selected:', result);
      
      // Update local user data
      const updatedUserData = { 
        ...userData, 
        branch, 
        approvalStatus: 'pending',
        needsBranchSelection: false 
      };
      
      setUserData(updatedUserData);
      localStorage.setItem('user', JSON.stringify(updatedUserData));
      
      toast.success('Branch selected! Awaiting pastor approval.');
      return result;
    } catch (error) {
      console.error('❌ Branch selection failed:', error);
      toast.error(error.message || 'Branch selection failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Starting logout...');
      
      await authService.logout();
      console.log('✅ Logout successful');
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      toast.error('Logout failed, but you have been signed out locally');
    }
  };

  const resetPassword = async (email) => {
    try {
      console.log('🔑 Sending password reset for:', email);
      
      await authService.resetPassword(email);
      console.log('✅ Password reset email sent');
      
      toast.success('Password reset email sent!');
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      toast.error(error.message || 'Password reset failed');
      throw error;
    }
  };

  // Status check methods
  const isAuthenticated = () => !!currentUser;
  const isApproved = () => userData?.approvalStatus === 'approved';
  const isPastor = () => userData?.userType === 'pastor';
  const needsBranchSelection = () => userData?.needsBranchSelection || (!userData?.branch && userData?.userType !== 'pastor');
  const needsApproval = () => userData?.approvalStatus === 'pending';

  const value = {
    currentUser,
    userData,
    loading,
    initialized,
    register,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    selectBranch,
    isAuthenticated,
    isApproved,
    isPastor,
    needsBranchSelection,
    needsApproval
  };

  // Show loading screen until initialized
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
