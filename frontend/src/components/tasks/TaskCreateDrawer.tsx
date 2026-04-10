import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '../../utils/constants';

interface TaskCreateDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    projectId: string;
    assignee?: string;
    priority?: string;
    due_date?: string;
    description?: string;
  }) => Promise<void>;
  /** Available projects for the dropdown */
  projects: Array<{ id: string; name: string }>;
  /** If set, locks the project selector to this project */
  fixedProjectId?: string;
}

export const TaskCreateDrawer: React.FC<TaskCreateDrawerProps> = ({
  open,
  onClose,
  onSubmit,
  projects,
  fixedProjectId,
}) => {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState(fixedProjectId ?? '');
  const [assignee, setAssignee] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      setName('');
      setProjectId(fixedProjectId ?? projects[0]?.id ?? '');
      setAssignee('');
      setPriority('medium');
      setDueDate('');
      setDescription('');
      setError('');
    }
  }, [open, fixedProjectId, projects]);

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
      setError('请输入任务名称');
      return;
    }
    if (!projectId) {
      setError('请选择所属项目');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        name: name.trim(),
        projectId,
        assignee: assignee.trim() || undefined,
        priority,
        due_date: dueDate || undefined,
        description: description.trim() || undefined,
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
        <div className="flex items-center justify-between h-12 px-5 border-b border-[#E8ECF4] shrink-0">
          <h2 className="text-[15px] font-medium text-light-text">新建任务</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#ecedf5] text-light-text-secondary transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          {/* Task name */}
          <div>
            <label className="block text-xs font-medium text-light-text-secondary mb-1.5">
              任务名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入任务名称"
              autoFocus
              className="w-full px-3 py-2 text-sm border border-[#E8ECF4] rounded-lg bg-white text-light-text focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 placeholder:text-light-text-secondary"
            />
          </div>

          {/* Project */}
          <div>
            <label className="block text-xs font-medium text-light-text-secondary mb-1.5">
              所属项目 <span className="text-red-500">*</span>
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!!fixedProjectId}
              className="w-full px-3 py-2 text-sm border border-[#E8ECF4] rounded-lg bg-white text-light-text focus:outline-none focus:border-blue-500 disabled:bg-[#EFF3F9] disabled:text-light-text-secondary"
            >
              <option value="">选择项目</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-xs font-medium text-light-text-secondary mb-1.5">
              负责人
            </label>
            <input
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="输入负责人姓名"
              className="w-full px-3 py-2 text-sm border border-[#E8ECF4] rounded-lg bg-white text-light-text focus:outline-none focus:border-blue-500 placeholder:text-light-text-secondary"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium text-light-text-secondary mb-1.5">
              优先级
            </label>
            <div className="flex gap-2">
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => {
                const color = PRIORITY_COLORS[key];
                const isActive = priority === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPriority(key)}
                    className="flex-1 py-2 rounded-[10px] text-sm font-medium text-center transition-all border-2"
                    style={{
                      borderColor: isActive ? color : 'transparent',
                      backgroundColor: isActive ? `${color}15` : '#EFF3F9',
                      color: isActive ? color : '#919AA3',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-medium text-light-text-secondary mb-1.5">
              截止日期
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#E8ECF4] rounded-lg bg-white text-light-text focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-light-text-secondary mb-1.5">
              描述
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="添加任务描述..."
              rows={3}
              className="w-full px-3 py-2 text-sm border border-[#E8ECF4] rounded-lg bg-white text-light-text focus:outline-none focus:border-blue-500 resize-y placeholder:text-light-text-secondary"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2 border-t border-[#E8ECF4]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium text-light-text-secondary border border-[#E8ECF4] hover:bg-[#EFF3F9] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim() || !projectId}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Check size={15} />
              )}
              {submitting ? '创建中...' : '创建任务'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
