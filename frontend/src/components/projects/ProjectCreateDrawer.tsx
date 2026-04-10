import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Plus, Trash2 } from 'lucide-react';
import { hrService } from '../../services/api';
import type { Employee } from '../../types';

const PROJECT_TYPES = ['EPC / 展馆', 'EPC / 公建', 'EPC / 市政', '信息化开发', '专项债咨询'];

const STAGES: { value: string; label: string }[] = [
  { value: 'initiation', label: '立项' },
  { value: 'bidding', label: '投标' },
  { value: 'contract', label: '签约' },
  { value: 'design', label: '设计' },
  { value: 'procurement', label: '采购' },
  { value: 'construction', label: '施工' },
];

const RISK_LEVELS: { value: string; label: string; color: string }[] = [
  { value: 'low', label: '低', color: '#00C875' },
  { value: 'medium', label: '中', color: '#FDAB3D' },
  { value: 'high', label: '高', color: '#E2445C' },
];

const BUDGET_UNITS = ['万元', '亿元'];

export interface CreateProjectData {
  name: string;
  project_type?: string;
  budget_display?: string;
  budget?: number;
  due_date?: string;
  description?: string;
  manager?: string;
  team_members?: string[];
  stage?: string;
  risk_level?: string;
  milestones?: Array<{ name: string; date: string; status: string }>;
}

interface ProjectCreateDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectData) => Promise<void>;
}

interface MilestoneRow {
  name: string;
  date: string;
}

