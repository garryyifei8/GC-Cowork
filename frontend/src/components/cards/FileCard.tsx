import React, { useState } from 'react';
import { FileText, FileSpreadsheet, File, FileImage, Download, ExternalLink, Loader2, Check } from 'lucide-react';
import type { InteractiveCard } from '../../types';
import { useNotificationStore } from '../../stores/notificationStore';

interface FileCardProps {
  card: InteractiveCard;
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  doc: <FileText size={20} className="text-[#00CAE3]" />,
  docx: <FileText size={20} className="text-[#00CAE3]" />,
  pdf: <FileText size={20} className="text-[#E74C3C]" />,
  xls: <FileSpreadsheet size={20} className="text-[#00C875]" />,
  xlsx: <FileSpreadsheet size={20} className="text-[#00C875]" />,
  csv: <FileSpreadsheet size={20} className="text-[#00C875]" />,
  png: <FileImage size={20} className="text-[#796DF6]" />,
  jpg: <FileImage size={20} className="text-[#796DF6]" />,
  ppt: <File size={20} className="text-[#FF7A59]" />,
  pptx: <File size={20} className="text-[#FF7A59]" />,
};

function getFileIcon(filename: string): React.ReactNode {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return FILE_ICONS[ext] || <File size={20} className="text-light-text-secondary" />;
}

export const FileCard: React.FC<FileCardProps> = ({ card }) => {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const data = card.data || {};
  const filename = data.filename || data.name || card.title;
  const fileType = data.type || data.doc_type || filename.split('.').pop()?.toUpperCase() || '文件';
  const size = data.size || data.file_size;
  const author = data.author;
  const version = data.version;
  const summary = card.content || data.summary || data.content_summary;
  const fileUrl = data.url || data.download_url || data.file_url;

  const handleDownload = async () => {
    if (downloaded || downloading) return;
    setDownloading(true);

    try {
      if (fileUrl) {
        // Real file URL — trigger browser download
        const a = document.createElement('a');
        a.href = String(fileUrl);
        a.download = String(filename);
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        // No URL — generate a text blob from card content as fallback
        const content = summary || card.title || '';
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = String(filename).replace(/\.[^.]+$/, '') + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      setDownloaded(true);
      addNotification({ title: '下载成功', message: `${filename} 已开始下载`, type: 'success' });
    } catch (err) {
      addNotification({
        title: '下载失败',
        message: err instanceof Error ? err.message : '请稍后重试',
        type: 'error',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleOpen = () => {
    if (fileUrl) {
      window.open(String(fileUrl), '_blank', 'noopener,noreferrer');
    } else {
      addNotification({ title: '提示', message: '文件预览暂不可用，请先下载', type: 'info' });
    }
  };

  return (
    <div className="bg-white border border-light-border border-l-4 border-l-[#796DF6] rounded-[10px] overflow-hidden">
      <div className="flex items-start gap-3 px-4 py-3">
        {/* File icon */}
        <div className="w-10 h-10 rounded-lg bg-light-bg flex items-center justify-center shrink-0 mt-0.5">
          {getFileIcon(filename)}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-light-text truncate">{filename}</div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs px-1.5 py-0.5 rounded bg-[#edf1fc] text-light-text-secondary font-medium">
              {fileType}
            </span>
            {size && (
              <span className="text-xs text-light-text-secondary">{size}</span>
            )}
            {version && (
              <span className="text-xs text-light-text-secondary">v{version}</span>
            )}
            {author && (
              <span className="text-xs text-light-text-secondary">{author}</span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || downloaded}
            className="w-7 h-7 rounded-md flex items-center justify-center text-light-text-secondary hover:bg-[#dcdfec] hover:text-[#00CAE3] transition-colors disabled:opacity-50"
            title="下载"
          >
            {downloading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : downloaded ? (
              <Check size={14} className="text-[#00C875]" />
            ) : (
              <Download size={14} />
            )}
          </button>
          <button
            type="button"
            onClick={handleOpen}
            className="w-7 h-7 rounded-md flex items-center justify-center text-light-text-secondary hover:bg-[#dcdfec] hover:text-[#00CAE3] transition-colors"
            title="打开"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* Summary preview */}
      {summary && (
        <div className="px-4 py-2.5 text-xs text-light-text-secondary border-t border-light-border bg-light-bg line-clamp-2">
          {summary}
        </div>
      )}
    </div>
  );
};
