import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import type { Notification } from '../../stores/notificationStore';

const ICON_MAP: Record<Notification['type'], React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
  error: <XCircle size={18} />,
};

const ICON_COLOR: Record<Notification['type'], string> = {
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  error: 'text-danger',
};

const BORDER_ACCENT: Record<Notification['type'], string> = {
  success: 'border-l-success',
  warning: 'border-l-warning',
  info: 'border-l-info',
  error: 'border-l-danger',
};

const AUTO_DISMISS_MS = 4000;

const ToastItem: React.FC<{ notification: Notification; onDismiss: (id: string) => void }> = ({
  notification,
  onDismiss,
}) => {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(notification.id), 300);
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  return (
    <div
      className={`bg-light-surface rounded-[10px] shadow-lg border border-light-border border-l-4 ${BORDER_ACCENT[notification.type]} p-3 px-4 min-w-72 flex items-start gap-2.5 pointer-events-auto transition-all duration-300 ${
        exiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
      role="alert"
    >
      <div className={`flex-shrink-0 mt-px ${ICON_COLOR[notification.type]}`}>
        {ICON_MAP[notification.type]}
      </div>
      <div className="flex-1 flex flex-col gap-0.5 min-w-0">
        <span className="text-[0.8125rem] font-medium">{notification.title}</span>
        <span className="text-xs text-light-text-secondary leading-snug">
          {notification.message}
        </span>
      </div>
      <button
        className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-light-text-secondary bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-[#ecedf5] hover:text-light-text"
        onClick={handleClose}
        aria-label="关闭"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export const NotificationToast: React.FC = () => {
  const { notifications, removeNotification } = useNotificationStore();

  // Only show latest 3 unread notifications
  const visibleToasts = notifications.filter((n) => !n.read).slice(0, 3);

  if (visibleToasts.length === 0) return null;

  const handleDismiss = (id: string) => {
    removeNotification(id);
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm"
      aria-live="polite"
    >
      {visibleToasts.map((n) => (
        <ToastItem key={n.id} notification={n} onDismiss={handleDismiss} />
      ))}
    </div>
  );
};
