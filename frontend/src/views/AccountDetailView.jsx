import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@components/Card.jsx';
import { Button } from '@components/Button.jsx';
import { Loader } from '@components/Loader.jsx';
import { KpiCard } from '@components/KpiCard.jsx';
import { TransactionList } from '@components/TransactionList.jsx';
import { fetchAccountSummary, fetchAccountTransactions } from '@apis/banks.js';
import { mockAccounts, mockSummary, mockTransactions } from '@apis/mockData.js';
import { useAsyncData } from '@hooks/useAsyncData.js';
import './AccountDetailView.css';

export const AccountDetailView = () => {
  const navigate = useNavigate();
  const { institutionId, accountId } = useParams();

  const account = useMemo(
    () => mockAccounts.find((item) => item.id === accountId),
    [accountId]
  );

  const { data: summary, loading: summaryLoading, error: summaryError } = useAsyncData(
    () => fetchAccountSummary(accountId),
    [accountId],
    { fallback: mockSummary[accountId] }
  );

  const {
    data: transactions,
    loading: transactionsLoading,
    error: transactionsError
  } = useAsyncData(
    () => fetchAccountTransactions(accountId),
    [accountId],
    { fallback: mockTransactions[accountId] }
  );

  const balance = useMemo(() => {
    if (!summary) {
      return null;
    }
    const income = Number(summary.income || 0);
    const expenses = Number(summary.expenses || 0);
    const computed = income - expenses;
    return {
      computed,
      income,
      expenses
    };
  }, [summary]);

  const title = account ? `${account.name} • ${account.number}` : 'Cuenta';

  return (
    <Card
      title={title}
      actions={
        <Button variant="ghost" type="button" onClick={() => navigate(`/banks/${institutionId}`)}>
          Regresar
        </Button>
      }
    >
      {summaryLoading || transactionsLoading ? <Loader label="Cargando información..." /> : null}
      {summaryError ? (
        <span className="error-inline">Mostrando resumen de ejemplo: {summaryError}</span>
      ) : null}
      {transactionsError ? (
        <span className="error-inline">Mostrando movimientos de ejemplo: {transactionsError}</span>
      ) : null}
      {balance ? (
        <div className="account-kpis">
          <KpiCard title="Balance" value={`$${balance.computed.toLocaleString()}`} />
          <div className="account-kpi-row">
            <KpiCard
              title="Ingresos"
              value={`$${balance.income.toLocaleString()}`}
              accent="positive"
            />
            <KpiCard
              title="Egresos"
              value={`$${balance.expenses.toLocaleString()}`}
              accent="negative"
            />
          </div>
        </div>
      ) : null}
      <div>
        <h3>Movimientos</h3>
        <TransactionList transactions={transactions} />
      </div>
    </Card>
  );
};
