/**
 * Axios API Client Configuration
 * Sets up the base HTTP client with automatic Authorization header injection
 * using the JWT stored in localStorage.
 */

import axios from 'axios';

// Create configured axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor to automatically attach the JWT token
 * to every outgoing request if available in localStorage.
 */
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle unauthenticated responses.
 * If 401 is received, it clears any invalid token from localStorage.
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== 'undefined' &&
      error.response &&
      error.response.status === 401
    ) {
      // Clear token if it expired or is invalid
      localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;
