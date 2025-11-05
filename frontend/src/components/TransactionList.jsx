import React from 'react';
import './TransactionList.css';

export const TransactionList = ({ transactions }) => {
  if (!transactions?.length) {
    return <p className="transaction-empty">No hay movimientos disponibles.</p>;
  }

  return (
    <ul className="transaction-list">
      {transactions.map((transaction) => {
        const normalizedType = (transaction.type || '').toString().toUpperCase();
        const isIncome = normalizedType === 'CREDIT' || normalizedType === 'INCOME';
        const isExpense = normalizedType === 'DEBIT' || normalizedType === 'EXPENSE';
        const formattedDate = new Date(transaction.date).toLocaleDateString('es-MX', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });

        const numericAmount = Number(transaction.amount ?? 0);
        const formattedAmount = new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: (transaction.currency || 'MXN').toUpperCase(),
        }).format(Math.abs(numericAmount));

        return (
          <li className="transaction-item" key={transaction.id}>
            <div className="transaction-meta">
              <span className="transaction-description">{transaction.description || 'Sin descripción'}</span>
              <span className="transaction-date">{formattedDate}</span>
            </div>
            <span
              className={`transaction-amount ${
                isIncome ? 'transaction-income' : isExpense ? 'transaction-expense' : ''
              }`}
            >
              {isIncome ? '+' : isExpense ? '-' : ''}
              {formattedAmount}
            </span>
          </li>
        );
      })}
    </ul>
  );
};
