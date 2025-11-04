import React from 'react';
import './KpiCard.css';

export const KpiCard = ({ title, value, accent }) => {
  return (
    <div className="kpi-card" data-accent={accent}>
      <span className="kpi-title">{title}</span>
      <strong className="kpi-value">{value}</strong>
    </div>
  );
};
