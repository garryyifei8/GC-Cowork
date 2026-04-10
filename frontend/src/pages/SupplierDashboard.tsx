import { useEffect, useState, useCallback } from 'react';
import {
  Truck,
  Plus,
  Search,
  Star,
  Building2,
  Package,
  Wrench,
  Users,
  BookOpen,
} from 'lucide-react';
import { supplierService } from '../services/api';
import { StatCard } from '../widgets/atomic';
import { SupplierDrawer } from '../components/suppliers/SupplierDrawer';
import type { Supplier, SupplierCategory, SupplierSummary } from '../types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_OPTIONS: { value: SupplierCategory | ''; label: string; icon: React.ReactNode }[] = [
  { value: '', label: '全部', icon: null },
  { value: 'material', label: '材料', icon: <Package size={14} /> },
  { value: 'equipment', label: '设备', icon: <Wrench size={14} /> },
  { value: 'subcontract', label: '分包', icon: <Building2 size={14} /> },
  { value: 'service', label: '服务', icon: <Users size={14} /> },
  { value: 'consulting', label: '咨询', icon: <BookOpen size={14} /> },
];

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '活跃' },
  { value: 'inactive', label: '停用' },
  { value: 'blacklisted', label: '黑名单' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: '活跃' },
  inactive: { bg: 'bg-gray-100', text: 'text-gray-500', label: '停用' },
  blacklisted: { bg: 'bg-red-50', text: 'text-red-600', label: '黑名单' },
};

const CATEGORY_LABELS: Record<string, string> = {
  material: '材料',
  equipment: '设备',
  subcontract: '分包',
  service: '服务',
  consulting: '咨询',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export const SupplierDashboard = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [summary, setSummary] = useState<SupplierSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, sum] = await Promise.all([supplierService.list(), supplierService.getSummary()]);
      setSuppliers(list);
      setSummary(sum);
    } catch (e) {
      console.error('Failed to load suppliers:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = suppliers.filter((s) => {
    if (filterCategory && s.category !== filterCategory) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.contact_person.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      if (editingSupplier) {
        await supplierService.update(editingSupplier.id, data);
      } else {
        await supplierService.create(data);
      }
      setDrawerOpen(false);
      setEditingSupplier(null);
      load();
    } catch (e) {
      console.error('Failed to save supplier:', e);
    }
  };

  const handleEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setDrawerOpen(true);
  };

  const handleCreate = () => {
    setEditingSupplier(null);
    setDrawerOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen bg-[#F5F6FA]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#333]">供应商管理</h1>
          <p className="text-sm text-[#6C7688]">供应商主数据管理与评估</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-[8px] hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} />
          新建供应商
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="供应商总数"
            value={`${summary.total}`}
            icon={<Truck size={20} />}
            iconColor="bg-blue-100 text-blue-600"
          />
          <StatCard
            label="活跃供应商"
            value={`${summary.active}`}
            icon={<Building2 size={20} />}
            iconColor="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            label="平均评分"
            value={`${summary.avg_rating}`}
            icon={<Star size={20} />}
            iconColor="bg-amber-100 text-amber-600"
          />
          <StatCard
            label="分类数量"
            value={`${Object.keys(summary.by_category).length}`}
            icon={<Package size={20} />}
            iconColor="bg-purple-100 text-purple-600"
          />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-[#E8E8E8] rounded-lg shadow-[0_0_35px_0_rgba(104,134,177,0.1)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="搜索供应商名称、联系人..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#E8ECF4] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 bg-white"
            />
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => setFilterCategory(c.value)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors ${
                  filterCategory === c.value
                    ? 'bg-primary text-white'
                    : 'bg-[#EFF3F9] text-light-text-secondary hover:bg-[#E4EAF6]'
                }`}
              >
                {c.icon}
                {c.label}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-[#E8ECF4] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white text-light-text"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Supplier list */}
      <div className="bg-white border border-[#E8E8E8] rounded-lg shadow-[0_0_35px_0_rgba(104,134,177,0.1)]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-[#9CA3AF] text-sm">暂无供应商数据</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0.5 p-4">
            {filtered.map((sup) => {
              const statusStyle = STATUS_COLORS[sup.status] ?? STATUS_COLORS.active;
              return (
                <div
                  key={sup.id}
                  onClick={() => handleEdit(sup)}
                  className="bg-white border border-[#E8ECF4] rounded-[10px] p-4 hover:bg-[#F4F6FC] transition-colors cursor-pointer flex flex-col gap-3"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-[8px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Truck size={18} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm text-light-text truncate">{sup.name}</h3>
                        <span className="text-xs text-light-text-secondary">
                          {CATEGORY_LABELS[sup.category] ?? sup.category}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      {statusStyle.label}
                    </span>
                  </div>

                  {/* Contact */}
                  {sup.contact_person && (
                    <div className="text-xs text-light-text-secondary">
                      联系人: {sup.contact_person}
                      {sup.phone && ` · ${sup.phone}`}
                    </div>
                  )}

                  {/* Rating + qualification */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          className={
                            s <= sup.rating ? 'fill-amber-400 text-amber-400' : 'text-[#D0D5DD]'
                          }
                        />
                      ))}
                    </div>
                    {sup.qualification && (
                      <span className="text-xs text-light-text-secondary bg-[#EFF3F9] px-2 py-0.5 rounded">
                        {sup.qualification}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drawer */}
      <SupplierDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditingSupplier(null);
        }}
        onSave={handleSave}
        supplier={editingSupplier}
      />
    </div>
  );
};
