export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSWORD_MAX_BYTES = 72;
export const PASSWORD_HELP_TEXT =
  'La contraseña debe tener entre 8 y 64 caracteres. Evita emojis o caracteres poco comunes.';
export const PASSWORD_TOO_LONG_TEXT =
  'La contraseña es demasiado larga. Usa máximo 64 caracteres y evita emojis o caracteres poco comunes.';
export const EMAIL_HELP_TEXT = 'Usa un correo válido (ejemplo: usuario@dominio.com).';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

const countPasswordBytes = (value) => {
  if (!value) {
    return 0;
  }
  return encoder ? encoder.encode(value).length : value.length;
};

export const normalizeEmail = (value = '') => value.trim();

export const validateAuthForm = ({ email, password }) => {
  const errors = {};
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    errors.email = 'Ingresa tu correo electrónico.';
  } else if (!EMAIL_REGEX.test(normalizedEmail)) {
    errors.email = EMAIL_HELP_TEXT;
  }

  if (!password) {
    errors.password = 'La contraseña es obligatoria.';
  } else if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  } else if (password.length > PASSWORD_MAX_LENGTH) {
    errors.password = PASSWORD_TOO_LONG_TEXT;
  } else if (countPasswordBytes(password) > PASSWORD_MAX_BYTES) {
    errors.password = PASSWORD_TOO_LONG_TEXT;
  }

  return errors;
};
