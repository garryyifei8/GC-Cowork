import React, { useState } from 'react';
import { FileText, ChevronRight, Copy, Check, Download } from 'lucide-react';
import type { InteractiveCard } from '../../types';
import { useNotificationStore } from '../../stores/notificationStore';

interface ReportCardProps {
  card: InteractiveCard;
  compact?: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({ card, compact = true }) => {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [copied, setCopied] = useState(false);

  const content = card.content || '';
  const data = card.data || {};
  const sections = data.sections as Array<{ title: string; content: string }> | undefined;

  const previewLines = compact ? 4 : 999;
  const lines = content.split('\n');
  const displayContent = compact ? lines.slice(0, previewLines).join('\n') : content;
  const isTruncated = compact && lines.length > previewLines;

  const getFullText = (): string => {
    if (sections) {
      return sections.map((s) => `## ${s.title}\n${s.content}`).join('\n\n');
    }
    return content;
  };

  const handleCopy = async () => {
    if (copied) return;
    try {
      await navigator.clipboard.writeText(getFullText());
      setCopied(true);
      addNotification({ title: '已复制', message: '报告内容已复制到剪贴板', type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addNotification({ title: '复制失败', message: '请手动复制', type: 'error' });
    }
  };

  const handleExport = () => {
    const text = `# ${card.title}\n\n${getFullText()}`;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${card.title || '报告'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addNotification({ title: '导出成功', message: '报告已导出为Markdown文件', type: 'success' });
  };

  return (
    <div className="bg-white border border-light-border border-l-4 border-l-[#0F79F3] rounded-[10px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-light-bg">
        <div className="flex items-center gap-2 min-w-0">
          <FileText size={15} className="text-[#0F79F3] shrink-0" />
          <span className="text-[13px] font-medium text-light-text truncate">{card.title}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="w-7 h-7 rounded-md flex items-center justify-center text-light-text-secondary hover:bg-[#dcdfec] hover:text-[#00CAE3] transition-colors"
            title="复制内容"
          >
            {copied ? <Check size={13} className="text-[#2ED47E]" /> : <Copy size={13} />}
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="w-7 h-7 rounded-md flex items-center justify-center text-light-text-secondary hover:bg-[#dcdfec] hover:text-[#00CAE3] transition-colors"
            title="导出文件"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* Content preview */}
      <div className="px-4 py-3">
        {sections ? (
          <div className="space-y-3">
            {(compact ? sections.slice(0, 3) : sections).map((section, idx) => (
              <div key={idx}>
                <h4 className="text-xs font-medium text-light-text mb-1 flex items-center gap-1">
                  <ChevronRight size={12} className="text-[#00CAE3]" />
                  {section.title}
                </h4>
                <p className="text-xs text-light-text-secondary leading-relaxed pl-4 line-clamp-2">
                  {section.content}
                </p>
              </div>
            ))}
            {compact && sections.length > 3 && (
              <div className="text-xs text-[#00CAE3] pl-4">
                还有 {sections.length - 3} 个章节...
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-light-text leading-relaxed whitespace-pre-wrap">
            {displayContent}
          </div>
        )}
      </div>

      {/* Truncation hint */}
      {isTruncated && (
        <div className="px-4 py-2 text-center text-xs text-[#00CAE3] bg-light-bg border-t border-light-border">
          内容较长，点击展开查看完整内容
        </div>
      )}

      {/* Key-value metadata */}
      {Object.entries(data)
        .filter(([k]) => !['sections', 'severity'].includes(k) && typeof data[k] !== 'object')
        .length > 0 && (
        <div className="border-t border-light-border px-4 py-2 flex flex-wrap gap-x-4 gap-y-1">
          {Object.entries(data)
            .filter(([k]) => !['sections', 'severity'].includes(k) && typeof data[k] !== 'object')
            .slice(0, compact ? 4 : 20)
            .map(([key, value]) => (
              <span key={key} className="text-xs text-light-text-secondary">
                <span className="font-medium">{key}:</span> {String(value)}
              </span>
            ))}
        </div>
      )}
    </div>
  );
};
