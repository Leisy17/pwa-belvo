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
        <Link
          className={`bank-card ${bank.is_linked ? 'bank-card--linked' : ''}`}
          to={`/banks/${bank.id}`}
          key={bank.id}
          state={{ institution: bank }}
        >
          <span className="bank-name">{bank.name}</span>
          <span className="bank-country">{bank.country}</span>
          <span className="bank-type">{bank.type}</span>
          {bank.is_linked ? <span className="bank-badge">Enlazado</span> : null}
          {bank.is_linked && bank.link_username ? (
            <span className="bank-user">Usuario banco: {bank.link_username}</span>
          ) : null}
          {bank.is_linked && bank.linked_email ? (
            <span className="bank-user">Registrado por: {bank.linked_email}</span>
          ) : null}
        </Link>
      ))}
    </div>
  );
};
