import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@components/Button.jsx';
import { InputField } from '@components/InputField.jsx';
import { Card } from '@components/Card.jsx';
import { useAuth } from '@context/AuthContext.jsx';
import {
  validateAuthForm,
  normalizeEmail,
  PASSWORD_HELP_TEXT,
  EMAIL_HELP_TEXT
} from '@utils/authValidation.js';
import './AuthViews.css';

const INITIAL_STATE = {
  email: '',
  password: ''
};

export const LoginView = () => {
  const [formState, setFormState] = useState(INITIAL_STATE);
  const [localError, setLocalError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => {
      if (!prev[name]) {
        return prev;
      }
      const { [name]: _removed, ...rest } = prev;
      return rest;
    });
    if (localError) {
      setLocalError(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLocalError(null);

    const validationErrors = validateAuthForm(formState);
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }
    try {
      await login({
        email: normalizeEmail(formState.email),
        password: formState.password
      });
      setFormErrors({});
      navigate('/banks');
    } catch (error) {
      if (error.fieldErrors) {
        setFormErrors(error.fieldErrors);
      }
      setLocalError(error.message || 'Ocurrió un error al iniciar sesión.');
    }
  };

  return (
    <div className="auth-view">
      <Card title="Iniciar sesión">
        <form className="auth-form" onSubmit={handleSubmit}>
          <InputField
            label="Correo electrónico"
            name="email"
            type="email"
            value={formState.email}
            onChange={handleChange}
            error={formErrors.email}
            helperText={EMAIL_HELP_TEXT}
            required
          />
          <InputField
            label="Contraseña"
            name="password"
            type="password"
            value={formState.password}
            onChange={handleChange}
            error={formErrors.password}
            helperText={PASSWORD_HELP_TEXT}
            allowTogglePassword
            required
          />
          {localError ? <span className="auth-error">{localError}</span> : null}
          <Button type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Entrar'}
          </Button>
          <span>
            ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
          </span>
        </form>
      </Card>
    </div>
  );
};
