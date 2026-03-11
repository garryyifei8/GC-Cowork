import React, { useEffect, useMemo, useState } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  DollarSign,
  CalendarDays,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useHRStore } from '../stores/hrStore';
import type { Employee, AttendanceRecord, LeaveRequest, SalaryRecord } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('zh-CN', { minimumFractionDigits: 0 })}`;
}

function buildEmployeeMap(employees: Employee[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const emp of employees) {
    map.set(emp.id, emp.name);
  }
  return map;
}

// ── Status badge helpers ───────────────────────────────────────────────────────

function employeeStatusBadge(status: string): React.ReactNode {
  const styles: Record<string, string> = {
    active:    'bg-success/10 text-success',
    on_leave:  'bg-warning/10 text-warning',
    resigned:  'bg-slate-200/60 text-slate-500 dark:bg-slate-700/60 dark:text-slate-400',
  };
  const labels: Record<string, string> = {
    active: '在职', on_leave: '休假中', resigned: '已离职',
  };
  const cls = styles[status] ?? styles.resigned;
  const label = labels[status] ?? status;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function attendanceStatusBadge(status: string): React.ReactNode {
  const map: Record<string, { cls: string; label: string }> = {
    normal:  { cls: 'bg-success/10 text-success',   label: '正常' },
    late:    { cls: 'bg-warning/10 text-warning',   label: '迟到' },
    absent:  { cls: 'bg-danger/10 text-danger',     label: '缺勤' },
    leave:   { cls: 'bg-info/10 text-info',         label: '请假' },
  };
  const info = map[status] ?? map.normal;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${info.cls}`}>
      {info.label}
    </span>
  );
}

