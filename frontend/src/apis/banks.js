import { apiClient } from './client.js';

export const fetchInstitutions = async () => {
  console.log(apiClient);
  return apiClient.get('/banks');
};

export const fetchAccountsByInstitution = async (institutionId) => {
  return apiClient.get(`/banks/${institutionId}/accounts`);
};

export const fetchAccountSummary = async (accountId) => {
  return apiClient.get(`/accounts/${accountId}/summary`);
};

export const fetchAccountTransactions = async (accountId) => {
  return apiClient.get(`/accounts/${accountId}/transactions`);
};
