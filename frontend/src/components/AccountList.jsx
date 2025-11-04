import React from 'react';
import { Link } from 'react-router-dom';
import './AccountList.css';

export const AccountList = ({ accounts, institutionId }) => {
  if (!accounts?.length) {
    return <p className="account-empty">No hay cuentas disponibles.</p>;
  }

  return (
    <ul className="account-list">
      {accounts.map((account) => (
        <li className="account-item" key={account.id}>
          <div className="account-summary">
            <span className="account-name">{account.name}</span>
            <span className="account-number">•••• {account.number}</span>
          </div>
          <div className="account-meta">
            <span className="account-type">{account.type}</span>
            <span className="account-balance">
              ${Number(account.balance || 0).toLocaleString()}
            </span>
            <Link className="account-link" to={`/banks/${institutionId}/accounts/${account.id}`}>
              Ver movimientos
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
};
