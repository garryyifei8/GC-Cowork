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
  development: '开发',
  testing: '测试',
  research: '调研',
  compilation: '编制',
  application: '申报',
  review: '评审',
};

export const STAGE_COLORS: Record<string, string> = {
  '立项': '#0086C0',
  '投标': '#2ED47E',
  '签约': '#796DF6',
  '设计': '#00C875',
  '采购': '#FFB264',
  '施工/实施': '#E74C3C',
  '验收': '#FF7A59',
  '结算': '#00CAE3',
  '归档': '#919AA3',
  // English key variants
  initiation: '#0086C0',
  bidding: '#2ED47E',
  contract: '#796DF6',
  design: '#00C875',
  procurement: '#FFB264',
  construction: '#E74C3C',
  acceptance: '#FF7A59',
  settlement: '#00CAE3',
  archived: '#919AA3',
  '开发': '#0F79F3',
  '测试': '#FF7A59',
  '调研': '#00CAE3',
  '编制': '#796DF6',
  '申报': '#FFB264',
  '评审': '#E74C3C',
  development: '#0F79F3',
  testing: '#FF7A59',
  research: '#00CAE3',
  compilation: '#796DF6',
  application: '#FFB264',
  review: '#E74C3C',
};

export const RISK_LEVEL_COLORS: Record<string, string> = {
  low: '#2ED47E',
  medium: '#FFB264',
  high: '#E74C3C',
  critical: '#9B1B30',
};

export const RISK_LEVEL_LABELS: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '极高风险',
};

export const STATUS_COLORS: Record<string, string> = {
  active: '#2ED47E',
  risk: '#E74C3C',
  planning: '#00CAE3',
  completed: '#919AA3',
};

export const STATUS_LABELS: Record<string, string> = {
  active: '进行中',
  risk: '存在风险',
  planning: '规划中',
  completed: '已完成',
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  todo: '#C4C4C4',
  in_progress: '#FFB264',
  review: '#796DF6',
  done: '#2ED47E',
  blocked: '#E74C3C',
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  todo: '未开始',
  in_progress: '进行中',
  review: '待评审',
  done: '完成',
  blocked: '卡住',
};

export const PRIORITY_COLORS: Record<string, string> = {
  high: '#E74C3C',
  medium: '#FFB264',
  low: '#00CAE3',
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
  active: '#2ED47E',
  on_leave: '#FFB264',
  resigned: '#919AA3',
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  normal: '正常',
  late: '迟到',
  absent: '缺勤',
  leave: '请假',
};

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  normal: '#2ED47E',
  late: '#FFB264',
  absent: '#E74C3C',
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
  pending: '#FFB264',
  approved: '#2ED47E',
  rejected: '#E74C3C',
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
  draft: '#919AA3',
  submitted: '#0086C0',
  approved: '#2ED47E',
  rejected: '#E74C3C',
  paid: '#00C875',
};

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  pending: '待付',
  paid: '已付',
  overdue: '逾期',
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  pending: '#FFB264',
  paid: '#2ED47E',
  overdue: '#E74C3C',
};

// ---------------------------------------------------------------------------
// 项目类型管线分化
// ---------------------------------------------------------------------------

/** 将自由文本 project_type 映射到管线分类 */
export type PipelineCategory = 'epc' | 'it' | 'consulting';

export function getPipelineCategory(projectType: string): PipelineCategory {
  const lower = projectType.toLowerCase();
  if (lower.includes('epc') || lower.includes('展馆') || lower.includes('公建')
    || lower.includes('市政') || lower.includes('景观') || lower.includes('工程')) {
    return 'epc';
  }
  if (lower.includes('信息化') || lower.includes('开发') || lower.includes('系统')
    || lower.includes('平台') || lower.includes('数据')) {
    return 'it';
  }
  if (lower.includes('咨询') || lower.includes('专项债') || lower.includes('可研')
    || lower.includes('可行性')) {
    return 'consulting';
  }
  return 'epc'; // 默认EPC
}

export const PIPELINE_CATEGORY_LABELS: Record<PipelineCategory, string> = {
  epc: 'EPC工程',
  it: '信息化',
  consulting: '咨询',
};

export const PIPELINE_STAGES: Record<PipelineCategory, readonly string[]> = {
  epc: ['initiation', 'bidding', 'contract', 'design', 'procurement', 'construction', 'acceptance', 'settlement', 'archived'] as const,
  it: ['initiation', 'contract', 'design', 'development', 'testing', 'acceptance', 'settlement', 'archived'] as const,
  consulting: ['initiation', 'research', 'compilation', 'application', 'review', 'archived'] as const,
};

