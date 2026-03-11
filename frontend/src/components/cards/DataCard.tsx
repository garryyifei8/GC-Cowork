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
    <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border border-l-4 border-l-info rounded-xl p-4 transition-colors duration-200 hover:-translate-y-px hover:shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <p className="text-sm font-semibold m-0 leading-snug">{card.title}</p>
      </div>
      {entries.length > 0 && (
        <div className="flex flex-col my-2.5">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between items-center py-1.5 border-b border-light-border/60 dark:border-dark-border/60 last:border-b-0 text-[0.8125rem]"
            >
              <span className="text-light-text-secondary dark:text-dark-text-secondary font-medium flex-shrink-0 mr-4">
                {key}
              </span>
              <span className="font-semibold text-right">{String(value)}</span>
            </div>
          ))}
        </div>
      )}
      {card.content && (
        <p className="text-[0.8125rem] text-light-text-secondary dark:text-dark-text-secondary leading-relaxed m-0">
          {card.content}
        </p>
      )}
      {card.actions && card.actions.length > 0 && (
        <div className="flex flex-row flex-wrap gap-2 mt-3">
          {card.actions.map((action, i) => (
            <button
              key={i}
              className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-[0.8125rem] font-medium whitespace-nowrap border transition-colors duration-150 cursor-pointer ${
                action.primary
                  ? 'bg-primary text-white border-primary hover:bg-primary/90'
                  : 'bg-transparent text-slate-700 dark:text-slate-200 border-light-border dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
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
