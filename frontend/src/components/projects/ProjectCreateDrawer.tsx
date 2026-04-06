import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const PROJECT_TYPES = ['EPC / 展馆', 'EPC / 公建', 'EPC / 市政', '信息化开发', '专项债咨询'];

interface ProjectCreateDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    project_type?: string;
    budget_display?: string;
    due_date?: string;
    description?: string;
    manager?: string;
  }) => Promise<void>;
}

export const ProjectCreateDrawer: React.FC<ProjectCreateDrawerProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [budgetDisplay, setBudgetDisplay] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [manager, setManager] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      setName('');
      setProjectType('');
      setBudgetDisplay('');
      setDueDate('');
      setManager('');
      setDescription('');
      setError('');
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('请输入项目名称');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        project_type: projectType || undefined,
        budget_display: budgetDisplay.trim() || undefined,
        due_date: dueDate || undefined,
        description: description.trim() || undefined,
        manager: manager.trim() || undefined,
      });
      onClose();
    } catch {
      setError('创建失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-white shadow-xl flex flex-col animate-slide-in-right">
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
              className="w-full px-3 py-2 text-sm border border-[#E8E8E8] rounded-lg bg-white text-[#333] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder:text-[#9CA3AF]"
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

          {/* Manager */}
          <div>
            <label className="block text-xs font-medium text-[#6C7688] mb-1.5">项目经理</label>
            <input
              type="text"
              value={manager}
              onChange={(e) => setManager(e.target.value)}
              placeholder="输入项目经理姓名"
              className="w-full px-3 py-2 text-sm border border-[#E8E8E8] rounded-lg bg-white text-[#333] focus:outline-none focus:border-blue-500 placeholder:text-[#9CA3AF]"
            />
          </div>

          {/* Budget + Due date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[#6C7688] mb-1.5">预算金额</label>
              <input
                type="text"
                value={budgetDisplay}
                onChange={(e) => setBudgetDisplay(e.target.value)}
                placeholder="如: 1.2亿、450万"
                className="w-full px-3 py-2 text-sm border border-[#E8E8E8] rounded-lg bg-white text-[#333] focus:outline-none focus:border-blue-500 placeholder:text-[#9CA3AF]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6C7688] mb-1.5">
                计划完工日期
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-[#E8E8E8] rounded-lg bg-white text-[#333] focus:outline-none focus:border-blue-500"
              />
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
              className="w-full px-3 py-2 text-sm border border-[#E8E8E8] rounded-lg bg-white text-[#333] focus:outline-none focus:border-blue-500 resize-y placeholder:text-[#9CA3AF]"
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
    </div>
  );
};
