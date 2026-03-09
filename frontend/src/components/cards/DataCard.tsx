import React from 'react';
import type { InteractiveCard } from '../../types';

interface DataCardProps {
  card: InteractiveCard;
}

export const DataCard: React.FC<DataCardProps> = ({ card }) => {
  return (
    <div className="card card--data">
      <div className="card__header">
        <p className="card__title">{card.title}</p>
      </div>

      {card.content && (
        <p className="card__metric">{card.content}</p>
      )}
    </div>
  );
};
