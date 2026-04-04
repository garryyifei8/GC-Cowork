import React from 'react';
import type { InteractiveCard } from '../../types';

interface KanbanMiniCardProps {
  card: InteractiveCard;
  compact?: boolean;
}

interface KanbanColumn {
  title: string;
  color: string;
  items: string[];
}

const COLUMN_COLORS: Record<string, string> = {
  '待办': '#c3c6d4',
  'todo': '#c3c6d4',
  '未开始': '#c3c6d4',
  '进行中': '#FFB264',
  'in_progress': '#FFB264',
  'doing': '#FFB264',
  '已完成': '#00C875',
  'done': '#00C875',
  'completed': '#00C875',
  '已阻塞': '#E74C3C',
  'blocked': '#E74C3C',
  '审核中': '#796DF6',
  'review': '#796DF6',
};

function parseKanbanColumns(data: Record<string, any>): KanbanColumn[] {
  // Explicit columns: { columns: [{ title, items }, ...] }
  if (data.columns && Array.isArray(data.columns)) {
    return data.columns.map((col: any) => ({
      title: col.title || col.name,
      color: col.color || COLUMN_COLORS[col.title] || COLUMN_COLORS[col.name] || '#00CAE3',
      items: Array.isArray(col.items) ? col.items.map(String) : [],
    }));
  }

  // Flat structure: { "进行中": ["task1", "task2"], "已完成": ["task3"] }
  const columns: KanbanColumn[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (Array.isArray(val)) {
      columns.push({
        title: key,
        color: COLUMN_COLORS[key] || '#00CAE3',
        items: val.map(String),
      });
    }
  }
  return columns;
}

export const KanbanMiniCard: React.FC<KanbanMiniCardProps> = ({ card, compact = true }) => {
  const columns = parseKanbanColumns(card.data || {});

  if (columns.length === 0) return null;

  return (
    <div className="bg-white border border-light-border border-l-4 border-l-[#796DF6] rounded-[10px] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-light-bg">
        <span className="text-[13px] font-medium text-light-text">{card.title}</span>
      </div>

      {/* Kanban columns — horizontal layout */}
      <div className="flex gap-2 p-3 overflow-x-auto" style={{ scrollbarWidth: 'thin' }}>
        {columns.map((col, ci) => {
          const displayItems = compact ? col.items.slice(0, 3) : col.items;
          const remaining = col.items.length - displayItems.length;

          return (
            <div key={ci} className="flex flex-col min-w-[140px] flex-1 bg-light-bg rounded-lg overflow-hidden">
              {/* Column header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b-2" style={{ borderColor: col.color }}>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: col.color }}
                />
                <span className="text-xs font-medium text-light-text">{col.title}</span>
                <span className="ml-auto text-xs text-light-text-secondary bg-white px-1.5 py-0.5 rounded-full">
                  {col.items.length}
                </span>
              </div>

              {/* Items */}
              <div className="flex flex-col gap-1.5 p-2">
                {displayItems.map((item, ii) => (
                  <div
                    key={ii}
                    className="bg-white rounded-md px-2.5 py-2 text-xs text-light-text border border-light-border"
                  >
                    {item}
                  </div>
                ))}
                {remaining > 0 && (
                  <div className="text-xs text-light-text-secondary text-center py-1">
                    +{remaining} 项
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {card.content && (
        <div className="px-4 py-2.5 text-xs text-light-text-secondary border-t border-light-border bg-light-bg">
          {card.content}
        </div>
      )}
    </div>
  );
};
