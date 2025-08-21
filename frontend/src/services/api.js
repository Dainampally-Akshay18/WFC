import axios from 'axios';
import { auth } from '../config/firebase';

// Ensure we're using HTTP for localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

console.log('🔗 API Base URL:', API_BASE_URL); // Debug log
console.log('🌍 Environment:', import.meta.env.MODE); // Debug log

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor with better logging
api.interceptors.request.use(
  async (config) => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Enhanced debug logging
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log(`🎯 Full URL: ${config.baseURL}${config.url}`);
      console.log(`🔒 Protocol: ${config.baseURL.startsWith('https') ? 'HTTPS' : 'HTTP'}`);
      
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.error('📊 Error Details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });
    
    // Don't redirect on 401 for now during debugging
    if (error.response?.status === 401) {
      console.warn('🔓 Authentication required - would normally redirect to login');
    }
    
    return Promise.reject(error);
  }
);

export default api;
