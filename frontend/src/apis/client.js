import { envConfig } from '@env/config.js';

const defaultHeaders = {
  'Content-Type': 'application/json'
};

const buildUrl = (path) => `${envConfig.apiBaseUrl}${path}`;

let authTokens = {
  accessToken: null,
  refreshToken: null
};

let refreshPromise = null;
let refreshListener = null;

const parseErrorPayload = (body) => {
  if (!body) {
    return { message: 'Ocurrió un error inesperado.' };
  }
  if (typeof body.detail === 'string') {
    return { message: body.detail };
  }
  if (Array.isArray(body.detail)) {
    const fieldErrors = body.detail.reduce((acc, item) => {
      const path = item?.loc;
      const message = item?.msg;
      if (message && Array.isArray(path)) {
        const fieldKey = path[path.length - 1];
        if (typeof fieldKey === 'string') {
          acc[fieldKey] = message;
        }
      }
      return acc;
    }, {});
    const combinedMessage =
      body.detail.map((item) => item?.msg).filter(Boolean).join(' ') || 'Error de validación.';
    return { message: combinedMessage, fieldErrors };
  }
  if (body.message) {
    return { message: body.message };
  }
  if (body.error) {
    return { message: body.error };
  }
  return { message: 'Ocurrió un error inesperado.' };
};

const handleResponse = async (response) => {
  if (!response.ok) {
    let errorBody = null;
    try {
      errorBody = await response.json();
    } catch (error) {
      errorBody = null;
    }
    const { message, fieldErrors } = parseErrorPayload(errorBody);
    const apiError = new Error(message);
    apiError.status = response.status;
    apiError.body = errorBody;
    if (fieldErrors && Object.keys(fieldErrors).length > 0) {
      apiError.fieldErrors = fieldErrors;
    }
    throw apiError;
  }

  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const notifyRefreshListener = (payload) => {
  if (typeof refreshListener === 'function') {
    refreshListener(payload);
  }
};

const refreshAccessToken = async () => {
  if (!authTokens.refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers: { ...defaultHeaders },
      body: JSON.stringify({ refresh_token: authTokens.refreshToken })
    })
      .then(handleResponse)
      .then((data) => {
        setAuthTokens({
          accessToken: data.access_token,
          refreshToken: data.refresh_token
        });
        notifyRefreshListener(data);
        return data;
      })
      .catch((error) => {
        clearAuthTokens();
        notifyRefreshListener(null);
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

const prepareHeaders = (headers = {}, auth = true) => {
  const prepared = { ...defaultHeaders, ...headers };
  if (auth && authTokens.accessToken) {
    prepared.Authorization = `Bearer ${authTokens.accessToken}`;
  }
  return prepared;
};

const prepareBody = (body) => {
  if (body === undefined || body === null) {
    return undefined;
  }
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return body;
  }
  if (typeof body === 'string') {
    return body;
  }
  return JSON.stringify(body);
};

const request = async (method, path, options = {}) => {
  const { body, headers, auth = true, retry = true, signal } = options;
  const payload = prepareBody(body);
  const preparedHeaders = prepareHeaders(headers, auth);

  if (payload instanceof FormData) {
    delete preparedHeaders['Content-Type'];
  }

  const fetchOptions = {
    method,
    headers: preparedHeaders,
    signal
  };

  if (payload !== undefined) {
    fetchOptions.body = payload;
  }

  const response = await fetch(buildUrl(path), fetchOptions);

  try {
    return await handleResponse(response);
  } catch (error) {
    if (auth && error.status === 401 && retry && authTokens.refreshToken) {
      // eslint-disable-next-line no-useless-catch
      try {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          return request(method, path, { body, headers, auth, retry: false, signal });
        }
      } catch (refreshError) {
        throw refreshError;
      }
    }
    throw error;
  }
};

export const setAuthTokens = (tokens = {}) => {
  authTokens = {
    accessToken: tokens.accessToken ?? null,
    refreshToken: tokens.refreshToken ?? null
  };
};

export const clearAuthTokens = () => {
  authTokens = { accessToken: null, refreshToken: null };
};

export const getAuthTokens = () => ({ ...authTokens });

export const registerAuthRefreshHandler = (handler) => {
  refreshListener = handler;
  return () => {
    if (refreshListener === handler) {
      refreshListener = null;
    }
  };
};

export const apiClient = {
  get: (path, options = {}) => request('GET', path, options),
  post: (path, body, options = {}) => request('POST', path, { ...options, body })
};
