import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, X, Check, ChevronDown, ChevronRight, Trash2,
  Users, AlertTriangle, Milestone, ClipboardList, Wallet, Cog, FileText,
  TrendingUp, DollarSign, ShieldAlert, Calendar, Percent, Package,
} from 'lucide-react'
import { LoadingSpinner, AvatarGroup } from '../widgets/atomic'
import ProjectDocuments from '../widgets/views/ProjectDocuments'
import { TaskDetailModal } from '../components/tasks/TaskDetailModal'
import { TaskCreateDrawer } from '../components/tasks/TaskCreateDrawer'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useProjectStore } from '../stores/projectStore'
import { projectService } from '../services/api'
import type { ProjectTask, TaskWithProject, ProcurementPackage, ProcessRecord, DocumentItem, ActivityEvent } from '../types'
import {
  TASK_STATUS_COLORS, TASK_STATUS_LABELS, PRIORITY_COLORS, PRIORITY_LABELS,
  STAGE_LABELS, PROCUREMENT_STATUS_LABELS, PROCUREMENT_STATUS_COLORS,
  PROCESS_RECORD_TYPE_LABELS, PROCESS_RECORD_TYPE_ICONS, PROCESS_STATUS_LABELS, PROCESS_STATUS_COLORS,
} from '../utils/constants'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PIPELINE_STAGES = ['initiation', 'bidding', 'contract', 'design', 'procurement', 'construction', 'acceptance', 'settlement', 'archived']
const STAGE_CLR: Record<string, string> = { initiation: '#0086C0', bidding: '#2ED47E', contract: '#796DF6', design: '#00C875', procurement: '#FFB264', construction: '#E74C3C', acceptance: '#FF7A59', settlement: '#37B4E3', archived: '#919AA3' }
const SEV_CLR: Record<string, string> = { critical: '#E74C3C', high: '#FFB264', medium: '#FFD166', low: '#2ED47E' }
const SEV_LBL: Record<string, string> = { critical: '严重', high: '高', medium: '中', low: '低' }

function fmtCNY(v: number | null | undefined): string {
  if (v == null) return '--'
  if (v >= 1e8) return `${(v / 1e8).toFixed(2)}亿`
  if (v >= 1e4) return `${(v / 1e4).toFixed(1)}万`
  return `¥${v.toLocaleString('zh-CN')}`
}

// ---------------------------------------------------------------------------
// Tabs — merged budget+procurement
// ---------------------------------------------------------------------------

