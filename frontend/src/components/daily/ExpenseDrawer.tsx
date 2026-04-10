import React, { useState, useRef } from 'react';
import { Plus, Upload, Sparkles, Loader2 } from 'lucide-react';
import { DrawerPanel } from './DrawerPanel';
import { useDailyStore } from '../../stores/dailyStore';
import type { ExpenseReport } from '../../types';

const CATEGORIES = [
  { value: 'travel', label: '差旅' },
  { value: 'office', label: '办公' },
  { value: 'entertainment', label: '招待' },
  { value: 'material', label: '材料' },
  { value: 'other', label: '其他' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: '#676879' },
  submitted: { label: '已提交', color: '#0073ea' },
  approved: { label: '已通过', color: '#00C875' },
  rejected: { label: '已驳回', color: '#E2445C' },
  paid: { label: '已打款', color: '#00C875' },
};

const inputClass = 'w-full rounded-lg border border-light-border bg-[#f6f7fb] px-3 py-2 text-sm text-light-text outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-[#676879]';
const labelClass = 'block text-xs font-semibold text-[#676879] uppercase tracking-wide mb-1';

interface ExpenseDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const ExpenseDrawer: React.FC<ExpenseDrawerProps> = ({ open, onClose }) => {
  const { myExpenses, createExpense, parseReceipt, fetchMyExpenses } = useDailyStore();
  const [category, setCategory] = useState('travel');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [aiParsed, setAiParsed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) fetchMyExpenses();
  }, [open, fetchMyExpenses]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setAiParsed(false);
    try {
      const result = await parseReceipt(file);
      setAmount(String(result.amount));
      setCategory(result.category);
      setDescription(result.description);
      setAiParsed(true);
    } catch {
      // silently fail
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSubmitting(true);
    try {
      await createExpense({
        category,
        amount: Number(amount),
        description,
      });
      setAmount('');
      setDescription('');
      setAiParsed(false);
      if (fileRef.current) fileRef.current.value = '';
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DrawerPanel open={open} onClose={onClose} title="报销申请">
      {/* AI Upload area */}
      <div className="mb-4">
        <div
          className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            parsing ? 'border-primary/40 bg-primary/5' : 'border-[#c3c6d4] hover:border-primary/40 hover:bg-[#f6f7fb]'
          }`}
          onClick={() => !parsing && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
          {parsing ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 size={24} className="animate-spin text-primary" />
              <span className="text-sm text-primary font-medium">AI 识别中...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="flex items-center gap-1.5">
                <Upload size={18} className="text-[#676879]" />
                <Sparkles size={16} className="text-primary" />
              </div>
              <span className="text-sm text-[#676879]">上传发票，AI 自动填写</span>
              <span className="text-xs text-[#9a9eb0]">支持图片、PDF格式</span>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-6">
        <div>
          <label className={labelClass}>费用类目</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} ${aiParsed ? 'ring-2 ring-primary/30' : ''}`}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>金额 (元)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`${inputClass} ${aiParsed ? 'ring-2 ring-primary/30' : ''}`}
            placeholder="0.00"
            min={0}
            step={0.01}
            required
          />
        </div>

        <div>
          <label className={labelClass}>描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className={`${inputClass} resize-y ${aiParsed ? 'ring-2 ring-primary/30' : ''}`}
            placeholder="费用说明"
          />
        </div>

        {aiParsed && (
          <p className="text-xs text-primary flex items-center gap-1">
            <Sparkles size={12} />
            AI 已自动填充，请确认后提交
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || !amount}
          className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <Plus size={15} />
          {submitting ? '提交中...' : '提交报销'}
        </button>
      </form>

      {/* My expense history */}
      <div>
        <h4 className="text-xs font-semibold text-[#676879] uppercase tracking-wide mb-2">我的报销记录</h4>
        {myExpenses.length === 0 ? (
          <p className="text-xs text-[#676879]">暂无记录</p>
        ) : (
          <div className="flex flex-col gap-2">
            {myExpenses.map((exp: ExpenseReport) => {
              const st = STATUS_MAP[exp.status] ?? { label: exp.status, color: '#676879' };
              const catLabel = CATEGORIES.find((c) => c.value === exp.category)?.label ?? exp.category;
              return (
                <div key={exp.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#f6f7fb] border border-light-border">
                  <div>
                    <span className="text-sm font-medium text-[#323338]">¥{exp.amount.toLocaleString()}</span>
                    <span className="text-xs text-[#676879] ml-2">{catLabel}</span>
                    {exp.description && <span className="text-xs text-[#9a9eb0] ml-1">· {exp.description}</span>}
                  </div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: st.color }}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DrawerPanel>
  );
};
