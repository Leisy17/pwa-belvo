import { apiClient } from './client.js';

export const fetchInstitutions = async () => {
  return apiClient.get('/banks');
};

export const fetchAccountSummary = async (accountId) => {
  return apiClient.get(`/accounts/${accountId}/summary`);
};

export const fetchAccountTransactions = async (accountId) => {
  return apiClient.get(`/accounts/${accountId}/transactions`);
};

export const createInstitutionLink = async (institutionId, payload) => {
  return apiClient.post(`/banks/${institutionId}/links`, payload, { retry: false });
};

export const fetchLinks = async () => {
  return apiClient.get('/banks/links');
};

export const fetchInstitutionLinks = async (institutionId) => {
  return apiClient.get(`/banks/${institutionId}/links`);
};

export const fetchLinkAccounts = async (linkId) => {
  return apiClient.get(`/banks/links/${linkId}/accounts`);
};

export const createLinkAccount = async (institutionId, linkId, payload) => {
  return apiClient.post(`/banks/${institutionId}/links/${linkId}/accounts`, payload);
};
