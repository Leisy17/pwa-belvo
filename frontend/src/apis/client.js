import { envConfig } from '@env/config.js';

const defaultHeaders = {
  'Content-Type': 'application/json'
};

let authToken = null;

const buildUrl = (path) => `${envConfig.apiBaseUrl}${path}`;

const withAuthHeader = (headers = {}) => {
  console.log("authToken", authToken);
  if (!authToken) return headers;
  return {
    ...headers,
    Authorization: `Bearer ${authToken}`
  };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch (err) {
      errorBody = null;
    }

    const parseErrorPayload = (body) => {
      if (!body) return { message: 'Ocurrió un error inesperado.' };
      if (typeof body.detail === 'string') return { message: body.detail };
      if (Array.isArray(body.detail)) {
        const fieldErrors = body.detail.reduce((acc, item) => {
          const path = item?.loc;
          const message = item?.msg;
          if (message && Array.isArray(path)) acc[path[path.length - 1]] = message;
          return acc;
        }, {});
        const combinedMessage = body.detail.map((item) => item?.msg).filter(Boolean).join(' ') || 'Error de validación.';
        return { message: combinedMessage, fieldErrors };
      }
      if (body.message) return { message: body.message };
      if (body.error) return { message: body.error };
      return { message: 'Ocurrió un error inesperado.' };
    };

    const { message, fieldErrors } = parseErrorPayload(errorBody);
    const apiError = new Error(message);
    apiError.status = response.status;
    apiError.body = errorBody;
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      apiError.fieldErrors = fieldErrors;
    }
    throw apiError;
  }

  if (response.status === 204) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const setAuthToken = (token) => {
  authToken = token;
};

export const apiClient = {
  get: async (path, options = {}) => {
    const response = await fetch(buildUrl(path), {
      method: 'GET',
      headers: withAuthHeader({ ...defaultHeaders, ...options.headers })
    });
    return handleResponse(response);
  },
  post: async (path, body, options = {}) => {
    const response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: withAuthHeader({ ...defaultHeaders, ...options.headers }),
      body: JSON.stringify(body)
    });
    return handleResponse(response);
  }
};
