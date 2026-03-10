import React from 'react';
import type { InteractiveCard } from '../../types';

interface DataCardProps {
  card: InteractiveCard;
}

export const DataCard: React.FC<DataCardProps> = ({ card }) => {
  const data = card.data || {};
  const entries = Object.entries(data).filter(
    ([key]) => key !== 'severity' // filter internal fields
  );

  return (
    <div className="card card--data">
      <div className="card__header">
        <p className="card__title">{card.title}</p>
      </div>
      {entries.length > 0 && (
        <div className="card__kv-grid">
          {entries.map(([key, value]) => (
            <div key={key} className="card__kv-row">
              <span className="card__kv-key">{key}</span>
              <span className="card__kv-value">{String(value)}</span>
            </div>
          ))}
        </div>
      )}
      {card.content && <p className="card__content">{card.content}</p>}
      {card.actions && card.actions.length > 0 && (
        <div className="card__actions">
          {card.actions.map((action, i) => (
            <button
              key={i}
              className={`card__btn ${action.primary ? 'card__btn--primary' : 'card__btn--secondary'}`}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
