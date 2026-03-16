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
  if (pct >= 50) return '#0073ea';
  if (pct >= 30) return '#FDAB3D';
  return '#E2445C';
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
    <div className="bg-white border border-[#d0d4e4] border-l-4 border-l-[#00C875] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#f6f7fb]">
        <span className="text-[13px] font-semibold text-[#323338]">{card.title}</span>
        {overall !== null && (
          <div className="flex items-center gap-1.5">
            {overall >= 50 ? (
              <TrendingUp size={13} className="text-[#00C875]" />
            ) : overall >= 30 ? (
              <Minus size={13} className="text-[#FDAB3D]" />
            ) : (
              <TrendingDown size={13} className="text-[#E2445C]" />
            )}
            <span className="text-[15px] font-bold" style={{ color: getProgressColor(overall) }}>
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
                <span className="text-[12px] text-[#323338] font-medium truncate mr-2">{item.label}</span>
                <span className="text-[12px] font-semibold shrink-0" style={{ color }}>
                  {item.value}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#e6e9ef] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(item.value, 100)}%`, backgroundColor: color }}
                />
              </div>
              {item.status && (
                <span className="text-[10px] text-[#676879] mt-0.5 block">{item.status}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Content */}
      {card.content && (
        <div className="px-4 py-2.5 text-[12px] text-[#676879] border-t border-[#e6e9ef] bg-[#f6f7fb]">
          {card.content}
        </div>
      )}

      {/* Actions */}
      {card.actions && card.actions.length > 0 && (
        <div className="flex gap-2 px-4 py-2.5 border-t border-[#e6e9ef]">
          {card.actions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                action.primary
                  ? 'bg-[#0073ea] text-white hover:bg-[#0060c2]'
                  : 'bg-[#f6f7fb] text-[#323338] border border-[#d0d4e4] hover:bg-[#dcdfec]'
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
