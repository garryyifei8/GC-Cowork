import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Check,
  Circle,
} from 'lucide-react';
import { STAGE_LABELS, STAGE_COLORS, STAGE_DELIVERABLES } from '../../utils/constants';
import type { DocumentItem, ProjectTask } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Fuzzy: document title contains deliverable name (case-insensitive) */
function documentMatchesDeliverable(doc: DocumentItem, deliverable: string): boolean {
  return doc.title.toLowerCase().includes(deliverable.toLowerCase());
}

function getDocStatusClasses(status: string): string {
  switch (status) {
    case 'draft':   return 'bg-warning/10 text-amber-700 dark:text-amber-400';
    case 'review':  return 'bg-info/10 text-info';
    case 'final':   return 'bg-success/10 text-success';
    default:        return 'bg-warning/10 text-amber-700 dark:text-amber-400';
  }
}

function getDocStatusLabel(status: string): string {
  switch (status) {
    case 'draft':  return '草稿';
    case 'review': return '审阅中';
    case 'final':  return '终稿';
    default:       return status;
  }
}

// ---------------------------------------------------------------------------
// Single stage accordion item
// ---------------------------------------------------------------------------

interface StageAccordionItemProps {
  stage: string;
  documents: DocumentItem[];
  tasks: ProjectTask[];
  isExpanded: boolean;
  onToggle: () => void;
}

