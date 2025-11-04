import React, { useState } from 'react';
import './InputField.css';

export const InputField = ({
  label,
  type = 'text',
  error,
  helperText,
  allowTogglePassword = false,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === 'password';
  const shouldToggle = allowTogglePassword && isPassword;
  const resolvedType = shouldToggle && isPasswordVisible ? 'text' : type;

  const toggleVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const feedback = error ? (
    <span className="input-helper input-helper-error">{error}</span>
  ) : helperText ? (
    <span className="input-helper">{helperText}</span>
  ) : null;

  return (
    <label className="input-field">
      <span className="input-label">{label}</span>
      <div className={`input-wrapper ${error ? 'input-wrapper-error' : ''}`}>
        <input
          className={`input-control ${error ? 'input-control-error' : ''}`}
          type={resolvedType}
          {...props}
        />
        {shouldToggle ? (
          <button
            type="button"
            className="input-toggle"
            onClick={toggleVisibility}
            aria-label={isPasswordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {isPasswordVisible ? 'Ocultar' : 'Mostrar'}
          </button>
        ) : null}
      </div>
      {feedback}
    </label>
  );
};
