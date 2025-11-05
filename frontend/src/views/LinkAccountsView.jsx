import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card } from '@components/Card.jsx';
import { Loader } from '@components/Loader.jsx';
import { Button } from '@components/Button.jsx';
import { AccountTable } from '@components/AccountTable.jsx';
import { AccountForm } from '@components/AccountForm.jsx';
import { mockAccounts } from '@apis/mockData.js';
import { createLinkAccount, fetchLinkAccounts } from '@apis/banks.js';
import { useAsyncData } from '@hooks/useAsyncData.js';
import './LinkAccountsView.css';

export const LinkAccountsView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { institutionId, linkId } = useParams();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fallbackLink = useMemo(() => location.state?.link || null, [location.state]);
  const fallbackInstitution = useMemo(
    () => location.state?.institution || null,
    [location.state]
  );
  const fallbackAccounts = useMemo(
    () =>
      mockAccounts.filter(
        (item) =>
          item.institutionId === institutionId || item.institution_id === institutionId
      ),
    [institutionId]
  );

  const {
    data: payload = { link: fallbackLink, accounts: [] },
    loading,
    error,
    refresh
  } = useAsyncData(() => fetchLinkAccounts(linkId), [linkId], {
    fallback: { link: fallbackLink, accounts: fallbackAccounts }
  });

  const link = payload?.link || fallbackLink;
  const accounts = payload?.accounts || [];

  const institutionName =
    fallbackInstitution?.name ||
    link?.institution_display_name ||
    link?.institution_name ||
    'Banco';

  const handleToggleForm = () => {
    setIsFormOpen((prev) => !prev);
    setFormError(null);
  };

  const handleCreateAccount = async (accountData) => {
    setFormError(null);
    setFormLoading(true);
    try {
      await createLinkAccount(institutionId, linkId, accountData);
      await refresh();
      setIsFormOpen(false);
    } catch (apiError) {
      setFormError(apiError.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleViewTransactions = (account) => {
    navigate(`/banks/${institutionId}/accounts/${account.id}`, {
      state: { account, institutionId, linkId, institution: fallbackInstitution }
    });
  };

  const handleGoBack = () => {
    navigate(`/banks/${institutionId}`, {
      state: { institution: fallbackInstitution }
    });
  };

  return (
    <Card
      title={`Cuentas vinculadas • ${institutionName}`}
      actions={
        <Button variant="ghost" type="button" onClick={handleGoBack}>
          Regresar
        </Button>
      }
    >
      {loading ? <Loader label="Cargando cuentas..." /> : null}
      {error ? (
        <span className="error-inline">
          No fue posible obtener las cuentas: {error.message}
        </span>
      ) : null}
      {link ? (
        <div className="link-meta">
          <span className="link-meta__item">
            <strong>ID:</strong> {link.id}
          </span>
          <span className="link-meta__item">
            <strong>Usuario:</strong> {link.username || '—'}
          </span>
          <span className="link-meta__item">
            <strong>Estado:</strong> {link.status}
          </span>
        </div>
      ) : null}
      <AccountTable accounts={accounts} onViewTransactions={handleViewTransactions} />
      <div className="account-actions">
        <Button type="button" onClick={handleToggleForm}>
          {isFormOpen ? 'Cancelar registro' : 'Registrar nueva cuenta'}
        </Button>
        <Button type="button" variant="ghost" onClick={refresh}>
          Actualizar listado
        </Button>
      </div>
      {isFormOpen ? (
        <AccountForm
          onSubmit={handleCreateAccount}
          loading={formLoading}
          error={formError}
        />
      ) : null}
    </Card>
  );
};
