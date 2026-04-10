import React from 'react';
import { useDailyStore } from '../../stores/dailyStore';

const STATUS_COLORS: Record<string, string> = {
  normal: '#00C875',
  late: '#FDAB3D',
  absent: '#E2445C',
  leave: '#0073ea',
};

export const AttendanceCard: React.FC = () => {
  const { myAttendance } = useDailyStore();

  // Build calendar for current month
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun

  // Map attendance by date
  const attendanceMap = new Map<number, string>();
  myAttendance.forEach((a) => {
    const d = new Date(a.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      attendanceMap.set(d.getDate(), a.status);
    }
  });

  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  // Stats
  const normalDays = myAttendance.filter((a) => a.status === 'normal').length;
  const lateDays = myAttendance.filter((a) => a.status === 'late').length;

  return (
    <div className="flex flex-col gap-3">
      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#00C875' }} />
          正常 {normalDays}天
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#FDAB3D' }} />
          迟到 {lateDays}天
        </span>
      </div>

      {/* Mini calendar */}
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {dayNames.map((d) => (
          <div key={d} className="text-[10px] text-[#676879] font-medium py-1">{d}</div>
        ))}
        {weeks.flat().map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;
          const status = attendanceMap.get(day);
          const isToday = day === now.getDate();
          const color = status ? STATUS_COLORS[status] : undefined;

          return (
            <div
              key={day}
              className={`relative flex items-center justify-center w-full aspect-square text-[11px] rounded-md ${
                isToday ? 'ring-1 ring-primary font-bold text-primary' : 'text-[#323338]'
              }`}
            >
              {day}
              {color && (
                <span
                  className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
