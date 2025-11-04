import React from 'react';
import { Card } from '@components/Card.jsx';
import { Loader } from '@components/Loader.jsx';
import { BankGrid } from '@components/BankGrid.jsx';
import { fetchInstitutions } from '@apis/banks.js';
import { mockInstitutions } from '@apis/mockData.js';
import { useAsyncData } from '@hooks/useAsyncData.js';

export const BankListView = () => {
  const { data, loading, error } = useAsyncData(fetchInstitutions, [], {
    fallback: mockInstitutions
  });

  return (
    <Card title="Instituciones">
      {loading ? <Loader label="Cargando instituciones..." /> : null}
      {error ? <span className="error-inline">Mostrando datos de ejemplo: {error}</span> : null}
      <BankGrid banks={data} />
    </Card>
  );
};