const StageAccordionItem: React.FC<StageAccordionItemProps> = ({
  stage,
  documents,
  tasks,
  isExpanded,
  onToggle,
}) => {
  const label = STAGE_LABELS[stage] ?? stage;
  const color = STAGE_COLORS[stage] ?? '#676879';
  const expectedDeliverables: string[] = STAGE_DELIVERABLES[stage] ?? [];

  // Count how many expected deliverables are matched by at least one document
  const matchedCount = expectedDeliverables.filter((d) =>
    documents.some((doc) => documentMatchesDeliverable(doc, d))
  ).length;

  const badgeClasses =
    matchedCount === expectedDeliverables.length && expectedDeliverables.length > 0
      ? 'bg-success/10 text-green-700 dark:text-green-400'
      : matchedCount > 0
      ? 'bg-warning/10 text-amber-700 dark:text-amber-400'
      : 'bg-slate-100 dark:bg-slate-800 text-light-text-secondary dark:text-dark-text-secondary border border-light-border dark:border-dark-border';

  return (
    <div className="border border-light-border dark:border-dark-border rounded-xl overflow-hidden">
      {/* Header */}
      <button
        className="flex items-center justify-between w-full px-5 py-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left gap-3"
        style={{ borderLeft: `4px solid ${color}` }}
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`stage-body-${stage}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="transition-transform duration-200 text-light-text-secondary dark:text-dark-text-secondary shrink-0">
            {isExpanded
              ? <ChevronDown size={16} />
              : <ChevronRight size={16} />
            }
          </span>
          <span className="text-[15px] font-semibold" style={{ color }}>
            {label}
          </span>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 ${badgeClasses}`}>
          {matchedCount}/{expectedDeliverables.length} 交付物完成
        </span>
      </button>

      {/* Body */}
      {isExpanded && (
        <div
          className="px-5 pb-5 pt-4 flex flex-col gap-5 border-t border-light-border dark:border-dark-border"
          id={`stage-body-${stage}`}
          role="region"
          aria-label={`${label} 交付物详情`}
        >
          {/* Expected deliverables checklist */}
          {expectedDeliverables.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wide mb-2.5">
                预期交付物
              </h4>
              <ul className="flex flex-col gap-1.5" role="list">
                {expectedDeliverables.map((item) => {
                  const matched = documents.some((doc) =>
                    documentMatchesDeliverable(doc, item)
                  );
                  return (
                    <li
                      key={item}
                      className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {matched ? (
                        <Check
                          size={14}
                          className="text-success shrink-0"
                          aria-label="已完成"
                        />
                      ) : (
                        <Circle
                          size={14}
                          className="text-slate-300 dark:text-slate-600 shrink-0"
                          aria-label="缺失"
                        />
                      )}
                      <span className={`text-sm ${matched ? 'text-inherit font-medium' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>
                        {item}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Actual documents */}
          {documents.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wide mb-2.5">
                实际文档
              </h4>
              <div className="flex flex-col gap-2" role="list">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-light-border dark:border-dark-border hover:shadow-sm hover:border-slate-300 dark:hover:border-slate-500 transition-all"
                    role="listitem"
                  >
                    <FileText
                      size={15}
                      className="text-light-text-secondary dark:text-dark-text-secondary shrink-0"
                      aria-hidden="true"
                    />
                    <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                      <span className="text-sm font-medium truncate">{doc.title}</span>
                      {doc.author && (
                        <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{doc.author}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {doc.version && (
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-light-text-secondary dark:text-dark-text-secondary whitespace-nowrap">
                          v{doc.version}
                        </span>
                      )}
                      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap ${getDocStatusClasses(doc.status)}`}>
                        {getDocStatusLabel(doc.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Placeholder when no documents */}
          {documents.length === 0 && (
            <div className="flex items-center gap-2 py-3 px-2 text-light-text-secondary dark:text-dark-text-secondary">
              <FileText
                size={20}
                className="text-slate-300 dark:text-slate-600 shrink-0"
                aria-hidden="true"
              />
              <span className="text-sm italic">暂无文档上传</span>
            </div>
          )}

          {/* Related tasks */}
          {tasks.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-light-text-secondary dark:text-dark-text-secondary uppercase tracking-wide mb-2.5">
                关联任务
              </h4>
              <ul className="flex flex-col gap-1" role="list">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    role="listitem"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        background:
                          task.status === 'done'
                            ? '#00C875'
                            : task.status === 'in_progress'
                            ? 'var(--color-primary)'
                            : task.status === 'blocked'
                            ? 'var(--color-danger)'
                            : 'var(--color-border)',
                      }}
                      aria-hidden="true"
                    />
                    <span className="flex-1 text-[13px] truncate">{task.name}</span>
                    {task.assignee && (
                      <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary whitespace-nowrap shrink-0">
                        {task.assignee}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main StageDeliverablesSection
// ---------------------------------------------------------------------------

interface StageDeliverablesSectionProps {
  stages: readonly string[];
  documents: DocumentItem[];
  tasks: ProjectTask[];
  currentStage: string;
}

export const StageDeliverablesSection: React.FC<StageDeliverablesSectionProps> = ({
  stages,
  documents,
  tasks,
  currentStage,
}) => {
  // Initially expand the current stage
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    () => new Set([currentStage])
  );

  const toggleStage = (stage: string) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) {
        next.delete(stage);
      } else {
        next.add(stage);
      }
      return next;
    });
  };

  return (
    <div
      className="space-y-3"
      role="region"
      aria-label="阶段交付物"
    >
      {stages.map((stage) => {
        // Filter documents that belong to this stage by doc_type matching stage label
        // Also show documents with no specific stage association on the current stage
        const stageLabel = STAGE_LABELS[stage] ?? stage;
        const stageDocs = documents.filter((doc) => {
          const typeMatch = doc.doc_type?.toLowerCase().includes(stage.toLowerCase())
            || doc.doc_type?.toLowerCase().includes(stageLabel.toLowerCase());
          const titleMatch = STAGE_DELIVERABLES[stage]?.some((d) =>
            doc.title.toLowerCase().includes(d.toLowerCase())
          );
          return typeMatch || titleMatch;
        });

        return (
          <StageAccordionItem
            key={stage}
            stage={stage}
            documents={stageDocs}
            tasks={tasks}
            isExpanded={expandedStages.has(stage)}
            onToggle={() => toggleStage(stage)}
          />
        );
      })}
    </div>
  );
};

export default StageDeliverablesSection;