export const PIPELINE_DELIVERABLES: Record<PipelineCategory, Record<string, string[]>> = {
  epc: {
    initiation: ['可行性报告', '立项申请书', '项目建议书'],
    bidding: ['投标文件', '报价单', '资质文件', '施工组织设计'],
    contract: ['合同文件', '付款计划', '履约保函'],
    design: ['设计方案', '施工图纸', '技术规格书', '工程量清单'],
    procurement: ['采购计划', '招标文件', '供应商合同', '材料样品确认单'],
    construction: ['施工日志', '质量报告', '进度记录', '隐蔽工程验收记录', '材料进场报验'],
    acceptance: ['验收报告', '竣工图纸', '质量评定报告', '消防验收', '规划验收'],
    settlement: ['结算报告', '决算书', '审计报告', '工程变更汇总'],
    archived: ['完整项目档案', '竣工备案表'],
  },
  it: {
    initiation: ['可行性报告', '立项申请书'],
    contract: ['合同文件', '付款计划', 'SLA协议'],
    design: ['需求规格说明书', '系统架构设计', '数据库设计', '接口文档', 'UI设计稿'],
    development: ['代码仓库', '开发进度报告', '接口联调报告'],
    testing: ['测试计划', '测试用例', '测试报告', '性能测试报告', '安全测评报告'],
    acceptance: ['验收报告', '用户手册', '运维手册', '培训记录'],
    settlement: ['结算报告', '决算书'],
    archived: ['完整项目档案', '源代码归档'],
  },
  consulting: {
    initiation: ['项目建议书', '立项申请'],
    research: ['调研报告', '现场踏勘记录', '数据采集表'],
    compilation: ['可研报告', '实施方案', '投资估算', '还款来源分析'],
    application: ['申报材料', '专家评审意见', '修改说明'],
    review: ['评审通过文件', '批复文件'],
    archived: ['完整项目档案'],
  },
};

export const PIPELINE_TRANSITIONS: Record<PipelineCategory, Record<string, string[]>> = {
  epc: {
    initiation: ['bidding', 'contract'],
    bidding: ['contract', 'initiation'],
    contract: ['design'],
    design: ['procurement', 'construction'],
    procurement: ['construction'],
    construction: ['acceptance'],
    acceptance: ['settlement'],
    settlement: ['archived'],
    archived: [],
  },
  it: {
    initiation: ['contract'],
    contract: ['design'],
    design: ['development'],
    development: ['testing'],
    testing: ['acceptance', 'development'],
    acceptance: ['settlement'],
    settlement: ['archived'],
    archived: [],
  },
  consulting: {
    initiation: ['research'],
    research: ['compilation'],
    compilation: ['application'],
    application: ['review', 'compilation'],
    review: ['archived'],
    archived: [],
  },
};

/** 根据项目类型获取管线配置 */
export function getPipelineConfig(projectType: string) {
  const category = getPipelineCategory(projectType);
  return {
    category,
    categoryLabel: PIPELINE_CATEGORY_LABELS[category],
    stages: PIPELINE_STAGES[category],
    deliverables: PIPELINE_DELIVERABLES[category],
    transitions: PIPELINE_TRANSITIONS[category],
  };
}

export const PROCUREMENT_STATUS_LABELS: Record<string, string> = {
  planning: '计划中',
  bidding: '招标中',
  evaluating: '评标中',
  contracted: '已签约',
  delivering: '供货中',
  inspecting: '验收中',
  completed: '已完成',
};

export const PROCUREMENT_STATUS_COLORS: Record<string, string> = {
  planning: '#919AA3',
  bidding: '#0086C0',
  evaluating: '#796DF6',
  contracted: '#0F79F3',
  delivering: '#FFB264',
  inspecting: '#FF7A59',
  completed: '#2ED47E',
};

export const PROCUREMENT_CATEGORIES: string[] = ['材料', '设备', '分包'];

export const PROCESS_RECORD_TYPE_LABELS: Record<string, string> = {
  daily_log: '施工日志',
  quality_check: '质量检查',
  inspection: '巡检记录',
  material_entry: '材料进场',
  hidden_work: '隐蔽工程',
  safety_check: '安全检查',
};

export const PROCESS_RECORD_TYPE_ICONS: Record<string, string> = {
  daily_log: '📋',
  quality_check: '🔍',
  inspection: '👷',
  material_entry: '📦',
  hidden_work: '🏗️',
  safety_check: '🦺',
};

export const PROCESS_STATUS_LABELS: Record<string, string> = {
  normal: '正常',
  issue: '异常',
  resolved: '已解决',
};

export const PROCESS_STATUS_COLORS: Record<string, string> = {
  normal: '#2ED47E',
  issue: '#E74C3C',
  resolved: '#0F79F3',
};
