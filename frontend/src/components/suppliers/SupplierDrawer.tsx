import { useState } from 'react';
import { X, Star } from 'lucide-react';
import type { Supplier, SupplierCategory, SupplierStatusType } from '../../types';

interface SupplierDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  supplier?: Supplier | null;
}

const CATEGORIES: { value: SupplierCategory; label: string }[] = [
  { value: 'material', label: '材料' },
  { value: 'equipment', label: '设备' },
  { value: 'subcontract', label: '分包' },
  { value: 'service', label: '服务' },
  { value: 'consulting', label: '咨询' },
];

const STATUSES: { value: SupplierStatusType; label: string; color: string }[] = [
  { value: 'active', label: '活跃', color: '#00C875' },
  { value: 'inactive', label: '停用', color: '#6C7688' },
  { value: 'blacklisted', label: '黑名单', color: '#E2445C' },
];

interface FormData {
  name: string;
  category: SupplierCategory;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  qualification: string;
  rating: number;
  status: SupplierStatusType;
  notes: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  category: 'material',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  qualification: '',
  rating: 0,
  status: 'active',
  notes: '',
};

function supplierToForm(supplier: Supplier | null | undefined): FormData {
  if (!supplier) return EMPTY_FORM;
  return {
    name: supplier.name,
    category: supplier.category,
    contact_person: supplier.contact_person,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    qualification: supplier.qualification,
    rating: supplier.rating,
    status: supplier.status,
    notes: supplier.notes,
  };
}

export const SupplierDrawer = ({ open, onClose, onSave, supplier }: SupplierDrawerProps) => {
  const [form, setForm] = useState<FormData>(() => supplierToForm(supplier));

  // Reset form state when the supplier prop changes (React 19 pattern for deriving state from props)
  const supplierKey = `${supplier?.id ?? 'new'}:${open ? '1' : '0'}`;
  const [prevKey, setPrevKey] = useState(supplierKey);
  if (prevKey !== supplierKey) {
    setPrevKey(supplierKey);
    setForm(supplierToForm(supplier));
  }

  if (!open) return null;

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    onSave(form as unknown as Record<string, unknown>);
  };

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-[480px] bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8ECF4]">
          <h2 className="font-medium text-light-text">{supplier ? '编辑供应商' : '新建供应商'}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-[6px] hover:bg-[#EFF3F9] text-light-text-secondary"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-light-text mb-1.5 block">
              公司名称 <span className="text-[#E2445C]">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="输入供应商公司名称"
              className="w-full px-3 py-2 text-sm border border-[#E8ECF4] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 bg-white"
            />
          </div>

          {/* Category — button group */}
          <div>
            <label className="text-sm font-medium text-light-text mb-1.5 block">分类</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => set('category', c.value)}
                  className={`px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors ${
                    form.category === c.value
                      ? 'bg-primary text-white'
                      : 'bg-[#EFF3F9] text-light-text-secondary hover:bg-[#E4EAF6]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-light-text mb-1.5 block">联系人</label>
              <input
                value={form.contact_person}
                onChange={(e) => set('contact_person', e.target.value)}
                placeholder="联系人姓名"
                className="w-full px-3 py-2 text-sm border border-[#E8ECF4] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 bg-white"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-light-text mb-1.5 block">电话</label>
              <input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="联系电话"
                className="w-full px-3 py-2 text-sm border border-[#E8ECF4] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 bg-white"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-light-text mb-1.5 block">邮箱</label>
            <input
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="电子邮箱"
              className="w-full px-3 py-2 text-sm border border-[#E8ECF4] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 bg-white"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-sm font-medium text-light-text mb-1.5 block">地址</label>
            <input
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              placeholder="公司地址"
              className="w-full px-3 py-2 text-sm border border-[#E8ECF4] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 bg-white"
            />
          </div>

          {/* Qualification */}
          <div>
            <label className="text-sm font-medium text-light-text mb-1.5 block">资质等级</label>
            <input
              value={form.qualification}
              onChange={(e) => set('qualification', e.target.value)}
              placeholder="如：特级、一级、二级"
              className="w-full px-3 py-2 text-sm border border-[#E8ECF4] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 bg-white"
            />
          </div>

          {/* Rating — star selector */}
          <div>
            <label className="text-sm font-medium text-light-text mb-1.5 block">评分</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => set('rating', star === form.rating ? 0 : star)}
                  className="p-0.5 transition-colors"
                >
                  <Star
                    size={20}
                    className={
                      star <= form.rating ? 'fill-amber-400 text-amber-400' : 'text-[#D0D5DD]'
                    }
                  />
                </button>
              ))}
              {form.rating > 0 && (
                <span className="text-sm text-light-text-secondary ml-2">{form.rating}/5</span>
              )}
            </div>
          </div>

          {/* Status — button group */}
          <div>
            <label className="text-sm font-medium text-light-text mb-1.5 block">状态</label>
            <div className="flex gap-2">
              {STATUSES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => set('status', s.value)}
                  className={`px-3 py-1.5 rounded-[6px] text-sm font-medium transition-colors border ${
                    form.status === s.value
                      ? 'text-white'
                      : 'bg-white text-light-text-secondary hover:bg-[#F4F6FC]'
                  }`}
                  style={
                    form.status === s.value
                      ? { backgroundColor: s.color, borderColor: s.color }
                      : { borderColor: '#E8ECF4' }
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-light-text mb-1.5 block">备注</label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="供应商备注信息"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-[#E8ECF4] rounded-[8px] focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 bg-white resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8ECF4] flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-light-text-secondary border border-[#E8ECF4] rounded-[8px] hover:bg-[#F4F6FC] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-[8px] hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {supplier ? '保存' : '创建'}
          </button>
        </div>
      </div>
    </>
  );
};