export const ProjectCreateDrawer: React.FC<ProjectCreateDrawerProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  // Form state
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetUnit, setBudgetUnit] = useState('万元');
  const [dueDate, setDueDate] = useState('');
  const [manager, setManager] = useState('');
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [stage, setStage] = useState('initiation');
  const [riskLevel, setRiskLevel] = useState('');
  const [description, setDescription] = useState('');
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Employee list for selectors
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managerSearch, setManagerSearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  // Load employees
  useEffect(() => {
    if (open) {
      hrService
        .listEmployees()
        .then(setEmployees)
        .catch(() => {});
    }
  }, [open]);

  // Reset form
  useEffect(() => {
    if (open) {
      setName('');
      setProjectType('');
      setBudgetAmount('');
      setBudgetUnit('万元');
      setDueDate('');
      setManager('');
      setTeamMembers([]);
      setStage('initiation');
      setRiskLevel('');
      setDescription('');
      setMilestones([]);
      setError('');
      setManagerSearch('');
      setMemberSearch('');
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  // Filtered employees for manager selector
  const filteredManagerEmployees = useMemo(() => {
    const q = managerSearch.toLowerCase();
    return employees
      .filter((e) => e.status === 'active')
      .filter(
        (e) => !q || e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)
      );
  }, [employees, managerSearch]);

  // Filtered employees for team member selector (exclude manager)
  const filteredMemberEmployees = useMemo(() => {
    const q = memberSearch.toLowerCase();
    return employees
      .filter((e) => e.status === 'active')
      .filter((e) => e.name !== manager)
      .filter((e) => !teamMembers.includes(e.name))
      .filter(
        (e) => !q || e.name.toLowerCase().includes(q) || e.department.toLowerCase().includes(q)
      );
  }, [employees, memberSearch, manager, teamMembers]);

  // Group employees by department
  const groupByDept = (list: Employee[]) => {
    const grouped: Record<string, Employee[]> = {};
    for (const e of list) {
      if (!grouped[e.department]) grouped[e.department] = [];
      grouped[e.department].push(e);
    }
    return grouped;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('请输入项目名称');
      return;
    }
    setSubmitting(true);
    setError('');

    // Build budget display and number
    let budget: number | undefined;
    let budgetDisplay: string | undefined;
    if (budgetAmount) {
      const num = parseFloat(budgetAmount);
      if (!isNaN(num) && num > 0) {
        budget = budgetUnit === '亿元' ? num * 10000 : num; // store in 万元
        budgetDisplay = `${budgetAmount}${budgetUnit}`;
      }
    }

    try {
      await onSubmit({
        name: name.trim(),
        project_type: projectType || undefined,
        budget_display: budgetDisplay,
        budget,
        due_date: dueDate || undefined,
        description: description.trim() || undefined,
        manager: manager || undefined,
        team_members: teamMembers.length > 0 ? teamMembers : undefined,
        stage: stage || undefined,
        risk_level: riskLevel || undefined,
        milestones:
          milestones.length > 0
            ? milestones
                .filter((m) => m.name.trim())
                .map((m) => ({ name: m.name, date: m.date, status: 'pending' }))
            : undefined,
      });
      onClose();
    } catch {
      setError('创建失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const inputCls =
    'w-full px-3 py-2 text-sm border border-[#E8E8E8] rounded-lg bg-white text-[#333] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 placeholder:text-[#9CA3AF]';

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white shadow-xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between h-12 px-5 border-b border-[#E8E8E8] shrink-0">
          <h2 className="text-[15px] font-semibold text-[#333]">新建项目</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#ecedf5] text-[#676879] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Project name */}
          <div>
            <label className="block text-xs font-medium text-[#6C7688] mb-1.5">
              项目名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入项目名称"
              autoFocus
              className={inputCls}
            />
          </div>

          {/* Project type */}
          <div>
            <label className="block text-xs font-medium text-[#6C7688] mb-1.5">项目类型</label>
            <div className="flex flex-wrap gap-2">
              {PROJECT_TYPES.map((type) => {
                const isActive = projectType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setProjectType(isActive ? '' : type)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                    style={{
                      borderColor: isActive ? '#2F80ED' : '#E8E8E8',
                      backgroundColor: isActive ? '#2F80ED10' : '#F5F6FA',
                      color: isActive ? '#2F80ED' : '#6C7688',
                    }}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Project stage */}
          <div>
            <label className="block text-xs font-medium text-[#6C7688] mb-1.5">项目阶段</label>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => {
                const isActive = stage === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStage(s.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      isActive
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-[#E8E8E8] bg-[#F5F6FA] text-[#6C7688]'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manager — searchable dropdown from HR */}
          <div className="relative">
            <label className="block text-xs font-medium text-[#6C7688] mb-1.5">项目经理</label>
            <input
              type="text"
              value={manager || managerSearch}
              onChange={(e) => {
                setManagerSearch(e.target.value);
                setManager('');
                setShowManagerDropdown(true);
              }}
              onFocus={() => setShowManagerDropdown(true)}
              placeholder="搜索选择项目经理..."
              className={inputCls}
            />
            {manager && (
              <button
                type="button"
                onClick={() => {
                  setManager('');
                  setManagerSearch('');
                }}
                className="absolute right-2 top-[30px] p-1 text-[#9CA3AF] hover:text-[#333]"
              >
                <X size={14} />
              </button>
            )}
            {showManagerDropdown && !manager && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-[#E8E8E8] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {Object.entries(groupByDept(filteredManagerEmployees)).map(([dept, emps]) => (
                  <div key={dept}>
                    <div className="px-3 py-1 text-[10px] font-medium text-[#9CA3AF] uppercase bg-[#F5F6FA]">
                      {dept}
                    </div>
                    {emps.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setManager(emp.name);
                          setManagerSearch('');
                          setShowManagerDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#F4F6FC] flex items-center gap-2"
                      >
                        <span className="text-[#333]">{emp.name}</span>
                        <span className="text-xs text-[#9CA3AF]">{emp.position}</span>
                      </button>
                    ))}
                  </div>
                ))}
                {filteredManagerEmployees.length === 0 && (
                  <div className="px-3 py-2 text-sm text-[#9CA3AF]">无匹配员工</div>
                )}
              </div>
            )}
          </div>

          {/* Team members — multi-select chips */}
          <div className="relative">
            <label className="block text-xs font-medium text-[#6C7688] mb-1.5">参与人员</label>
            {/* Selected chips */}
            {teamMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {teamMembers.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                  >
                    {m}
                    <button
                      type="button"
                      onClick={() => setTeamMembers((prev) => prev.filter((n) => n !== m))}
                      className="p-0.5 hover:bg-primary/20 rounded-full"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value);
                setShowMemberDropdown(true);
              }}
              onFocus={() => setShowMemberDropdown(true)}
              placeholder="搜索添加参与人员..."
              className={inputCls}
            />
            {showMemberDropdown && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-[#E8E8E8] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {Object.entries(groupByDept(filteredMemberEmployees)).map(([dept, emps]) => (
                  <div key={dept}>
                    <div className="px-3 py-1 text-[10px] font-medium text-[#9CA3AF] uppercase bg-[#F5F6FA]">
                      {dept}
                    </div>
                    {emps.map((emp) => (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => {
                          setTeamMembers((prev) => [...prev, emp.name]);
                          setMemberSearch('');
                          setShowMemberDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#F4F6FC] flex items-center gap-2"
                      >
                        <span className="text-[#333]">{emp.name}</span>
                        <span className="text-xs text-[#9CA3AF]">{emp.position}</span>
                      </button>
                    ))}
                  </div>
                ))}
                {filteredMemberEmployees.length === 0 && (
                  <div className="px-3 py-2 text-sm text-[#9CA3AF]">无匹配员工</div>
                )}
              </div>
            )}
          </div>

          {/* Budget — number + unit */}
          <div>
            <label className="block text-xs font-medium text-[#6C7688] mb-1.5">预算金额</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="输入金额"
                min="0"
                step="0.01"
                className={`flex-1 ${inputCls}`}
              />
              <div className="flex rounded-lg border border-[#E8E8E8] overflow-hidden">
                {BUDGET_UNITS.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setBudgetUnit(unit)}
                    className={`px-3 py-2 text-xs font-medium transition-colors ${
                      budgetUnit === unit
                        ? 'bg-primary text-white'
                        : 'bg-[#F5F6FA] text-[#6C7688] hover:bg-[#E8ECF4]'
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-medium text-[#6C7688] mb-1.5">计划完工日期</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Risk level */}
          <div>
            <label className="block text-xs font-medium text-[#6C7688] mb-1.5">风险等级</label>
            <div className="flex gap-2">
              {RISK_LEVELS.map((r) => {
                const isActive = riskLevel === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRiskLevel(isActive ? '' : r.value)}
                    className="flex-1 py-2 rounded-lg text-xs font-medium transition-all border"
                    style={{
                      borderColor: isActive ? r.color : '#E8E8E8',
                      backgroundColor: isActive ? `${r.color}15` : '#F5F6FA',
                      color: isActive ? r.color : '#6C7688',
                    }}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Milestones */}
          <div>
            <label className="block text-xs font-medium text-[#6C7688] mb-1.5">里程碑</label>
            <div className="flex flex-col gap-2">
              {milestones.map((m, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={m.name}
                    onChange={(e) => {
                      const updated = [...milestones];
                      updated[idx] = { ...updated[idx], name: e.target.value };
                      setMilestones(updated);
                    }}
                    placeholder="里程碑名称"
                    className={`flex-1 ${inputCls}`}
                  />
                  <input
                    type="date"
                    value={m.date}
                    onChange={(e) => {
                      const updated = [...milestones];
                      updated[idx] = { ...updated[idx], date: e.target.value };
                      setMilestones(updated);
                    }}
                    className="w-36 px-3 py-2 text-sm border border-[#E8E8E8] rounded-lg bg-white text-[#333] focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setMilestones((prev) => prev.filter((_, i) => i !== idx))}
                    className="p-1.5 text-[#9CA3AF] hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setMilestones((prev) => [...prev, { name: '', date: '' }])}
                className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline self-start"
              >
                <Plus size={12} />
                添加里程碑
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-[#6C7688] mb-1.5">项目描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要描述项目概况..."
              rows={3}
              className={`${inputCls} resize-y`}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2 border-t border-[#E8E8E8]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-[#6C7688] border border-[#E8E8E8] hover:bg-[#F5F6FA] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check size={15} />
              )}
              {submitting ? '创建中...' : '创建项目'}
            </button>
          </div>
        </form>
      </div>

      {/* Click outside dropdown closes */}
      {(showManagerDropdown || showMemberDropdown) && (
        <div
          className="fixed inset-0 z-[5]"
          onClick={() => {
            setShowManagerDropdown(false);
            setShowMemberDropdown(false);
          }}
        />
      )}
    </div>
  );
};