type TabKey = 'overview' | 'tasks' | 'documents' | 'risks' | 'milestones' | 'budget' | 'process' | 'activity'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: '概览', icon: <ClipboardList size={15} /> },
  { key: 'tasks', label: '任务', icon: <ClipboardList size={15} /> },
  { key: 'documents', label: '资料', icon: <FileText size={15} /> },
  { key: 'risks', label: '风险', icon: <AlertTriangle size={15} /> },
  { key: 'milestones', label: '里程碑', icon: <Milestone size={15} /> },
  { key: 'budget', label: '预算与采购', icon: <Wallet size={15} /> },
  { key: 'process', label: '过程管理', icon: <Cog size={15} /> },
  { key: 'activity', label: '活动日志', icon: <Calendar size={15} /> },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    projectDetail, tasks, isLoading,
    fetchProjectDetail, createTask, updateTask, deleteTask,
    createMilestone, updateMilestone, deleteMilestone,
    createRisk, updateRisk, deleteRisk,
    transitionProject, addTeamMember, removeTeamMember, deleteProject,
    fetchActivities, activities,
  } = useProjectStore()

  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null)

  // Forms
  const [showCreateDrawer, setShowCreateDrawer] = useState(false)
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [milestoneName, setMilestoneName] = useState('')
  const [milestoneDate, setMilestoneDate] = useState('')
  const [showRiskForm, setShowRiskForm] = useState(false)
  const [riskDesc, setRiskDesc] = useState('')
  const [riskLevel, setRiskLevel] = useState('medium')
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [showStageMenu, setShowStageMenu] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showProcurementForm, setShowProcurementForm] = useState(false)
  const [procFormData, setProcFormData] = useState({ name: '', category: '材料', supplier: '', budget_amount: '', plan_date: '', responsible: '', notes: '' })
  const [procSubmitting, setProcSubmitting] = useState(false)

  // Sub-data
  const [procurements, setProcurements] = useState<ProcurementPackage[]>([])
  const [processRecords, setProcessRecords] = useState<ProcessRecord[]>([])
  const [projectDocs, setProjectDocs] = useState<DocumentItem[]>([])
  const [processFilter, setProcessFilter] = useState<string>('all')

  useEffect(() => { if (id) fetchProjectDetail(id) }, [id, fetchProjectDetail])
  useEffect(() => {
    if (!id) return
    projectService.getProcurements(id).then(setProcurements).catch(() => {})
    projectService.getProcessRecords(id).then(setProcessRecords).catch(() => {})
    fetch(`/api/documents?project_id=${id}`).then(r => r.json()).then(setProjectDocs).catch(() => {})
  }, [id])

  const projectTasks = id ? (tasks[id] ?? []) : []

  // Handlers
  const handleTaskClick = useCallback((t: ProjectTask | TaskWithProject) => { setSelectedTask({ ...t, project_name: projectDetail?.name ?? '' }) }, [projectDetail?.name])
  const handleTaskUpdate = useCallback(async (tid: string, d: Record<string, unknown>) => { await updateTask(tid, d as Partial<ProjectTask>) }, [updateTask])
  const handleTaskDelete = useCallback(async (tid: string) => { if (id) await deleteTask(tid, id) }, [deleteTask, id])
  const handleCreateTask = async (data: { name: string; projectId: string; assignee?: string; priority?: string; due_date?: string; description?: string }) => {
    await createTask(data.projectId, { name: data.name, assignee: data.assignee, priority: data.priority, due_date: data.due_date })
  }
  const handleCreateMilestone = async () => { if (!milestoneName.trim() || !id) return; await createMilestone(id, { name: milestoneName.trim(), date: milestoneDate || undefined }); setMilestoneName(''); setMilestoneDate(''); setShowMilestoneForm(false) }
  const handleCreateRisk = async () => { if (!riskDesc.trim() || !id) return; await createRisk(id, { description: riskDesc.trim(), level: riskLevel }); setRiskDesc(''); setRiskLevel('medium'); setShowRiskForm(false) }
  const handleStageTransition = async (s: string) => { if (!id) return; await transitionProject(id, s); setShowStageMenu(false) }
  const handleAddMember = async () => { if (!memberName.trim() || !id) return; await addTeamMember(id, memberName.trim()); setMemberName(''); setShowAddMember(false) }
  const handleProcStatusChange = async (pkgId: string, pid: string, ns: string) => { await projectService.updateProcurement(pid, pkgId, { status: ns }); setProcurements((p) => p.map((x) => (x.id === pkgId ? { ...x, status: ns } : x))) }
  const handleCreateProcess = async (rec: Partial<ProcessRecord>) => { if (!id) return; const c = await projectService.createProcessRecord(id, rec); setProcessRecords((p) => [c as ProcessRecord, ...p]); return { id: (c as any).id } }

  // Stats
  const taskStats = useMemo(() => { const c: Record<string, number> = {}; for (const t of projectTasks) c[t.status] = (c[t.status] || 0) + 1; return c }, [projectTasks])
  const riskStats = useMemo(() => { const c: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }; for (const r of (projectDetail?.risks ?? [])) { if (c[r.severity] !== undefined) c[r.severity]++; else c[r.severity] = 1 } return c }, [projectDetail?.risks])
  const budgetUsage = useMemo(() => { if (!projectDetail?.budget_amount) return null; const r = (projectDetail.actual_spend ?? 0) / projectDetail.budget_amount; return { budget: projectDetail.budget_amount, spent: projectDetail.actual_spend ?? 0, rate: r } }, [projectDetail])
  const currentStageIdx = projectDetail ? PIPELINE_STAGES.indexOf(projectDetail.stage) : -1

  // Task kanban columns — must be before early returns to satisfy React hooks rules
  const kanbanCols = ['todo', 'in_progress', 'review', 'done', 'blocked'] as const
  const tasksByStatus = useMemo(() => {
    const m: Record<string, ProjectTask[]> = {}
    for (const s of kanbanCols) m[s] = []
    for (const t of projectTasks) (m[t.status] ??= []).push(t)
    return m
  }, [projectTasks])

  if (isLoading && !projectDetail) return <div className="flex items-center justify-center h-64"><LoadingSpinner text="加载项目..." /></div>
  if (!projectDetail) return <div className="flex flex-col items-center justify-center h-64 gap-3"><p className="text-light-text-secondary">项目未找到或加载中...</p><button onClick={() => { if (id) fetchProjectDetail(id) }} className="text-primary hover:underline text-sm">重试</button><button onClick={() => navigate('/projects')} className="text-[#919AA3] hover:underline text-sm">返回列表</button></div>

  const avatars = (projectDetail.team_members ?? []).map((n) => ({ src: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(n)}&backgroundColor=6366f1,0ea5e9,10b981,f59e0b,ef4444&backgroundType=gradientLinear`, alt: n }))

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* ========== Header ========== */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/projects')} className="p-2 rounded-[10px] hover:bg-[#F4F6FC] transition-colors"><ArrowLeft size={18} className="text-light-text-secondary" /></button>
          <div>
            <h1 className="text-xl font-bold text-light-text">{projectDetail.name}</h1>
            <p className="text-sm text-light-text-secondary">{projectDetail.project_type} · {STAGE_LABELS[projectDetail.stage] ?? projectDetail.stage} · {projectDetail.progress_pct}%</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button onClick={() => setShowStageMenu(!showStageMenu)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-[#E8ECF4] text-sm font-medium text-light-text hover:bg-[#EFF3F9]"><ChevronDown size={14} /> {STAGE_LABELS[projectDetail.stage] ?? projectDetail.stage}</button>
            {showStageMenu && <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E8ECF4] rounded-[10px] shadow-lg z-50 py-1">{PIPELINE_STAGES.map((s) => <button key={s} onClick={() => handleStageTransition(STAGE_LABELS[s] ?? s)} className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F4F6FC] ${s === projectDetail.stage ? 'font-bold text-primary' : 'text-light-text'}`}>{STAGE_LABELS[s] ?? s}</button>)}</div>}
          </div>
          <div className="flex items-center gap-2">{avatars.length > 0 && <AvatarGroup avatars={avatars} max={4} size="sm" />}<button onClick={() => setShowAddMember(!showAddMember)} className="p-1.5 rounded-[10px] hover:bg-[#F4F6FC] text-light-text-secondary" title="团队"><Users size={16} /></button><button onClick={() => setShowDeleteConfirm(true)} className="p-1.5 rounded-[10px] hover:bg-red-50 text-[#919AA3] hover:text-red-500 transition-colors" title="删除项目"><Trash2 size={16} /></button></div>
        </div>
      </div>
      {showAddMember && (
        <div className="flex items-center gap-3 p-3 bg-white border border-[#E8ECF4] rounded-[10px]">
          <span className="text-sm font-medium text-light-text">团队:</span>
          <div className="flex flex-wrap gap-1.5">{(projectDetail.team_members ?? []).map((m) => <span key={m} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#F4F6FC] text-xs text-light-text">{m}<button onClick={() => id && removeTeamMember(id, m)} className="text-red-400 hover:text-red-600"><X size={11} /></button></span>)}</div>
          <input type="text" placeholder="姓名" value={memberName} onChange={(e) => setMemberName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddMember() }} className="w-24 px-2 py-1 text-sm border border-[#E8ECF4] rounded-md" />
          <button onClick={handleAddMember} disabled={!memberName.trim()} className="px-2 py-1 rounded bg-primary text-white text-xs disabled:opacity-50">添加</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E8ECF4] overflow-x-auto">
        {TABS.map((t) => <button key={t.key} onClick={() => setActiveTab(t.key)} className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-light-text-secondary hover:text-light-text hover:border-gray-300'}`}>{t.icon} {t.label}</button>)}
      </div>

      <div className="min-h-[400px]">
        {/* ================================================================ */}
        {/* OVERVIEW — Dashboard                                             */}
        {/* ================================================================ */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-5">
            {/* Progress header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-lg font-bold">{projectDetail.name}</div>
                  <div className="text-blue-100 text-sm mt-0.5">{projectDetail.project_type} · 第 {currentStageIdx + 1}/{PIPELINE_STAGES.length} 阶段</div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-extrabold">{projectDetail.progress_pct}%</div>
                  <div className="text-blue-200 text-xs">整体进度</div>
                </div>
              </div>
              {/* Pipeline dots */}
              <div className="flex items-center gap-0">
                {PIPELINE_STAGES.map((s, i) => (
                  <React.Fragment key={s}>
                    {i > 0 && <div className={`flex-1 h-0.5 ${i <= currentStageIdx ? 'bg-white/60' : 'bg-white/20'}`} />}
                    <div className="flex flex-col items-center relative" style={{ minWidth: 48 }}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                        i < currentStageIdx ? 'border-white/80 bg-white/30 text-white' :
                        i === currentStageIdx ? 'border-white bg-white text-primary shadow-lg scale-125' :
                        'border-white/30 bg-transparent text-white/40'
                      }`}>{i < currentStageIdx ? '✓' : i + 1}</div>
                      <span className={`text-[11px] mt-1 ${i === currentStageIdx ? 'text-white font-bold' : i < currentStageIdx ? 'text-blue-100' : 'text-white/30'}`}>{STAGE_LABELS[s] ?? s}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Budget */}
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4">
                <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 rounded-[10px] bg-blue-100 flex items-center justify-center"><DollarSign size={14} className="text-primary" /></div><span className="text-xs text-light-text-secondary">合同额</span></div>
                <div className="text-lg font-medium text-light-text">{fmtCNY(budgetUsage?.budget)}</div>
                {budgetUsage && <div className="mt-1.5"><div className="w-full h-1 bg-[#F4F6FC] rounded-full overflow-hidden"><div className={`h-full rounded-full ${budgetUsage.rate > .9 ? 'bg-red-400' : budgetUsage.rate > .7 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${Math.min(budgetUsage.rate * 100, 100)}%` }} /></div><div className="text-xs text-[#919AA3] mt-0.5">已用 {(budgetUsage.rate * 100).toFixed(0)}%</div></div>}
              </div>
              {/* Tasks */}
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4">
                <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 rounded-[10px] bg-emerald-100 flex items-center justify-center"><ClipboardList size={14} className="text-emerald-600" /></div><span className="text-xs text-light-text-secondary">任务</span></div>
                <div className="text-lg font-medium text-light-text">{projectTasks.length}</div>
                <div className="flex gap-1 mt-1.5">{['done', 'in_progress', 'todo'].map((s) => { const c = taskStats[s] ?? 0; if (!c) return null; return <span key={s} className="text-xs px-1 py-1 rounded-full font-medium" style={{ color: TASK_STATUS_COLORS[s], backgroundColor: `${TASK_STATUS_COLORS[s]}15` }}>{TASK_STATUS_LABELS[s]} {c}</span> })}</div>
              </div>
              {/* Risks */}
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4">
                <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 rounded-[10px] bg-red-100 flex items-center justify-center"><ShieldAlert size={14} className="text-red-600" /></div><span className="text-xs text-light-text-secondary">风险</span></div>
                <div className="text-lg font-medium text-light-text">{projectDetail.risks.length}</div>
                <div className="flex gap-1 mt-1.5">{['critical', 'high', 'medium'].map((s) => { const c = riskStats[s]; if (!c) return null; return <span key={s} className="text-xs px-1 py-1 rounded-full font-medium" style={{ color: SEV_CLR[s], backgroundColor: `${SEV_CLR[s]}15` }}>{SEV_LBL[s]} {c}</span> })}</div>
              </div>
              {/* Docs */}
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4">
                <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 rounded-[10px] bg-purple-100 flex items-center justify-center"><FileText size={14} className="text-purple-600" /></div><span className="text-xs text-light-text-secondary">资料</span></div>
                <div className="text-lg font-medium text-light-text">{projectDocs.length} <span className="text-xs font-normal text-[#919AA3]">份</span></div>
              </div>
              {/* Process */}
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4">
                <div className="flex items-center gap-2 mb-2"><div className="w-7 h-7 rounded-[10px] bg-amber-100 flex items-center justify-center"><Cog size={14} className="text-amber-600" /></div><span className="text-xs text-light-text-secondary">过程记录</span></div>
                <div className="text-lg font-medium text-light-text">{processRecords.length}</div>
                <div className="text-xs text-[#919AA3] mt-1.5">异常 <span className="text-red-500 font-medium">{processRecords.filter(r => r.status === 'issue').length}</span></div>
              </div>
            </div>

            {/* Bottom overview cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Recent tasks */}
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4">
                <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-medium text-light-text">最近任务</h4><button onClick={() => setActiveTab('tasks')} className="text-xs text-primary hover:underline">查看全部</button></div>
                {projectTasks.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 py-1.5 text-xs cursor-pointer hover:bg-[#EFF3F9] rounded px-1 -mx-1" onClick={() => handleTaskClick(t)}>
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: TASK_STATUS_COLORS[t.status] }} />
                    <span className="text-light-text truncate flex-1">{t.name}</span>
                    <span className="text-[#919AA3] shrink-0">{t.assignee ?? '未分配'}</span>
                  </div>
                ))}
                {projectTasks.length === 0 && <p className="text-xs text-[#919AA3]">暂无任务</p>}
              </div>
              {/* Recent process */}
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4">
                <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-medium text-light-text">过程动态</h4><button onClick={() => setActiveTab('process')} className="text-xs text-primary hover:underline">查看全部</button></div>
                {processRecords.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center gap-2 py-1.5 text-xs">
                    <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'issue' ? 'bg-red-500' : 'bg-green-400'}`} />
                    <span className="text-light-text truncate flex-1">{r.title}</span>
                    <span className="text-[#919AA3] shrink-0">{r.date}</span>
                  </div>
                ))}
                {processRecords.length === 0 && <p className="text-xs text-[#919AA3]">暂无记录</p>}
              </div>
              {/* Procurement summary */}
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4">
                <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-medium text-light-text">采购概览</h4><button onClick={() => setActiveTab('budget')} className="text-xs text-primary hover:underline">查看全部</button></div>
                {procurements.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center gap-2 py-1.5 text-xs">
                    <span className="text-light-text truncate flex-1">{p.name}</span>
                    <span className="px-1.5 py-1 rounded-full text-xs font-medium" style={{ color: PROCUREMENT_STATUS_COLORS[p.status] ?? '#919AA3', backgroundColor: `${PROCUREMENT_STATUS_COLORS[p.status] ?? '#919AA3'}15` }}>{PROCUREMENT_STATUS_LABELS[p.status] ?? p.status}</span>
                  </div>
                ))}
                {procurements.length === 0 && <p className="text-xs text-[#919AA3]">暂无采购</p>}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* TASKS — Kanban + Stats                                           */}
        {/* ================================================================ */}
        {activeTab === 'tasks' && (
          <div className="flex flex-col gap-4">
            {/* Stats bar */}
            <div className="flex items-center gap-4 bg-white border border-[#E8ECF4] rounded-[10px] p-4">
              <div className="text-center px-3"><div className="text-2xl font-medium text-light-text">{projectTasks.length}</div><div className="text-xs text-light-text-secondary">总计</div></div>
              <div className="w-px h-8 bg-gray-200" />
              {kanbanCols.map((s) => { const c = taskStats[s] ?? 0; return (
                <div key={s} className="text-center px-2"><div className="text-lg font-medium" style={{ color: TASK_STATUS_COLORS[s] }}>{c}</div><div className="text-xs text-light-text-secondary">{TASK_STATUS_LABELS[s]}</div></div>
              ) })}
              <div className="ml-auto">
                <button onClick={() => setShowCreateDrawer(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-primary text-white text-xs font-medium hover:bg-primary-dark"><Plus size={13} /> 新建</button>
              </div>
            </div>
            {/* Kanban board */}
            <div className="grid grid-cols-5 gap-3 min-h-[300px]">
              {kanbanCols.map((status) => {
                const color = TASK_STATUS_COLORS[status]
                const label = TASK_STATUS_LABELS[status]
                const items = tasksByStatus[status] ?? []
                return (
                  <div key={status} className="flex flex-col bg-[#EFF3F9] rounded-[10px] p-2 min-h-[200px]">
                    <div className="flex items-center gap-2 px-2 py-1.5 mb-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs font-medium text-light-text">{label}</span>
                      <span className="ml-auto text-xs px-1.5 py-1 rounded-full bg-white text-light-text-secondary font-medium">{items.length}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1">
                      {items.map((task) => (
                        <div key={task.id} onClick={() => handleTaskClick(task)} className="bg-white rounded-[10px] p-2.5 border border-[#E8ECF4] hover:border-gray-300 cursor-pointer transition-all">
                          <div className="text-xs font-medium text-light-text mb-1 line-clamp-2">{task.name}</div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#919AA3]">{task.assignee ?? '未分配'}</span>
                            {task.priority && <span className="text-xs px-1 py-1 rounded font-medium" style={{ color: PRIORITY_COLORS[task.priority], backgroundColor: `${PRIORITY_COLORS[task.priority]}15` }}>{PRIORITY_LABELS[task.priority]}</span>}
                          </div>
                          {task.due_date && <div className="text-xs text-[#919AA3] mt-1 flex items-center gap-0.5"><Calendar size={9} />{task.due_date}</div>}
                        </div>
                      ))}
                      {items.length === 0 && <div className="flex-1 flex items-center justify-center text-xs text-gray-300">空</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* DOCUMENTS — with preview panel                                   */}
        {/* ================================================================ */}
        {activeTab === 'documents' && id && <ProjectDocuments projectId={id} projectType={projectDetail.project_type} />}

        {/* ================================================================ */}
        {/* RISKS — summary chart + list                                     */}
        {/* ================================================================ */}
        {activeTab === 'risks' && (
          <div className="flex flex-col gap-4">
            <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-5">
              <h3 className="text-sm font-medium text-light-text mb-4">风险分析总览</h3>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {(['critical', 'high', 'medium', 'low'] as const).map((sev) => (<div key={sev} className="text-center p-3 rounded-[10px]" style={{ backgroundColor: `${SEV_CLR[sev]}10` }}><div className="text-2xl font-medium" style={{ color: SEV_CLR[sev] }}>{riskStats[sev]}</div><div className="text-xs mt-0.5" style={{ color: SEV_CLR[sev] }}>{SEV_LBL[sev]}</div></div>))}
              </div>
              {projectDetail.risks.length > 0 && <div className="flex h-3 rounded-full overflow-hidden bg-[#F4F6FC]">{(['critical', 'high', 'medium', 'low'] as const).map((sev) => { const c = riskStats[sev]; if (!c) return null; return <div key={sev} className="h-full" style={{ width: `${(c / projectDetail.risks.length) * 100}%`, backgroundColor: SEV_CLR[sev] }} /> })}</div>}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-light-text-secondary">{projectDetail.risks.length} 个风险</span>
              <button onClick={() => setShowRiskForm(!showRiskForm)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-red-500 text-white text-xs font-medium hover:bg-red-600"><Plus size={13} /> 新建</button>
            </div>
            {showRiskForm && (
              <div className="flex items-center gap-2 p-3 bg-white border border-red-500/30 rounded-[10px]">
                <input type="text" placeholder="风险描述" value={riskDesc} onChange={(e) => setRiskDesc(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateRisk() }} autoFocus className="flex-1 px-3 py-1.5 text-sm border border-[#E8ECF4] rounded-md" />
                <select value={riskLevel} onChange={(e) => setRiskLevel(e.target.value)} className="px-2 py-1.5 text-sm border border-[#E8ECF4] rounded-md"><option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="critical">严重</option></select>
                <button onClick={handleCreateRisk} disabled={!riskDesc.trim()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-500 text-white text-xs disabled:opacity-50"><Check size={12} /> 创建</button>
                <button onClick={() => { setShowRiskForm(false); setRiskDesc('') }} className="p-1 text-[#919AA3]"><X size={14} /></button>
              </div>
            )}
            {projectDetail.risks.length === 0 ? <div className="py-12 text-center text-sm text-[#919AA3] bg-white border border-[#E8ECF4] rounded-[10px]">暂无风险</div> : (
              <div className="flex flex-col gap-2">{projectDetail.risks.map((r, i) => (
                <RiskRow
                  key={i}
                  risk={r}
                  onUpdate={(data) => id && updateRisk(id, `risk-${i}`, data)}
                  onDelete={() => id && deleteRisk(id, `risk-${i}`)}
                />
              ))}</div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* MILESTONES — visual timeline                                     */}
        {/* ================================================================ */}
        {activeTab === 'milestones' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-light-text-secondary">{projectDetail.milestones.length} 个里程碑</span>
              <button onClick={() => setShowMilestoneForm(!showMilestoneForm)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] bg-purple-500 text-white text-xs font-medium hover:bg-purple-600"><Plus size={13} /> 新建</button>
            </div>
            {showMilestoneForm && (
              <div className="flex items-center gap-2 p-3 bg-white border border-purple-500/30 rounded-[10px]">
                <input type="text" placeholder="名称" value={milestoneName} onChange={(e) => setMilestoneName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleCreateMilestone() }} autoFocus className="flex-1 px-3 py-1.5 text-sm border border-[#E8ECF4] rounded-md" />
                <input type="date" value={milestoneDate} onChange={(e) => setMilestoneDate(e.target.value)} className="px-2 py-1.5 text-sm border border-[#E8ECF4] rounded-md" />
                <button onClick={handleCreateMilestone} disabled={!milestoneName.trim()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-purple-500 text-white text-xs disabled:opacity-50"><Check size={12} /> 创建</button>
                <button onClick={() => { setShowMilestoneForm(false); setMilestoneName('') }} className="p-1 text-[#919AA3]"><X size={14} /></button>
              </div>
            )}
            {projectDetail.milestones.length === 0 ? <div className="py-12 text-center text-sm text-[#919AA3] bg-white border border-[#E8ECF4] rounded-[10px]">暂无里程碑</div> : (
              <div className="relative pl-8">
                <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-purple-200" />
                {projectDetail.milestones.map((ms, i) => (
                  <MilestoneRow
                    key={i}
                    ms={ms}
                    onUpdate={(data) => id && updateMilestone(id, `milestone-${i}`, data)}
                    onDelete={() => id && deleteMilestone(id, `milestone-${i}`)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================ */}
        {/* BUDGET + PROCUREMENT (merged)                                    */}
        {/* ================================================================ */}
        {activeTab === 'budget' && (
          <div className="flex flex-col gap-5">
            {/* Financial KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4"><span className="text-xs text-light-text-secondary">合同总额</span><div className="text-xl font-medium text-light-text mt-1">{fmtCNY(budgetUsage?.budget)}</div></div>
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4"><span className="text-xs text-light-text-secondary">已支出</span><div className="text-xl font-medium text-light-text mt-1 flex items-center gap-1">{fmtCNY(budgetUsage?.spent)}{budgetUsage && budgetUsage.rate > .8 && <TrendingUp size={14} className="text-red-500" />}</div></div>
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4"><span className="text-xs text-light-text-secondary">剩余</span><div className="text-xl font-medium text-light-text mt-1">{fmtCNY(budgetUsage ? budgetUsage.budget - budgetUsage.spent : null)}</div></div>
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4"><span className="text-xs text-light-text-secondary">执行率</span><div className={`text-xl font-medium mt-1 ${!budgetUsage ? 'text-[#919AA3]' : budgetUsage.rate > .9 ? 'text-red-500' : budgetUsage.rate > .7 ? 'text-amber-500' : 'text-green-500'}`}>{budgetUsage ? `${(budgetUsage.rate * 100).toFixed(1)}%` : '--'}</div></div>
            </div>
            {/* Budget bar */}
            {budgetUsage && (
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-5">
                <h3 className="text-sm font-medium text-light-text mb-3">预算执行</h3>
                <div className="relative h-10 bg-[#F4F6FC] rounded-[10px] overflow-hidden">
                  <div className={`absolute top-0 left-0 h-full rounded-[10px] ${budgetUsage.rate > .9 ? 'bg-red-400' : budgetUsage.rate > .7 ? 'bg-amber-400' : 'bg-green-400'}`} style={{ width: `${Math.min(budgetUsage.rate * 100, 100)}%` }}><div className="flex items-center h-full px-3"><span className="text-sm font-bold text-white">{fmtCNY(budgetUsage.spent)}</span></div></div>
                  {budgetUsage.rate < 1 && <div className="absolute top-0 right-0 h-full flex items-center pr-3"><span className="text-xs text-light-text-secondary">剩余 {fmtCNY(budgetUsage.budget - budgetUsage.spent)}</span></div>}
                </div>
                <div className="flex justify-between mt-1 text-xs text-[#919AA3]"><span>0%</span><span className="text-amber-500">|70%</span><span className="text-red-500">|90%</span><span>100%</span></div>
              </div>
            )}
            {/* Procurement section */}
            <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-light-text">采购管理 <span className="text-xs text-[#919AA3] font-normal">({procurements.length} 个包)</span></h3>
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#0086C0] rounded-[10px] hover:bg-[#006d9e] transition-colors" onClick={() => setShowProcurementForm(true)}><Plus size={13} /> 新建采购包</button>
              </div>
              {/* Inline create form */}
              {showProcurementForm && (
                <div className="mb-4 p-4 bg-[#EFF3F9] rounded-[10px] border border-[#E8ECF4] animate-fade-in">
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div><label className="block text-xs font-semibold text-light-text-secondary mb-1">名称 *</label><input className="w-full border border-light-border rounded-[10px] px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#0086C0]" placeholder="采购包名称" value={procFormData.name} onChange={e => setProcFormData(d => ({ ...d, name: e.target.value }))} /></div>
                    <div><label className="block text-xs font-semibold text-light-text-secondary mb-1">分类</label><select className="w-full border border-light-border rounded-[10px] px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-[#0086C0]" value={procFormData.category} onChange={e => setProcFormData(d => ({ ...d, category: e.target.value }))}><option value="材料">材料</option><option value="设备">设备</option><option value="分包">分包</option></select></div>
                    <div><label className="block text-xs font-semibold text-light-text-secondary mb-1">供应商</label><input className="w-full border border-light-border rounded-[10px] px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#0086C0]" placeholder="供应商" value={procFormData.supplier} onChange={e => setProcFormData(d => ({ ...d, supplier: e.target.value }))} /></div>
                    <div><label className="block text-xs font-semibold text-light-text-secondary mb-1">预算金额 (元)</label><input type="number" className="w-full border border-light-border rounded-[10px] px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#0086C0]" placeholder="金额" value={procFormData.budget_amount} onChange={e => setProcFormData(d => ({ ...d, budget_amount: e.target.value }))} /></div>
                    <div><label className="block text-xs font-semibold text-light-text-secondary mb-1">计划日期</label><input type="date" className="w-full border border-light-border rounded-[10px] px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#0086C0]" value={procFormData.plan_date} onChange={e => setProcFormData(d => ({ ...d, plan_date: e.target.value }))} /></div>
                    <div><label className="block text-xs font-semibold text-light-text-secondary mb-1">负责人</label><input className="w-full border border-light-border rounded-[10px] px-2.5 py-1.5 text-sm focus:outline-none focus:border-[#0086C0]" placeholder="负责人" value={procFormData.responsible} onChange={e => setProcFormData(d => ({ ...d, responsible: e.target.value }))} /></div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button className="px-3 py-1.5 text-xs text-light-text-secondary rounded-[10px] hover:bg-white transition-colors" onClick={() => { setShowProcurementForm(false); setProcFormData({ name: '', category: '材料', supplier: '', budget_amount: '', plan_date: '', responsible: '', notes: '' }) }}>取消</button>
                    <button className="px-3 py-1.5 text-xs font-medium text-white bg-[#0086C0] rounded-[10px] hover:bg-[#006d9e] disabled:opacity-50 transition-colors" disabled={!procFormData.name.trim() || procSubmitting} onClick={async () => {
                      setProcSubmitting(true)
                      try {
                        const created = await projectService.createProcurement(id!, { name: procFormData.name.trim(), category: procFormData.category, supplier: procFormData.supplier.trim() || undefined, budget_amount: procFormData.budget_amount ? Number(procFormData.budget_amount) : undefined, plan_date: procFormData.plan_date || undefined, responsible: procFormData.responsible.trim() || undefined, notes: procFormData.notes.trim() || undefined })
                        setProcurements(prev => [...prev, created])
                        setShowProcurementForm(false)
                        setProcFormData({ name: '', category: '材料', supplier: '', budget_amount: '', plan_date: '', responsible: '', notes: '' })
                      } finally { setProcSubmitting(false) }
                    }}>{procSubmitting ? '创建中...' : '创建'}</button>
                  </div>
                </div>
              )}
              {procurements.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-3 bg-[#EFF3F9] rounded-[10px]"><div className="text-lg font-medium text-primary">{procurements.filter(p => ['planning', 'bidding'].includes(p.status)).length}</div><div className="text-xs text-light-text-secondary">进行中</div></div>
                  <div className="text-center p-3 bg-[#EFF3F9] rounded-[10px]"><div className="text-lg font-medium text-green-500">{procurements.filter(p => p.status === 'completed').length}</div><div className="text-xs text-light-text-secondary">已完成</div></div>
                  <div className="text-center p-3 bg-[#EFF3F9] rounded-[10px]"><div className="text-lg font-medium text-light-text">{fmtCNY(procurements.reduce((s, p) => s + (p.budget_amount ?? 0), 0))}</div><div className="text-xs text-light-text-secondary">预算总额</div></div>
                </div>
              )}
              {/* Procurement table */}
              {procurements.length === 0 ? <p className="text-xs text-[#919AA3] text-center py-6">暂无采购包</p> : (
                <div className="overflow-auto"><table className="w-full text-sm">
                  <thead><tr className="bg-[#E6FAF0] border-b border-[#E8ECF4]">{['采购包', '分类', '供应商', '预算', '实际', '状态'].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-medium text-light-text-secondary">{h}</th>)}</tr></thead>
                  <tbody>{procurements.map((p) => {
                    const sc = PROCUREMENT_STATUS_COLORS[p.status] ?? '#919AA3'
                    return (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-[#EFF3F9]">
                        <td className="px-3 py-2 font-medium text-light-text">{p.name}</td>
                        <td className="px-3 py-2 text-light-text-secondary">{p.category || '--'}</td>
                        <td className="px-3 py-2 text-light-text-secondary">{p.supplier ?? '--'}</td>
                        <td className="px-3 py-2 font-mono text-light-text">{p.budget_amount != null ? fmtCNY(p.budget_amount) : '--'}</td>
                        <td className="px-3 py-2 font-mono text-light-text-secondary">{p.actual_amount != null ? fmtCNY(p.actual_amount) : '--'}</td>
                        <td className="px-3 py-2"><span className="px-1.5 py-1 rounded-full text-xs font-semibold" style={{ color: sc, backgroundColor: `${sc}15` }}>{PROCUREMENT_STATUS_LABELS[p.status] ?? p.status}</span></td>
                      </tr>
                    )
                  })}</tbody>
                </table></div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* PROCESS — Timeline + Pipeline                                    */}
        {/* ================================================================ */}
        {activeTab === 'process' && (
          <div className="flex flex-col gap-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4 text-center"><div className="text-2xl font-medium text-light-text">{processRecords.length}</div><div className="text-xs text-light-text-secondary">总记录</div></div>
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4 text-center"><div className="text-2xl font-medium text-red-500">{processRecords.filter(r => r.status === 'issue').length}</div><div className="text-xs text-light-text-secondary">异常</div></div>
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4 text-center"><div className="text-2xl font-medium text-green-500">{processRecords.filter(r => r.status === 'resolved').length}</div><div className="text-xs text-light-text-secondary">已解决</div></div>
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4 text-center"><div className="text-2xl font-medium text-light-text">{new Set(processRecords.map(r => r.record_type)).size}</div><div className="text-xs text-light-text-secondary">记录类型</div></div>
            </div>
            {/* Type filter pipeline */}
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setProcessFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${processFilter === 'all' ? 'bg-primary text-white' : 'bg-[#F4F6FC] text-gray-600 hover:bg-gray-200'}`}>全部</button>
              {Object.entries(PROCESS_RECORD_TYPE_LABELS).map(([key, label]) => (
                <button key={key} onClick={() => setProcessFilter(key)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors inline-flex items-center gap-1 ${processFilter === key ? 'bg-primary text-white' : 'bg-[#F4F6FC] text-gray-600 hover:bg-gray-200'}`}>
                  <span>{PROCESS_RECORD_TYPE_ICONS[key]}</span> {label}
                  <span className="ml-0.5 text-xs opacity-70">({processRecords.filter(r => r.record_type === key).length})</span>
                </button>
              ))}
            </div>
            {/* Timeline */}
            {(() => {
              const recs = processFilter === 'all' ? processRecords : processRecords.filter(r => r.record_type === processFilter)
              // Group by date
              const byDate: Record<string, ProcessRecord[]> = {}
              for (const r of recs) { (byDate[r.date] ??= []).push(r) }
              const dates = Object.keys(byDate).sort().reverse()

              return dates.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#919AA3] bg-white border border-[#E8ECF4] rounded-[10px]">暂无过程记录</div>
              ) : (
                <div className="relative pl-8">
                  <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gray-200" />
                  {dates.map((date) => (
                    <div key={date} className="relative mb-4">
                      {/* Date marker */}
                      <div className="absolute -left-8 top-1 w-3.5 h-3.5 rounded-full bg-primary border-[3px] border-white z-10" style={{ boxShadow: '0 0 0 2px #93c5fd' }} />
                      <div className="ml-2">
                        <div className="text-xs font-semibold text-light-text-secondary mb-2">{date}</div>
                        <div className="flex flex-col gap-1.5">
                          {byDate[date].map((rec) => {
                            const icon = PROCESS_RECORD_TYPE_ICONS[rec.record_type] ?? '📄'
                            const typeLabel = PROCESS_RECORD_TYPE_LABELS[rec.record_type] ?? rec.record_type
                            const statusColor = PROCESS_STATUS_COLORS[rec.status] ?? '#919AA3'
                            const statusLabel = PROCESS_STATUS_LABELS[rec.status] ?? rec.status
                            return (
                              <div key={rec.id} className="flex items-start gap-3 p-3 bg-white border border-[#E8ECF4] rounded-[10px] transition-shadow">
                                <span className="text-lg mt-0.5">{icon}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-xs px-1.5 py-1 rounded bg-[#F4F6FC] text-light-text-secondary font-medium">{typeLabel}</span>
                                    <span className="text-sm font-medium text-light-text truncate">{rec.title}</span>
                                  </div>
                                  {rec.content && <p className="text-xs text-light-text-secondary line-clamp-2 mb-1">{rec.content}</p>}
                                  <div className="flex items-center gap-3 text-xs text-[#919AA3]">
                                    <span>{rec.author}</span>
                                    <span className="px-1.5 py-1 rounded-full text-white text-xs font-medium" style={{ backgroundColor: statusColor }}>{statusLabel}</span>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            })()}
            {/* Create new record inline */}
            <div className="border-t border-[#E8ECF4] pt-3">
              <NewProcessRecordForm projectId={id!} onCreate={handleCreateProcess} />
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* ACTIVITY LOG                                                     */}
        {/* ================================================================ */}
        {activeTab === 'activity' && (
          <ActivityLogTab projectId={id!} activities={id ? (activities[id] ?? []) : []} fetchActivities={fetchActivities} />
        )}
      </div>

      <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} onUpdate={handleTaskUpdate} onDelete={handleTaskDelete} />

      <TaskCreateDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreateTask}
        projects={projectDetail ? [{ id: projectDetail.id, name: projectDetail.name }] : []}
        fixedProjectId={id}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        title="删除项目"
        message={`确定要删除「${projectDetail.name}」吗？此操作不可撤销，项目下的所有任务、里程碑、风险等数据将一并删除。`}
        confirmLabel="删除"
        variant="danger"
        loading={deleting}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          if (!id) return
          setDeleting(true)
          try {
            await deleteProject(id, navigate)
          } finally {
            setDeleting(false)
            setShowDeleteConfirm(false)
          }
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline process record creation form
// ---------------------------------------------------------------------------
const NewProcessRecordForm: React.FC<{ projectId: string; onCreate: (rec: Partial<ProcessRecord>) => Promise<any> }> = ({ projectId, onCreate }) => {
  const [show, setShow] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ title: '', record_type: 'daily_log', content: '' })

  const handleSubmit = async () => {
    if (!form.title.trim()) return
    setCreating(true)
    try {
      await onCreate({ project_id: projectId, record_type: form.record_type, title: form.title, content: form.content, date: new Date().toISOString().split('T')[0], author: '当前用户', status: 'normal', attachments: [], related_stage: '' })
      setForm({ title: '', record_type: 'daily_log', content: '' }); setShow(false)
    } finally { setCreating(false) }
  }

  if (!show) return <button onClick={() => setShow(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[10px] text-xs font-medium text-primary bg-primary-50 hover:bg-blue-100 transition-colors"><Plus size={13} /> 新增记录</button>

  return (
    <div className="p-3 rounded-[10px] border border-primary/30 bg-[#EFF3F9] space-y-2">
      <input type="text" placeholder="记录标题" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="w-full px-3 py-1.5 text-sm border border-[#E8ECF4] rounded-md bg-white focus:outline-none focus:border-primary" />
      <div className="flex gap-2">
        <select value={form.record_type} onChange={(e) => setForm(p => ({ ...p, record_type: e.target.value }))} className="px-2 py-1.5 text-sm border border-[#E8ECF4] rounded-md bg-white">
          {Object.entries(PROCESS_RECORD_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input type="text" placeholder="内容描述" value={form.content} onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} className="flex-1 px-3 py-1.5 text-sm border border-[#E8ECF4] rounded-md bg-white focus:outline-none focus:border-primary" />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={() => setShow(false)} className="px-3 py-1 text-sm text-light-text-secondary border border-[#E8ECF4] rounded-md hover:bg-[#F4F6FC]">取消</button>
        <button onClick={handleSubmit} disabled={creating || !form.title.trim()} className="inline-flex items-center gap-1 px-3 py-1 text-sm text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50">
          {creating ? '...' : <Check size={12} />} 创建
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MilestoneRow — inline editable name, date, status
// ---------------------------------------------------------------------------
const MS_STATUSES = [
  { key: 'pending', label: '进行中', cls: 'bg-purple-100 text-purple-700' },
  { key: 'completed', label: '已完成', cls: 'bg-green-100 text-green-700' },
  { key: 'delayed', label: '已延期', cls: 'bg-red-100 text-red-700' },
]

const MilestoneRow: React.FC<{
  ms: { name: string; date?: string; status?: string }
  onUpdate: (data: Record<string, unknown>) => void
  onDelete: () => void
}> = ({ ms, onUpdate, onDelete }) => {
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(ms.name)
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const statusRef = React.useRef<HTMLDivElement>(null)

  const done = ms.status === 'completed' || ms.status === 'done'
  const overdue = ms.status === 'delayed' || ms.status === 'overdue'
  const dc = done ? '#00C875' : overdue ? '#E74C3C' : '#796DF6'

  React.useEffect(() => {
    if (!showStatusMenu) return
    const h = (e: MouseEvent) => { if (statusRef.current && !statusRef.current.contains(e.target as Node)) setShowStatusMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showStatusMenu])

  const saveName = () => {
    const trimmed = nameVal.trim()
    if (trimmed && trimmed !== ms.name) onUpdate({ name: trimmed })
    else setNameVal(ms.name)
    setEditingName(false)
  }

  return (
    <div className="relative mb-6 last:mb-0">
      <div className="absolute -left-8 top-2 w-3.5 h-3.5 rounded-full border-[3px] border-white z-10" style={{ backgroundColor: dc, boxShadow: `0 0 0 2px ${dc}40` }} />
      <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-4 ml-2 transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {editingName ? (
              <input
                autoFocus
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') { setNameVal(ms.name); setEditingName(false) } }}
                className="text-sm font-medium text-light-text bg-transparent border-b border-primary outline-none px-0 py-0"
              />
            ) : (
              <span className="text-sm font-medium text-light-text cursor-pointer hover:text-primary" onClick={() => setEditingName(true)} title="点击编辑">{ms.name}</span>
            )}
            <div className="relative" ref={statusRef}>
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                className={`text-xs px-1.5 py-1 rounded-full font-medium cursor-pointer hover:opacity-80 ${done ? 'bg-green-100 text-green-700' : overdue ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'}`}
              >
                {done ? '已完成' : overdue ? '已延期' : ms.status || '进行中'}
              </button>
              {showStatusMenu && (
                <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-[#E8ECF4] rounded-[10px] shadow-lg py-1 min-w-[90px]">
                  {MS_STATUSES.map((s) => (
                    <button key={s.key} onClick={() => { onUpdate({ status: s.key }); setShowStatusMenu(false) }} className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#EFF3F9] ${ms.status === s.key ? 'font-bold' : ''}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={ms.date || ''}
              onChange={(e) => onUpdate({ date: e.target.value || null })}
              className="text-xs text-[#919AA3] bg-transparent border-none outline-none cursor-pointer hover:text-light-text w-28"
            />
            <button onClick={onDelete} className="text-[#919AA3] hover:text-red-500 p-1"><X size={14} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// RiskRow — inline editable severity
// ---------------------------------------------------------------------------
const RiskRow: React.FC<{
  risk: { title?: string; description: string; severity: string; owner?: string | null }
  onUpdate: (data: Record<string, unknown>) => void
  onDelete: () => void
}> = ({ risk, onUpdate, onDelete }) => {
  const [editingDesc, setEditingDesc] = useState(false)
  const [descVal, setDescVal] = useState(risk.description)
  const [showSevMenu, setShowSevMenu] = useState(false)
  const sevRef = React.useRef<HTMLDivElement>(null)

  const c = SEV_CLR[risk.severity] ?? '#919AA3'

  React.useEffect(() => {
    if (!showSevMenu) return
    const h = (e: MouseEvent) => { if (sevRef.current && !sevRef.current.contains(e.target as Node)) setShowSevMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [showSevMenu])

  const saveDesc = () => {
    const trimmed = descVal.trim()
    if (trimmed && trimmed !== risk.description) onUpdate({ description: trimmed })
    else setDescVal(risk.description)
    setEditingDesc(false)
  }

  return (
    <div className="flex items-start gap-3 p-4 bg-white border border-[#E8ECF4] rounded-[10px] transition-shadow">
      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: `${c}15` }}><AlertTriangle size={16} style={{ color: c }} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {editingDesc ? (
            <input
              autoFocus
              value={descVal}
              onChange={(e) => setDescVal(e.target.value)}
              onBlur={saveDesc}
              onKeyDown={(e) => { if (e.key === 'Enter') saveDesc(); if (e.key === 'Escape') { setDescVal(risk.description); setEditingDesc(false) } }}
              className="text-sm font-medium text-light-text bg-transparent border-b border-primary outline-none flex-1"
            />
          ) : (
            <span className="text-sm font-medium text-light-text cursor-pointer hover:text-primary" onClick={() => setEditingDesc(true)} title="点击编辑">{risk.title || risk.description}</span>
          )}
          <div className="relative" ref={sevRef}>
            <button
              onClick={() => setShowSevMenu(!showSevMenu)}
              className="text-xs px-1.5 py-1 rounded-full font-bold cursor-pointer hover:opacity-80"
              style={{ color: c, backgroundColor: `${c}18` }}
            >
              {SEV_LBL[risk.severity] ?? risk.severity}
            </button>
            {showSevMenu && (
              <div className="absolute z-50 top-full left-0 mt-1 bg-white border border-[#E8ECF4] rounded-[10px] shadow-lg py-1 min-w-[80px]">
                {(['low', 'medium', 'high', 'critical'] as const).map((sev) => (
                  <button key={sev} onClick={() => { onUpdate({ severity: sev }); setShowSevMenu(false) }} className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#EFF3F9] ${risk.severity === sev ? 'font-bold' : ''}`} style={{ color: SEV_CLR[sev] }}>
                    {SEV_LBL[sev]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        {risk.owner && <p className="text-xs text-[#919AA3] mt-1">负责人: {risk.owner}</p>}
      </div>
      <button onClick={onDelete} className="text-[#919AA3] hover:text-red-500 p-1 shrink-0"><X size={14} /></button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ActivityLogTab — timeline of project events
// ---------------------------------------------------------------------------
const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  task_created:     { label: '创建任务', color: '#00C875' },
  task_updated:     { label: '更新任务', color: '#00CAE3' },
  stage_transition: { label: '阶段变更', color: '#796DF6' },
  status_changed:   { label: '状态变更', color: '#FFB264' },
  milestone_created:{ label: '新增里程碑', color: '#E74C3C' },
  risk_created:     { label: '新增风险', color: '#E74C3C' },
  member_added:     { label: '添加成员', color: '#00D3C7' },
  member_removed:   { label: '移除成员', color: '#919AA3' },
}

const ActivityLogTab: React.FC<{
  projectId: string
  activities: ActivityEvent[]
  fetchActivities: (projectId: string) => Promise<void>
}> = ({ projectId, activities, fetchActivities }) => {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetchActivities(projectId).finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [projectId, fetchActivities])

  if (!loaded && activities.length === 0) {
    return <div className="flex items-center justify-center py-16 text-sm text-[#919AA3]">加载活动日志...</div>
  }

  if (activities.length === 0) {
    return <div className="py-16 text-center text-sm text-[#919AA3] bg-white border border-[#E8ECF4] rounded-[10px]">暂无活动记录</div>
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-light-text-secondary">{activities.length} 条活动记录</span>
      </div>
      <div className="relative pl-8">
        <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-[#E8ECF4]" />
        {activities.map((evt) => {
          const cfg = EVENT_TYPE_CONFIG[evt.event_type] ?? { label: evt.event_type, color: '#919AA3' }
          const timeStr = (() => {
            try {
              const d = new Date(evt.created_at)
              return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
            } catch { return evt.created_at }
          })()
          return (
            <div key={evt.id} className="relative mb-4 last:mb-0">
              <div
                className="absolute -left-8 top-2 w-3 h-3 rounded-full border-[2.5px] border-white z-10"
                style={{ backgroundColor: cfg.color, boxShadow: `0 0 0 2px ${cfg.color}30` }}
              />
              <div className="bg-white border border-[#E8ECF4] rounded-[10px] p-3 ml-2 transition-shadow">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-1.5 py-1 rounded-full font-medium" style={{ color: cfg.color, backgroundColor: `${cfg.color}15` }}>{cfg.label}</span>
                    <span className="text-xs font-medium text-light-text">{evt.actor}</span>
                  </div>
                  <span className="text-xs text-[#919AA3]">{timeStr}</span>
                </div>
                <p className="text-sm text-light-text-secondary">{evt.summary}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
