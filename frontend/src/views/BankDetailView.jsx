import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card } from '@components/Card.jsx';
import { Loader } from '@components/Loader.jsx';
import { Button } from '@components/Button.jsx';
import { LinkCredentialsForm } from '@components/LinkCredentialsForm.jsx';
import { LinkList } from '@components/LinkList.jsx';
import { createInstitutionLink, fetchInstitutionLinks } from '@apis/banks.js';
import { mockInstitutions } from '@apis/mockData.js';
import { useAsyncData } from '@hooks/useAsyncData.js';
import { getDefaultSandboxCredentials } from '@utils/sandboxCredentials.js';
import './BankDetailView.css';

export const BankDetailView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { institutionId } = useParams();
  const initialInstitution = useMemo(() => {
    return (
      location.state?.institution ||
      mockInstitutions.find((item) => item.id === institutionId) ||
      null
    );
  }, [institutionId, location.state]);

  const [linkError, setLinkError] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const institutionName =
    initialInstitution?.name ||
    'Banco';

  const defaultCredentials = useMemo(
    () => getDefaultSandboxCredentials(institutionId),
    [institutionId]
  );

  const {
    data: links = [],
    loading: linksLoading,
    error: linksError,
    refresh: refreshLinks
  } = useAsyncData(() => fetchInstitutionLinks(institutionId), [institutionId], {
    fallback: []
  });

  const handleLinkSubmit = async (credentials) => {
    setLinkError(null);
    setLinkLoading(true);
    try {
      const institutionInternalName =
        initialInstitution?.internal_name ||
        links?.[0]?.institution_name ||
        institutionId;
      const payload = {
        institution_name: institutionInternalName,
        institution_display_name: institutionName,
        username: credentials.username.trim(),
        password: credentials.password,
        access_mode: 'single'
      };
      if (credentials.token) {
        payload.token = credentials.token.trim();
      }
      await createInstitutionLink(institutionId, payload);
      await refreshLinks();
      setIsFormVisible(false);
    } catch (apiError) {
      console.error('Failed to create link', apiError);
      setLinkError(apiError.message);
    } finally {
      setLinkLoading(false);
    }
  };

  const handleViewAccounts = (link) => {
    if (!link?.id) {
      return;
    }
    const statePayload = {
      institution: initialInstitution,
      link
    };
    navigate(`/banks/${institutionId}/links/${link.id}`, { state: statePayload });
  };

  const emptyMessage = 'Aún no has registrado usuarios vinculados para este banco.';

  return (
    <Card
      title={`Usuarios vinculados a ${institutionName}`}
      actions={
        <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
          Regresar
        </Button>
      }
    >
      {linksLoading ? <Loader label="Cargando usuarios..." /> : null}
      {linksError ? (
        <span className="error-inline">
          No fue posible obtener los enlaces: {linksError.message}
        </span>
      ) : null}
      <LinkList links={links} onSelect={handleViewAccounts} emptyMessage={emptyMessage} />
      <div className="link-detail__actions">
        <Button type="button" onClick={() => setIsFormVisible((prev) => !prev)}>
          {isFormVisible ? 'Ocultar formulario' : 'Conectar nuevo usuario'}
        </Button>
        <Button type="button" variant="ghost" onClick={refreshLinks}>
          Actualizar usuarios
        </Button>
      </div>
      {isFormVisible ? (
        <LinkCredentialsForm
          institutionName={institutionName}
          initialValues={defaultCredentials}
          onSubmit={handleLinkSubmit}
          loading={linkLoading}
          error={linkError}
        />
      ) : null}
    </Card>
  );
};
