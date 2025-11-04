import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '@components/Card.jsx';
import { Loader } from '@components/Loader.jsx';
import { Button } from '@components/Button.jsx';
import { AccountList } from '@components/AccountList.jsx';
import { fetchAccountsByInstitution } from '@apis/banks.js';
import { mockAccounts, mockInstitutions } from '@apis/mockData.js';
import { useAsyncData } from '@hooks/useAsyncData.js';

export const BankDetailView = () => {
  const navigate = useNavigate();
  const { institutionId } = useParams();

  const fallbackAccounts = useMemo(
    () => mockAccounts.filter((account) => account.institutionId === institutionId),
    [institutionId]
  );

  const institution = useMemo(
    () => mockInstitutions.find((item) => item.id === institutionId),
    [institutionId]
  );

  const { data, loading, error } = useAsyncData(
    () => fetchAccountsByInstitution(institutionId),
    [institutionId],
    { fallback: fallbackAccounts }
  );

  const title = institution ? `Cuentas en ${institution.name}` : 'Cuentas';

  return (
    <Card
      title={title}
      actions={
        <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
          Regresar
        </Button>
      }
    >
      {loading ? <Loader label="Cargando cuentas..." /> : null}
      {error ? <span className="error-inline">Mostrando datos de ejemplo: {error}</span> : null}
      <AccountList accounts={data} institutionId={institutionId} />
    </Card>
  );
};
