import React from 'react';
import type { InteractiveCard } from '../../types';

interface AlertCardProps {
  card: InteractiveCard;
}

type AlertStatus = NonNullable<InteractiveCard['status']>;

const BORDER_ACCENT: Record<AlertStatus, string> = {
  success: 'border-l-success',
  warning: 'border-l-warning',
  danger: 'border-l-danger',
  info: 'border-l-info',
};

const DOT_COLOR: Record<AlertStatus, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
};

export const AlertCard: React.FC<AlertCardProps> = ({ card }) => {
  const rawSeverity = card.status || card.data?.severity || 'info';
  // Ensure severity is a valid AlertStatus, fallback to 'info'
  const validStatuses: AlertStatus[] = ['success', 'warning', 'danger', 'info'];
  const status: AlertStatus = validStatuses.includes(rawSeverity as AlertStatus)
    ? (rawSeverity as AlertStatus)
    : 'info';

  const handleAction = (action?: string) => {
    if (action) {
      console.log('[AlertCard] action triggered:', action);
    }
  };

  return (
    <div
      className={`bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border border-l-4 ${BORDER_ACCENT[status]} rounded-xl p-4 transition-colors duration-200 hover:-translate-y-px hover:shadow-sm`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLOR[status]}`}
          aria-hidden="true"
        />
        <p className="text-sm font-semibold m-0 leading-snug">{card.title}</p>
      </div>

      {card.content && (
        <p className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary leading-relaxed m-0">
          {card.content}
        </p>
      )}

      {card.data?.description && (
        <p className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary leading-relaxed m-0">
          {card.data.description}
        </p>
      )}

      {card.actions && card.actions.length > 0 && (
        <div className="flex flex-row flex-wrap gap-2 mt-3">
          {card.actions.map((btn, index) => (
            <button
              key={index}
              className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[0.8125rem] font-medium whitespace-nowrap border transition-colors duration-150 cursor-pointer ${
                btn.primary
                  ? 'bg-primary text-white border-primary hover:bg-primary/90'
                  : 'bg-transparent text-slate-700 dark:text-slate-200 border-light-border dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
              onClick={() => handleAction(btn.action)}
              type="button"
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
