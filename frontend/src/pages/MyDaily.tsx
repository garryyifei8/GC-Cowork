import { useEffect, useState } from 'react'
import { Clock, PlaneTakeoff, Receipt, Bell, CheckCircle2, AlertCircle, Plus, X } from 'lucide-react'
import { useDailyStore, CURRENT_USER_NAME } from '../stores/dailyStore'

type Tab = 'overview' | 'leaves' | 'expenses' | 'notices'

const TAB_ITEMS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: '概览', icon: <Clock size={15} /> },
  { key: 'leaves', label: '我的请假', icon: <PlaneTakeoff size={15} /> },
  { key: 'expenses', label: '我的报销', icon: <Receipt size={15} /> },
  { key: 'notices', label: '通知', icon: <Bell size={15} /> },
]

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-[#FFF8E1] text-[#FFB264]',
  approved: 'bg-[#E8F5E9] text-[#27AE60]',
  rejected: 'bg-[#FFEBEE] text-[#E74C3C]',
  submitted: 'bg-[#E3F2FD] text-[#00CAE3]',
  normal: 'bg-[#E8F5E9] text-[#27AE60]',
  late: 'bg-[#FFF3E0] text-[#FFB264]',
}

export const MyDaily = () => {
  const [tab, setTab] = useState<Tab>('overview')
  const [showLeaveForm, setShowLeaveForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ leave_type: '年假', start_date: '', end_date: '', days: 1, reason: '' })
  const [expenseForm, setExpenseForm] = useState({ category: '差旅', amount: 0, description: '' })

  const {
    myLeaves, myAttendance, myExpenses, pendingApprovals, notices,
    isLoading, fetchAll, createLeave, createExpense, markNoticeRead, clockIn,
  } = useDailyStore()

  useEffect(() => { fetchAll() }, [fetchAll])

  const today = new Date().toISOString().slice(0, 10)
  const todayAttendance = myAttendance.find((a) => a.date === today)
  const unreadNotices = notices.filter((n) => !n.is_read)
  const pendingLeaves = myLeaves.filter((l) => l.status === 'pending')
  const approvedLeaves = myLeaves.filter((l) => l.status === 'approved')

  const handleCreateLeave = async () => {
    if (!leaveForm.start_date || !leaveForm.end_date || !leaveForm.reason) return
    await createLeave(leaveForm)
    setShowLeaveForm(false)
    setLeaveForm({ leave_type: '年假', start_date: '', end_date: '', days: 1, reason: '' })
  }

  const handleCreateExpense = async () => {
    if (!expenseForm.description || expenseForm.amount <= 0) return
    await createExpense(expenseForm)
    setShowExpenseForm(false)
    setExpenseForm({ category: '差旅', amount: 0, description: '' })
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? '早上好' : hour < 18 ? '下午好' : '晚上好'

  return (
    <div className="flex flex-col gap-4 p-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-light-text">{greeting}，{CURRENT_USER_NAME}</h1>
          <p className="text-sm text-light-text-secondary mt-0.5">{today}</p>
        </div>
        <button
          onClick={clockIn}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Clock size={16} />
          {todayAttendance ? '打卡下班' : '打卡上班'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E8ECF4]">
        {TAB_ITEMS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-primary text-primary'
                : 'border-transparent text-light-text-secondary hover:text-light-text'
            }`}
          >
            {t.icon}
            {t.label}
            {t.key === 'notices' && unreadNotices.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">{unreadNotices.length}</span>
            )}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-sm text-[#919AA3] animate-pulse">加载中...</div>}

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quick stats */}
          <div className="rounded-[10px] border border-[#E8ECF4] bg-white p-4">
            <p className="text-xs text-light-text-secondary font-medium">剩余年假</p>
            <p className="text-2xl font-medium text-light-text mt-1">{Math.max(0, 10 - approvedLeaves.reduce((s, l) => s + l.days, 0))} 天</p>
          </div>
          <div className="rounded-[10px] border border-[#E8ECF4] bg-white p-4">
            <p className="text-xs text-light-text-secondary font-medium">待审批报销</p>
            <p className="text-2xl font-medium text-light-text mt-1">{myExpenses.filter((e) => e.status === 'submitted').length} 笔</p>
          </div>
          <div className="rounded-[10px] border border-[#E8ECF4] bg-white p-4">
            <p className="text-xs text-light-text-secondary font-medium">未读通知</p>
            <p className="text-2xl font-medium text-light-text mt-1">{unreadNotices.length} 条</p>
          </div>
          <div className="rounded-[10px] border border-[#E8ECF4] bg-white p-4">
            <p className="text-xs text-light-text-secondary font-medium">今日考勤</p>
            <div className="mt-1">
              {todayAttendance ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-green-500" />
                  <span className="text-sm text-light-text font-medium">已打卡 {todayAttendance.check_in}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle size={18} className="text-amber-500" />
                  <span className="text-sm text-light-text-secondary">未打卡</span>
                </div>
              )}
            </div>
          </div>

          {/* Pending approvals */}
          <div className="md:col-span-2 rounded-[10px] border border-[#E8ECF4] bg-white p-4">
            <h3 className="text-sm font-medium text-light-text mb-3">待审批事项</h3>
            {pendingApprovals.leaves.length + pendingApprovals.expenses.length + pendingApprovals.vehicles.length === 0 ? (
              <p className="text-sm text-[#919AA3]">暂无待审批事项</p>
            ) : (
              <div className="space-y-2">
                {pendingApprovals.leaves.map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-light-text">请假: {l.leave_type} ({l.days}天)</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS.pending}`}>待审批</span>
                  </div>
                ))}
                {pendingApprovals.expenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-light-text">报销: {e.category} ({e.amount}元)</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS.submitted}`}>待审批</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent leaves */}
          <div className="md:col-span-2 rounded-[10px] border border-[#E8ECF4] bg-white p-4">
            <h3 className="text-sm font-medium text-light-text mb-3">最近请假</h3>
            {pendingLeaves.length === 0 && myLeaves.length === 0 ? (
              <p className="text-sm text-[#919AA3]">暂无请假记录</p>
            ) : (
              <div className="space-y-2">
                {myLeaves.slice(0, 3).map((l) => (
                  <div key={l.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                    <span className="text-light-text">{l.leave_type}: {l.start_date} ~ {l.end_date}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[l.status] || STATUS_COLORS.pending}`}>{l.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Leaves Tab */}
      {tab === 'leaves' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowLeaveForm(!showLeaveForm)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
              {showLeaveForm ? <X size={14} /> : <Plus size={14} />}
              {showLeaveForm ? '取消' : '申请请假'}
            </button>
          </div>
          {showLeaveForm && (
            <div className="rounded-[10px] border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <select value={leaveForm.leave_type} onChange={(e) => setLeaveForm({ ...leaveForm, leave_type: e.target.value })} className="px-3 py-2 rounded-[10px] border border-[#E8ECF4] bg-white text-sm text-light-text">
                  <option>年假</option><option>事假</option><option>病假</option><option>调休</option>
                </select>
                <input type="date" value={leaveForm.start_date} onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })} className="px-3 py-2 rounded-[10px] border border-[#E8ECF4] bg-white text-sm text-light-text" />
                <input type="date" value={leaveForm.end_date} onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })} className="px-3 py-2 rounded-[10px] border border-[#E8ECF4] bg-white text-sm text-light-text" />
                <input type="number" min={0.5} step={0.5} value={leaveForm.days} onChange={(e) => setLeaveForm({ ...leaveForm, days: parseFloat(e.target.value) || 1 })} placeholder="天数" className="px-3 py-2 rounded-[10px] border border-[#E8ECF4] bg-white text-sm text-light-text" />
              </div>
              <input value={leaveForm.reason} onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="请假事由" className="w-full px-3 py-2 rounded-[10px] border border-[#E8ECF4] bg-white text-sm text-light-text" />
              <button onClick={handleCreateLeave} className="px-4 py-2 rounded-[10px] bg-primary text-white text-sm font-medium hover:bg-primary/90">提交</button>
            </div>
          )}
          <div className="rounded-[10px] border border-[#E8ECF4] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#E6FAF0]">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-light-text-secondary">类型</th>
                  <th className="text-left px-4 py-2.5 font-medium text-light-text-secondary">开始</th>
                  <th className="text-left px-4 py-2.5 font-medium text-light-text-secondary">结束</th>
                  <th className="text-left px-4 py-2.5 font-medium text-light-text-secondary">天数</th>
                  <th className="text-left px-4 py-2.5 font-medium text-light-text-secondary">事由</th>
                  <th className="text-left px-4 py-2.5 font-medium text-light-text-secondary">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myLeaves.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-[#919AA3]">暂无请假记录</td></tr>
                ) : myLeaves.map((l) => (
                  <tr key={l.id} className="bg-white hover:bg-[#EFF3F9]">
                    <td className="px-4 py-2.5 text-light-text">{l.leave_type}</td>
                    <td className="px-4 py-2.5 text-gray-600">{l.start_date}</td>
                    <td className="px-4 py-2.5 text-gray-600">{l.end_date}</td>
                    <td className="px-4 py-2.5 text-gray-600">{l.days}</td>
                    <td className="px-4 py-2.5 text-gray-600 max-w-[200px] truncate">{l.reason}</td>
                    <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[l.status] || STATUS_COLORS.pending}`}>{l.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {tab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowExpenseForm(!showExpenseForm)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
              {showExpenseForm ? <X size={14} /> : <Plus size={14} />}
              {showExpenseForm ? '取消' : '提交报销'}
            </button>
          </div>
          {showExpenseForm && (
            <div className="rounded-[10px] border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })} className="px-3 py-2 rounded-[10px] border border-[#E8ECF4] bg-white text-sm text-light-text">
                  <option>差旅</option><option>办公用品</option><option>餐饮</option><option>交通</option><option>其他</option>
                </select>
                <input type="number" min={0} step={0.01} value={expenseForm.amount || ''} onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })} placeholder="金额 (元)" className="px-3 py-2 rounded-[10px] border border-[#E8ECF4] bg-white text-sm text-light-text" />
                <input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="报销说明" className="px-3 py-2 rounded-[10px] border border-[#E8ECF4] bg-white text-sm text-light-text" />
              </div>
              <button onClick={handleCreateExpense} className="px-4 py-2 rounded-[10px] bg-primary text-white text-sm font-medium hover:bg-primary/90">提交</button>
            </div>
          )}
          <div className="rounded-[10px] border border-[#E8ECF4] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#E6FAF0]">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-light-text-secondary">类别</th>
                  <th className="text-left px-4 py-2.5 font-medium text-light-text-secondary">金额</th>
                  <th className="text-left px-4 py-2.5 font-medium text-light-text-secondary">说明</th>
                  <th className="text-left px-4 py-2.5 font-medium text-light-text-secondary">提交日期</th>
                  <th className="text-left px-4 py-2.5 font-medium text-light-text-secondary">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myExpenses.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-[#919AA3]">暂无报销记录</td></tr>
                ) : myExpenses.map((e) => (
                  <tr key={e.id} className="bg-white hover:bg-[#EFF3F9]">
                    <td className="px-4 py-2.5 text-light-text">{e.category}</td>
                    <td className="px-4 py-2.5 text-gray-600">{e.amount.toLocaleString()} 元</td>
                    <td className="px-4 py-2.5 text-gray-600 max-w-[200px] truncate">{e.description}</td>
                    <td className="px-4 py-2.5 text-gray-600">{e.submit_date}</td>
                    <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[e.status] || STATUS_COLORS.submitted}`}>{e.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notices Tab */}
      {tab === 'notices' && (
        <div className="space-y-2">
          {notices.length === 0 ? (
            <p className="text-sm text-[#919AA3] py-8 text-center">暂无通知</p>
          ) : notices.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && markNoticeRead(n.id)}
              className={`rounded-[10px] border p-4 cursor-pointer transition-colors ${
                n.is_read
                  ? 'border-[#E8ECF4] bg-white'
                  : 'border-primary/30 bg-primary/5'
              } hover:bg-[#EFF3F9]`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium text-light-text">{n.title}</h4>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-sm text-light-text-secondary mt-1 line-clamp-2">{n.content}</p>
                </div>
                <span className="text-xs text-[#919AA3] shrink-0">{n.created_at?.slice(0, 10)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
