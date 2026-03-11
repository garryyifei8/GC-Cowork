import React from 'react';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

interface StatusBadgeProps {
  status: StatusVariant;
  label: string;
  size?: 'sm' | 'md';
}

const variantClasses: Record<StatusVariant, string> = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-info/10 text-info border-info/20',
  default: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, size = 'md' }) => {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-semibold border whitespace-nowrap ${variantClasses[status]} ${sizeClasses[size]}`}
      aria-label={`Status: ${label}`}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
