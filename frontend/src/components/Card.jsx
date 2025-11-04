import React from 'react';
import './Card.css';

export const Card = ({ title, actions, children }) => {
  return (
    <section className="card">
      {title ? (
        <header className="card-header">
          <h2>{title}</h2>
          {actions ? <div className="card-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="card-body">{children}</div>
    </section>
  );
};
