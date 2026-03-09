import React from 'react';
import type { InteractiveCard } from '../../types';

interface AlertCardProps {
  card: InteractiveCard;
}

type AlertStatus = NonNullable<InteractiveCard['status']>;

const STATUS_CLASS: Record<AlertStatus, string> = {
  success: 'card--alert-success',
  warning: 'card--alert-warning',
  danger: 'card--alert-danger',
  info: 'card--alert-info',
};

const DOT_CLASS: Record<AlertStatus, string> = {
  success: 'card__status-dot--success',
  warning: 'card__status-dot--warning',
  danger: 'card__status-dot--danger',
  info: 'card__status-dot--info',
};

export const AlertCard: React.FC<AlertCardProps> = ({ card }) => {
  const status: AlertStatus = card.status ?? 'info';
  const cardClass = STATUS_CLASS[status];
  const dotClass = DOT_CLASS[status];

  const handleAction = (action?: string) => {
    if (action) {
      console.log('[AlertCard] action triggered:', action);
    }
  };

  return (
    <div className={`card ${cardClass}`}>
      <div className="card__header">
        <span
          className={`card__status-dot ${dotClass}`}
          aria-hidden="true"
        />
        <p className="card__title">{card.title}</p>
      </div>

      {card.content && (
        <p className="card__content">{card.content}</p>
      )}

      {card.actions && card.actions.length > 0 && (
        <div className="card__actions">
          {card.actions.map((btn, index) => (
            <button
              key={index}
              className={`card__btn ${btn.primary ? 'card__btn--primary' : 'card__btn--secondary'}`}
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
