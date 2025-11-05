import React from 'react';
import './AccountTable.css';

const formatCurrency = (value) => {
  const numeric = Number(value || 0);
  return `$${numeric.toLocaleString()}`;
};

const maskAccountNumber = (number) => {
  if (!number) {
    return '—';
  }
  const text = String(number);
  if (text.length <= 4) {
    return text;
  }
  return `•••• ${text.slice(-4)}`;
};

export const AccountTable = ({ accounts = [], onViewTransactions }) => {
  if (!accounts.length) {
    return <p className="account-table__empty">No se registraron cuentas todavía.</p>;
  }

  const handleView = (account) => {
    if (typeof onViewTransactions === 'function') {
      onViewTransactions(account);
    }
  };

  return (
    <div className="table-scroll">
      <table className="account-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Número</th>
            <th>Saldo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((account) => (
            <tr key={account.id}>
              <td>{account.id}</td>
              <td>{account.name || 'Cuenta'}</td>
              <td>{account.type || '—'}</td>
              <td>{maskAccountNumber(account.number)}</td>
              <td>{formatCurrency(account.balance)}</td>
              <td>
                <button
                  type="button"
                  className="account-table__action"
                  onClick={() => handleView(account)}
                >
                  Ver transacciones
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
