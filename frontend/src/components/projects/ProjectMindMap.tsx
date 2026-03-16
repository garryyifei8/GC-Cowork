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
// Props
// ---------------------------------------------------------------------------

interface ProjectMindMapProps {
  project: ProjectDetail;
  pipelineStages: readonly string[];
  documents: DocumentItem[];
}

// ---------------------------------------------------------------------------
// Branch color palette (by depth)
// ---------------------------------------------------------------------------

const BRANCH_COLORS = [
  '#0086C0', // root
  '#6BBF59', // depth 1: categories
  '#9B51E0', // depth 2: sub-groups
  '#FDAB3D', // depth 3: items
  '#579BFC', // depth 4+
  '#FF7A59',
  '#37B4E3',
];

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
  if (stageIdx < 0) return '○';
  if (stageIdx < currentIdx) return '✅';
  if (stageIdx === currentIdx) return '🔵';
  return '○';
}

function riskDot(severity: string): string {
  const colors: Record<string, string> = { critical: '🔴', high: '🔴', medium: '🟡', low: '🟢' };
  return colors[severity] ?? '⚪';
}

function milestoneIcon(status: string): string {
  return status === 'completed' || status === 'done' ? '✅' : '○';
}

function makeNode(content: string, children: IPureNode[] = [], fold?: number): IPureNode {
  return { content, children, ...(fold != null ? { payload: { fold } } : {}) };
}

// ---------------------------------------------------------------------------
// Tree Builder
// ---------------------------------------------------------------------------

