'use client';

/**
 * Authentication Context and Provider
 * Manages global authentication state, token storage, login, registration, and logout.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null as any);

/**
 * AuthProvider wraps the application and supplies authentication state to all components.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Loads the saved token from localStorage on initial mount
   * and verifies it by fetching the current user profile.
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
          setToken(savedToken);
          // Verify saved token against backend
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data?.data?.user) {
            setUser(res.data.data.user);
          } else {
            // Invalid user data received
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        }
      } catch (err) {
        // Token expired or invalid
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Authenticates a user with email and password, saves the JWT, and sets user state.
   */
  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success && res.data?.data) {
        const { token: receivedToken, user: receivedUser } = res.data.data;
        localStorage.setItem('token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
        return { success: true, user: receivedUser };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Login failed';
      return { success: false, message };
    }
  };

  /**
   * Registers a new citizen or business account, saves the JWT, and sets user state.
   */
  const register = async ({ name, email, password, role }) => {
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        role: role || 'citizen',
      });
      if (res.data?.success && res.data?.data) {
        const { token: receivedToken, user: receivedUser } = res.data.data;
        localStorage.setItem('token', receivedToken);
        setToken(receivedToken);
        setUser(receivedUser);
        return { success: true, user: receivedUser };
      }
      return { success: false, message: 'Invalid response from server' };
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Registration failed';
      return { success: false, message };
    }
  };

  /**
   * Logs out the user by clearing the JWT from localStorage and resetting user state.
   */
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  /**
   * Refreshes the user profile data from the backend.
   */
  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.data?.user) {
        setUser(res.data.data.user);
      }
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to easily access authentication context throughout the app.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
