import React from 'react';
import { Card } from '@components/Card.jsx';
import { Loader } from '@components/Loader.jsx';
import { Button } from '@components/Button.jsx';
import { fetchInstitutions } from '@apis/banks.js';
import { mockInstitutions } from '@apis/mockData.js';
import { useAsyncData } from '@hooks/useAsyncData.js';
import { useNavigate } from 'react-router-dom';

export const BankListView = () => {
  const navigate = useNavigate();
  const {
    data: institutions = [],
    loading: institutionsLoading,
    error: institutionsError,
    refresh: refreshInstitutions
  } = useAsyncData(fetchInstitutions, [], { fallback: mockInstitutions });

  const handleNavigate = (institution) => {
    navigate(`/banks/${institution.id}`, { state: { institution } });
  };

  return (
    <Card title="Bancos disponibles">
      {institutionsLoading ? <Loader label="Cargando bancos..." /> : null}
      {institutionsError ? (
        <span className="error-inline">
          Mostrando datos de ejemplo: {institutionsError.message}
        </span>
      ) : null}
      {institutions.length ? (
        <div className="table-scroll">
          <table className="link-list">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>País</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((institution) => (
                <tr key={institution.id}>
                  <td>
                    <strong>{institution.id}</strong>
                    <div className="link-list__subtitle">{institution.code || '—'}</div>
                  </td>
                  <td>{institution.name}</td>
                  <td>{institution.country || '—'}</td>
                  <td
                    className={`link-list__status ${
                      institution.is_linked ? 'link-list__status--valid' : ''
                    }`}
                  >
                    {institution.is_linked ? 'Con usuarios' : 'Sin usuarios'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="link-list__action"
                      onClick={() => handleNavigate(institution)}
                    >
                      Ver usuarios
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="link-list__empty">No se encontraron bancos registrados.</p>
      )}
      <Button type="button" variant="ghost" onClick={refreshInstitutions}>
        Actualizar lista
      </Button>
    </Card>
  );
};
