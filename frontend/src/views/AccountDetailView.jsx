import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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
  const location = useLocation();
  const { accountId } = useParams();

  const account = useMemo(
    () =>
      location.state?.account ||
      mockAccounts.find((item) => item.id === accountId) ||
      null,
    [accountId, location.state]
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
    if (!summary) return null;

    const income = Number(summary.income || 0);
    const expenses = Number(summary.expenses || 0);

    const ingresos = income;
    const egresos = expenses;
    const computedBalance = ingresos - egresos;

    return {
      computedBalance,
      ingresos,
      egresos
    };
  }, [summary]);

  const title = account
    ? `${account.name}${account?.number ? ` • ${account.number}` : ''}`
    : 'Cuenta';

  return (
    <Card
      title={title}
      actions={
        <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
          Regresar
        </Button>
      }
    >
      {summaryLoading || transactionsLoading ? <Loader label="Cargando información..." /> : null}
      {summaryError && (
        <span className="error-inline">
          Mostrando resumen de ejemplo: {summaryError.message}
        </span>
      )}
      {transactionsError && (
        <span className="error-inline">
          Mostrando movimientos de ejemplo: {transactionsError.message}
        </span>
      )}
      {balance && (
        <div className="account-kpis">
          <KpiCard title="Balance" value={`$${balance.computedBalance.toLocaleString()}`} />
          <div className="account-kpi-row">
            <KpiCard title="Ingresos" value={`$${balance.ingresos.toLocaleString()}`} accent="positive" />
            <KpiCard title="Egresos" value={`$${balance.egresos.toLocaleString()}`} accent="negative" />
          </div>
        </div>
      )}
      <div>
        <h3>Movimientos</h3>
        <TransactionList transactions={transactions} />
      </div>
    </Card>
  );
};
