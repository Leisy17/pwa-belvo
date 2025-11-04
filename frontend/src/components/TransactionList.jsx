import React from 'react';
import './TransactionList.css';

export const TransactionList = ({ transactions }) => {
  if (!transactions?.length) {
    return <p className="transaction-empty">No hay movimientos disponibles.</p>;
  }

  return (
    <ul className="transaction-list">
      {transactions.map((transaction) => (
        <li className="transaction-item" key={transaction.id}>
          <div className="transaction-meta">
            <span className="transaction-description">{transaction.description}</span>
            <span className="transaction-date">{transaction.date}</span>
          </div>
          <span
            className={`transaction-amount ${
              transaction.type === 'income' ? 'transaction-income' : 'transaction-expense'
            }`}
          >
            {transaction.type === 'income' ? '+' : '-'}
            {transaction.amount} {transaction.currency}
          </span>
        </li>
      ))}
    </ul>
  );
};
