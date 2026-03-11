// Shared constants extracted from Overview, ProjectDetail, KanbanBoard

export const STAGE_ORDER = [
  'initiation', 'bidding', 'contract', 'design',
  'procurement', 'construction', 'acceptance', 'settlement', 'archived',
] as const;

export const STAGE_LABELS: Record<string, string> = {
  initiation: '立项',
  bidding: '投标',
  contract: '签约',
  design: '设计',
  procurement: '采购',
  construction: '施工/实施',
  acceptance: '验收',
  settlement: '结算',
  archived: '归档',
};

export const STAGE_COLORS: Record<string, string> = {
  '立项': '#0086C0',
  '投标': '#6BBF59',
  '签约': '#9B51E0',
  '设计': '#00C875',
  '采购': '#FDAB3D',
  '施工/实施': '#E2445C',
  '验收': '#FF7A59',
  '结算': '#37B4E3',
  '归档': '#676879',
  // English key variants
  initiation: '#0086C0',
  bidding: '#6BBF59',
  contract: '#9B51E0',
  design: '#00C875',
  procurement: '#FDAB3D',
  construction: '#E2445C',
  acceptance: '#FF7A59',
  settlement: '#37B4E3',
  archived: '#676879',
};

export const RISK_LEVEL_COLORS: Record<string, string> = {
  low: 'var(--color-success)',
  medium: 'var(--color-warning)',
  high: 'var(--color-danger)',
  critical: '#9B1B30',
};

export const RISK_LEVEL_LABELS: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '极高风险',
};

export const STATUS_COLORS: Record<string, string> = {
  active: 'var(--color-success)',
  risk: 'var(--color-danger)',
  planning: 'var(--color-info)',
  completed: 'var(--color-text-muted)',
};

export const STATUS_LABELS: Record<string, string> = {
  active: '进行中',
  risk: '存在风险',
  planning: '规划中',
  completed: '已完成',
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  todo: '#0086C0',
  in_progress: '#6BBF59',
  review: '#9B8EC4',
  done: '#00C875',
  blocked: '#E2445C',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: '待办',
  in_progress: '进行中',
  review: '评审中',
  done: '已完成',
  blocked: '已阻塞',
};

export const PRIORITY_COLORS: Record<string, string> = {
  high: '#E2445C',
  medium: '#FDAB3D',
  low: '#00C875',
};

export const PRIORITY_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

export const STAGE_DELIVERABLES: Record<string, string[]> = {
  initiation: ['可行性报告', '立项申请书'],
  bidding: ['投标文件', '报价单', '资质文件'],
  contract: ['合同文件', '付款计划'],
  design: ['设计方案', '图纸', '技术规格书'],
  procurement: ['采购清单', '供应商合同', '验收标准'],
  construction: ['施工日志', '质量报告', '进度记录'],
  acceptance: ['验收报告', '竣工文件', '用户手册'],
  settlement: ['结算报告', '决算书', '审计文件'],
  archived: ['完整项目档案'],
};

export const STAGE_TRANSITIONS: Record<string, string[]> = {
  initiation: ['bidding', 'contract'],
  bidding: ['contract', 'initiation'],
  contract: ['design'],
  design: ['procurement', 'construction'],
  procurement: ['construction'],
  construction: ['acceptance'],
  acceptance: ['settlement'],
  settlement: ['archived'],
  archived: [],
};

// ---------------------------------------------------------------------------
// HR Constants
// ---------------------------------------------------------------------------

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  active: '在职',
  on_leave: '休假中',
  resigned: '已离职',
};

export const EMPLOYEE_STATUS_COLORS: Record<string, string> = {
  active: '#00C875',
  on_leave: '#FDAB3D',
  resigned: '#676879',
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  normal: '正常',
  late: '迟到',
  absent: '缺勤',
  leave: '请假',
};

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  normal: '#00C875',
  late: '#FDAB3D',
  absent: '#E2445C',
  leave: '#0086C0',
};

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  annual: '年假',
  sick: '病假',
  personal: '事假',
  maternity: '产假',
};

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
};

export const APPROVAL_STATUS_COLORS: Record<string, string> = {
  pending: '#FDAB3D',
  approved: '#00C875',
  rejected: '#E2445C',
};

// ---------------------------------------------------------------------------
// Finance Constants
// ---------------------------------------------------------------------------

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  travel: '差旅',
  office: '办公',
  entertainment: '招待',
  material: '材料',
  other: '其他',
};

export const EXPENSE_STATUS_LABELS: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  approved: '已通过',
  rejected: '已驳回',
  paid: '已付款',
};

export const EXPENSE_STATUS_COLORS: Record<string, string> = {
  draft: '#676879',
  submitted: '#0086C0',
  approved: '#00C875',
  rejected: '#E2445C',
  paid: '#6BBF59',
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  pending: '待付',
  paid: '已付',
  overdue: '逾期',
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  pending: '#FDAB3D',
  paid: '#00C875',
  overdue: '#E2445C',
};
