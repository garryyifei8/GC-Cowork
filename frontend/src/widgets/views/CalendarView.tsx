import React, { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { TaskWithProject } from '../../types'
import { useTaskWorkbenchStore } from '../../stores/taskWorkbenchStore'

// ---------------------------------------------------------------------------
// Types & Props
// ---------------------------------------------------------------------------

export interface CalendarViewProps {
  data?: { tasks?: TaskWithProject[] }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_NAMES = ['一', '二', '三', '四', '五', '六', '日']

const PRIORITY_PILL_COLORS: Record<string, string> = {
  high: '#E74C3C',
  medium: '#FFB264',
  low: '#0F79F3',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number): number {
  // JS: 0=Sun…6=Sat. We want Mon=0…Sun=6
  const dow = new Date(year, month, 1).getDay()
  return dow === 0 ? 6 : dow - 1
}

function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ---------------------------------------------------------------------------
// Task pill with tooltip
// ---------------------------------------------------------------------------

const TaskPill: React.FC<{ task: TaskWithProject }> = ({ task }) => {
  const [showTip, setShowTip] = useState(false)
  const color = PRIORITY_PILL_COLORS[task.priority] ?? '#C4C4C4'

  return (
    <div className="relative">
      <button
        className="w-full text-left px-1.5 py-0.5 rounded text-xs font-medium text-white truncate leading-tight transition-opacity hover:opacity-80"
        style={{ backgroundColor: color }}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => setShowTip(true)}
        onBlur={() => setShowTip(false)}
        title={task.name}
      >
        {task.name}
      </button>
      {showTip && (
        <div className="absolute z-50 bottom-full left-0 mb-1 px-2 py-1.5 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap max-w-[200px] pointer-events-none">
          <div className="font-medium truncate">{task.name}</div>
          {task.project_name && (
            <div className="text-gray-300 text-xs truncate mt-0.5">{task.project_name}</div>
          )}
          {task.assignee && (
            <div className="text-gray-400 text-xs mt-0.5">负责人: {task.assignee}</div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Calendar day cell
// ---------------------------------------------------------------------------

const DayCell: React.FC<{
  day: number | null
  isToday: boolean
  isCurrentMonth: boolean
  tasks: TaskWithProject[]
}> = ({ day, isToday, isCurrentMonth, tasks }) => {
  if (day === null) {
    return <div className="min-h-[96px] bg-gray-50 dark:bg-gray-900/30 border-r border-b border-gray-100 dark:border-gray-800" />
  }

  return (
    <div
      className={`min-h-[96px] p-1.5 border-r border-b border-gray-100 dark:border-gray-800 transition-colors ${
        isCurrentMonth
          ? 'bg-white dark:bg-gray-900'
          : 'bg-gray-50/60 dark:bg-gray-900/20'
      }`}
    >
      {/* Day number */}
      <div className="flex items-center justify-end mb-1">
        <span
          className={`w-6 h-6 flex items-center justify-center rounded-full text-[13px] font-medium leading-none ${
            isToday
              ? 'ring-2 ring-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
              : isCurrentMonth
              ? 'text-gray-700 dark:text-gray-200'
              : 'text-gray-400 dark:text-gray-600'
          }`}
        >
          {day}
        </span>
      </div>

      {/* Task pills */}
      <div className="flex flex-col gap-0.5">
        {tasks.slice(0, 3).map((task) => (
          <TaskPill key={task.id} task={task} />
        ))}
        {tasks.length > 3 && (
          <div className="text-xs text-gray-400 dark:text-gray-500 px-1">
            +{tasks.length - 3} 个任务
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const CalendarView: React.FC<CalendarViewProps> = ({ data }) => {
  const storeTasks = useTaskWorkbenchStore((s) => s.tasks)
  const tasks: TaskWithProject[] = data?.tasks ?? storeTasks

  const today = new Date()
  const todayStr = toYMD(today)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
  }

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
  }

  // Build a map: dateStr -> tasks
  const tasksByDate = useMemo(() => {
    const map = new Map<string, TaskWithProject[]>()
    for (const task of tasks) {
      if (!task.due_date) continue
      const existing = map.get(task.due_date) ?? []
      map.set(task.due_date, [...existing, task])
    }
    return map
  }, [tasks])

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDow = getFirstDayOfWeek(viewYear, viewMonth) // 0=Mon
    const daysInMonth = getDaysInMonth(viewYear, viewMonth)

    // Prev month filler
    const prevMonthDays = getDaysInMonth(
      viewMonth === 0 ? viewYear - 1 : viewYear,
      viewMonth === 0 ? 11 : viewMonth - 1
    )

    const cells: Array<{ day: number | null; date: string | null; isCurrentMonth: boolean }> = []

    // Leading empty cells (show prev month days)
    for (let i = 0; i < firstDow; i++) {
      const d = prevMonthDays - firstDow + 1 + i
      const m = viewMonth === 0 ? 11 : viewMonth - 1
      const y = viewMonth === 0 ? viewYear - 1 : viewYear
      cells.push({
        day: d,
        date: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        date: `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
        isCurrentMonth: true,
      })
    }

    // Trailing empty cells
    const remaining = (7 - (cells.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1
      const y = viewMonth === 11 ? viewYear + 1 : viewYear
      cells.push({
        day: i,
        date: `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
        isCurrentMonth: false,
      })
    }

    return cells
  }, [viewYear, viewMonth])

  const monthLabel = `${viewYear}年${viewMonth + 1}月`

  // Count tasks with due_date in current month (for subtitle)
  const currentMonthTaskCount = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`
    return tasks.filter((t) => t.due_date?.startsWith(prefix)).length
  }, [tasks, viewYear, viewMonth])

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 rounded-[10px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shrink-0">
        <div>
          <h2 className="text-[15px] font-medium text-gray-800 dark:text-gray-100">{monthLabel}</h2>
          <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">
            {currentMonthTaskCount} 个任务到期
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={prevMonth}
            aria-label="上个月"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className="px-2.5 py-1 text-[13px] font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            onClick={() => { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()) }}
          >
            今天
          </button>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={nextMonth}
            aria-label="下个月"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Priority legend */}
      <div className="flex items-center gap-4 px-5 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
        {[
          { label: '高优先级', color: '#E74C3C' },
          { label: '中优先级', color: '#FFB264' },
          { label: '低优先级', color: '#0F79F3' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 shrink-0">
        {DAY_NAMES.map((name, i) => (
          <div
            key={name}
            className={`py-2 text-center text-[13px] font-medium border-r last:border-r-0 border-gray-100 dark:border-gray-800 ${
              i >= 5
                ? 'text-blue-500 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-7">
          {calendarDays.map((cell, idx) => (
            <DayCell
              key={idx}
              day={cell.day}
              isToday={cell.date === todayStr}
              isCurrentMonth={cell.isCurrentMonth}
              tasks={cell.date ? (tasksByDate.get(cell.date) ?? []) : []}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default CalendarView
