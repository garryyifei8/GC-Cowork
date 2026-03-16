import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DrawerPanel } from './DrawerPanel';
import { useDailyStore } from '../../stores/dailyStore';
import type { LeaveRequest } from '../../types';

const LEAVE_TYPES = [
  { value: 'annual', label: '年假' },
  { value: 'sick', label: '病假' },
  { value: 'personal', label: '事假' },
  { value: 'maternity', label: '产假' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '审批中', color: '#FDAB3D' },
  approved: { label: '已通过', color: '#00C875' },
  rejected: { label: '已驳回', color: '#E2445C' },
};

const inputClass = 'w-full rounded-lg border border-light-border bg-[#f6f7fb] px-3 py-2 text-sm text-light-text outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-[#676879]';
const labelClass = 'block text-xs font-semibold text-[#676879] uppercase tracking-wide mb-1';

interface LeaveDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const LeaveDrawer: React.FC<LeaveDrawerProps> = ({ open, onClose }) => {
  const { myLeaves, createLeave, fetchMyLeaves } = useDailyStore();
  const [leaveType, setLeaveType] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) fetchMyLeaves();
  }, [open, fetchMyLeaves]);

  const calcDays = () => {
    if (!startDate || !endDate) return 0;
    const diff = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(1, Math.ceil(diff) + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    setSubmitting(true);
    try {
      await createLeave({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        days: calcDays(),
        reason,
      });
      setStartDate('');
      setEndDate('');
      setReason('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DrawerPanel open={open} onClose={onClose} title="请假申请">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
        <div>
          <label className={labelClass}>请假类型</label>
          <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className={inputClass}>
            {LEAVE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>开始日期</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>结束日期</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} required />
          </div>
        </div>

        {startDate && endDate && (
          <p className="text-xs text-[#676879]">共 {calcDays()} 天</p>
        )}

        <div>
          <label className={labelClass}>事由</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className={inputClass + ' resize-y'}
            placeholder="请输入请假事由"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !startDate || !endDate}
          className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <Plus size={15} />
          {submitting ? '提交中...' : '提交申请'}
        </button>
      </form>

      {/* My leave history */}
      <div>
        <h4 className="text-xs font-semibold text-[#676879] uppercase tracking-wide mb-2">我的请假记录</h4>
        {myLeaves.length === 0 ? (
          <p className="text-xs text-[#676879]">暂无记录</p>
        ) : (
          <div className="flex flex-col gap-2">
            {myLeaves.map((lr: LeaveRequest) => {
              const st = STATUS_MAP[lr.status] ?? { label: lr.status, color: '#676879' };
              const typeLabel = LEAVE_TYPES.find((t) => t.value === lr.leave_type)?.label ?? lr.leave_type;
              return (
                <div key={lr.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#f6f7fb] border border-light-border">
                  <div>
                    <span className="text-sm font-medium text-[#323338]">{typeLabel}</span>
                    <span className="text-xs text-[#676879] ml-2">{lr.start_date} ~ {lr.end_date} ({lr.days}天)</span>
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: st.color }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DrawerPanel>
  );
};
