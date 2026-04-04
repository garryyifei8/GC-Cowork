import React from 'react'
import { FileText, ThumbsUp, BookMarked } from 'lucide-react'
import type { KnowledgeDoc } from '../../types'

export interface DocumentItemProps {
  doc: KnowledgeDoc
  onClick?: (doc: KnowledgeDoc) => void
}

const DOC_TYPE_CONFIG: Record<string, { borderClass: string; iconBg: string }> = {
  pdf: { borderClass: 'border-l-red-500', iconBg: 'bg-red-500' },
  doc: { borderClass: 'border-l-blue-500', iconBg: 'bg-blue-500' },
  code: { borderClass: 'border-l-emerald-500', iconBg: 'bg-emerald-500' },
}

const DocumentItem: React.FC<DocumentItemProps> = ({ doc, onClick }) => {
  const config = DOC_TYPE_CONFIG[doc.type] ?? DOC_TYPE_CONFIG.doc

  return (
    <div
      className={[
        'bg-white border border-[#E8E8E8] rounded-lg p-5',
        'transition-all duration-200 hover:shadow-md cursor-pointer border-l-4',
        config.borderClass,
      ].join(' ')}
      onClick={() => onClick?.(doc)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' && onClick) onClick(doc) }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`flex-shrink-0 w-9 h-9 rounded-lg ${config.iconBg} flex items-center justify-center`}>
          <FileText size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold mb-1 line-clamp-2 leading-snug text-[#333]">
            {doc.title}
          </h4>
          <div className="flex items-center gap-2 text-xs text-[#6C7688]">
            <span className="truncate">{doc.author}</span>
            <span className="flex-shrink-0">·</span>
            <span className="flex-shrink-0">{doc.date}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5 text-xs text-[#6C7688]">
          <BookMarked size={13} />
          <span>知识库</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[#6C7688]">
          <ThumbsUp size={13} />
          <span>{doc.likes}</span>
        </div>
      </div>
    </div>
  )
}

export default DocumentItem
