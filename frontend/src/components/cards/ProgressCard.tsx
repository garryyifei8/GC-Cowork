import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { InteractiveCard } from '../../types';

interface ProgressCardProps {
  card: InteractiveCard;
  compact?: boolean;
}

interface ProgressItem {
  label: string;
  value: number;
  max?: number;
  color?: string;
  status?: string;
}

function getProgressColor(pct: number): string {
  if (pct >= 80) return '#00C875';
  if (pct >= 50) return '#00CAE3';
  if (pct >= 30) return '#FFB264';
  return '#E74C3C';
}

function parseProgressItems(data: Record<string, any>): ProgressItem[] {
  // If data has explicit 'items' or 'projects' array
  if (data.items && Array.isArray(data.items)) return data.items;
  if (data.projects && Array.isArray(data.projects)) {
    return data.projects.map((p: any) => ({
      label: p.name || p.label || p.project_name,
      value: p.progress ?? p.progress_pct ?? p.value ?? 0,
      status: p.status,
    }));
  }

  // Try to parse from flat key-value (key = project name, value = percentage)
  const items: ProgressItem[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (['severity', 'total', 'count', 'summary', 'overall', '整体进度'].includes(key)) continue;
    const numVal = typeof val === 'number' ? val : typeof val === 'string' ? parseFloat(val) : NaN;
    if (!isNaN(numVal) && numVal >= 0 && numVal <= 100) {
      items.push({ label: key, value: numVal });
    }
  }
  return items;
}

function getOverallProgress(data: Record<string, any>): number | null {
  if (data.overall !== undefined) return Number(data.overall);
  if (data['整体进度'] !== undefined) return parseFloat(String(data['整体进度']));
  if (data.progress !== undefined) return Number(data.progress);
  if (data.progress_pct !== undefined) return Number(data.progress_pct);
  return null;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({ card, compact = true }) => {
  const items = parseProgressItems(card.data || {});
  const overall = getOverallProgress(card.data || {});
  const displayItems = compact ? items.slice(0, 4) : items;

  return (
    <div className="bg-white border border-light-border border-l-4 border-l-[#00C875] rounded-[10px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-light-bg">
        <span className="text-[13px] font-medium text-light-text">{card.title}</span>
        {overall !== null && (
          <div className="flex items-center gap-1.5">
            {overall >= 50 ? (
              <TrendingUp size={13} className="text-[#00C875]" />
            ) : overall >= 30 ? (
              <Minus size={13} className="text-[#FFB264]" />
            ) : (
              <TrendingDown size={13} className="text-[#E74C3C]" />
            )}
            <span className="text-[15px] font-medium" style={{ color: getProgressColor(overall) }}>
              {overall}%
            </span>
          </div>
        )}
      </div>

      {/* Progress bars */}
      <div className="px-4 py-3 space-y-3">
        {displayItems.map((item, idx) => {
          const color = item.color || getProgressColor(item.value);
          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-light-text font-medium truncate mr-2">{item.label}</span>
                <span className="text-xs font-medium shrink-0" style={{ color }}>
                  {item.value}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-light-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(item.value, 100)}%`, backgroundColor: color }}
                />
              </div>
              {item.status && (
                <span className="text-xs text-light-text-secondary mt-0.5 block">{item.status}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Content */}
      {card.content && (
        <div className="px-4 py-2.5 text-xs text-light-text-secondary border-t border-light-border bg-light-bg">
          {card.content}
        </div>
      )}

      {/* Actions */}
      {card.actions && card.actions.length > 0 && (
        <div className="flex gap-2 px-4 py-2.5 border-t border-light-border">
          {card.actions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                action.primary
                  ? 'bg-[#00CAE3] text-white hover:bg-[#00b5cc]'
                  : 'bg-light-bg text-light-text border border-light-border hover:bg-[#dcdfec]'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
