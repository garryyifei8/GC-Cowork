import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DailyCardProps {
  icon: React.ReactNode;
  title: string;
  metric: string | number;
  metricLabel?: string;
  accentColor: string;
  actionLabel: string;
  onAction: () => void;
  expandable?: boolean;
  children?: React.ReactNode;
}

export const DailyCard: React.FC<DailyCardProps> = ({
  icon,
  title,
  metric,
  metricLabel,
  accentColor,
  actionLabel,
  onAction,
  expandable,
  children,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleAction = () => {
    if (expandable) {
      setExpanded(!expanded);
    } else {
      onAction();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-light-border shadow-sm overflow-hidden flex flex-col">
      {/* Color accent top bar */}
      <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />

      <div className="p-4 flex flex-col flex-1">
        {/* Icon + title */}
        <div className="flex items-center gap-2.5 mb-3">
          <span
            className="flex items-center justify-center w-8 h-8 rounded-lg text-white"
            style={{ backgroundColor: accentColor }}
          >
            {icon}
          </span>
          <h3 className="text-sm font-semibold text-[#323338]">{title}</h3>
        </div>

        {/* Metric */}
        <div className="mb-3">
          <span className="text-2xl font-bold text-[#323338]">{metric}</span>
          {metricLabel && (
            <span className="text-xs text-[#676879] ml-1.5">{metricLabel}</span>
          )}
        </div>

        {/* Action button */}
        <button
          onClick={handleAction}
          className="mt-auto flex items-center justify-center gap-1.5 w-full h-8 rounded-md text-sm font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
        >
          {actionLabel}
          {expandable && (expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </button>
      </div>

      {/* Expandable content */}
      {expandable && expanded && children && (
        <div className="border-t border-light-border px-4 py-3 bg-[#f6f7fb]/50 max-h-[400px] overflow-y-auto">
          {children}
        </div>
      )}
    </div>
  );
};
