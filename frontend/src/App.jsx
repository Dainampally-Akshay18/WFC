import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';

// Layout Components
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import PastorLogin from './pages/auth/PastorLogin';
import BranchSelection from './pages/auth/BranchSelection';
import PendingApproval from './pages/auth/PendingApproval';
import ForgotPassword from './pages/auth/ForgotPassword';

// User Pages
import Dashboard from './pages/user/Dashboard';
import Profile from './pages/user/Profile';
import SermonList from './pages/user/SermonList';
import SermonDetail from './pages/user/SermonDetail';
import EventList from './pages/user/EventList';
import EventDetail from './pages/user/EventDetail';
import BlogList from './pages/user/BlogList';
import BlogDetail from './pages/user/BlogDetail';
import PrayerList from './pages/user/PrayerList';
import PrayerSubmit from './pages/user/PrayerSubmit';

// ⭐ ADMIN PAGES - Correct import paths based on your file structure
import PastorDashboard from './pages/admin/PastorDashboard';
import UserManagement from './pages/admin/UserManagement';
import ContentManagement from './pages/admin/ContentManagement';

// Protection Components
import ProtectedRoute from './components/auth/ProtectedRoute';

// Error Pages
import NotFound from './pages/NotFound';
import Unauthorized from './pages/Unauthorized';

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
              success: {
                style: {
                  background: '#22c55e',
                },
              },
              error: {
                style: {
                  background: '#ef4444',
                },
              },
            }}
          />
          
          <Routes>
            {/* Root Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* PUBLIC AUTH ROUTES */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/pastor-login" element={<PastorLogin />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* SEMI-PROTECTED ROUTES */}
            <Route 
              path="/select-branch" 
              element={
                <ProtectedRoute requireApproval={false}>
                  <BranchSelection />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/pending-approval" 
              element={
                <ProtectedRoute requireApproval={false}>
                  <PendingApproval />
                </ProtectedRoute>
              } 
            />

            {/* PROTECTED USER ROUTES */}
            <Route 
              element={
                <ProtectedRoute requireApproval={true}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              
              {/* Sermons */}
              <Route path="/sermons" element={<SermonList />} />
              <Route path="/sermons/:id" element={<SermonDetail />} />
              
              {/* Events */}
              <Route path="/events" element={<EventList />} />
              <Route path="/events/:id" element={<EventDetail />} />
              
              {/* Blogs */}
              <Route path="/blogs" element={<BlogList />} />
              <Route path="/blogs/:id" element={<BlogDetail />} />
              
              {/* Prayers */}
              <Route path="/prayers" element={<PrayerList />} />
              <Route path="/prayers/submit" element={<PrayerSubmit />} />
            </Route>

            {/* ⭐ PASTOR/ADMIN ROUTES */}
            <Route 
              element={
                <ProtectedRoute requirePastor={true}>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/pastor/dashboard" element={<PastorDashboard />} />
              <Route path="/pastor/users" element={<UserManagement />} />
              <Route path="/pastor/content" element={<ContentManagement />} />
            </Route>

            {/* ERROR ROUTES */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/application-rejected" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-red-600 mb-4">Application Rejected</h1>
                  <p className="text-gray-600">Your application has been rejected. Please contact a pastor for more information.</p>
                </div>
              </div>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
