import React, { useState } from 'react';
import { Bell, Megaphone, CheckCircle, Circle } from 'lucide-react';
import { useDailyStore } from '../../stores/dailyStore';
import type { Notice } from '../../types';

const TYPE_ICONS: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  system: { icon: <Bell size={12} />, color: '#0073ea', label: '系统' },
  announcement: { icon: <Megaphone size={12} />, color: '#FDAB3D', label: '公告' },
  approval_result: { icon: <CheckCircle size={12} />, color: '#00C875', label: '审批' },
};

export const NoticeList: React.FC = () => {
  const { notices, markNoticeRead } = useDailyStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleClick = async (notice: Notice) => {
    setExpandedId(expandedId === notice.id ? null : notice.id);
    if (!notice.is_read) {
      await markNoticeRead(notice.id);
    }
  };

  if (notices.length === 0) {
    return <p className="text-xs text-[#676879] text-center py-2">暂无通知</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {notices.map((notice) => {
        const typeInfo = TYPE_ICONS[notice.type] ?? TYPE_ICONS.system;
        const isExpanded = expandedId === notice.id;

        return (
          <div
            key={notice.id}
            className={`rounded-lg border transition-colors cursor-pointer ${
              notice.is_read
                ? 'bg-white border-light-border'
                : 'bg-[#e8f0fe] border-primary/20'
            }`}
            onClick={() => handleClick(notice)}
          >
            <div className="flex items-center gap-2 p-2.5">
              {/* Read indicator */}
              {notice.is_read ? (
                <Circle size={6} className="text-transparent shrink-0" />
              ) : (
                <Circle size={6} className="text-primary fill-primary shrink-0" />
              )}

              {/* Type badge */}
              <span
                className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded text-white shrink-0"
                style={{ backgroundColor: typeInfo.color }}
              >
                {typeInfo.icon}
                {typeInfo.label}
              </span>

              {/* Title */}
              <span className={`text-xs truncate ${notice.is_read ? 'text-[#676879]' : 'text-[#323338] font-medium'}`}>
                {notice.title}
              </span>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-2.5 pb-2.5 pl-8">
                <p className="text-xs text-[#676879] leading-relaxed whitespace-pre-wrap">
                  {notice.content}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
