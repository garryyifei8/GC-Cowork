import { useEffect, useState } from 'react'
import { Users, UserCheck, CalendarOff, Clock } from 'lucide-react'
import { useHRStore } from '../stores/hrStore'
import { StatCard, DataTable, LoadingSpinner } from '../widgets/atomic'
import type { Column } from '../widgets/atomic/DataTable'
import StaffDirectory from '../widgets/views/StaffDirectory'
import type { AttendanceRecord, LeaveRequest, SalaryRecord } from '../types'

type TabKey = 'employees' | 'attendance' | 'leaves' | 'salary'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'employees', label: '员工' },
  { key: 'attendance', label: '考勤' },
  { key: 'leaves', label: '请假' },
  { key: 'salary', label: '薪资' },
]

const attendanceCols: Column<AttendanceRecord>[] = [
  { key: 'employee_id', label: '员工ID', sortable: true },
  { key: 'date', label: '日期', sortable: true },
  { key: 'check_in', label: '签到', render: (v) => v ?? '-' },
  { key: 'check_out', label: '签退', render: (v) => v ?? '-' },
  {
    key: 'status',
    label: '状态',
    sortable: true,
    render: (v) => {
      const colors: Record<string, string> = {
        normal: 'text-emerald-600 bg-emerald-50',
        late: 'text-amber-600 bg-amber-50',
        absent: 'text-red-600 bg-red-50',
      }
      const labels: Record<string, string> = { normal: '正常', late: '迟到', absent: '缺勤' }
      return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[v] ?? ''}`}>
          {labels[v] ?? v}
        </span>
      )
    },
  },
]

const leaveCols = (onApprove: (id: string, approved: boolean) => void): Column<LeaveRequest>[] => [
  { key: 'employee_id', label: '员工ID', sortable: true },
  { key: 'leave_type', label: '类型', sortable: true },
  { key: 'start_date', label: '开始', sortable: true },
  { key: 'end_date', label: '结束' },
  { key: 'days', label: '天数', sortable: true },
  { key: 'reason', label: '原因' },
  {
    key: 'status',
    label: '状态',
    render: (v) => {
      const colors: Record<string, string> = {
        pending: 'text-blue-600 bg-blue-50',
        approved: 'text-emerald-600 bg-emerald-50',
        rejected: 'text-red-600 bg-red-50',
      }
      const labels: Record<string, string> = { pending: '待审批', approved: '已通过', rejected: '已驳回' }
      return (
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[v] ?? ''}`}>
          {labels[v] ?? v}
        </span>
      )
    },
  },
  {
    key: 'id',
    label: '操作',
    render: (_v, row) => {
      if (row.status !== 'pending') return null
      return (
        <div className="flex gap-2">
          <button
            className="px-2 py-1 text-xs rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
            onClick={(e) => { e.stopPropagation(); onApprove(row.id, true) }}
          >
            通过
          </button>
          <button
            className="px-2 py-1 text-xs rounded bg-red-500 text-white hover:bg-red-600 transition-colors"
            onClick={(e) => { e.stopPropagation(); onApprove(row.id, false) }}
          >
            驳回
          </button>
        </div>
      )
    },
  },
]

const salaryCols: Column<SalaryRecord>[] = [
  { key: 'employee_id', label: '员工ID', sortable: true },
  { key: 'month', label: '月份', sortable: true },
  { key: 'base_salary', label: '基本工资', sortable: true, render: (v) => `¥${Number(v).toLocaleString()}` },
  { key: 'overtime_pay', label: '加班', render: (v) => `¥${Number(v).toLocaleString()}` },
  { key: 'bonus', label: '奖金', render: (v) => `¥${Number(v).toLocaleString()}` },
  { key: 'deductions', label: '扣款', render: (v) => `¥${Number(v).toLocaleString()}` },
  { key: 'social_insurance', label: '社保', render: (v) => `¥${Number(v).toLocaleString()}` },
  { key: 'tax', label: '个税', render: (v) => `¥${Number(v).toLocaleString()}` },
  { key: 'net_salary', label: '实发', sortable: true, render: (v) => (
    <span className="font-medium text-[#00C875]">¥{Number(v).toLocaleString()}</span>
  )},
]

export const HRDashboard = () => {
  const {
    summary, attendance, leaveRequests, salaryRecords, isLoading, error,
    fetchEmployees, fetchAttendance, fetchLeaveRequests, fetchSalaryRecords,
    fetchSummary, approveLeave, clearError,
  } = useHRStore()

  const [activeTab, setActiveTab] = useState<TabKey>('employees')

  useEffect(() => {
    fetchSummary()
    fetchEmployees()
    fetchAttendance()
    fetchLeaveRequests()
    fetchSalaryRecords()
  }, [fetchSummary, fetchEmployees, fetchAttendance, fetchLeaveRequests, fetchSalaryRecords])

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <h1 className="text-[18px] font-medium text-light-text">人力资源</h1>

      {/* Error banner */}
      {error && (
        <div className="bg-[#FFEBEE] border border-[#E74C3C]/20 rounded-[10px] p-3 flex items-center justify-between">
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={clearError} className="text-red-500 hover:text-red-700 text-sm font-medium">关闭</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="总员工"
          value={summary?.total_employees ?? '-'}
          icon={<Users size={20} />}
          iconColor="bg-[#00CAE3] text-white"
        />
        <StatCard
          label="在职"
          value={summary?.active_count ?? '-'}
          icon={<UserCheck size={20} />}
          iconColor="bg-[#00C875] text-white"
        />
        <StatCard
          label="休假中"
          value={summary?.on_leave_count ?? '-'}
          icon={<CalendarOff size={20} />}
          iconColor="bg-[#FFB264] text-white"
        />
        <StatCard
          label="出勤率"
          value={summary ? `${(summary.attendance_rate * 100).toFixed(1)}%` : '-'}
          icon={<Clock size={20} />}
          iconColor="bg-[#2E37A4] text-white"
        />
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 bg-[#EFF3F9] rounded-[10px] p-1 self-start" role="tablist">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            className={
              activeTab === key
                ? 'px-4 py-2 rounded-md text-sm font-medium bg-white text-[#00C875] transition-colors'
                : 'px-4 py-2 rounded-md text-sm font-medium text-light-text-secondary hover:text-light-text transition-colors'
            }
            onClick={() => setActiveTab(key)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && <LoadingSpinner text="加载中..." />}

      {/* Tab content */}
      {!isLoading && (
        <>
          {activeTab === 'employees' && <StaffDirectory />}
          {activeTab === 'attendance' && (
            <DataTable<AttendanceRecord> columns={attendanceCols} rows={attendance} emptyMessage="暂无考勤记录" />
          )}
          {activeTab === 'leaves' && (
            <DataTable<LeaveRequest> columns={leaveCols(approveLeave)} rows={leaveRequests} emptyMessage="暂无请假记录" />
          )}
          {activeTab === 'salary' && (
            <DataTable<SalaryRecord> columns={salaryCols} rows={salaryRecords} emptyMessage="暂无薪资记录" />
          )}
        </>
      )}
    </div>
  )
}
