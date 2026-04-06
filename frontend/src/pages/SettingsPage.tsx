import { useEffect, useState } from 'react';
import { Bot, Check, Plus, Trash2, Radio, Cloud, Monitor, Loader2, X } from 'lucide-react';

interface LLMProvider {
  id: string;
  name: string;
  model: string;
  api_base: string;
  description: string;
  is_local: boolean;
  is_active: boolean;
}

export const SettingsPage = () => {
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProvider, setNewProvider] = useState({
    id: '',
    name: '',
    model: '',
    api_base: 'http://127.0.0.1:1234/v1',
    api_key: 'lm-studio',
    description: '',
    is_local: true,
  });

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/settings/llm/providers');
      if (res.ok) setProviders(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
  }, []);

  const handleSwitch = async (providerId: string) => {
    setSwitching(providerId);
    setMessage(null);
    try {
      const res = await fetch('/api/settings/llm/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider_id: providerId }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: data.message, type: 'success' });
        await fetchProviders();
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (e) {
      setMessage({ text: '切换失败', type: 'error' });
    } finally {
      setSwitching(null);
    }
  };

  const handleAdd = async () => {
    if (!newProvider.id || !newProvider.name || !newProvider.model) return;
    try {
      const res = await fetch('/api/settings/llm/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProvider),
      });
      if (res.ok) {
        await fetchProviders();
        setShowAddForm(false);
        setNewProvider({
          id: '',
          name: '',
          model: '',
          api_base: 'http://127.0.0.1:1234/v1',
          api_key: 'lm-studio',
          description: '',
          is_local: true,
        });
        setMessage({ text: '已添加新模型', type: 'success' });
      }
    } catch {
      setMessage({ text: '添加失败', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/settings/llm/providers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchProviders();
        setMessage({ text: '已删除', type: 'success' });
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="p-6 max-w-4xl animate-fade-in">
      <h1 className="text-[18px] font-bold text-[#0A1B39] mb-1">设置</h1>
      <p className="text-[13px] text-[#6C7688] mb-6">管理 AI 助手模型和系统配置</p>

      {/* Toast message */}
      {message && (
        <div
          className={`mb-4 px-4 py-2.5 rounded-[5px] text-[13px] font-medium flex items-center justify-between ${
            message.type === 'success'
              ? 'bg-[#F4FBF7] text-[#27AE60] border border-[#27AE60]/20'
              : 'bg-[#FEF4F4] text-[#EF1E1E] border border-[#EF1E1E]/20'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="p-0.5">
            <X size={14} />
          </button>
        </div>
      )}

      {/* LLM Provider Section */}
      <div className="bg-white border border-[#E7E8EB] rounded-[5px] shadow-[0_0_35px_0_rgba(104,134,177,0.1)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E7E8EB]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E6FAF0] flex items-center justify-center">
              <Bot size={18} className="text-[#00C875]" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-[#0A1B39]">AI 模型配置</h2>
              <p className="text-[12px] text-[#6C7688]">选择 AI 助手使用的大语言模型</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[5px] bg-[#00C875] text-white text-[13px] font-medium hover:bg-[#00a35e] transition-colors"
          >
            <Plus size={14} /> 添加模型
          </button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="px-5 py-4 border-b border-[#E7E8EB] bg-[#F5F6F8]">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[12px] font-medium text-[#6C7688] mb-1 block">
                  ID (唯一标识)
                </label>
                <input
                  value={newProvider.id}
                  onChange={(e) => setNewProvider((p) => ({ ...p, id: e.target.value }))}
                  placeholder="my-model"
                  className="w-full px-3 py-2 text-[13px] border border-[#E7E8EB] rounded-[5px] bg-white focus:border-[#00C875] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6C7688] mb-1 block">
                  显示名称
                </label>
                <input
                  value={newProvider.name}
                  onChange={(e) => setNewProvider((p) => ({ ...p, name: e.target.value }))}
                  placeholder="My Model (本地)"
                  className="w-full px-3 py-2 text-[13px] border border-[#E7E8EB] rounded-[5px] bg-white focus:border-[#00C875] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6C7688] mb-1 block">
                  模型名称
                </label>
                <input
                  value={newProvider.model}
                  onChange={(e) => setNewProvider((p) => ({ ...p, model: e.target.value }))}
                  placeholder="qwen/qwen3-8b"
                  className="w-full px-3 py-2 text-[13px] border border-[#E7E8EB] rounded-[5px] bg-white focus:border-[#00C875] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6C7688] mb-1 block">
                  API 地址
                </label>
                <input
                  value={newProvider.api_base}
                  onChange={(e) => setNewProvider((p) => ({ ...p, api_base: e.target.value }))}
                  className="w-full px-3 py-2 text-[13px] border border-[#E7E8EB] rounded-[5px] bg-white focus:border-[#00C875] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6C7688] mb-1 block">API Key</label>
                <input
                  value={newProvider.api_key}
                  onChange={(e) => setNewProvider((p) => ({ ...p, api_key: e.target.value }))}
                  className="w-full px-3 py-2 text-[13px] border border-[#E7E8EB] rounded-[5px] bg-white focus:border-[#00C875] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#6C7688] mb-1 block">说明</label>
                <input
                  value={newProvider.description}
                  onChange={(e) => setNewProvider((p) => ({ ...p, description: e.target.value }))}
                  placeholder="模型描述"
                  className="w-full px-3 py-2 text-[13px] border border-[#E7E8EB] rounded-[5px] bg-white focus:border-[#00C875] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[13px] text-[#6C7688] cursor-pointer">
                <input
                  type="checkbox"
                  checked={newProvider.is_local}
                  onChange={(e) => setNewProvider((p) => ({ ...p, is_local: e.target.checked }))}
                  className="rounded border-[#E7E8EB]"
                />{' '}
                本地模型
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-[13px] text-[#6C7688] border border-[#E7E8EB] rounded-[5px] hover:bg-white"
                >
                  取消
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!newProvider.id || !newProvider.name || !newProvider.model}
                  className="px-3 py-1.5 text-[13px] text-white bg-[#00C875] rounded-[5px] hover:bg-[#00a35e] disabled:opacity-50"
                >
                  <Check size={13} className="inline mr-1" />
                  添加
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Provider list */}
        <div className="divide-y divide-[#F0F0F0]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={20} className="animate-spin text-[#00C875]" />
            </div>
          ) : (
            providers.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors ${p.is_active ? 'bg-[#F4FBF7]' : 'hover:bg-[#F8F9FC]'}`}
              >
                {/* Radio indicator */}
                <button
                  onClick={() => handleSwitch(p.id)}
                  disabled={p.is_active || switching !== null}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    p.is_active
                      ? 'border-[#00C875] bg-[#00C875]'
                      : 'border-[#E7E8EB] hover:border-[#00C875]'
                  }`}
                >
                  {p.is_active && <Check size={12} className="text-white" />}
                  {switching === p.id && (
                    <Loader2 size={12} className="animate-spin text-[#00C875]" />
                  )}
                </button>

                {/* Icon */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    p.is_local ? 'bg-[#F4F9FE]' : 'bg-[#FEFBF5]'
                  }`}
                >
                  {p.is_local ? (
                    <Monitor size={18} className="text-[#2F80ED]" />
                  ) : (
                    <Cloud size={18} className="text-[#E2B93B]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-[#0A1B39]">{p.name}</span>
                    {p.is_active && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-[5px] bg-[#E6FAF0] text-[#00C875] border border-[#00C875]/20">
                        当前使用
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded-[5px] ${
                        p.is_local
                          ? 'bg-[#F4F9FE] text-[#2F80ED] border border-[#2F80ED]/20'
                          : 'bg-[#FEFBF5] text-[#E2B93B] border border-[#E2B93B]/20'
                      }`}
                    >
                      {p.is_local ? '本地' : '云端'}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#6C7688] mt-0.5">{p.description}</div>
                  <div className="text-[11px] text-[#B6BBC4] mt-0.5 font-mono">
                    {p.model} · {p.api_base}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!p.is_active && (
                    <>
                      <button
                        onClick={() => handleSwitch(p.id)}
                        disabled={switching !== null}
                        className="px-3 py-1.5 text-[12px] font-medium text-[#00C875] border border-[#00C875]/30 rounded-[5px] hover:bg-[#E6FAF0] transition-colors disabled:opacity-50"
                      >
                        切换
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-[#B6BBC4] hover:text-[#EF1E1E] rounded hover:bg-[#FEF4F4] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="mt-6 bg-white border border-[#E7E8EB] rounded-[5px] shadow-[0_0_35px_0_rgba(104,134,177,0.1)] p-5">
        <h3 className="text-[14px] font-bold text-[#0A1B39] mb-3">使用说明</h3>
        <div className="space-y-2 text-[13px] text-[#6C7688]">
          <p>
            · <strong>本地模型</strong>: 通过 LM Studio 运行，数据不离开本地，适合敏感项目
          </p>
          <p>
            · <strong>云端模型</strong>: 调用 DeepSeek/OpenAI 等 API，响应更快，支持更多功能
          </p>
          <p>· 切换模型后立即生效，无需重启服务</p>
          <p>· 添加自定义模型时，确保 API 地址可访问且模型已加载</p>
        </div>
      </div>
    </div>
  );
};
