import React, { useState } from 'react';
import { InputField } from '@components/InputField.jsx';
import { Button } from '@components/Button.jsx';
import './AccountForm.css';

const initialState = {
  reference_id: '',
  name: '',
  type: '',
  number: '',
  currency: '',
  balance: ''
};

export const AccountForm = ({ onSubmit, loading = false, error = null }) => {
  const [formState, setFormState] = useState(initialState);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (typeof onSubmit !== 'function') {
      return;
    }
    const payload = {
      reference_id: formState.reference_id.trim() || null,
      name: formState.name.trim(),
      type: formState.type.trim() || null,
      number: formState.number.trim() || null,
      currency: formState.currency.trim().toUpperCase() || null,
      balance: formState.balance === '' ? 0 : Number(formState.balance)
    };
    if (!payload.name) {
      return;
    }
    if (Number.isNaN(payload.balance)) {
      payload.balance = 0;
    }
    onSubmit(payload);
  };

  return (
    <form className="account-form" onSubmit={handleSubmit}>
      <h3>Registrar nueva cuenta</h3>
      <div className="account-form__grid">
        <InputField
          label="Código de la cuenta"
          name="reference_id"
          value={formState.reference_id}
          onChange={handleChange}
          helperText="Opcional. Si lo omites se generará uno automáticamente."
        />
        <InputField
          label="Nombre"
          name="name"
          value={formState.name}
          onChange={handleChange}
          required
        />
        <InputField
          label="Tipo"
          name="type"
          value={formState.type}
          onChange={handleChange}
        />
        <InputField
          label="Número"
          name="number"
          value={formState.number}
          onChange={handleChange}
        />
        <InputField
          label="Moneda"
          name="currency"
          value={formState.currency}
          onChange={handleChange}
          helperText="Ejemplo: MXN, USD"
        />
        <InputField
          label="Saldo inicial"
          name="balance"
          type="number"
          step="0.01"
          value={formState.balance}
          onChange={handleChange}
        />
      </div>
      {error ? <span className="account-form__error">{error}</span> : null}
      <div className="account-form__actions">
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cuenta'}
        </Button>
      </div>
    </form>
  );
};
