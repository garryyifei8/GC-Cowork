import React from 'react';
import { Check, X, FileText, Calendar, Car } from 'lucide-react';
import { useDailyStore } from '../../stores/dailyStore';

const LEAVE_TYPES: Record<string, string> = {
  annual: '年假', sick: '病假', personal: '事假', maternity: '产假',
};

const EXPENSE_CATS: Record<string, string> = {
  travel: '差旅', office: '办公', entertainment: '招待', material: '材料', other: '其他',
};

export const ApprovalList: React.FC = () => {
  const { pendingApprovals, approveLeave, approveExpense, approveVehicle } = useDailyStore();
  const { leaves, expenses, vehicles } = pendingApprovals;

  const total = leaves.length + expenses.length + vehicles.length;

  if (total === 0) {
    return <p className="text-xs text-[#676879] text-center py-2">暂无待审批事项</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Leave approvals */}
      {leaves.map((lr) => (
        <div key={lr.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-light-border">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar size={14} className="text-[#FDAB3D] shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-medium text-[#323338]">
                请假 · {LEAVE_TYPES[lr.leave_type] ?? lr.leave_type}
              </span>
              <p className="text-xs text-[#676879] truncate">
                {lr.start_date} ~ {lr.end_date} ({lr.days}天)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={() => approveLeave(lr.id, true)}
              className="p-1.5 rounded-md bg-[#00C875]/10 text-[#00C875] hover:bg-[#00C875]/20 transition-colors"
              title="通过"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => approveLeave(lr.id, false)}
              className="p-1.5 rounded-md bg-[#E2445C]/10 text-[#E2445C] hover:bg-[#E2445C]/20 transition-colors"
              title="驳回"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}

      {/* Expense approvals */}
      {expenses.map((exp) => (
        <div key={exp.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-light-border">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={14} className="text-[#0073ea] shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-medium text-[#323338]">
                报销 · {EXPENSE_CATS[exp.category] ?? exp.category}
              </span>
              <p className="text-xs text-[#676879] truncate">
                ¥{exp.amount.toLocaleString()} · {exp.submitter}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={() => approveExpense(exp.id, true)}
              className="p-1.5 rounded-md bg-[#00C875]/10 text-[#00C875] hover:bg-[#00C875]/20 transition-colors"
              title="通过"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => approveExpense(exp.id, false)}
              className="p-1.5 rounded-md bg-[#E2445C]/10 text-[#E2445C] hover:bg-[#E2445C]/20 transition-colors"
              title="驳回"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}

      {/* Vehicle approvals */}
      {vehicles.map((vr) => (
        <div key={vr.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-light-border">
          <div className="flex items-center gap-2 min-w-0">
            <Car size={14} className="text-[#9b51e0] shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-medium text-[#323338]">
                用车 · {vr.date}
              </span>
              <p className="text-xs text-[#676879] truncate">
                {vr.origin} → {vr.destination}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button
              onClick={() => approveVehicle(vr.id, true)}
              className="p-1.5 rounded-md bg-[#00C875]/10 text-[#00C875] hover:bg-[#00C875]/20 transition-colors"
              title="通过"
            >
              <Check size={14} />
            </button>
            <button
              onClick={() => approveVehicle(vr.id, false)}
              className="p-1.5 rounded-md bg-[#E2445C]/10 text-[#E2445C] hover:bg-[#E2445C]/20 transition-colors"
              title="驳回"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
