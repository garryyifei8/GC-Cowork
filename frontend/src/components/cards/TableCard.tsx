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
  '进行中': { bg: '#FDAB3D20', text: '#FDAB3D' },
  in_progress: { bg: '#FDAB3D20', text: '#FDAB3D' },
  active: { bg: '#0073ea20', text: '#0073ea' },
  '待审批': { bg: '#A25DDC20', text: '#A25DDC' },
  pending: { bg: '#A25DDC20', text: '#A25DDC' },
  '已逾期': { bg: '#E2445C20', text: '#E2445C' },
  overdue: { bg: '#E2445C20', text: '#E2445C' },
  risk: { bg: '#E2445C20', text: '#E2445C' },
  '高': { bg: '#E2445C20', text: '#E2445C' },
  '中': { bg: '#FDAB3D20', text: '#FDAB3D' },
  '低': { bg: '#00C87520', text: '#00C875' },
};

function CellValue({ value }: { value: string }) {
  const sc = STATUS_COLORS[value];
  if (sc) {
    return (
      <span
        className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
        style={{ backgroundColor: sc.bg, color: sc.text }}
      >
        {value}
      </span>
    );
  }
  // Percentage values
  if (/^\d+(\.\d+)?%$/.test(value)) {
    const num = parseFloat(value);
    const color = num >= 80 ? '#00C875' : num >= 50 ? '#0073ea' : num >= 30 ? '#FDAB3D' : '#E2445C';
    return <span className="font-semibold" style={{ color }}>{value}</span>;
  }
  // Currency values
  if (/^[¥$€]\s?[\d,.]+/.test(value) || /^\d[\d,.]+\s?[万元]/.test(value)) {
    return <span className="font-semibold text-[#323338]">{value}</span>;
  }
  return <span>{value}</span>;
}

export const TableCard: React.FC<TableCardProps> = ({ card, compact = true }) => {
  const tableData = parseTableData(card.data || {});

  if (!tableData) {
    // Fallback: render as key-value
    const entries = Object.entries(card.data || {}).filter(([k]) => k !== 'severity');
    return (
      <div className="bg-white border border-[#d0d4e4] border-l-4 border-l-[#579BFC] rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-[#f6f7fb]">
          <span className="text-[13px] font-semibold text-[#323338]">{card.title}</span>
        </div>
        <div className="divide-y divide-[#e6e9ef]">
          {entries.map(([key, value]) => (
            <div key={key} className="flex justify-between items-center px-4 py-2.5 text-[13px]">
              <span className="text-[#676879] font-medium">{key}</span>
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
    <div className="bg-white border border-[#d0d4e4] border-l-4 border-l-[#579BFC] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#f6f7fb]">
        <span className="text-[13px] font-semibold text-[#323338]">{card.title}</span>
        <span className="text-[11px] text-[#676879] bg-white px-2 py-0.5 rounded-full border border-[#d0d4e4]">
          {tableData.rows.length} 条
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[#d0d4e4]">
              {tableData.headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left text-[#676879] font-semibold uppercase tracking-wider bg-[#f6f7fb]/50">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e6e9ef]">
            {displayRows.map((row, ri) => (
              <tr key={ri} className="hover:bg-[#f6f7fb] transition-colors">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-3 py-2 text-[#323338]">
                    <CellValue value={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {remaining > 0 && compact && (
        <div className="px-4 py-2 text-center text-[11px] text-[#0073ea] bg-[#f6f7fb] border-t border-[#e6e9ef]">
          还有 {remaining} 条，点击展开查看全部
        </div>
      )}

      {card.content && (
        <div className="px-4 py-2.5 text-[12px] text-[#676879] border-t border-[#e6e9ef] bg-[#f6f7fb]">
          {card.content}
        </div>
      )}
    </div>
  );
};
