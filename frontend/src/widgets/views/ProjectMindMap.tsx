import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Markmap } from 'markmap-view';
import type { IPureNode } from 'markmap-common';
import { ZoomIn, ZoomOut, Maximize2, ChevronsDownUp, ChevronsUpDown } from 'lucide-react';
import { projectService } from '../../services/api';
import {
  STAGE_LABELS,
  STAGE_COLORS,
  TASK_STATUS_LABELS,
  TASK_STATUS_COLORS,
  RISK_LEVEL_LABELS,
  getPipelineCategory,
  getPipelineConfig,
  PROCUREMENT_STATUS_LABELS,
  PROCESS_RECORD_TYPE_LABELS,
} from '../../utils/constants';
import type { ProjectDetail, DocumentItem, ProcurementPackage, ProcessRecord } from '../../types';

// ---------------------------------------------------------------------------
// Branch colors
// ---------------------------------------------------------------------------

const BRANCH_COLORS = ['#0086C0', '#6BBF59', '#9B51E0', '#FDAB3D', '#579BFC', '#FF7A59', '#37B4E3'];

function colorByDepth(node: IPureNode & { depth?: number }): string {
  const d = node.depth ?? 0;
  return BRANCH_COLORS[Math.min(d, BRANCH_COLORS.length - 1)];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stageIcon(stage: string, currentStage: string, allStages: readonly string[]): string {
  const currentIdx = allStages.indexOf(currentStage);
  const stageIdx = allStages.indexOf(stage);
  if (stageIdx < 0) return '\u25CB';
  if (stageIdx < currentIdx) return '\u2705';
  if (stageIdx === currentIdx) return '\uD83D\uDD35';
  return '\u25CB';
}

function riskDot(severity: string): string {
  const colors: Record<string, string> = {
    critical: '\uD83D\uDD34',
    high: '\uD83D\uDD34',
    medium: '\uD83D\uDFE1',
    low: '\uD83D\uDFE2',
  };
  return colors[severity] ?? '\u26AA';
}

function milestoneIcon(status: string): string {
  return status === 'completed' || status === 'done' ? '\u2705' : '\u25CB';
}

function makeNode(content: string, children: IPureNode[] = [], fold?: number): IPureNode {
  return { content, children, ...(fold != null ? { payload: { fold } } : {}) };
}

// ---------------------------------------------------------------------------
// Tree builder
// ---------------------------------------------------------------------------

function buildMindMapTree(
  project: ProjectDetail,
  stages: readonly string[],
  documents: DocumentItem[],
  procurements: ProcurementPackage[],
  processes: ProcessRecord[]
): IPureNode {
  const category = getPipelineCategory(project.project_type);
  const pipelineConfig = getPipelineConfig(project.project_type);

  const statusColor =
    project.status === 'risk' ? '#E2445C' : project.status === 'active' ? '#00C875' : '#676879';
  const rootContent = `<strong style="font-size:16px">${project.name}</strong> <span style="background:${statusColor};color:#fff;padding:1px 8px;border-radius:10px;font-size:11px;margin-left:6px">${project.progress_pct}%</span>`;

  const children: IPureNode[] = [];

  // Stage pipeline
  const stageChildren = stages.map((s) => {
    const label = STAGE_LABELS[s] || s;
    const icon = stageIcon(s, project.stage, stages);
    const color = STAGE_COLORS[s] || '#676879';
    const isCurrent = s === project.stage;
    const style = isCurrent ? `font-weight:bold;color:${color}` : '';
    const suffix = isCurrent
      ? ' <span style="font-size:10px;color:#fff;background:#0086C0;padding:0 6px;border-radius:8px">\u5F53\u524D</span>'
      : '';
    return makeNode(`<span style="${style}">${icon} ${label}${suffix}</span>`);
  });
  children.push(makeNode('<strong>\uD83D\uDCCB \u9636\u6BB5\u7BA1\u7EBF</strong>', stageChildren));

  // Tasks
  const tasks = project.tasks || [];
  if (tasks.length > 0) {
    const grouped: Record<string, typeof tasks> = {};
    for (const t of tasks) {
      const s = t.status || 'todo';
      (grouped[s] ??= []).push(t);
    }
    const statusOrder = ['in_progress', 'todo', 'review', 'done', 'blocked'];
    const taskStatusChildren: IPureNode[] = [];
    for (const status of statusOrder) {
      const list = grouped[status];
      if (!list?.length) continue;
      const label = TASK_STATUS_LABELS[status] || status;
      const color = TASK_STATUS_COLORS[status] || '#676879';
      const items = list.map((t) =>
        makeNode(`<span style="color:${color}">\u25CF</span> ${t.name}`)
      );
      taskStatusChildren.push(
        makeNode(
          `<span style="color:${color}"><strong>${label}</strong></span> <span style="font-size:11px;color:#888">(${list.length})</span>`,
          items,
          items.length > 5 ? 1 : 0
        )
      );
    }
    children.push(
      makeNode(
        `<strong>\uD83D\uDCCC \u4EFB\u52A1\u6982\u51B5</strong> <span style="font-size:11px;color:#888">(${tasks.length}\u9879)</span>`,
        taskStatusChildren
      )
    );
  }

  // Risks
  const risks = project.risks || [];
  if (risks.length > 0) {
    const riskChildren = risks.map((r) => {
      const label = RISK_LEVEL_LABELS[r.severity] || r.severity;
      return makeNode(
        `${riskDot(r.severity)} <span style="font-size:12px">${label}: ${r.title}</span>`
      );
    });
    children.push(
      makeNode(
        `<strong>\u26A0\uFE0F \u98CE\u9669\u9879</strong> <span style="font-size:11px;color:#888">(${risks.length}\u9879)</span>`,
        riskChildren
      )
    );
  }

  // Milestones
  const milestones = project.milestones || [];
  if (milestones.length > 0) {
    const msChildren = milestones.map((m) =>
      makeNode(
        `${milestoneIcon(m.status)} ${m.name} <span style="font-size:11px;color:#888">\u2014 ${m.date}</span>`
      )
    );
    children.push(makeNode('<strong>\uD83C\uDFC1 \u91CC\u7A0B\u7891</strong>', msChildren));
  }

  // Deliverables
  const deliverablesByStage = pipelineConfig.deliverables;
  if (deliverablesByStage && Object.keys(deliverablesByStage).length > 0) {
    const delivChildren: IPureNode[] = [];
    for (const stage of stages) {
      const expected = deliverablesByStage[stage];
      if (!expected?.length) continue;
      const stageLabel = STAGE_LABELS[stage] || stage;
      const items = expected.map((name) => {
        const found = documents.find((d) => d.title === name || d.title.includes(name));
        const icon = found ? '\u2705' : '\u25CB';
        return makeNode(`${icon} ${name}`);
      });
      delivChildren.push(makeNode(`<strong>${stageLabel}</strong>`, items, 1));
    }
    if (delivChildren.length > 0) {
      children.push(makeNode('<strong>\uD83D\uDCC4 \u4EA4\u4ED8\u7269</strong>', delivChildren, 1));
    }
  }

  // Team
  const members = project.team_members || [];
  if (members.length > 0) {
    const teamChildren = members.map((m) => makeNode(`\uD83D\uDC64 ${m}`));
    children.push(
      makeNode(
        `<strong>\uD83D\uDC65 \u56E2\u961F</strong> <span style="font-size:11px;color:#888">(${members.length}\u4EBA)</span>`,
        teamChildren,
        members.length > 6 ? 1 : 0
      )
    );
  }

  // Procurement (EPC)
  if (category === 'epc' && procurements.length > 0) {
    const procChildren = procurements.map((p) => {
      const statusLabel = PROCUREMENT_STATUS_LABELS[p.status] || p.status;
      return makeNode(
        `\uD83D\uDCE6 ${p.name} <span style="font-size:11px;color:#888">\u2014 ${statusLabel}</span>`
      );
    });
    children.push(
      makeNode(
        `<strong>\uD83D\uDCE6 \u91C7\u8D2D\u7BA1\u7406</strong> <span style="font-size:11px;color:#888">(${procurements.length}\u9879)</span>`,
        procChildren,
        1
      )
    );
  }

  // Process records (EPC)
  if (category === 'epc' && processes.length > 0) {
    const grouped: Record<string, ProcessRecord[]> = {};
    for (const p of processes) {
      (grouped[p.record_type] ??= []).push(p);
    }
    const procRecChildren = Object.entries(grouped).map(([type, records]) => {
      const label = PROCESS_RECORD_TYPE_LABELS[type] || type;
      return makeNode(`${label} <span style="font-size:11px;color:#888">x${records.length}</span>`);
    });
    children.push(
      makeNode(
        `<strong>\uD83D\uDCDD \u8FC7\u7A0B\u8BB0\u5F55</strong> <span style="font-size:11px;color:#888">(${processes.length}\u6761)</span>`,
        procRecChildren,
        1
      )
    );
  }

  return makeNode(rootContent, children);
}

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

const ToolbarBtn: React.FC<{ title: string; onClick: () => void; children: React.ReactNode }> = ({
  title,
  onClick,
  children,
}) => (
  <button
    title={title}
    onClick={onClick}
    className="p-1.5 rounded-md hover:bg-[#F4F6FC] dark:hover:bg-dark-surface-hover text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text dark:hover:text-dark-text transition-colors"
  >
    {children}
  </button>
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProjectMindMapProps {
  data?: {
    project?: ProjectDetail;
    pipelineStages?: readonly string[];
    documents?: DocumentItem[];
  };
  project?: ProjectDetail;
  pipelineStages?: readonly string[];
  documents?: DocumentItem[];
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ProjectMindMap: React.FC<ProjectMindMapProps> = (props) => {
  const project = props.data?.project ?? props.project;
  const pipelineStages = props.data?.pipelineStages ?? props.pipelineStages ?? [];
  const documents = props.data?.documents ?? props.documents ?? [];

  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap | null>(null);

  const [procurements, setProcurements] = useState<ProcurementPackage[]>([]);
  const [processes, setProcesses] = useState<ProcessRecord[]>([]);
  const category = project ? getPipelineCategory(project.project_type) : null;

  // Load EPC-specific data
  useEffect(() => {
    if (!project || category !== 'epc') return;
    projectService
      .getProcurements(project.id)
      .then(setProcurements)
      .catch(() => {});
    projectService
      .getProcessRecords(project.id)
      .then(setProcesses)
      .catch(() => {});
  }, [project?.id, category]);

  // Create markmap instance
  useEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.innerHTML = '';
    mmRef.current = new Markmap(svgRef.current, {
      autoFit: true,
      duration: 300,
      maxWidth: 280,
      paddingX: 16,
      initialExpandLevel: 2,
      color: colorByDepth,
      zoom: true,
      pan: true,
    });
    return () => {
      if (svgRef.current) svgRef.current.innerHTML = '';
      mmRef.current = null;
    };
  }, []);

  // Update data
  useEffect(() => {
    if (!mmRef.current || !project) return;
    const tree = buildMindMapTree(project, pipelineStages, documents, procurements, processes);
    mmRef.current.setData(tree);
    setTimeout(() => mmRef.current?.fit(), 150);
  }, [project, pipelineStages, documents, procurements, processes]);

  // Toolbar handlers
  const handleZoomIn = useCallback(() => mmRef.current?.rescale(1.25), []);
  const handleZoomOut = useCallback(() => mmRef.current?.rescale(0.8), []);
  const handleFit = useCallback(() => {
    mmRef.current?.fit();
  }, []);

  const handleExpandAll = useCallback(() => {
    if (!mmRef.current?.state.data) return;
    const walk = (node: IPureNode) => {
      if (node.payload) node.payload.fold = 0;
      node.children?.forEach(walk);
    };
    walk(mmRef.current.state.data);
    mmRef.current.renderData();
    setTimeout(() => mmRef.current?.fit(), 200);
  }, []);

  const handleCollapseAll = useCallback(() => {
    if (!mmRef.current?.state.data) return;
    const walk = (node: IPureNode, depth: number) => {
      if (depth >= 1) {
        if (!node.payload) node.payload = {};
        node.payload.fold = 1;
      }
      node.children?.forEach((c) => walk(c, depth + 1));
    };
    walk(mmRef.current.state.data, 0);
    mmRef.current.renderData();
    setTimeout(() => mmRef.current?.fit(), 200);
  }, []);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-64 text-[#919AA3] dark:text-dark-text-secondary text-sm">
        请选择一个项目查看思维导图
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#E8ECF4] dark:border-dark-border bg-[#F4F6FC] dark:bg-dark-surface">
        <span className="text-[0.9375rem] font-semibold mr-auto text-light-text dark:text-dark-text">
          思维导图
        </span>
        <ToolbarBtn title="放大" onClick={handleZoomIn}>
          <ZoomIn size={16} />
        </ToolbarBtn>
        <ToolbarBtn title="缩小" onClick={handleZoomOut}>
          <ZoomOut size={16} />
        </ToolbarBtn>
        <ToolbarBtn title="适应视图" onClick={handleFit}>
          <Maximize2 size={16} />
        </ToolbarBtn>
        <div className="w-px h-5 bg-[#E8ECF4] dark:bg-dark-border mx-1" />
        <ToolbarBtn title="展开全部" onClick={handleExpandAll}>
          <ChevronsUpDown size={16} />
        </ToolbarBtn>
        <ToolbarBtn title="折叠全部" onClick={handleCollapseAll}>
          <ChevronsDownUp size={16} />
        </ToolbarBtn>
      </div>

      {/* SVG container */}
      <div className="flex-1 min-h-[500px] relative">
        <svg ref={svgRef} className="w-full h-full" style={{ minHeight: 500 }} />
      </div>
    </div>
  );
};

export default ProjectMindMap;
