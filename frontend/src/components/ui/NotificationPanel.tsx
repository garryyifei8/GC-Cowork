import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle, X, Bell } from 'lucide-react';
import { useNotificationStore } from '../../stores/notificationStore';
import type { Notification } from '../../stores/notificationStore';

// ── Type icon map ──────────────────────────────────────────────

const ICON_MAP: Record<Notification['type'], React.ReactNode> = {
  success: <CheckCircle2 size={15} />,
  warning: <AlertTriangle size={15} />,
  info: <Info size={15} />,
  error: <XCircle size={15} />,
};

const ICON_COLOR: Record<Notification['type'], string> = {
  success: 'text-success bg-success/10',
  warning: 'text-warning bg-warning/10',
  info: 'text-info bg-info/10',
  error: 'text-danger bg-danger/10',
};

// ── Relative time helper ───────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// ── Single notification row ────────────────────────────────────

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onDismiss,
  onMarkRead,
}) => {
  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss(notification.id);
  };

  return (
    <div
      className={`group flex items-start gap-2.5 px-4 py-3 border-b border-light-border/50 dark:border-dark-border/50 last:border-b-0 transition-colors duration-150 cursor-pointer relative ${
        notification.read
          ? 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
          : 'bg-primary/[0.03] hover:bg-primary/[0.06]'
      }`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      aria-label={`${notification.title}: ${notification.message}`}
    >
      {/* Type icon */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded flex items-center justify-center mt-px ${ICON_COLOR[notification.type]}`}
      >
        {ICON_MAP[notification.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <span className="text-[0.8125rem] font-semibold truncate">{notification.title}</span>
        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-snug line-clamp-2">
          {notification.message}
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          {!notification.read && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" aria-hidden="true" />
          )}
          <span className="text-[0.6875rem] text-light-text-secondary dark:text-dark-text-secondary flex-shrink-0">
            {formatRelativeTime(notification.timestamp)}
          </span>
        </div>
      </div>

      {/* Dismiss */}
      <button
        className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-light-text-secondary dark:text-dark-text-secondary bg-transparent border-none cursor-pointer opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-danger transition-all duration-150 mt-0.5"
        onClick={handleDismiss}
        aria-label="删除通知"
        type="button"
        tabIndex={-1}
      >
        <X size={12} />
      </button>
    </div>
  );
};

// ── Panel ──────────────────────────────────────────────────────

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const removeNotification = useNotificationStore((s) => s.removeNotification);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  if (!isOpen) return null;

  const handleMarkAllRead = () => {
    markAllRead();
  };

  return (
    <div
      className="absolute right-0 top-12 w-80 max-h-96 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl shadow-xl z-50 flex flex-col overflow-hidden"
      role="dialog"
      aria-modal="false"
      aria-label="通知面板"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-light-border dark:border-dark-border flex-shrink-0">
        <h2 className="text-[0.9375rem] font-semibold m-0">
          通知{unreadCount > 0 ? `（${unreadCount}）` : ''}
        </h2>
        {unreadCount > 0 && (
          <button
            className="text-xs font-medium text-primary bg-transparent border-none px-2 py-1 rounded cursor-pointer whitespace-nowrap transition-colors duration-150 hover:bg-primary/10 hover:text-primary/80"
            onClick={handleMarkAllRead}
            type="button"
            aria-label="全部标记为已读"
          >
            全部已读
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto overscroll-contain" role="list">
        {notifications.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-10 gap-2 text-light-text-secondary dark:text-dark-text-secondary"
            role="listitem"
          >
            <Bell size={32} className="opacity-35" />
            <span className="text-sm">暂无通知</span>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onDismiss={removeNotification}
              onMarkRead={markRead}
            />
          ))
        )}
      </div>

      {/* Footer — only shown when there are notifications */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-light-border dark:border-dark-border text-center flex-shrink-0">
          <button
            className="text-xs font-medium text-primary bg-transparent border-none px-2 py-1 rounded cursor-pointer transition-colors duration-150 hover:bg-primary/10"
            onClick={onClose}
            type="button"
          >
            关闭
          </button>
        </div>
      )}
    </div>
  );
};
