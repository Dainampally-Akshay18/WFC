import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

// Auth Components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import BranchSelection from './pages/auth/BranchSelection';
import PendingApproval from './pages/auth/PendingApproval';

// User Components
import Dashboard from './pages/user/Dashboard';

// Protection Components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Error Pages
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Toast Notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Branch Selection Route - Simplified */}
            <Route 
              path="/select-branch" 
              element={
                <ProtectedRoute requireApproval={false}>
                  <BranchSelection />
                </ProtectedRoute>
              } 
            />

            {/* Pending Approval Route */}
            <Route 
              path="/pending-approval" 
              element={
                <ProtectedRoute requireApproval={false}>
                  <PendingApproval />
                </ProtectedRoute>
              } 
            />

            {/* Dashboard Route */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute requireApproval={true}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
