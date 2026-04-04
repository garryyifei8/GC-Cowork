import React from 'react';
import type { InteractiveCard } from '../../types';

interface TableCardProps {
  card: InteractiveCard;
  compact?: boolean;
}

interface TableData {
  headers: string[];
  rows: string[][];
}

function parseTableData(data: Record<string, any>): TableData | null {
  // Explicit table structure: { headers: [...], rows: [[...], ...] }
  if (data.headers && data.rows) {
    return { headers: data.headers, rows: data.rows };
  }

  // Array of objects: [{name: "A", status: "ok"}, ...]
  if (data.items && Array.isArray(data.items) && data.items.length > 0) {
    const headers = Object.keys(data.items[0]);
    const rows = data.items.map((item: any) => headers.map((h) => String(item[h] ?? '')));
    return { headers, rows };
  }

  // Array of objects at root level
  const arrayKeys = Object.keys(data).filter((k) => Array.isArray(data[k]) && data[k].length > 0 && typeof data[k][0] === 'object');
  if (arrayKeys.length > 0) {
    const arr = data[arrayKeys[0]];
    const headers = Object.keys(arr[0]);
    const rows = arr.map((item: any) => headers.map((h) => String(item[h] ?? '')));
    return { headers, rows };
  }

  return null;
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  '已完成': { bg: '#00C87520', text: '#00C875' },
  completed: { bg: '#00C87520', text: '#00C875' },
  done: { bg: '#00C87520', text: '#00C875' },
  '进行中': { bg: '#FFB26420', text: '#FFB264' },
  in_progress: { bg: '#FFB26420', text: '#FFB264' },
  active: { bg: '#00CAE320', text: '#00CAE3' },
  '待审批': { bg: '#796DF620', text: '#796DF6' },
  pending: { bg: '#796DF620', text: '#796DF6' },
  '已逾期': { bg: '#E74C3C20', text: '#E74C3C' },
  overdue: { bg: '#E74C3C20', text: '#E74C3C' },
  risk: { bg: '#E74C3C20', text: '#E74C3C' },
  '高': { bg: '#E74C3C20', text: '#E74C3C' },
  '中': { bg: '#FFB26420', text: '#FFB264' },
  '低': { bg: '#00C87520', text: '#00C875' },
};

function CellValue({ value }: { value: string }) {
  const sc = STATUS_COLORS[value];
  if (sc) {
    return (
      <span
        className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ backgroundColor: sc.bg, color: sc.text }}
      >
        {value}
      </span>
    );
  }
  // Percentage values
  if (/^\d+(\.\d+)?%$/.test(value)) {
    const num = parseFloat(value);
    const color = num >= 80 ? '#00C875' : num >= 50 ? '#00CAE3' : num >= 30 ? '#FFB264' : '#E74C3C';
    return <span className="font-medium" style={{ color }}>{value}</span>;
  }
  // Currency values
  if (/^[¥$€]\s?[\d,.]+/.test(value) || /^\d[\d,.]+\s?[万元]/.test(value)) {
    return <span className="font-medium text-light-text">{value}</span>;
  }
  return <span>{value}</span>;
}

export const TableCard: React.FC<TableCardProps> = ({ card, compact = true }) => {
  const tableData = parseTableData(card.data || {});

  if (!tableData) {
    // Fallback: render as key-value
    const entries = Object.entries(card.data || {}).filter(([k]) => k !== 'severity');
    return (
      <div className="bg-white border border-light-border border-l-4 border-l-[#0F79F3] rounded-[10px] overflow-hidden">
        <div className="px-4 py-3 bg-light-bg">
          <span className="text-[13px] font-medium text-light-text">{card.title}</span>
        </div>
        <div className="divide-y divide-light-border">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between items-center px-4 py-2.5 text-[13px]">
              <span className="text-light-text-secondary font-medium">{key}</span>
              <CellValue value={String(value)} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayRows = compact ? tableData.rows.slice(0, 6) : tableData.rows;
  const remaining = tableData.rows.length - displayRows.length;

  return (
    <div className="bg-white border border-light-border border-l-4 border-l-[#0F79F3] rounded-[10px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-light-bg">
        <span className="text-[13px] font-medium text-light-text">{card.title}</span>
        <span className="text-xs text-light-text-secondary bg-white px-2 py-0.5 rounded-full border border-light-border">
          {tableData.rows.length} 条
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-light-border">
              {tableData.headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left text-light-text-secondary font-medium uppercase tracking-wider bg-[#E6FAF0]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-light-border">
            {displayRows.map((row, ri) => (
              <tr key={ri} className="hover:bg-light-bg transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-light-text">
                    <CellValue value={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {remaining > 0 && compact && (
        <div className="px-4 py-2 text-center text-xs text-[#00CAE3] bg-light-bg border-t border-light-border">
          还有 {remaining} 条，点击展开查看全部
        </div>
      )}

      {card.content && (
        <div className="px-4 py-2.5 text-xs text-light-text-secondary border-t border-light-border bg-light-bg">
          {card.content}
        </div>
      )}
    </div>
  );
};
