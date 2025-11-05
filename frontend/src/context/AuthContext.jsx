import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { loginUser, registerUser } from '@apis/auth.js';
import { clearAuthTokens, registerAuthRefreshHandler, setAuthTokens } from '@apis/client.js';

const AuthContext = createContext(null);

const AUTH_STORAGE_KEY = 'pwa-belvo-auth';

const mapAuthResponseToState = (payload, fallback = {}) => {
  if (!payload) {
    return null;
  }

  const now = Date.now();
  const base = fallback || {};

  const user = payload.user ?? base.user ?? null;
  const accessToken =
    payload.access_token ??
    payload.accessToken ??
    base.accessToken ??
    base.token ??
    null;
  const refreshToken =
    payload.refresh_token ?? payload.refreshToken ?? base.refreshToken ?? null;
  const tokenType = payload.token_type ?? payload.tokenType ?? base.tokenType ?? 'bearer';
  const expiresIn = payload.expires_in ?? payload.expiresIn ?? base.expiresIn ?? null;
  const refreshExpiresIn =
    payload.refresh_expires_in ?? payload.refreshExpiresIn ?? base.refreshExpiresIn ?? null;

  const accessTokenExpiresAt =
    payload.expires_in !== undefined && payload.expires_in !== null
      ? now + payload.expires_in * 1000
      : base.accessTokenExpiresAt ?? null;
  const refreshTokenExpiresAt =
    payload.refresh_expires_in !== undefined && payload.refresh_expires_in !== null
      ? now + payload.refresh_expires_in * 1000
      : base.refreshTokenExpiresAt ?? null;

  return {
    user,
    accessToken,
    refreshToken,
    tokenType,
    expiresIn,
    refreshExpiresIn,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    issuedAt: now
  };
};

const normalizeStoredAuth = (raw) => {
  if (!raw) {
    return null;
  }
  if (raw.accessToken) {
    const state = mapAuthResponseToState(raw, raw);
    return state?.accessToken && state?.refreshToken ? state : null;
  }
  if (raw.token) {
    const state = mapAuthResponseToState(
      {
        user: raw.user,
        access_token: raw.token,
        refresh_token: raw.refreshToken,
        token_type: raw.tokenType ?? raw.token_type,
        expires_in: raw.expiresIn,
        refresh_expires_in: raw.refreshExpiresIn
      },
      raw
    );
    return state?.accessToken && state?.refreshToken ? state : null;
  }
  return null;
};

const readStoredAuth = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const normalized = normalizeStoredAuth(parsed);
    if (normalized?.accessToken && normalized?.refreshToken) {
      setAuthTokens({
        accessToken: normalized.accessToken,
        refreshToken: normalized.refreshToken
      });
    }
    return normalized;
  } catch (error) {
    console.error('Failed reading auth state', error);
    return null;
  }
};

const persistAuthState = (payload) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed persisting auth state', error);
  }
};

const clearStoredAuth = () => {
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
    const unsubscribe = registerAuthRefreshHandler((payload) => {
      if (!payload) {
        setAuthState(null);
        return;
      }
      setAuthState((prev) => mapAuthResponseToState(payload, prev ?? undefined));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (authState) {
      setAuthTokens({
        accessToken: authState.accessToken,
        refreshToken: authState.refreshToken
      });
      persistAuthState(authState);
    } else {
      clearAuthTokens();
      clearStoredAuth();
    }
  }, [authState]);

  const handleRegister = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await registerUser(credentials);
      const nextState = mapAuthResponseToState(response);
      if (!nextState?.accessToken || !nextState?.refreshToken) {
        throw new Error('La respuesta de autenticación no es válida.');
      }
      setAuthState(nextState);
      return nextState;
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
      const nextState = mapAuthResponseToState(response);
      if (!nextState?.accessToken || !nextState?.refreshToken) {
        throw new Error('La respuesta de autenticación no es válida.');
      }
      setAuthState(nextState);
      return nextState;
    } catch (apiError) {
      setError(apiError.message);
      throw apiError;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setAuthState(null);
    setError(null);
  };

  const value = useMemo(
    () => ({
      user: authState?.user ?? null,
      token: authState?.accessToken ?? null,
      accessToken: authState?.accessToken ?? null,
      refreshToken: authState?.refreshToken ?? null,
      authState,
      loading,
      error,
      register: handleRegister,
      login: handleLogin,
      logout: handleLogout,
      isAuthenticated: Boolean(authState?.accessToken)
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
