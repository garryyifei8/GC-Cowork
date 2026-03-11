import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  icon?: React.ReactNode;
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  trend,
  icon,
  iconColor = 'bg-primary/10 text-primary',
}) => {
  const isPositive = trend !== undefined && trend >= 0;

  return (
    <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border
      rounded-xl p-5 transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{label}</span>
        {icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold font-heading">{value}</div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-sm font-medium
          ${isPositive ? 'text-success' : 'text-danger'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          <span>{isPositive ? '+' : ''}{trend}%</span>
        </div>
      )}
    </div>
  );
};