function leaveStatusBadge(status: string): React.ReactNode {
  const map: Record<string, { cls: string; label: string }> = {
    pending:  { cls: 'bg-warning/10 text-warning',     label: '待审批' },
    approved: { cls: 'bg-success/10 text-success',     label: '已批准' },
    rejected: { cls: 'bg-danger/10 text-danger',       label: '已驳回' },
  };
  const info = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${info.cls}`}>
      {info.label}
    </span>
  );
}

function leaveTypeLabel(type: string): string {
  const map: Record<string, string> = {
    annual:    '年假',
    sick:      '病假',
    personal:  '事假',
    maternity: '产假',
  };
  return map[type] ?? type;
}

// ── HRMetricCard ──────────────────────────────────────────────────────────────

interface MetricCardProps {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  iconColorClass: string;
}

const HRMetricCard: React.FC<MetricCardProps> = ({ icon, value, label, iconColorClass }) => (
  <div
    className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-4 transition-colors duration-200"
    role="figure"
    aria-label={`${label}: ${value}`}
  >
    <div className="flex items-center gap-2 mb-2">
      <span className={iconColorClass} aria-hidden="true">{icon}</span>
      <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{label}</span>
    </div>
    <div className="text-xl font-bold font-heading">{value}</div>
  </div>
);

interface HRMetricsRowProps {
  totalEmployees: number;
  activeCount: number;
  onLeaveCount: number;
  attendanceRate: number;
  avgSalary: number;
}

const HRMetricsRow: React.FC<HRMetricsRowProps> = ({
  totalEmployees,
  activeCount,
  onLeaveCount,
  attendanceRate,
  avgSalary,
}) => (
  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6" role="list" aria-label="人力资源指标">
    <HRMetricCard icon={<Users size={22} />}       value={totalEmployees}                label="员工总数" iconColorClass="text-primary" />
    <HRMetricCard icon={<UserCheck size={22} />}   value={activeCount}                   label="在职人数" iconColorClass="text-success" />
    <HRMetricCard icon={<Clock size={22} />}       value={onLeaveCount}                  label="休假中"   iconColorClass="text-warning" />
    <HRMetricCard icon={<CalendarDays size={22} />} value={`${attendanceRate.toFixed(1)}%`} label="出勤率" iconColorClass="text-info" />
    <HRMetricCard icon={<DollarSign size={22} />}  value={formatCurrency(avgSalary)}     label="平均工资" iconColorClass="text-cyan-500" />
  </div>
);

// ── Common table wrapper classes ─────────────────────────────────────────────

const PANEL_CLS = 'bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl overflow-hidden transition-colors duration-200';
const TH_CLS    = 'px-4 py-3 text-left text-xs font-medium text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wider';
const TR_CLS    = 'border-t border-light-border/50 dark:border-dark-border/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors';
const TD_CLS    = 'px-4 py-3 text-sm';
const FILTER_SELECT_CLS = 'rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
const FILTER_INPUT_CLS  = 'rounded-lg border border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

// ── EmployeeTable ─────────────────────────────────────────────────────────────

interface EmployeeTableProps {
  employees: Employee[];
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ employees }) => {
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { fetchEmployees } = useHRStore();

  const departments = useMemo(() => {
    const depts = Array.from(new Set(employees.map((e) => e.department))).sort();
    return depts;
  }, [employees]);

  const filtered = useMemo(
    () =>
      employees.filter((e) => {
        if (deptFilter && e.department !== deptFilter) return false;
        if (statusFilter && e.status !== statusFilter) return false;
        return true;
      }),
    [employees, deptFilter, statusFilter]
  );

  useEffect(() => {
    fetchEmployees(deptFilter || undefined, statusFilter || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deptFilter, statusFilter]);

  return (
    <div className={PANEL_CLS}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-light-border dark:border-dark-border">
        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">筛选:</span>
        <select
          className={FILTER_SELECT_CLS}
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          aria-label="按部门筛选"
        >
          <option value="">全部部门</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          className={FILTER_SELECT_CLS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="按状态筛选"
        >
          <option value="">全部状态</option>
          <option value="active">在职</option>
          <option value="on_leave">休假中</option>
          <option value="resigned">已离职</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" aria-label="员工列表">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className={TH_CLS}>姓名</th>
              <th className={TH_CLS}>部门</th>
              <th className={TH_CLS}>职位</th>
              <th className={TH_CLS}>入职日期</th>
              <th className={TH_CLS}>状态</th>
              <th className={`${TH_CLS} text-right`}>薪资</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">暂无员工数据</td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr key={emp.id} className={TR_CLS}>
                  <td className={`${TD_CLS} font-semibold`}>{emp.name}</td>
                  <td className={TD_CLS}>{emp.department}</td>
                  <td className={TD_CLS}>{emp.position}</td>
                  <td className={TD_CLS}>{emp.hire_date}</td>
                  <td className={TD_CLS}>{employeeStatusBadge(emp.status)}</td>
                  <td className={`${TD_CLS} text-right font-medium text-primary`}>{formatCurrency(emp.salary)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── AttendanceTable ───────────────────────────────────────────────────────────

interface AttendanceTableProps {
  records: AttendanceRecord[];
  employeeMap: Map<string, string>;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ records, employeeMap }) => {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { fetchAttendance } = useHRStore();

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        if (dateFrom && r.date < dateFrom) return false;
        if (dateTo && r.date > dateTo) return false;
        return true;
      }),
    [records, dateFrom, dateTo]
  );

  useEffect(() => {
    fetchAttendance(undefined, dateFrom || undefined, dateTo || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo]);

  return (
    <div className={PANEL_CLS}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-light-border dark:border-dark-border">
        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">日期范围:</span>
        <input
          type="date"
          className={FILTER_INPUT_CLS}
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          aria-label="开始日期"
        />
        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">至</span>
        <input
          type="date"
          className={FILTER_INPUT_CLS}
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          aria-label="结束日期"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" aria-label="考勤记录">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className={TH_CLS}>员工</th>
              <th className={TH_CLS}>日期</th>
              <th className={TH_CLS}>签到</th>
              <th className={TH_CLS}>签退</th>
              <th className={TH_CLS}>状态</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">暂无考勤记录</td>
              </tr>
            ) : (
              filtered.map((rec) => (
                <tr key={rec.id} className={TR_CLS}>
                  <td className={`${TD_CLS} font-semibold`}>
                    {employeeMap.get(rec.employee_id) ?? rec.employee_id}
                  </td>
                  <td className={TD_CLS}>{rec.date}</td>
                  <td className={TD_CLS}>{rec.check_in ?? '—'}</td>
                  <td className={TD_CLS}>{rec.check_out ?? '—'}</td>
                  <td className={TD_CLS}>{attendanceStatusBadge(rec.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── LeaveTable ────────────────────────────────────────────────────────────────

interface LeaveTableProps {
  leaves: LeaveRequest[];
  employeeMap: Map<string, string>;
  onApprove: (id: string, approved: boolean) => void;
}

const LeaveTable: React.FC<LeaveTableProps> = ({ leaves, employeeMap, onApprove }) => {
  const [statusFilter, setStatusFilter] = useState('');

  const { fetchLeaveRequests } = useHRStore();

  const filtered = useMemo(
    () => (statusFilter ? leaves.filter((l) => l.status === statusFilter) : leaves),
    [leaves, statusFilter]
  );

  useEffect(() => {
    fetchLeaveRequests(undefined, statusFilter || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <div className={PANEL_CLS}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-light-border dark:border-dark-border">
        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">审批状态:</span>
        <select
          className={FILTER_SELECT_CLS}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="按审批状态筛选"
        >
          <option value="">全部</option>
          <option value="pending">待审批</option>
          <option value="approved">已批准</option>
          <option value="rejected">已驳回</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" aria-label="请假申请">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className={TH_CLS}>员工</th>
              <th className={TH_CLS}>类型</th>
              <th className={TH_CLS}>开始日期</th>
              <th className={TH_CLS}>结束日期</th>
              <th className={`${TH_CLS} text-right`}>天数</th>
              <th className={TH_CLS}>原因</th>
              <th className={TH_CLS}>状态</th>
              <th className={TH_CLS}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">暂无请假申请</td>
              </tr>
            ) : (
              filtered.map((leave) => (
                <tr key={leave.id} className={TR_CLS}>
                  <td className={`${TD_CLS} font-semibold`}>
                    {employeeMap.get(leave.employee_id) ?? leave.employee_id}
                  </td>
                  <td className={TD_CLS}>{leaveTypeLabel(leave.leave_type)}</td>
                  <td className={TD_CLS}>{leave.start_date}</td>
                  <td className={TD_CLS}>{leave.end_date}</td>
                  <td className={`${TD_CLS} text-right`}>{leave.days}</td>
                  <td
                    className={`${TD_CLS} max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap`}
                    title={leave.reason}
                  >
                    {leave.reason}
                  </td>
                  <td className={TD_CLS}>{leaveStatusBadge(leave.status)}</td>
                  <td className={TD_CLS}>
                    {leave.status === 'pending' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-success/10 text-success hover:bg-success/20 transition-colors"
                          onClick={() => onApprove(leave.id, true)}
                          aria-label={`批准 ${employeeMap.get(leave.employee_id)} 的请假申请`}
                        >
                          <CheckCircle2 size={13} />
                          通过
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                          onClick={() => onApprove(leave.id, false)}
                          aria-label={`驳回 ${employeeMap.get(leave.employee_id)} 的请假申请`}
                        >
                          <XCircle size={13} />
                          驳回
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {leave.approver ?? '—'}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── SalaryTable ───────────────────────────────────────────────────────────────

interface SalaryTableProps {
  records: SalaryRecord[];
  employeeMap: Map<string, string>;
}

const SalaryTable: React.FC<SalaryTableProps> = ({ records, employeeMap }) => {
  const [monthFilter, setMonthFilter] = useState('');

  const { fetchSalaryRecords } = useHRStore();

  const months = useMemo(() => {
    const set = new Set(records.map((r) => r.month));
    return Array.from(set).sort().reverse();
  }, [records]);

  const filtered = useMemo(
    () => (monthFilter ? records.filter((r) => r.month === monthFilter) : records),
    [records, monthFilter]
  );

  useEffect(() => {
    fetchSalaryRecords(undefined, monthFilter || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter]);

  return (
    <div className={PANEL_CLS}>
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-light-border dark:border-dark-border">
        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">月份:</span>
        <select
          className={FILTER_SELECT_CLS}
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          aria-label="按月份筛选"
        >
          <option value="">全部月份</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full" aria-label="工资明细">
          <thead className="bg-slate-50 dark:bg-slate-800/50">
            <tr>
              <th className={TH_CLS}>员工</th>
              <th className={TH_CLS}>月份</th>
              <th className={`${TH_CLS} text-right`}>基本工资</th>
              <th className={`${TH_CLS} text-right`}>加班费</th>
              <th className={`${TH_CLS} text-right`}>奖金</th>
              <th className={`${TH_CLS} text-right`}>扣款</th>
              <th className={`${TH_CLS} text-right`}>社保</th>
              <th className={`${TH_CLS} text-right`}>个税</th>
              <th className={`${TH_CLS} text-right`}>实发工资</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-sm text-light-text-secondary dark:text-dark-text-secondary">暂无工资记录</td>
              </tr>
            ) : (
              filtered.map((rec) => (
                <tr key={rec.id} className={TR_CLS}>
                  <td className={`${TD_CLS} font-semibold`}>
                    {employeeMap.get(rec.employee_id) ?? rec.employee_id}
                  </td>
                  <td className={TD_CLS}>{rec.month}</td>
                  <td className={`${TD_CLS} text-right font-medium`}>{formatCurrency(rec.base_salary)}</td>
                  <td className={`${TD_CLS} text-right font-medium`}>{formatCurrency(rec.overtime_pay)}</td>
                  <td className={`${TD_CLS} text-right font-medium`}>{formatCurrency(rec.bonus)}</td>
                  <td className={`${TD_CLS} text-right font-medium text-danger`}>-{formatCurrency(rec.deductions)}</td>
                  <td className={`${TD_CLS} text-right font-medium text-danger`}>-{formatCurrency(rec.social_insurance)}</td>
                  <td className={`${TD_CLS} text-right font-medium text-danger`}>-{formatCurrency(rec.tax)}</td>
                  <td className={`${TD_CLS} text-right font-bold text-primary`}>{formatCurrency(rec.net_salary)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── AI Insights Section ───────────────────────────────────────────────────────

interface InsightItem {
  title: string;
  description: string;
  severity: string;
  category: string;
}

interface HRInsightsSectionProps {
  insights: InsightItem[];
}

const HRInsightsSection: React.FC<HRInsightsSectionProps> = ({ insights }) => {
  if (insights.length === 0) return null;

  const getIconColorClass = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-danger';
      case 'warning':  return 'text-warning';
      default:         return 'text-info';
    }
  };

  return (
    <section
      className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-xl p-5 transition-colors duration-200 mb-6"
      aria-labelledby="hr-insights-heading"
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold font-heading" id="hr-insights-heading">AI 人力洞察</h2>
      </div>
      <div className="space-y-2">
        {insights.map((insight, idx) => {
          const iconColorClass = getIconColorClass(insight.severity);
          const IconComp =
            insight.severity === 'critical' || insight.severity === 'warning'
              ? AlertTriangle
              : Sparkles;
          return (
            <div
              key={idx}
              className="flex gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
            >
              <span className={`flex-shrink-0 mt-0.5 ${iconColorClass}`} aria-hidden="true">
                <IconComp size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold mb-0.5">{insight.title}</div>
                <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary leading-relaxed">{insight.description}</p>
                {insight.category && (
                  <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary font-medium">
                    {insight.category}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ── Tab types ─────────────────────────────────────────────────────────────────

type TabId = 'employees' | 'attendance' | 'leaves' | 'salary';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabDef[] = [
  { id: 'employees',  label: '员工列表', icon: <Users size={15} /> },
  { id: 'attendance', label: '考勤记录', icon: <CalendarDays size={15} /> },
  { id: 'leaves',     label: '请假管理', icon: <Clock size={15} /> },
  { id: 'salary',     label: '工资明细', icon: <DollarSign size={15} /> },
];

// ── Main Component ────────────────────────────────────────────────────────────

export const HRDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('employees');

  const {
    employees,
    attendance,
    leaveRequests,
    salaryRecords,
    summary,
    insights,
    isLoading,
    error,
    fetchEmployees,
    fetchAttendance,
    fetchLeaveRequests,
    fetchSalaryRecords,
    fetchSummary,
    fetchInsights,
    approveLeave,
  } = useHRStore();

  // Initial data load
  useEffect(() => {
    fetchEmployees();
    fetchSummary();
    fetchInsights();
  }, [fetchEmployees, fetchSummary, fetchInsights]);

  // Lazy-load tab data on first visit
  useEffect(() => {
    if (activeTab === 'attendance') fetchAttendance();
    if (activeTab === 'leaves')     fetchLeaveRequests();
    if (activeTab === 'salary')     fetchSalaryRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Employee id -> name lookup map shared across sub-tables
  const employeeMap = useMemo(() => buildEmployeeMap(employees), [employees]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (isLoading && !summary && employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3 text-light-text-secondary dark:text-dark-text-secondary" aria-live="polite">
        <Loader2 size={36} className="animate-spin text-primary" aria-label="加载中" />
        <span className="text-sm">正在加载人力资源数据…</span>
      </div>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error && !summary && employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-3" role="alert">
        <AlertTriangle size={32} className="text-danger" aria-hidden="true" />
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{error}</p>
        <button
          type="button"
          className="px-5 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
          onClick={() => { fetchEmployees(); fetchSummary(); fetchInsights(); }}
        >
          重新加载
        </button>
      </div>
    );
  }

  const s = summary;

  return (
    <div className="space-y-0">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">员工档案 · 考勤管理 · 假期审批 · 薪酬明细</p>
      </div>

      {/* ── Metric cards ────────────────────────────────────────────────────── */}
      <HRMetricsRow
        totalEmployees={s?.total_employees ?? employees.length}
        activeCount={s?.active_count ?? 0}
        onLeaveCount={s?.on_leave_count ?? 0}
        attendanceRate={s?.attendance_rate ?? 0}
        avgSalary={s?.avg_salary ?? 0}
      />

      {/* ── AI Insights ─────────────────────────────────────────────────────── */}
      <HRInsightsSection insights={insights} />

      {/* ── Tab bar ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mb-6"
        role="tablist"
        aria-label="人力资源模块导航"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={
              activeTab === tab.id
                ? 'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium bg-light-surface dark:bg-dark-surface shadow-sm text-primary transition-colors'
                : 'flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text transition-colors'
            }
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ─────────────────────────────────────────────────────── */}
      <div role="tabpanel" aria-label={TABS.find((t) => t.id === activeTab)?.label}>
        {activeTab === 'employees' && (
          <EmployeeTable employees={employees} />
        )}
        {activeTab === 'attendance' && (
          <AttendanceTable records={attendance} employeeMap={employeeMap} />
        )}
        {activeTab === 'leaves' && (
          <LeaveTable
            leaves={leaveRequests}
            employeeMap={employeeMap}
            onApprove={(id, approved) => approveLeave(id, approved)}
          />
        )}
        {activeTab === 'salary' && (
          <SalaryTable records={salaryRecords} employeeMap={employeeMap} />
        )}
      </div>

    </div>
  );
};
