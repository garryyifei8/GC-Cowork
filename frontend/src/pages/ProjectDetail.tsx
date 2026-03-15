import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, X, Check, ChevronDown,
  Users, AlertTriangle, Milestone, ClipboardList, Wallet, Cog, Package,
} from 'lucide-react'
import { LoadingSpinner, AvatarGroup } from '../widgets/atomic'
import { BudgetOverview, StagePipeline, ProcessTimeline, ProcurementTable } from '../widgets/views'
import { TaskDetailModal } from '../components/tasks/TaskDetailModal'
import { useProjectStore } from '../stores/projectStore'
import { projectService } from '../services/api'
import type { ProjectTask, TaskWithProject, ProcurementPackage, ProcessRecord } from '../types'
import {
  TASK_STATUS_COLORS,
  TASK_STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
} from '../utils/constants'

// ---------------------------------------------------------------------------
// Stage pipeline constants
// ---------------------------------------------------------------------------

const PIPELINE_STAGES = [
  '立项', '投标', '签约', '设计', '采购', '施工/实施', '验收', '结算', '归档',
]

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

type TabKey = 'overview' | 'tasks' | 'risks' | 'milestones' | 'budget' | 'process' | 'procurement'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: '概览', icon: <ClipboardList size={15} /> },
  { key: 'tasks', label: '任务', icon: <ClipboardList size={15} /> },
  { key: 'risks', label: '风险', icon: <AlertTriangle size={15} /> },
  { key: 'milestones', label: '里程碑', icon: <Milestone size={15} /> },
  { key: 'budget', label: '预算', icon: <Wallet size={15} /> },
  { key: 'process', label: '过程管理', icon: <Cog size={15} /> },
  { key: 'procurement', label: '采购', icon: <Package size={15} /> },
]

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    projectDetail, tasks, isLoading,
    fetchProjectDetail, createTask, updateTask, deleteTask,
    createMilestone, deleteMilestone,
    createRisk, deleteRisk,
    transitionProject,
    addTeamMember, removeTeamMember,
  } = useProjectStore()

  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [selectedTask, setSelectedTask] = useState<TaskWithProject | null>(null)

  // Inline forms
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [showMilestoneForm, setShowMilestoneForm] = useState(false)
  const [milestoneName, setMilestoneName] = useState('')
  const [milestoneDate, setMilestoneDate] = useState('')
  const [showRiskForm, setShowRiskForm] = useState(false)
  const [riskDesc, setRiskDesc] = useState('')
  const [riskLevel, setRiskLevel] = useState('medium')

  // Team
  const [showAddMember, setShowAddMember] = useState(false)
  const [memberName, setMemberName] = useState('')

  // Stage transition
  const [showStageMenu, setShowStageMenu] = useState(false)

  // Procurement / Process data
  const [procurements, setProcurements] = useState<ProcurementPackage[]>([])
  const [processRecords, setProcessRecords] = useState<ProcessRecord[]>([])

  useEffect(() => {
    if (id) fetchProjectDetail(id)
  }, [id, fetchProjectDetail])

  // Fetch procurement + process when those tabs are activated
  useEffect(() => {
    if (!id) return
    if (activeTab === 'procurement') {
      projectService.getProcurements(id).then(setProcurements).catch(() => {})
    }
    if (activeTab === 'process') {
      projectService.getProcessRecords(id).then(setProcessRecords).catch(() => {})
    }
  }, [id, activeTab])

  const projectTasks = id ? (tasks[id] ?? []) : []

  const handleTaskClick = useCallback((task: ProjectTask | TaskWithProject) => {
    const twp: TaskWithProject = {
      ...task,
      project_name: projectDetail?.name ?? '',
    }
    setSelectedTask(twp)
  }, [projectDetail?.name])

  const handleTaskUpdate = useCallback(async (taskId: string, data: Record<string, unknown>) => {
    await updateTask(taskId, data as Partial<ProjectTask>)
  }, [updateTask])

  const handleTaskDelete = useCallback(async (taskId: string) => {
    if (id) await deleteTask(taskId, id)
  }, [deleteTask, id])

  const handleCreateTask = async () => {
    if (!taskName.trim() || !id) return
    await createTask(id, { name: taskName.trim() })
    setTaskName('')
    setShowTaskForm(false)
  }

  const handleCreateMilestone = async () => {
    if (!milestoneName.trim() || !id) return
    await createMilestone(id, { name: milestoneName.trim(), date: milestoneDate || undefined })
    setMilestoneName('')
    setMilestoneDate('')
    setShowMilestoneForm(false)
  }

  const handleCreateRisk = async () => {
    if (!riskDesc.trim() || !id) return
    await createRisk(id, { description: riskDesc.trim(), level: riskLevel })
    setRiskDesc('')
    setRiskLevel('medium')
    setShowRiskForm(false)
  }

  const handleStageTransition = async (stage: string) => {
    if (!id) return
    await transitionProject(id, stage)
    setShowStageMenu(false)
  }

  const handleAddMember = async () => {
    if (!memberName.trim() || !id) return
    await addTeamMember(id, memberName.trim())
    setMemberName('')
    setShowAddMember(false)
  }

  const handleProcurementStatusChange = async (pkgId: string, projectId: string, newStatus: string) => {
    await projectService.updateProcurement(projectId, pkgId, { status: newStatus })
    setProcurements((prev) => prev.map((p) => (p.id === pkgId ? { ...p, status: newStatus } : p)))
  }

  const handleCreateProcessRecord = async (record: Partial<ProcessRecord>) => {
    if (!id) return
    const created = await projectService.createProcessRecord(id, record)
    return { id: (created as any).id ?? `new-${Date.now()}` }
  }

  if (isLoading && !projectDetail) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner /></div>
  }

  if (!projectDetail) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-gray-500 dark:text-gray-400">项目未找到</p>
        <button onClick={() => navigate('/projects')} className="text-blue-500 hover:underline text-sm">返回项目列表</button>
      </div>
    )
  }

  const avatars = (projectDetail.team_members ?? []).map((name) => ({
    src: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1,0ea5e9,10b981,f59e0b,ef4444&backgroundType=gradientLinear`,
    alt: name,
  }))

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/projects')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">{projectDetail.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {projectDetail.project_type} &middot; {projectDetail.stage} &middot; 进度 {projectDetail.progress_pct}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Stage transition */}
          <div className="relative">
            <button
              onClick={() => setShowStageMenu(!showStageMenu)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              阶段: {projectDetail.stage}
              <ChevronDown size={14} />
            </button>
            {showStageMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1">
                {PIPELINE_STAGES.map((stage) => (
                  <button
                    key={stage}
                    onClick={() => handleStageTransition(stage)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      stage === projectDetail.stage ? 'font-bold text-blue-500' : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Team */}
          <div className="flex items-center gap-2">
            {avatars.length > 0 && <AvatarGroup avatars={avatars} max={4} size="sm" />}
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
              title="管理团队"
            >
              <Users size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Add team member inline */}
      {showAddMember && (
        <div className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">团队成员:</span>
          <div className="flex flex-wrap gap-2">
            {(projectDetail.team_members ?? []).map((m) => (
              <span key={m} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200">
                {m}
                <button onClick={() => id && removeTeamMember(id, m)} className="text-red-400 hover:text-red-600"><X size={12} /></button>
              </span>
            ))}
          </div>
          <input
            type="text"
            placeholder="新成员姓名"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddMember() }}
            className="w-36 px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
          />
          <button onClick={handleAddMember} disabled={!memberName.trim()} className="px-3 py-1 rounded-lg bg-blue-500 text-white text-xs font-medium disabled:opacity-50">
            添加
          </button>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="min-h-[400px]">
        {/* ===== Overview ===== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StagePipeline data={{ distribution: { [projectDetail.stage]: 1 } }} />
            <BudgetOverview data={{ items: projectDetail.budget_amount ? [{
              project_id: projectDetail.id,
              project_name: projectDetail.name,
              budget_amount: projectDetail.budget_amount,
              actual_spend: projectDetail.actual_spend,
            }] : [] }} />
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">任务概况</h3>
              <div className="grid grid-cols-3 gap-3">
                {['todo', 'in_progress', 'done'].map((s) => {
                  const count = projectTasks.filter((t) => t.status === s).length
                  const color = TASK_STATUS_COLORS[s] ?? '#C4C4C4'
                  const label = TASK_STATUS_LABELS[s] ?? s
                  return (
                    <div key={s} className="text-center p-3 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                      <div className="text-2xl font-bold" style={{ color }}>{count}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-3">风险 ({projectDetail.risks.length})</h3>
              {projectDetail.risks.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-gray-500">暂无风险记录</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {projectDetail.risks.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className={`w-2 h-2 rounded-full ${r.severity === 'critical' || r.severity === 'high' ? 'bg-red-500' : r.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                      <span className="text-gray-700 dark:text-gray-200 truncate">{r.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== Tasks ===== */}
        {activeTab === 'tasks' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{projectTasks.length} 个任务</span>
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors"
              >
                <Plus size={13} />
                新建任务
              </button>
            </div>
            {showTaskForm && (
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border border-blue-500/30 rounded-lg">
                <input
                  type="text"
                  placeholder="任务名称"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateTask() }}
                  autoFocus
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                />
                <button onClick={handleCreateTask} disabled={!taskName.trim()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-blue-500 text-white text-xs font-medium disabled:opacity-50">
                  <Check size={12} /> 创建
                </button>
                <button onClick={() => { setShowTaskForm(false); setTaskName('') }} className="p-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
              </div>
            )}
            {/* Task list */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              {projectTasks.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-500">暂无任务</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      {['任务名称', '负责人', '状态', '优先级', '截止日期'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projectTasks.map((task) => {
                      const statusColor = TASK_STATUS_COLORS[task.status] ?? '#C4C4C4'
                      const statusLabel = TASK_STATUS_LABELS[task.status] ?? task.status
                      const priorityColor = PRIORITY_COLORS[task.priority] ?? '#C4C4C4'
                      const priorityLabel = PRIORITY_LABELS[task.priority] ?? task.priority
                      return (
                        <tr
                          key={task.id}
                          className="border-t border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                          onClick={() => handleTaskClick(task)}
                        >
                          <td className="px-4 py-2.5 text-sm font-medium text-gray-800 dark:text-gray-100">{task.name}</td>
                          <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">{task.assignee || '未分配'}</td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: statusColor }}>{statusLabel}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: priorityColor }}>{priorityLabel}</span>
                          </td>
                          <td className="px-4 py-2.5 text-sm text-gray-500 dark:text-gray-400">{task.due_date || '-'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ===== Risks ===== */}
        {activeTab === 'risks' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{projectDetail.risks.length} 个风险</span>
              <button
                onClick={() => setShowRiskForm(!showRiskForm)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors"
              >
                <Plus size={13} />
                新建风险
              </button>
            </div>
            {showRiskForm && (
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border border-red-500/30 rounded-lg">
                <input
                  type="text"
                  placeholder="风险描述"
                  value={riskDesc}
                  onChange={(e) => setRiskDesc(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateRisk() }}
                  autoFocus
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-red-500"
                />
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="critical">严重</option>
                </select>
                <button onClick={handleCreateRisk} disabled={!riskDesc.trim()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-500 text-white text-xs font-medium disabled:opacity-50">
                  <Check size={12} /> 创建
                </button>
                <button onClick={() => { setShowRiskForm(false); setRiskDesc('') }} className="p-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {projectDetail.risks.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">暂无风险</div>
              ) : (
                projectDetail.risks.map((risk, i) => {
                  const sevColor = risk.severity === 'critical' ? '#E2445C' : risk.severity === 'high' ? '#FDAB3D' : risk.severity === 'medium' ? '#FFD166' : '#6BBF59'
                  return (
                    <div key={i} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                      <span className="w-3 h-3 rounded-full mt-1 shrink-0" style={{ backgroundColor: sevColor }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{risk.title || risk.description}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ color: sevColor, backgroundColor: `${sevColor}20` }}>
                            {risk.severity}
                          </span>
                        </div>
                        {risk.description && risk.title && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{risk.description}</p>
                        )}
                        {risk.owner && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">负责人: {risk.owner}</p>
                        )}
                      </div>
                      <button
                        onClick={() => id && deleteRisk(id, `risk-${i}`)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="删除风险"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ===== Milestones ===== */}
        {activeTab === 'milestones' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{projectDetail.milestones.length} 个里程碑</span>
              <button
                onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-medium hover:bg-purple-600 transition-colors"
              >
                <Plus size={13} />
                新建里程碑
              </button>
            </div>
            {showMilestoneForm && (
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-gray-800 border border-purple-500/30 rounded-lg">
                <input
                  type="text"
                  placeholder="里程碑名称"
                  value={milestoneName}
                  onChange={(e) => setMilestoneName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateMilestone() }}
                  autoFocus
                  className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-purple-500"
                />
                <input
                  type="date"
                  value={milestoneDate}
                  onChange={(e) => setMilestoneDate(e.target.value)}
                  className="px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                />
                <button onClick={handleCreateMilestone} disabled={!milestoneName.trim()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-purple-500 text-white text-xs font-medium disabled:opacity-50">
                  <Check size={12} /> 创建
                </button>
                <button onClick={() => { setShowMilestoneForm(false); setMilestoneName('') }} className="p-1 text-gray-400 hover:text-gray-600"><X size={14} /></button>
              </div>
            )}
            <div className="flex flex-col gap-2">
              {projectDetail.milestones.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-sm text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">暂无里程碑</div>
              ) : (
                projectDetail.milestones.map((ms, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Milestone size={16} className="text-purple-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{ms.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{ms.date || '未设置日期'}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          ms.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          ms.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {ms.status || '进行中'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => id && deleteMilestone(id, `milestone-${i}`)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="删除里程碑"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===== Budget ===== */}
        {activeTab === 'budget' && (
          <BudgetOverview data={{ items: projectDetail.budget_amount ? [{
            project_id: projectDetail.id,
            project_name: projectDetail.name,
            budget_amount: projectDetail.budget_amount,
            actual_spend: projectDetail.actual_spend,
          }] : [] }} />
        )}

        {/* ===== Process ===== */}
        {activeTab === 'process' && (
          <ProcessTimeline
            data={{ records: processRecords, project_id: id }}
            onCreate={handleCreateProcessRecord}
          />
        )}

        {/* ===== Procurement ===== */}
        {activeTab === 'procurement' && (
          <ProcurementTable
            data={{ packages: procurements }}
            onStatusChange={handleProcurementStatusChange}
          />
        )}
      </div>

      {/* Task detail modal */}
      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleTaskUpdate}
        onDelete={handleTaskDelete}
      />
    </div>
  )
}
