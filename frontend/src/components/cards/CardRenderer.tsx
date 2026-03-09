import React from 'react';
import type { InteractiveCard } from '../../types';
import { ActionCard } from './ActionCard';
import { AlertCard } from './AlertCard';
import { DataCard } from './DataCard';
import './Cards.css';

interface CardRendererProps {
  cards: InteractiveCard[];
}

export const CardRenderer: React.FC<CardRendererProps> = ({ cards }) => (
  <div className="card-list">
    {cards.map((card, i) => {
      switch (card.type) {
        case 'action':
          return <ActionCard key={i} card={card} />;
        case 'alert':
          return <AlertCard key={i} card={card} />;
        case 'data':
          return <DataCard key={i} card={card} />;
        default:
          return <ActionCard key={i} card={card} />;
      }
    })}
  </div>
);
