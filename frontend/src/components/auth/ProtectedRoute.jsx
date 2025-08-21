import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../ui/LoadingSpinner';

const ProtectedRoute = ({ children, requireApproval = true, requirePastor = false }) => {
  const { currentUser, userData, loading, initialized } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute Check:', {
    currentUser: !!currentUser,
    userData: !!userData,
    loading,
    initialized,
    requireApproval,
    path: location.pathname
  });

  // Show loading while checking auth state
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner text="Checking authentication..." />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    console.log('🚫 Not authenticated, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow access to branch selection and pending approval without full approval
  if (location.pathname === '/select-branch' || location.pathname === '/pending-approval') {
    console.log('✅ Access granted to auth flow page');
    return children;
  }

  // Check if user needs branch selection
  if (!userData?.branch && userData?.userType !== 'pastor') {
    console.log('🏢 Branch selection needed, redirecting');
    return <Navigate to="/select-branch" replace />;
  }

  // Check approval status for regular users
  if (requireApproval && userData?.userType === 'user' && userData?.approvalStatus !== 'approved') {
    console.log('⏳ Approval needed, redirecting to pending approval');
    return <Navigate to="/pending-approval" replace />;
  }

  // Check pastor access
  if (requirePastor && userData?.userType !== 'pastor') {
    console.log('👨‍💼 Pastor access required, redirecting to unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('✅ Access granted to protected route');
  return children;
};

export default ProtectedRoute;
