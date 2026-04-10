import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useToastStore } from '../../stores/toastStore';

const ICON_MAP = {
  success: { Icon: CheckCircle, color: '#00C875' },
  error: { Icon: AlertCircle, color: '#EF1E1E' },
  warning: { Icon: AlertTriangle, color: '#E2B93B' },
  info: { Icon: Info, color: '#2F80ED' },
};

export const ToastContainer: React.FC = () => {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[70] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const { Icon, color } = ICON_MAP[toast.type];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 bg-white border border-[#E8E8E8] rounded-lg shadow-lg min-w-[260px] max-w-[380px] animate-slide-in-right"
          >
            <Icon size={18} style={{ color }} className="shrink-0" />
            <span className="text-sm text-[#333] flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-0.5 rounded hover:bg-[#F0F2F8] text-[#9CA3AF] hover:text-[#6C7688] transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
