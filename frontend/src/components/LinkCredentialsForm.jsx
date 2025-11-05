import React, { useEffect, useState } from 'react';
import { InputField } from '@components/InputField.jsx';
import { Button } from '@components/Button.jsx';
import './LinkCredentialsForm.css';

const sanitize = (value) => (value == null ? '' : value);

export const LinkCredentialsForm = ({
  institutionName,
  initialValues,
  onSubmit,
  loading = false,
  error = null
}) => {
  const [formState, setFormState] = useState({
    username: sanitize(initialValues?.username),
    password: sanitize(initialValues?.password),
    token: sanitize(initialValues?.token)
  });

  useEffect(() => {
    setFormState({
      username: sanitize(initialValues?.username),
      password: sanitize(initialValues?.password),
      token: sanitize(initialValues?.token)
    });
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (typeof onSubmit === 'function') {
      onSubmit(formState);
    }
  };

  return (
    <form className="link-form" onSubmit={handleSubmit}>
      <h3>Conecta tus credenciales de prueba</h3>
      <p className="link-form__hint">
        Para el sandbox de Belvo puedes usar credenciales demo. Por ejemplo: usuario
        <code> user_ok </code> y contraseña <code> pass_ok </code> con token <code>123456</code>.
      </p>
      <div className="link-form__fields">
        <InputField
          label="Usuario"
          name="username"
          value={formState.username}
          onChange={handleChange}
          pattern="[A-Za-z0-9_]+"
          title="Usa letras, números o guion bajo."
          required
        />
        <InputField
          label="Contraseña"
          name="password"
          type="password"
          value={formState.password}
          onChange={handleChange}
          allowTogglePassword
          required
        />
        <InputField
          label="Token (si aplica)"
          name="token"
          value={formState.token}
          onChange={handleChange}
          helperText="Algunos bancos sandbox requieren un token numérico."
        />
      </div>
      {error ? <span className="link-form__error">{error}</span> : null}
      <Button type="submit" disabled={loading}>
        {loading ? 'Creando enlace…' : `Conectar ${institutionName || 'banco'}`}
      </Button>
    </form>
  );
};
