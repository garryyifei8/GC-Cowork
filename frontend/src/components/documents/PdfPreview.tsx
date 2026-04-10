import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

// Use CDN worker to avoid bundling issues
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps {
  url: string;
}

export default function PdfPreview({ url }: PdfPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages: n }: { numPages: number }) => {
    setNumPages(n);
    setPageNumber(1);
    setLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    setError(err.message);
    setLoading(false);
  }, []);

  const goPage = (delta: number) => {
    setPageNumber((p) => Math.max(1, Math.min(numPages, p + delta)));
  };

  const zoom = (delta: number) => {
    setScale((s) => Math.max(0.5, Math.min(3, s + delta)));
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
        <p>PDF 加载失败: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-default)] bg-[var(--surface-secondary)]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => goPage(-1)}
            disabled={pageNumber <= 1}
            className="p-1 rounded hover:bg-[var(--surface-hover)] disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-[13px] text-[var(--text-secondary)] min-w-[80px] text-center">
            {pageNumber} / {numPages}
          </span>
          <button
            onClick={() => goPage(1)}
            disabled={pageNumber >= numPages}
            className="p-1 rounded hover:bg-[var(--surface-hover)] disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => zoom(-0.2)}
            disabled={scale <= 0.5}
            className="p-1 rounded hover:bg-[var(--surface-hover)] disabled:opacity-40"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-[13px] text-[var(--text-secondary)] min-w-[48px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => zoom(0.2)}
            disabled={scale >= 3}
            className="p-1 rounded hover:bg-[var(--surface-hover)] disabled:opacity-40"
          >
            <ZoomIn size={18} />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto flex justify-center p-4 bg-[var(--surface-secondary)]">
        {loading && (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={null}
        >
          <Page pageNumber={pageNumber} scale={scale} />
        </Document>
      </div>
    </div>
  );
}
