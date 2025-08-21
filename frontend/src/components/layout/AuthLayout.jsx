import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const AuthLayout = () => {
  const { currentUser, loading, initialized } = useAuth();

  if (loading || !initialized) {
    return <LoadingSpinner />;
  }

  // Redirect authenticated users to dashboard
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary-700 mb-2">
            Christian Organization
          </h1>
          <p className="text-gray-600">
            Welcome to our community
          </p>
        </div>
        
        {/* Auth Form */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <Outlet />
        </div>
        
        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>&copy; 2025 Christian Organization. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