function buildMindMapTree(
  project: ProjectDetail,
  stages: readonly string[],
  documents: DocumentItem[],
  procurements: ProcurementPackage[],
  processes: ProcessRecord[],
): IPureNode {
  const category = getPipelineCategory(project.project_type);
  const pipelineConfig = getPipelineConfig(project.project_type);

  // ── Root ──
  const statusColor = project.status === 'risk' ? '#E2445C' : project.status === 'active' ? '#00C875' : '#676879';
  const rootContent = `<strong style="font-size:16px">${project.name}</strong> <span style="background:${statusColor};color:#fff;padding:1px 8px;border-radius:10px;font-size:11px;margin-left:6px">${project.progress_pct}%</span>`;

  const children: IPureNode[] = [];

  // ── 1. 阶段管线 ──
  const stageChildren = stages.map((s) => {
    const label = STAGE_LABELS[s] || s;
    const icon = stageIcon(s, project.stage, stages);
    const color = STAGE_COLORS[s] || '#676879';
    const isCurrent = s === project.stage;
    const style = isCurrent ? `font-weight:bold;color:${color}` : '';
    const suffix = isCurrent ? ' <span style="font-size:10px;color:#fff;background:#0086C0;padding:0 6px;border-radius:8px">当前</span>' : '';
    return makeNode(`<span style="${style}">${icon} ${label}${suffix}</span>`);
  });
  children.push(makeNode('<strong>📋 阶段管线</strong>', stageChildren));

  // ── 2. 任务概况 ──
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
      const items = list.map((t) => makeNode(`<span style="color:${color}">●</span> ${t.name}`));
      taskStatusChildren.push(makeNode(
        `<span style="color:${color}"><strong>${label}</strong></span> <span style="font-size:11px;color:#888">(${list.length})</span>`,
        items,
        items.length > 5 ? 1 : 0,
      ));
    }
    children.push(makeNode(
      `<strong>📌 任务概况</strong> <span style="font-size:11px;color:#888">(${tasks.length}项)</span>`,
      taskStatusChildren,
    ));
  }

  // ── 3. 风险项 ──
  const risks = project.risks || [];
  if (risks.length > 0) {
    const riskChildren = risks.map((r) => {
      const label = RISK_LEVEL_LABELS[r.severity] || r.severity;
      return makeNode(`${riskDot(r.severity)} <span style="font-size:12px">${label}: ${r.title}</span>`);
    });
    children.push(makeNode(
      `<strong>⚠️ 风险项</strong> <span style="font-size:11px;color:#888">(${risks.length}项)</span>`,
      riskChildren,
    ));
  }

  // ── 4. 里程碑 ──
  const milestones = project.milestones || [];
  if (milestones.length > 0) {
    const msChildren = milestones.map((m) =>
      makeNode(`${milestoneIcon(m.status)} ${m.name} <span style="font-size:11px;color:#888">— ${m.date}</span>`),
    );
    children.push(makeNode('<strong>🏁 里程碑</strong>', msChildren));
  }

  // ── 5. 交付物 ──
  const deliverablesByStage = pipelineConfig.deliverables;
  if (deliverablesByStage && Object.keys(deliverablesByStage).length > 0) {
    const delivChildren: IPureNode[] = [];
    for (const stage of stages) {
      const expected = deliverablesByStage[stage];
      if (!expected?.length) continue;
      const stageLabel = STAGE_LABELS[stage] || stage;
      const items = expected.map((name) => {
        const found = documents.find((d) => d.title === name || d.title.includes(name));
        const icon = found ? '✅' : '○';
        return makeNode(`${icon} ${name}`);
      });
      delivChildren.push(makeNode(`<strong>${stageLabel}</strong>`, items, 1));
    }
    if (delivChildren.length > 0) {
      children.push(makeNode('<strong>📄 交付物</strong>', delivChildren, 1));
    }
  }

  // ── 6. 团队 ──
  const members = project.team_members || [];
  if (members.length > 0) {
    const teamChildren = members.map((m) => makeNode(`👤 ${m}`));
    children.push(makeNode(
      `<strong>👥 团队</strong> <span style="font-size:11px;color:#888">(${members.length}人)</span>`,
      teamChildren,
      members.length > 6 ? 1 : 0,
    ));
  }

  // ── 7. 采购管理 (EPC only) ──
  if (category === 'epc' && procurements.length > 0) {
    const procChildren = procurements.map((p) => {
      const statusLabel = PROCUREMENT_STATUS_LABELS[p.status] || p.status;
      return makeNode(`📦 ${p.name} <span style="font-size:11px;color:#888">— ${statusLabel}</span>`);
    });
    children.push(makeNode(
      `<strong>📦 采购管理</strong> <span style="font-size:11px;color:#888">(${procurements.length}项)</span>`,
      procChildren,
      1,
    ));
  }

  // ── 8. 过程记录 (EPC only) ──
  if (category === 'epc' && processes.length > 0) {
    // Group by record_type
    const grouped: Record<string, ProcessRecord[]> = {};
    for (const p of processes) {
      (grouped[p.record_type] ??= []).push(p);
    }
    const procRecChildren = Object.entries(grouped).map(([type, records]) => {
      const label = PROCESS_RECORD_TYPE_LABELS[type] || type;
      return makeNode(`${label} <span style="font-size:11px;color:#888">x${records.length}</span>`);
    });
    children.push(makeNode(
      `<strong>📝 过程记录</strong> <span style="font-size:11px;color:#888">(${processes.length}条)</span>`,
      procRecChildren,
      1,
    ));
  }

  return makeNode(rootContent, children);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ProjectMindMap: React.FC<ProjectMindMapProps> = ({ project, pipelineStages, documents }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap | null>(null);

  const [procurements, setProcurements] = useState<ProcurementPackage[]>([]);
  const [processes, setProcesses] = useState<ProcessRecord[]>([]);
  const category = getPipelineCategory(project.project_type);

  // Load EPC-specific data
  useEffect(() => {
    if (category === 'epc') {
      projectService.getProcurements(project.id).then(setProcurements).catch(() => {});
      projectService.getProcessRecords(project.id).then(setProcesses).catch(() => {});
    }
  }, [project.id, category]);

  // Create markmap instance once (handles StrictMode double-mount)
  useEffect(() => {
    if (!svgRef.current) return;

    // Clear any previous SVG content to avoid duplication on StrictMode re-mount
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
      // Destroy: clear SVG and release reference
      if (svgRef.current) svgRef.current.innerHTML = '';
      mmRef.current = null;
    };
  }, []);

  // Update data when inputs change
  useEffect(() => {
    if (!mmRef.current) return;
    const tree = buildMindMapTree(project, pipelineStages, documents, procurements, processes);
    mmRef.current.setData(tree);
    setTimeout(() => mmRef.current?.fit(), 150);
  }, [project, pipelineStages, documents, procurements, processes]);

  // Toolbar handlers
  const handleZoomIn = useCallback(() => mmRef.current?.rescale(1.25), []);
  const handleZoomOut = useCallback(() => mmRef.current?.rescale(0.8), []);
  const handleFit = useCallback(() => { mmRef.current?.fit(); }, []);

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

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-light-border bg-[#f6f7fb]">
        <span className="text-[0.9375rem] font-semibold mr-auto">思维导图</span>
        <ToolbarBtn title="放大" onClick={handleZoomIn}><ZoomIn size={16} /></ToolbarBtn>
        <ToolbarBtn title="缩小" onClick={handleZoomOut}><ZoomOut size={16} /></ToolbarBtn>
        <ToolbarBtn title="适应视图" onClick={handleFit}><Maximize2 size={16} /></ToolbarBtn>
        <div className="w-px h-5 bg-light-border mx-1" />
        <ToolbarBtn title="展开全部" onClick={handleExpandAll}><ChevronsUpDown size={16} /></ToolbarBtn>
        <ToolbarBtn title="折叠全部" onClick={handleCollapseAll}><ChevronsDownUp size={16} /></ToolbarBtn>
      </div>

      {/* SVG container */}
      <div className="flex-1 min-h-[500px] relative">
        <svg ref={svgRef} className="w-full h-full" style={{ minHeight: 500 }} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Toolbar Button
// ---------------------------------------------------------------------------

const ToolbarBtn: React.FC<{ title: string; onClick: () => void; children: React.ReactNode }> = ({ title, onClick, children }) => (
  <button
    title={title}
    onClick={onClick}
    className="p-1.5 rounded-md hover:bg-light-border text-light-text-secondary hover:text-light-text transition-colors"
  >
    {children}
  </button>
);

export default ProjectMindMap;
