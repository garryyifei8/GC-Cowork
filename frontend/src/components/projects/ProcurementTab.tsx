import React, { useEffect, useState } from 'react';
import { Package, ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import { projectService } from '../../services/api';
import {
  PROCUREMENT_STATUS_LABELS,
  PROCUREMENT_STATUS_COLORS,
  PROCUREMENT_CATEGORIES,
} from '../../utils/constants';
import type { ProcurementPackage } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatWan(amount: number | null | undefined): string {
  if (amount == null) return '—';
  const wan = amount / 10000;
  return `${wan % 1 === 0 ? wan.toFixed(0) : wan.toFixed(1)}万`;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const color = PROCUREMENT_STATUS_COLORS[status] ?? '#676879';
  const label = PROCUREMENT_STATUS_LABELS[status] ?? status;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap"
      style={{
        color,
        backgroundColor: hexToRgba(color, 0.15),
      }}
    >
      {label}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Category Filter Tabs
// ---------------------------------------------------------------------------

const ALL_CATEGORY = '全部';

interface CategoryTabsProps {
  active: string;
  onChange: (cat: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ active, onChange }) => {
  const tabs = [ALL_CATEGORY, ...PROCUREMENT_CATEGORIES];
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {tabs.map((tab) => {
        const isActive = tab === active;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={[
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-[#0086C0] text-white'
                : 'text-[#676879] hover:bg-[#f6f7fb] hover:text-[#323338]',
            ].join(' ')}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Budget Summary Row
// ---------------------------------------------------------------------------

interface BudgetSummaryRowProps {
  packages: ProcurementPackage[];
}

const BudgetSummaryRow: React.FC<BudgetSummaryRowProps> = ({ packages }) => {
  const totalBudget = packages.reduce((sum, p) => sum + (p.budget_amount ?? 0), 0);
  const totalActual = packages.reduce((sum, p) => sum + (p.actual_amount ?? 0), 0);
  const variance = totalActual - totalBudget;
  const overBudget = totalBudget > 0 && variance > 0;

  return (
    <tr className="bg-[#f6f7fb] border-t-2 border-[#d0d4e4]">
      <td className="px-4 py-3 text-xs font-bold text-[#323338]" colSpan={3}>
        合计 ({packages.length} 个采购包)
      </td>
      <td className="px-4 py-3 text-xs font-bold text-[#323338] text-right">
        {formatWan(totalBudget)}
      </td>
      <td className="px-4 py-3 text-xs font-bold text-right">
        <span className={overBudget ? 'text-[#E2445C]' : 'text-[#00C875]'}>
          {formatWan(totalActual)}
        </span>
        {totalBudget > 0 && (
          <span
            className={[
              'ml-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded',
              overBudget ? 'bg-[#E2445C]/10 text-[#E2445C]' : 'bg-[#00C875]/10 text-[#00C875]',
            ].join(' ')}
          >
            {overBudget ? '+' : ''}
            {formatWan(variance)}
          </span>
        )}
      </td>
      <td className="px-4 py-3" colSpan={3} />
    </tr>
  );
};

// ---------------------------------------------------------------------------
// Expanded Row Detail
// ---------------------------------------------------------------------------

interface ExpandedDetailProps {
  pkg: ProcurementPackage;
}

const ExpandedDetail: React.FC<ExpandedDetailProps> = ({ pkg }) => (
  <tr className="bg-[#f6f7fb]">
    <td colSpan={8} className="px-6 pb-4 pt-2">
      <div className="flex flex-wrap gap-6 text-sm">
        <div>
          <span className="text-xs font-semibold text-[#676879] uppercase tracking-wide mr-2">
            计划日期
          </span>
          <span className="text-[#323338]">{pkg.plan_date ?? '—'}</span>
        </div>
        <div>
          <span className="text-xs font-semibold text-[#676879] uppercase tracking-wide mr-2">
            到货日期
          </span>
          <span className="text-[#323338]">{pkg.arrival_date ?? '—'}</span>
        </div>
        {pkg.notes && (
          <div>
            <span className="text-xs font-semibold text-[#676879] uppercase tracking-wide mr-2">
              备注
            </span>
            <span className="text-[#323338]">{pkg.notes}</span>
          </div>
        )}
      </div>
    </td>
  </tr>
);

// ---------------------------------------------------------------------------
// Table Row
// ---------------------------------------------------------------------------

interface PackageRowProps {
  pkg: ProcurementPackage;
  isExpanded: boolean;
  onToggle: () => void;
}

const PackageRow: React.FC<PackageRowProps> = ({ pkg, isExpanded, onToggle }) => (
  <>
    <tr
      className="border-b border-[#e6e9ef] hover:bg-[#f6f7fb] transition-colors cursor-pointer"
      onClick={onToggle}
      aria-expanded={isExpanded}
    >
      {/* Expand toggle + Name */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-[#676879] shrink-0">
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <span className="text-sm font-medium text-[#323338] truncate max-w-[180px]">
            {pkg.name}
          </span>
        </div>
      </td>

      {/* Category */}
      <td className="px-4 py-3 text-sm text-[#323338]">{pkg.category || '—'}</td>

      {/* Supplier */}
      <td className="px-4 py-3 text-sm text-[#676879] truncate max-w-[120px]">
        {pkg.supplier ?? '—'}
      </td>

      {/* Budget Amount */}
      <td className="px-4 py-3 text-sm text-[#323338] text-right font-mono">
        {formatWan(pkg.budget_amount)}
      </td>

      {/* Actual Amount */}
      <td className="px-4 py-3 text-sm text-right font-mono">
        {pkg.actual_amount != null ? (
          <span
            className={
              pkg.budget_amount != null && pkg.actual_amount > pkg.budget_amount
                ? 'text-[#E2445C] font-semibold'
                : 'text-[#00C875]'
            }
          >
            {formatWan(pkg.actual_amount)}
          </span>
        ) : (
          <span className="text-[#c3c6d4]">—</span>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <StatusBadge status={pkg.status} />
      </td>

      {/* Responsible */}
      <td className="px-4 py-3 text-sm text-[#676879]">{pkg.responsible ?? '—'}</td>
    </tr>

    {isExpanded && <ExpandedDetail pkg={pkg} />}
  </>
);

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-2 p-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-11 bg-[#e6e9ef] rounded-lg" />
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

const EmptyState: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#676879]">
    <Package size={36} className="text-[#c3c6d4]" />
    <p className="text-sm font-medium">暂无采购包数据</p>
    <p className="text-xs text-[#c3c6d4]">该项目尚未创建采购包</p>
  </div>
);

// ---------------------------------------------------------------------------
// Create Procurement Drawer
// ---------------------------------------------------------------------------

interface CreateProcurementDrawerProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    category: string;
    supplier?: string;
    budget_amount?: number;
    plan_date?: string;
    responsible?: string;
    notes?: string;
  }) => Promise<void>;
}

const CreateProcurementDrawer: React.FC<CreateProcurementDrawerProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(PROCUREMENT_CATEGORIES[0]);
  const [supplier, setSupplier] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [planDate, setPlanDate] = useState('');
  const [responsible, setResponsible] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName('');
    setCategory(PROCUREMENT_CATEGORIES[0]);
    setSupplier('');
    setBudgetAmount('');
    setPlanDate('');
    setResponsible('');
    setNotes('');
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        category,
        supplier: supplier.trim() || undefined,
        budget_amount: budgetAmount ? Number(budgetAmount) : undefined,
        plan_date: planDate || undefined,
        responsible: responsible.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      reset();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e6e9ef]">
          <h3 className="text-base font-bold text-[#323338]">新建采购包</h3>
          <button className="p-1 rounded-md hover:bg-[#f6f7fb] text-[#676879]" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[#676879] mb-1">
              采购包名称 <span className="text-[#E2445C]">*</span>
            </label>
            <input
              className="w-full border border-[#d0d4e4] rounded-lg px-3 py-2 text-sm text-[#323338] focus:outline-none focus:border-[#0086C0] transition-colors"
              placeholder="输入采购包名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-[#676879] mb-1">分类</label>
            <select
              className="w-full border border-[#d0d4e4] rounded-lg px-3 py-2 text-sm text-[#323338] bg-white focus:outline-none focus:border-[#0086C0]"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {PROCUREMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-xs font-semibold text-[#676879] mb-1">供应商</label>
            <input
              className="w-full border border-[#d0d4e4] rounded-lg px-3 py-2 text-sm text-[#323338] focus:outline-none focus:border-[#0086C0] transition-colors"
              placeholder="输入供应商名称"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
            />
          </div>

          {/* Budget Amount */}
          <div>
            <label className="block text-xs font-semibold text-[#676879] mb-1">预算金额 (元)</label>
            <input
              type="number"
              className="w-full border border-[#d0d4e4] rounded-lg px-3 py-2 text-sm text-[#323338] focus:outline-none focus:border-[#0086C0] transition-colors"
              placeholder="输入预算金额"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
            />
          </div>

          {/* Plan Date */}
          <div>
            <label className="block text-xs font-semibold text-[#676879] mb-1">计划日期</label>
            <input
              type="date"
              className="w-full border border-[#d0d4e4] rounded-lg px-3 py-2 text-sm text-[#323338] focus:outline-none focus:border-[#0086C0] transition-colors"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
            />
          </div>

          {/* Responsible */}
          <div>
            <label className="block text-xs font-semibold text-[#676879] mb-1">负责人</label>
            <input
              className="w-full border border-[#d0d4e4] rounded-lg px-3 py-2 text-sm text-[#323338] focus:outline-none focus:border-[#0086C0] transition-colors"
              placeholder="输入负责人"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#676879] mb-1">备注</label>
            <textarea
              className="w-full border border-[#d0d4e4] rounded-lg px-3 py-2 text-sm text-[#323338] focus:outline-none focus:border-[#0086C0] transition-colors resize-none"
              rows={3}
              placeholder="备注信息"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#e6e9ef]">
          <button
            className="px-4 py-2 text-sm font-medium text-[#676879] rounded-lg hover:bg-[#f6f7fb] transition-colors"
            onClick={onClose}
          >
            取消
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-[#0086C0] rounded-lg hover:bg-[#006d9e] transition-colors disabled:opacity-50"
            disabled={!name.trim() || submitting}
            onClick={handleSubmit}
          >
            {submitting ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// Main ProcurementTab Component
// ---------------------------------------------------------------------------

interface ProcurementTabProps {
  projectId: string;
}

const ProcurementTab: React.FC<ProcurementTabProps> = ({ projectId }) => {
  const [packages, setPackages] = useState<ProcurementPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showCreateDrawer, setShowCreateDrawer] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await projectService.getProcurements(projectId);
        if (!cancelled) setPackages(data);
      } catch (err: unknown) {
        if (!cancelled) setError((err as Error)?.message ?? '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const filteredPackages =
    activeCategory === ALL_CATEGORY
      ? packages
      : packages.filter((p) => p.category === activeCategory);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreate = async (data: {
    name: string;
    category: string;
    supplier?: string;
    budget_amount?: number;
    plan_date?: string;
    responsible?: string;
    notes?: string;
  }) => {
    const created = await projectService.createProcurement(projectId, data);
    setPackages((prev) => [...prev, created]);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header bar: category filter tabs + create button */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <CategoryTabs active={activeCategory} onChange={setActiveCategory} />
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#676879]">共 {filteredPackages.length} 个采购包</span>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-[#0086C0] rounded-lg hover:bg-[#006d9e] transition-colors"
            onClick={() => setShowCreateDrawer(true)}
          >
            <Plus size={14} />
            新建采购包
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#d0d4e4] rounded-lg overflow-hidden">
        {loading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-sm text-[#E2445C]">
            {error}
          </div>
        ) : filteredPackages.length === 0 ? (
          <EmptyState />
        ) : (
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-[#f6f7fb] border-b border-[#d0d4e4]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#676879] uppercase tracking-wide">
                  采购包名称
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#676879] uppercase tracking-wide">
                  分类
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#676879] uppercase tracking-wide">
                  供应商
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#676879] uppercase tracking-wide">
                  预算金额
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#676879] uppercase tracking-wide">
                  实际金额
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#676879] uppercase tracking-wide">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#676879] uppercase tracking-wide">
                  负责人
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPackages.map((pkg) => (
                <PackageRow
                  key={pkg.id}
                  pkg={pkg}
                  isExpanded={expandedIds.has(pkg.id)}
                  onToggle={() => toggleExpand(pkg.id)}
                />
              ))}
              <BudgetSummaryRow packages={filteredPackages} />
            </tbody>
          </table>
        )}
      </div>

      {/* Create Procurement Drawer */}
      <CreateProcurementDrawer
        open={showCreateDrawer}
        onClose={() => setShowCreateDrawer(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default ProcurementTab;
