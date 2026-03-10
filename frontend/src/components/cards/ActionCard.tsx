import React from 'react';
import type { InteractiveCard } from '../../types';

interface ActionCardProps {
  card: InteractiveCard;
}

export const ActionCard: React.FC<ActionCardProps> = ({ card }) => {
  const handleAction = (action?: string) => {
    if (action) {
      console.log('[ActionCard] action triggered:', action);
    }
  };

  return (
    <div className="card card--action">
      <div className="card__header">
        <p className="card__title">{card.title}</p>
      </div>
      {card.content && <p className="card__content">{card.content}</p>}
      {card.data && Object.keys(card.data).length > 0 && (
        <div className="card__kv-grid">
          {Object.entries(card.data)
            .filter(([key]) => key !== 'severity')
            .map(([key, value]) => (
              <div key={key} className="card__kv-row">
                <span className="card__kv-key">{key}</span>
                <span className="card__kv-value">{String(value)}</span>
              </div>
            ))}
        </div>
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
