import React from 'react';
import { Link } from 'react-router-dom';
import './BankGrid.css';

export const BankGrid = ({ banks }) => {
  if (!banks?.length) {
    return <p className="bank-empty">No encontramos instituciones disponibles.</p>;
  }

  return (
    <div className="bank-grid">
      {banks.map((bank) => (
        <Link className="bank-card" to={`/banks/${bank.id}`} key={bank.id}>
          <span className="bank-name">{bank.name}</span>
          <span className="bank-country">{bank.country}</span>
          <span className="bank-type">{bank.type}</span>
        </Link>
      ))}
    </div>
  );
};
