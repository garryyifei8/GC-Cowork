import React from 'react';
import './StatusBadge.css';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps {
  status: StatusVariant;
  label: string;
  size?: 'sm' | 'md';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md' }) => {
  return (
    <span
      className={`status-badge status-badge--${status} status-badge--${size}`}
      aria-label={`Status: ${label}`}
    >
      <span className="status-badge__dot" aria-hidden="true" />
      <span className="status-badge__label">{label}</span>
    </span>
  );
};

export default StatusBadge;
