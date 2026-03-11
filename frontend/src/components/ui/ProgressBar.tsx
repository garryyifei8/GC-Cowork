import React from 'react';

interface ProgressBarProps {
  value: number;
  color?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color,
  showLabel = true,
  size = 'sm',
}) => {
  const clamped = Math.min(100, Math.max(0, value));
  const heightClass = size === 'sm' ? 'h-1.5' : 'h-2.5';

  const defaultColor =
    clamped >= 70 ? '#00ca72' :
    clamped >= 40 ? '#3b82f6' :
    '#e2445c';

  return (
    <div className="w-full">
      <div className={`w-full ${heightClass} bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden`}>
        <div
          className={`${heightClass} rounded-full transition-all duration-500 ease-out`}
          style={{
            width: `${clamped}%`,
            backgroundColor: color || defaultColor,
          }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 block text-right">
          {clamped}%
        </span>
      )}
    </div>
  );
};
