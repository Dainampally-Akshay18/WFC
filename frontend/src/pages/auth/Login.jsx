import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { EnvelopeIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { 
    login, 
    loginWithGoogle, 
    currentUser, 
    userData, 
    initialized, 
    isAuthenticated, 
    needsBranchSelection,
    needsApproval 
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  // Handle navigation for authenticated users
  useEffect(() => {
    if (!initialized) {
      console.log('🔄 Waiting for auth initialization...');
      return;
    }

    if (isAuthenticated()) {
      console.log('👤 User authenticated, determining destination...');
      console.log('User data:', userData);
      
      if (needsBranchSelection()) {
        console.log('🏢 Redirecting to branch selection');
        navigate('/select-branch', { replace: true });
        return;
      }
      
      if (userData?.userType === 'user' && needsApproval()) {
        console.log('⏳ Redirecting to pending approval');
        navigate('/pending-approval', { replace: true });
        return;
      }
      
      if (userData?.approvalStatus === 'approved' || userData?.userType === 'pastor') {
        console.log('✅ Redirecting to dashboard');
        navigate(from, { replace: true });
        return;
      }
      
      // If user data indicates some setup is needed
      if (userData?.needsSetup) {
        if (userData.needsBranchSelection) {
          console.log('🏢 Setup needed: branch selection');
          navigate('/select-branch', { replace: true });
          return;
        }
      }
    }
  }, [currentUser, userData, initialized, navigate, from, isAuthenticated, needsBranchSelection, needsApproval]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    
    try {
      console.log('🔐 Attempting email login...');
      await login(formData.email, formData.password);
      
      // Navigation will be handled by useEffect after auth state updates
      console.log('✅ Login successful, waiting for auth state update...');
      
    } catch (error) {
      console.error('❌ Login failed:', error);
      setErrors({ submit: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrors({});
    
    try {
      console.log('🔐 Attempting Google login...');
      await loginWithGoogle();
      // This will redirect the page, so no further code execution
    } catch (error) {
      console.error('❌ Google login failed:', error);
      if (error.message !== 'Google sign-in cancelled') {
        setErrors({ submit: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while authentication state is being determined
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Welcome Back
        </h2>
        <p className="mt-2 text-gray-600">
          Sign in to your account to continue
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          required
          error={errors.email}
          leftIcon={<EnvelopeIcon className="w-5 h-5" />}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
            error={errors.password}
          />
          <button
            type="button"
            className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeSlashIcon className="w-5 h-5" />
            ) : (
              <EyeIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {errors.submit && (
          <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg text-danger-700 text-sm">
            {errors.submit}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isLoading}
          disabled={isLoading}
        >
          Sign In
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <Button
        variant="secondary"
        fullWidth
        onClick={handleGoogleLogin}
        disabled={isLoading}
        leftIcon={
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        }
      >
        Sign in with Google
      </Button>

      <div className="text-center space-y-2">
        <Link
          to="/forgot-password"
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Forgot your password?
        </Link>
        <div className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Sign up here
          </Link>
        </div>
        <div className="text-sm text-gray-600">
          Are you a pastor?{' '}
          <Link
            to="/pastor-login"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Pastor Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
