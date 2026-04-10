import { useEffect, useRef, useState } from 'react';

interface DocxPreviewProps {
  url: string;
}

export default function DocxPreview({ url }: DocxPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      if (!containerRef.current) return;
      setLoading(true);
      setError(null);

      try {
        const [response, docxPreview] = await Promise.all([fetch(url), import('docx-preview')]);

        if (cancelled) return;
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        if (cancelled) return;

        containerRef.current.innerHTML = '';
        await docxPreview.renderAsync(blob, containerRef.current, undefined, {
          className: 'docx-preview-content',
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          ignoreFonts: false,
          breakPages: true,
          ignoreLastRenderedPageBreak: true,
          experimental: false,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'DOCX 加载失败');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--text-secondary)]">
        <p>DOCX 加载失败: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {loading && (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={containerRef} className="flex-1 overflow-auto bg-white" style={{ minHeight: 0 }} />
    </div>
  );
}
