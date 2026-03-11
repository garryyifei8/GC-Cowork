import React from 'react';
import type { InteractiveCard } from '../../types';
import { ActionCard } from './ActionCard';
import { AlertCard } from './AlertCard';
import { DataCard } from './DataCard';

interface CardRendererProps {
  cards: InteractiveCard[];
}

export const CardRenderer: React.FC<CardRendererProps> = ({ cards }) => {
  if (!cards || cards.length === 0) return null;

  return (
    <div className="flex flex-col gap-2.5">
      {cards.map((card, i) => {
        const cardType = card.type || 'data';
        switch (cardType) {
          case 'action':
            return <ActionCard key={i} card={card} />;
          case 'alert':
            return <AlertCard key={i} card={card} />;
          case 'data':
            return <DataCard key={i} card={card} />;
          case 'form':
            return <DataCard key={i} card={card} />; // fallback form to data for now
          default:
            return <DataCard key={i} card={card} />;
        }
      })}
    </div>
  );
};
