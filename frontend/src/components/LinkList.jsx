import React from 'react';
import './LinkList.css';

export const LinkList = ({ links = [], onSelect, emptyMessage }) => {
  if (!links.length) {
    return (
      <p className="link-list__empty">
        {emptyMessage || 'Aún no has conectado usuarios para este banco.'}
      </p>
    );
  }

  const handleSelect = (link) => {
    if (typeof onSelect === 'function') {
      onSelect(link);
    }
  };

  return (
    <div className="table-scroll">
      <table className="link-list">
        <thead>
          <tr>
            <th>Código</th>
            <th>Usuario</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {links.map((link) => (
            <tr key={link.id}>
              <td>
                <strong>{link.id}</strong>
                <div className="link-list__subtitle">
                  {link.institution_display_name || link.institution_name || '—'}
                </div>
              </td>
              <td>{link.username || '—'}</td>
              <td
                className={`link-list__status link-list__status--${(link.status || '')
                  .toLowerCase()}`}
              >
                {link.status || 'desconocido'}
              </td>
              <td>
                <button
                  type="button"
                  className="link-list__action"
                  onClick={() => handleSelect(link)}
                >
                  Ver cuentas
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
