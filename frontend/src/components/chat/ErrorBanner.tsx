import React, { useEffect, useState } from 'react';
import { AlertTriangle, Settings, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chatService } from '../../services/api';

export const ErrorBanner: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'ok' | 'error' | 'checking'>('checking');
  const [message, setMessage] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    chatService
      .checkHealth()
      .then((res) => {
        setStatus(res.status === 'ok' ? 'ok' : 'error');
        if (res.message) setMessage(res.message);
      })
      .catch(() => {
        setStatus('error');
        setMessage('无法连接到后端服务');
      });
  }, []);

  if (status !== 'error' || dismissed) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#E74C3C]/5 border-b border-[#E74C3C]/20 text-sm shrink-0">
      <AlertTriangle size={14} className="text-[#E74C3C] shrink-0" />
      <span className="text-light-text flex-1">
        AI 服务连接异常
        {message && <span className="text-light-text-secondary ml-1">({message})</span>}
      </span>
      <button
        onClick={() => navigate('/settings')}
        className="text-xs text-primary hover:underline flex items-center gap-1"
      >
        <Settings size={12} />
        设置
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="text-light-text-secondary hover:text-light-text"
      >
        <X size={14} />
      </button>
    </div>
  );
};
