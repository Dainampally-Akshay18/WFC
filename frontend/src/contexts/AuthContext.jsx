import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import authService from '../services/authService'; // ⭐ Import authService instead of api

const AuthContext = createContext({});

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
  const [loading, setLoading] = useState(true);      // ⭐ Loading state
  const [initialized, setInitialized] = useState(false);

  // ⭐ FIXED: Auth state change handler using authService
  const handleAuthStateChange = useCallback(async (user) => {
    console.log('🔐 Auth state changed:', user ? `User: ${user.uid} (${user.email})` : 'No user');
    
    try {
      setCurrentUser(user);
      
      if (user) {
        console.log('👤 Firebase user found, fetching from database...');
        setLoading(true); // Set loading while fetching
        
        try {
          // ⭐ Use authService instead of api directly
          const response = await authService.getUserStatus();
          
          console.log('✅ Database response:', response);
          
          if (response.status === 'success' && response.data && response.data.user) {
            // User exists in database with complete data
            console.log('🔄 Setting user data from database');
            setUserData(response.data.user);
          } else {
            // New user - needs setup
            console.log('🆕 New user - needs branch selection');
            setUserData(null);
          }
        } catch (error) {
          console.error('❌ Database fetch failed:', error);
          setUserData(null);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('🚪 User logged out');
        setUserData(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Auth state change error:', error);
      setUserData(null);
      setLoading(false);
    } finally {
      setInitialized(true);
    }
  }, []);

  // Set up Firebase auth state listener
  useEffect(() => {
    console.log('🔥 Setting up Firebase auth listener');
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);
    
    return () => {
      console.log('🧹 Cleaning up Firebase auth listener');
      unsubscribe();
    };
  }, [handleAuthStateChange]);

  // Auth methods using authService
  const login = async (email, password) => {
    setLoading(true);
    try {
      const result = await authService.login(email, password);
      return result;
    } finally {
      // Don't set loading false here - let handleAuthStateChange handle it
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await authService.loginWithGoogle();
      return result;
    } finally {
      // Don't set loading false here - let handleAuthStateChange handle it
    }
  };

  const selectBranch = async (branch) => {
    setLoading(true);
    try {
      const result = await authService.selectBranch(branch);
      // Update userData after successful branch selection
      if (result.status === 'success' && result.data && result.data.user) {
        setUserData(result.data.user);
      }
      return result;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
      setCurrentUser(null);
      setUserData(null);
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => {
    return !!currentUser;
  };

  // Context value
  const value = {
    currentUser,
    userData,
    loading,           // ⭐ Include loading state
    initialized,
    login,
    loginWithGoogle,
    selectBranch,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
