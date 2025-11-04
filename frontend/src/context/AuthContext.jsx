import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginUser, registerUser } from '@apis/auth.js';
import { setAuthToken } from '@apis/client.js';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'pwa-belvo-auth';

const readStoredAuth = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed reading auth state', error);
    return null;
  }
};

const persistAuth = (payload) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed persisting auth state', error);
  }
};

const clearAuth = () => {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(readStoredAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authState?.token) {
      setAuthToken(authState.token);
    } else {
      setAuthToken(null);
    }
    if (authState) {
      persistAuth(authState);
    } else {
      clearAuth();
    }
  }, [authState]);

  const handleRegister = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await registerUser(credentials);
      setAuthState(response);
      return response;
    } catch (apiError) {
      setError(apiError.message);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await loginUser(credentials);
      setAuthState(response);
      return response;
    } catch (apiError) {
      setError(apiError.message);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthState(null);
  };

  const value = useMemo(
    () => ({
      user: authState?.user ?? null,
      token: authState?.token ?? null,
      loading,
      error,
      register: handleRegister,
      login: handleLogin,
      logout: handleLogout,
      isAuthenticated: Boolean(authState?.token)
    }),
    [authState, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
};
