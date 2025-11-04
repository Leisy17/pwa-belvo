import { apiClient } from './client.js';

export const registerUser = async (payload) => {
  return apiClient.post('/auth/register', payload);
};

export const loginUser = async (payload) => {
  return apiClient.post('/auth/login', payload);
};
