import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DrawerPanel } from './DrawerPanel';
import { useDailyStore } from '../../stores/dailyStore';
import type { VehicleRequest } from '../../types';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '审批中', color: '#FDAB3D' },
  approved: { label: '已通过', color: '#00C875' },
  rejected: { label: '已驳回', color: '#E2445C' },
};

const inputClass = 'w-full rounded-lg border border-light-border bg-[#f6f7fb] px-3 py-2 text-sm text-light-text outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-[#676879]';
const labelClass = 'block text-xs font-semibold text-[#676879] uppercase tracking-wide mb-1';

interface VehicleDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const VehicleDrawer: React.FC<VehicleDrawerProps> = ({ open, onClose }) => {
  const { myVehicles, createVehicle, fetchMyVehicles } = useDailyStore();
  const [date, setDate] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (open) fetchMyVehicles();
  }, [open, fetchMyVehicles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !origin || !destination) return;
    setSubmitting(true);
    try {
      await createVehicle({ date, origin, destination, reason });
      setDate('');
      setOrigin('');
      setDestination('');
      setReason('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DrawerPanel open={open} onClose={onClose} title="用车申请">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
        <div>
          <label className={labelClass}>用车日期</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
        </div>

        <div>
          <label className={labelClass}>出发地</label>
          <input type="text" value={origin} onChange={(e) => setOrigin(e.target.value)} className={inputClass} placeholder="如：公司总部" required />
        </div>

        <div>
          <label className={labelClass}>目的地</label>
          <input type="text" value={destination} onChange={(e) => setDestination(e.target.value)} className={inputClass} placeholder="如：市政府" required />
        </div>

        <div>
          <label className={labelClass}>事由</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className={inputClass + ' resize-y'}
            placeholder="用车事由"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !date || !origin || !destination}
          className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <Plus size={15} />
          {submitting ? '提交中...' : '提交申请'}
        </button>
      </form>

      {/* My vehicle request history */}
      <div>
        <h4 className="text-xs font-semibold text-[#676879] uppercase tracking-wide mb-2">我的用车记录</h4>
        {myVehicles.length === 0 ? (
          <p className="text-xs text-[#676879]">暂无记录</p>
        ) : (
          <div className="flex flex-col gap-2">
            {myVehicles.map((vr: VehicleRequest) => {
              const st = STATUS_MAP[vr.status] ?? { label: vr.status, color: '#676879' };
              return (
                <div key={vr.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#f6f7fb] border border-light-border">
                  <div>
                    <span className="text-sm font-medium text-[#323338]">{vr.date}</span>
                    <span className="text-xs text-[#676879] ml-2">{vr.origin} → {vr.destination}</span>
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
