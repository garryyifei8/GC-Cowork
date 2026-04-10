import { lazy, Suspense, useMemo } from 'react';
import { Download, X, FileText, Image, Film, Music, File } from 'lucide-react';
import type { DocumentItem } from '../../types';
import { documentService } from '../../services/api';

const PdfPreview = lazy(() => import('./PdfPreview'));
const DocxPreview = lazy(() => import('./DocxPreview'));

interface DocumentPreviewProps {
  document: DocumentItem;
  onClose: () => void;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MimeIconProps {
  mime: string | null | undefined;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function MimeIcon({ mime, ...props }: MimeIconProps) {
  if (!mime) return <File {...props} />;
  if (mime.startsWith('image/')) return <Image {...props} />;
  if (mime.startsWith('video/')) return <Film {...props} />;
  if (mime.startsWith('audio/')) return <Music {...props} />;
  if (mime.includes('pdf') || mime.includes('word') || mime.includes('document'))
    return <FileText {...props} />;
  return <File {...props} />;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function DocumentPreview({ document: doc, onClose }: DocumentPreviewProps) {
  const fileUrl = useMemo(() => {
    if (!doc.file_url) return null;
    return documentService.getFileUrl(doc.file_url);
  }, [doc.file_url]);

  const downloadUrl = documentService.getDownloadUrl(doc.id);
  const mime = doc.mime_type || '';

  const renderPreview = () => {
    if (!fileUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-secondary)]">
          <File size={48} strokeWidth={1} />
          <p className="text-[15px]">此文档无关联文件</p>
          <p className="text-[13px]">{doc.content_summary}</p>
        </div>
      );
    }

    // PDF
    if (mime === 'application/pdf') {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <PdfPreview url={fileUrl} />
        </Suspense>
      );
    }

    // DOCX
    if (
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mime === 'application/msword'
    ) {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <DocxPreview url={fileUrl} />
        </Suspense>
      );
    }

    // Images
    if (mime.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full p-4 bg-[var(--surface-secondary)]">
          <img
            src={fileUrl}
            alt={doc.title}
            className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
          />
        </div>
      );
    }

    // Video
    if (mime.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center h-full p-4 bg-black">
          <video src={fileUrl} controls className="max-w-full max-h-full rounded-lg" />
        </div>
      );
    }

    // Audio
    if (mime.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
          <Music size={64} strokeWidth={1} className="text-[var(--text-secondary)]" />
          <audio src={fileUrl} controls className="w-full max-w-md" />
        </div>
      );
    }

    // Fallback — download only
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-secondary)]">
        <MimeIcon mime={mime} size={48} strokeWidth={1} />
        <p className="text-[15px]">暂不支持预览此文件格式</p>
        <p className="text-[13px]">{doc.file_name}</p>
        <a
          href={downloadUrl}
          className="mt-2 px-4 py-2 bg-[var(--primary)] text-white rounded-[8px] text-[13px] hover:opacity-90 transition-opacity flex items-center gap-1.5"
        >
          <Download size={14} />
          下载文件
        </a>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[10px] border border-[var(--border-default)] overflow-hidden">
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-2 min-w-0">
          <MimeIcon mime={mime} size={18} className="text-[var(--text-secondary)] shrink-0" />
          <span className="text-[15px] font-medium truncate">{doc.title}</span>
          {doc.file_size ? (
            <span className="text-[13px] text-[var(--text-secondary)] shrink-0">
              ({formatFileSize(doc.file_size)})
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          {fileUrl && (
            <a
              href={downloadUrl}
              className="p-1.5 rounded-[6px] hover:bg-[var(--surface-hover)] transition-colors"
              title="下载"
            >
              <Download size={16} className="text-[var(--text-secondary)]" />
            </a>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-[6px] hover:bg-[var(--surface-hover)] transition-colors"
            title="关闭预览"
          >
            <X size={16} className="text-[var(--text-secondary)]" />
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 min-h-0">{renderPreview()}</div>
    </div>
  );
}
