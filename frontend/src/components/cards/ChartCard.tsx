import React from 'react';
import type { InteractiveCard } from '../../types';

interface ChartCardProps {
  card: InteractiveCard;
  compact?: boolean;
}

interface ChartItem {
  label: string;
  value: number;
  color?: string;
}

const CHART_COLORS = ['#0073ea', '#00C875', '#FDAB3D', '#E2445C', '#A25DDC', '#579BFC', '#FF642E', '#66CCFF'];

function parseChartItems(data: Record<string, any>): ChartItem[] {
  if (data.items && Array.isArray(data.items)) {
    return data.items.map((item: any, idx: number) => ({
      label: item.label || item.name || item.key,
      value: Number(item.value ?? item.count ?? item.amount ?? 0),
      color: item.color || CHART_COLORS[idx % CHART_COLORS.length],
    }));
  }

  // Flat key-value
  const items: ChartItem[] = [];
  let idx = 0;
  for (const [key, val] of Object.entries(data)) {
    if (['severity', 'chart_type', 'type', 'summary'].includes(key)) continue;
    const num = Number(val);
    if (!isNaN(num)) {
      items.push({ label: key, value: num, color: CHART_COLORS[idx % CHART_COLORS.length] });
      idx++;
    }
  }
  return items;
}

// Simple horizontal bar chart
function BarChart({ items }: { items: ChartItem[] }) {
  const maxVal = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-2.5">
      {items.map((item, idx) => (
        <div key={idx}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[#323338] font-medium truncate mr-2">{item.label}</span>
            <span className="text-[11px] font-semibold text-[#323338] shrink-0">{item.value.toLocaleString()}</span>
          </div>
          <div className="h-[6px] rounded-full bg-[#e6e9ef] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(item.value / maxVal) * 100}%`,
                backgroundColor: item.color || '#0073ea',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Simple donut chart using CSS
function DonutChart({ items }: { items: ChartItem[] }) {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total === 0) return null;

  let cumulative = 0;
  const gradientParts = items.map((item) => {
    const start = (cumulative / total) * 100;
    const end = ((cumulative + item.value) / total) * 100;
    cumulative += item.value;
    return `${item.color} ${start}% ${end}%`;
  });

  return (
    <div className="flex items-center gap-4">
      {/* Donut */}
      <div
        className="w-20 h-20 rounded-full shrink-0 relative"
        style={{
          background: `conic-gradient(${gradientParts.join(', ')})`,
        }}
      >
        <div className="absolute inset-2.5 rounded-full bg-white flex items-center justify-center">
          <span className="text-[13px] font-bold text-[#323338]">{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 min-w-0">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-[11px]">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[#676879] truncate">{item.label}</span>
            <span className="ml-auto font-semibold text-[#323338] shrink-0">{item.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const ChartCard: React.FC<ChartCardProps> = ({ card, compact = true }) => {
  const items = parseChartItems(card.data || {});
  const chartType = card.data?.chart_type || (items.length <= 6 ? 'donut' : 'bar');
  const displayItems = compact ? items.slice(0, 8) : items;

  return (
    <div className="bg-white border border-[#d0d4e4] border-l-4 border-l-[#FF642E] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[#f6f7fb]">
        <span className="text-[13px] font-semibold text-[#323338]">{card.title}</span>
      </div>

      {/* Chart */}
      <div className="px-4 py-4">
        {chartType === 'donut' ? (
          <DonutChart items={displayItems} />
        ) : (
          <BarChart items={displayItems} />
        )}
      </div>

      {card.content && (
        <div className="px-4 py-2.5 text-[12px] text-[#676879] border-t border-[#e6e9ef] bg-[#f6f7fb]">
          {card.content}
        </div>
      )}
    </div>
  );
};
