import React, { useState, useEffect } from 'react';
import { useDailyStore } from '../../stores/dailyStore';

export const SalaryCard: React.FC = () => {
  const { mySalary, fetchMySalary } = useDailyStore();
  const [selectedMonth, setSelectedMonth] = useState('');

  // Generate last 6 months as options
  const monthOptions = React.useMemo(() => {
    const opts: string[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      opts.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return opts;
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      fetchMySalary(selectedMonth);
    }
  }, [selectedMonth, fetchMySalary]);

  const record = mySalary.find((s) => !selectedMonth || s.month === selectedMonth) ?? mySalary[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Month selector */}
      <select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="w-full rounded-lg border border-light-border bg-[#f6f7fb] px-3 py-1.5 text-xs text-[#323338] outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="">最近月份</option>
        {monthOptions.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      {record ? (
        <div className="flex flex-col gap-1.5">
          {/* Earnings */}
          <div className="text-xs text-[#676879] font-medium mb-0.5">收入</div>
          <Row label="基本工资" value={record.base_salary} />
          <Row label="加班费" value={record.overtime_pay} />
          <Row label="奖金" value={record.bonus} />
          <div className="border-t border-light-border my-1" />

          {/* Deductions */}
          <div className="text-xs text-[#676879] font-medium mb-0.5">扣除</div>
          <Row label="扣款" value={-record.deductions} negative />
          <Row label="社保" value={-record.social_insurance} negative />
          <Row label="个税" value={-record.tax} negative />
          <div className="border-t border-light-border my-1" />

          {/* Net */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#323338]">实发工资</span>
            <span className="text-sm font-bold text-[#00C875]">
              ¥{record.net_salary.toLocaleString()}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-[#676879] text-center py-2">暂无工资记录</p>
      )}
    </div>
  );
};

const Row: React.FC<{ label: string; value: number; negative?: boolean }> = ({ label, value, negative }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-[#676879]">{label}</span>
    <span className={`text-xs font-medium ${negative ? 'text-[#E2445C]' : 'text-[#323338]'}`}>
      {negative ? '-' : ''}¥{Math.abs(value).toLocaleString()}
    </span>
  </div>
);
