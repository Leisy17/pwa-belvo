const DEFAULT_CREDENTIALS = {
  'mx_retail': {
    username: 'user_ok',
    password: 'pass_ok',
    token: '123456'
  },
  'mx_retail_qsr': {
    username: 'user-ok',
    password: 'pass-ok',
    token: '123456'
  }
};

const FALLBACK_CREDENTIALS = {
  username: 'user_ok',
  password: 'pass_ok',
  token: '123456'
};

export const getDefaultSandboxCredentials = (institutionId) => {
  if (!institutionId) {
    return { ...FALLBACK_CREDENTIALS };
  }
  const key = institutionId.toLowerCase();
  if (DEFAULT_CREDENTIALS[key]) {
    return { ...DEFAULT_CREDENTIALS[key] };
  }
  return { ...FALLBACK_CREDENTIALS };
};
