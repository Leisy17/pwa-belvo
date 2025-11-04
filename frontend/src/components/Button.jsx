import React from 'react';
import './Button.css';

export const Button = ({ children, variant = 'primary', type = 'button', ...props }) => {
  return (
    <button className={`btn btn-${variant}`} type={type} {...props}>
      {children}
    </button>
  );
};
