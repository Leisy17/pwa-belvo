import { apiClient } from './client.js';

export const registerUser = async (payload) => {
  return apiClient.post('/auth/register', payload, { auth: false });
};

export const loginUser = async (payload) => {
  return apiClient.post('/auth/login', payload, { auth: false });
};

export const refreshSession = async (refreshToken) => {
  return apiClient.post(
    '/auth/refresh',
    { refresh_token: refreshToken },
    { auth: false, retry: false }
  );
};
