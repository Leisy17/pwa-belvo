import React from 'react';
import './Loader.css';

export const Loader = ({ label = 'Cargando...' }) => {
  return (
    <div className="loader">
      <span className="loader-spinner" />
      <span>{label}</span>
    </div>
  );
};
