# 知识库可视化导图 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mindmap visualization view to the knowledge base page, supporting EPC category view and project association view with document preview drawer.

**Architecture:** Pure client-side tree building from existing `/api/knowledge/documents` endpoint. Reuses existing `markmap-view` library (already used by `ProjectMindMap.tsx`). New `KnowledgeGraph` container component with two switchable modes; renders via isolated `KnowledgeMindmap` presentational component; reuses existing `DocumentPreview` component in a right-side drawer. View mode toggle added to existing `KnowledgeBase.tsx` page.

**Tech Stack:** React 19, TypeScript 5.9, markmap-view + markmap-common (types), Zustand, Tailwind CSS v4, Vitest + happy-dom. Backend: FastAPI + Pydantic v2.

**Spec:** [2026-04-10-knowledge-base-visualization-design.md](./2026-04-10-knowledge-base-visualization-design.md)

**Reference implementation:** `frontend/src/widgets/views/ProjectMindMap.tsx` — existing markmap usage pattern to mirror.

---

## File Structure

### Backend
- **Modify**: `src/api/routes/knowledge.py` — add `category` field to `KnowledgeDocResponse` + populate in both return statements
- **Modify**: `tests/test_api_knowledge.py` — add assertion for `category` field + new test for category grouping data

### Frontend
- **Modify**: `frontend/src/stores/knowledgeStore.ts` — add `category: string` to `KnowledgeDoc` interface
- **Create**: `frontend/src/components/knowledge/buildKnowledgeTree.ts` — pure tree builder function (~80 lines)
- **Create**: `frontend/src/components/knowledge/buildKnowledgeTree.test.ts` — unit tests (~120 lines)
- **Create**: `frontend/src/components/knowledge/KnowledgeMindmap.tsx` — presentational markmap wrapper (~90 lines)
- **Create**: `frontend/src/components/knowledge/KnowledgeGraph.tsx` — orchestrator container (~140 lines)
- **Create**: `frontend/src/components/knowledge/__tests__/KnowledgeGraph.test.tsx` — component test (~80 lines)
- **Create**: `frontend/src/components/knowledge/__tests__/buildKnowledgeTree.test.ts` (see above, tests will live in `__tests__` subfolder to match existing convention — see Task 3)
- **Modify**: `frontend/src/pages/KnowledgeBase.tsx` — add view mode toggle + conditional render

### No changes to
- Zustand stores (reuse existing `useKnowledgeStore` and `useProjectStore` as-is)
- Routing (page stays at `/knowledge`)
- `DocumentPreview.tsx` (reuse as-is)
- Backend tree aggregation (not built — YAGNI per spec §9)

---

## Task Breakdown

### Task 1: Backend — Add `category` field to knowledge API response

**Files:**
- Modify: `src/api/routes/knowledge.py:12-20` (schema), `:46-57` and `:68-78` (return statements)
- Modify: `tests/test_api_knowledge.py:31` (required_fields set)

**Why first:** Smallest change, unblocks frontend. Purely additive — no breaking changes.

- [ ] **Step 1: Add failing test assertion**

Open `tests/test_api_knowledge.py`, find `test_list_knowledge_documents_response_schema` (around line 26), and update the `required_fields` set:

```python
def test_list_knowledge_documents_response_schema(client):
    """Each knowledge document should have the required fields."""
    response = client.get("/api/knowledge/documents")
    assert response.status_code == 200
    data = response.json()
    required_fields = {
        "id", "title", "doc_type", "project_id", "content_summary",
        "version", "author", "status", "category",  # NEW
    }
    for doc in data:
        for field in required_fields:
            assert field in doc, f"Missing field: {field}"
```

Also add a new test at the bottom of the file (before any module-level code):

```python
def test_list_knowledge_documents_includes_categories(client):
    """Category field should contain EPC category values from seed data."""
    response = client.get("/api/knowledge/documents")
    data = response.json()
    categories = {doc["category"] for doc in data}
    # Seed data uses these categories — at least several should be present
    expected_subset = {"design", "construction", "quality", "safety", "general"}
    assert expected_subset.issubset(categories), (
        f"Expected categories not found. Got: {categories}"
    )
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_api_knowledge.py::test_list_knowledge_documents_response_schema tests/test_api_knowledge.py::test_list_knowledge_documents_includes_categories -v
```

Expected: Both FAIL. The first with `AssertionError: Missing field: category`, the second with `AssertionError: Expected categories not found`.

- [ ] **Step 3: Add `category` field to response schema**

Open `src/api/routes/knowledge.py` and modify `KnowledgeDocResponse`:

```python
class KnowledgeDocResponse(BaseModel):
    id: str
    title: str
    doc_type: str
    project_id: str | None
    content_summary: str
    version: str
    author: str
    status: str
    category: str  # EPC category: design/construction/quality/safety/completion/contract/change/general
```

- [ ] **Step 4: Populate `category` in both return statements**

In the same file, update `list_knowledge_documents` return block:

```python
return [
    KnowledgeDocResponse(
        id=d.id,
        title=d.title,
        doc_type=d.doc_type,
        project_id=d.project_id,
        content_summary=d.content_summary,
        version=d.version,
        author=d.author,
        status=d.status,
        category=d.category,  # NEW
    )
    for d in docs
]
```

And update `get_knowledge_document` return block:

```python
return KnowledgeDocResponse(
    id=doc.id,
    title=doc.title,
    doc_type=doc.doc_type,
    project_id=doc.project_id,
    content_summary=doc.content_summary,
    version=doc.version,
    author=doc.author,
    status=doc.status,
    category=doc.category,  # NEW
)
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pytest tests/test_api_knowledge.py -v
```

Expected: All tests pass (the two modified/new ones plus any existing ones).

- [ ] **Step 6: Run full backend test suite to confirm no regressions**

```bash
pytest tests/ -x -q
```

Expected: All previously-passing tests still pass (509 passed baseline).

- [ ] **Step 7: Run ruff**

```bash
ruff check src/ && ruff format --check src/
```

Expected: clean.

- [ ] **Step 8: Commit**

```bash
git add src/api/routes/knowledge.py tests/test_api_knowledge.py
git commit -m "feat(backend): add category field to knowledge API response"
```

---

### Task 2: Frontend — Add `category` to KnowledgeDoc type

**Files:**
- Modify: `frontend/src/stores/knowledgeStore.ts:4-13` (interface)

**Why:** Unblocks tree builder — it needs `category` on the doc objects.

- [ ] **Step 1: Add `category` field to the interface**

Open `frontend/src/stores/knowledgeStore.ts` and modify the `KnowledgeDoc` interface:

```typescript
interface KnowledgeDoc {
  id: string;
  title: string;
  doc_type: string;
  project_id: string | null;
  content_summary: string;
  version: string;
  author: string;
  status: string;
  category: string; // NEW: EPC category
}
```

No other changes in this file — the field flows through automatically since the store just passes API responses.

- [ ] **Step 2: Run TypeScript check to verify no errors**

```bash
cd frontend && npx tsc --noEmit
```

Expected: clean (0 errors).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/stores/knowledgeStore.ts
git commit -m "feat(frontend): add category field to KnowledgeDoc type"
```

---

### Task 3: Create `buildKnowledgeTree` pure function + tests (TDD)

**Files:**
- Create: `frontend/src/components/knowledge/buildKnowledgeTree.ts`
- Create: `frontend/src/components/knowledge/__tests__/buildKnowledgeTree.test.ts`

**Why:** Pure function, no React dependencies — easiest to test in isolation. Write tests first.

- [ ] **Step 1: Create directory and write failing tests**

Create file `frontend/src/components/knowledge/__tests__/buildKnowledgeTree.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildKnowledgeTree, type KnowledgeDocLite, type ProjectLite } from '../buildKnowledgeTree';

// ---------- Fixtures ----------

const docs: KnowledgeDocLite[] = [
  {
    id: 'd1', title: 'Zeta design doc', doc_type: 'proposal',
    project_id: 'p1', category: 'design',
  },
  {
    id: 'd2', title: 'Alpha design doc', doc_type: 'proposal',
    project_id: 'p1', category: 'design',
  },
  {
    id: 'd3', title: 'Safety plan', doc_type: 'proposal',
    project_id: 'p1', category: 'safety',
  },
  {
    id: 'd4', title: 'Public template', doc_type: 'template',
    project_id: null, category: 'contract',
  },
  {
    id: 'd5', title: 'Unknown cat doc', doc_type: 'report',
    project_id: 'p2', category: 'weirdunknown',
  },
];

const projects: ProjectLite[] = [
  { id: 'p1', name: '博物馆EPC项目' },
  { id: 'p2', name: '信息化项目' },
];

// ---------- Empty ----------

describe('buildKnowledgeTree — empty documents', () => {
  it('returns a root node with count 0 and no children when docs empty', () => {
    const tree = buildKnowledgeTree([], projects, 'category');
    expect(tree.content).toContain('知识库');
    expect(tree.content).toContain('(0)');
    expect(tree.children ?? []).toHaveLength(0);
  });
});

// ---------- Category view ----------

describe('buildKnowledgeTree — category view', () => {
  it('groups documents by category with Chinese labels', () => {
    const tree = buildKnowledgeTree(docs, projects, 'category');
    expect(tree.content).toContain('(5)');
    const childLabels = tree.children!.map((c) => c.content);
    // Should contain "设计", "安全", "合同", "通用" (weirdunknown → 通用)
    expect(childLabels.some((l) => l.includes('设计'))).toBe(true);
    expect(childLabels.some((l) => l.includes('安全'))).toBe(true);
    expect(childLabels.some((l) => l.includes('合同'))).toBe(true);
    expect(childLabels.some((l) => l.includes('通用'))).toBe(true);
  });

  it('counts documents in each category label', () => {
    const tree = buildKnowledgeTree(docs, projects, 'category');
    const designBranch = tree.children!.find((c) => c.content.includes('设计'));
    expect(designBranch).toBeDefined();
    expect(designBranch!.content).toContain('(2)');
    expect(designBranch!.children).toHaveLength(2);
  });

  it('sorts documents within a category by title (alphabetical)', () => {
    const tree = buildKnowledgeTree(docs, projects, 'category');
    const designBranch = tree.children!.find((c) => c.content.includes('设计'))!;
    const titles = designBranch.children!.map((c) => c.content);
    // 'Alpha design doc' should come before 'Zeta design doc'
    const alphaIdx = titles.findIndex((t) => t.includes('Alpha'));
    const zetaIdx = titles.findIndex((t) => t.includes('Zeta'));
    expect(alphaIdx).toBeLessThan(zetaIdx);
  });

  it('places unknown categories under 通用', () => {
    const tree = buildKnowledgeTree(docs, projects, 'category');
    const generalBranch = tree.children!.find((c) => c.content.includes('通用'))!;
    const titles = generalBranch.children!.map((c) => c.content);
    expect(titles.some((t) => t.includes('Unknown cat doc'))).toBe(true);
  });

  it('encodes docId in leaf node HTML for click handling', () => {
    const tree = buildKnowledgeTree(docs, projects, 'category');
    const designBranch = tree.children!.find((c) => c.content.includes('设计'))!;
    const leaf = designBranch.children![0];
    expect(leaf.content).toMatch(/data-doc-id="d[12]"/);
  });

  it('escapes HTML in document titles to prevent XSS', () => {
    const xssDocs: KnowledgeDocLite[] = [
      {
        id: 'x1',
        title: '<script>alert(1)</script>',
        doc_type: 'report',
        project_id: null,
        category: 'general',
      },
    ];
    const tree = buildKnowledgeTree(xssDocs, projects, 'category');
    const leaf = tree.children![0].children![0];
    expect(leaf.content).not.toContain('<script>');
    expect(leaf.content).toContain('&lt;script&gt;');
  });

  it('follows predefined category order (design before construction before quality ...)', () => {
    const moreDocs: KnowledgeDocLite[] = [
      { id: 'a', title: 'A', doc_type: 'report', project_id: null, category: 'contract' },
      { id: 'b', title: 'B', doc_type: 'report', project_id: null, category: 'design' },
      { id: 'c', title: 'C', doc_type: 'report', project_id: null, category: 'quality' },
    ];
    const tree = buildKnowledgeTree(moreDocs, projects, 'category');
    const labels = tree.children!.map((c) => c.content);
    const designIdx = labels.findIndex((l) => l.includes('设计'));
    const qualityIdx = labels.findIndex((l) => l.includes('质量'));
    const contractIdx = labels.findIndex((l) => l.includes('合同'));
    expect(designIdx).toBeLessThan(qualityIdx);
    expect(qualityIdx).toBeLessThan(contractIdx);
  });
});

// ---------- Project view ----------

describe('buildKnowledgeTree — project view', () => {
  it('groups documents by project_id, mapping to project names', () => {
    const tree = buildKnowledgeTree(docs, projects, 'project');
    const childLabels = tree.children!.map((c) => c.content);
    expect(childLabels.some((l) => l.includes('博物馆EPC项目'))).toBe(true);
    expect(childLabels.some((l) => l.includes('信息化项目'))).toBe(true);
  });

  it('groups docs with null project_id under 公共模板/通用文档', () => {
    const tree = buildKnowledgeTree(docs, projects, 'project');
    const publicBranch = tree.children!.find((c) => c.content.includes('公共模板'));
    expect(publicBranch).toBeDefined();
    expect(publicBranch!.children).toHaveLength(1);
    expect(publicBranch!.children![0].content).toContain('Public template');
  });

  it('sorts project branches by document count descending', () => {
    // p1 has 3 docs, p2 has 1 doc, public has 1 doc
    const tree = buildKnowledgeTree(docs, projects, 'project');
    const firstBranch = tree.children![0];
    expect(firstBranch.content).toContain('博物馆EPC项目');
    expect(firstBranch.content).toContain('(3)');
  });

  it('handles project_id pointing to an unknown project gracefully', () => {
    const orphanDocs: KnowledgeDocLite[] = [
      {
        id: 'o1', title: 'Orphan doc', doc_type: 'report',
        project_id: 'nonexistent', category: 'general',
      },
    ];
    const tree = buildKnowledgeTree(orphanDocs, projects, 'project');
    // Orphan should fall back to a placeholder branch, not crash
    const labels = tree.children!.map((c) => c.content);
    expect(labels.some((l) => l.includes('未知项目') || l.includes('nonexistent'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail (file doesn't exist yet)**

```bash
cd frontend && npx vitest run src/components/knowledge/__tests__/buildKnowledgeTree.test.ts
```

Expected: FAIL with "Cannot find module '../buildKnowledgeTree'".

- [ ] **Step 3: Create the `buildKnowledgeTree.ts` implementation**

Create file `frontend/src/components/knowledge/buildKnowledgeTree.ts`:

```typescript
import type { IPureNode } from 'markmap-common';

// ---------------------------------------------------------------------------
// Lightweight types — accept shape subsets to stay decoupled from stores
// ---------------------------------------------------------------------------

export interface KnowledgeDocLite {
  id: string;
  title: string;
  doc_type: string;
  project_id: string | null;
  category: string;
}

export interface ProjectLite {
  id: string;
  name: string;
}

export type GraphMode = 'category' | 'project';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORY_ORDER = [
  'design',
  'construction',
  'quality',
  'safety',
  'completion',
  'contract',
  'change',
  'general',
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  design: '设计',
  construction: '施工',
  quality: '质量',
  safety: '安全',
  completion: '竣工',
  contract: '合同',
  change: '变更',
  general: '通用',
};

const UNKNOWN_CATEGORY_FALLBACK = 'general';
const PUBLIC_PROJECT_LABEL = '公共模板/通用文档';
const UNKNOWN_PROJECT_LABEL = '未知项目';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return c;
    }
  });
}

function makeLeafNode(doc: KnowledgeDocLite): IPureNode {
  const safeTitle = escapeHtml(doc.title);
  return {
    content: `<span data-doc-id="${doc.id}">${safeTitle}</span>`,
    children: [],
  };
}

function makeBranchNode(label: string, count: number, children: IPureNode[]): IPureNode {
  return {
    content: `${label} (${count})`,
    children,
  };
}

function sortByTitle(a: KnowledgeDocLite, b: KnowledgeDocLite): number {
  return a.title.localeCompare(b.title, 'zh-Hans-CN');
}

// ---------------------------------------------------------------------------
// Main builder
// ---------------------------------------------------------------------------

export function buildKnowledgeTree(
  docs: KnowledgeDocLite[],
  projects: ProjectLite[],
  mode: GraphMode,
): IPureNode {
  const rootLabel = `知识库 (${docs.length})`;

  if (docs.length === 0) {
    return { content: rootLabel, children: [] };
  }

  if (mode === 'category') {
    return buildCategoryTree(docs, rootLabel);
  }
  return buildProjectTree(docs, projects, rootLabel);
}

// ---------------------------------------------------------------------------
// Category view
// ---------------------------------------------------------------------------

function buildCategoryTree(docs: KnowledgeDocLite[], rootLabel: string): IPureNode {
  const buckets = new Map<string, KnowledgeDocLite[]>();
  for (const doc of docs) {
    const key = (CATEGORY_ORDER as readonly string[]).includes(doc.category)
      ? doc.category
      : UNKNOWN_CATEGORY_FALLBACK;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(doc);
  }

  const children: IPureNode[] = [];
  for (const key of CATEGORY_ORDER) {
    const bucket = buckets.get(key);
    if (!bucket || bucket.length === 0) continue;
    bucket.sort(sortByTitle);
    const leaves = bucket.map(makeLeafNode);
    children.push(makeBranchNode(CATEGORY_LABELS[key], bucket.length, leaves));
  }

  return { content: rootLabel, children };
}

// ---------------------------------------------------------------------------
// Project view
// ---------------------------------------------------------------------------

function buildProjectTree(
  docs: KnowledgeDocLite[],
  projects: ProjectLite[],
  rootLabel: string,
): IPureNode {
  const projectsById = new Map(projects.map((p) => [p.id, p]));
  const buckets = new Map<string, { label: string; docs: KnowledgeDocLite[] }>();

  for (const doc of docs) {
    let key: string;
    let label: string;
    if (doc.project_id == null) {
      key = '__public__';
      label = PUBLIC_PROJECT_LABEL;
    } else {
      const proj = projectsById.get(doc.project_id);
      key = doc.project_id;
      label = proj ? proj.name : `${UNKNOWN_PROJECT_LABEL} (${doc.project_id})`;
    }
    if (!buckets.has(key)) buckets.set(key, { label, docs: [] });
    buckets.get(key)!.docs.push(doc);
  }

  // Sort branches: named projects first by doc count desc, public/unknown last
  const entries = Array.from(buckets.entries());
  entries.sort(([keyA, a], [keyB, b]) => {
    const aIsPublic = keyA === '__public__';
    const bIsPublic = keyB === '__public__';
    if (aIsPublic && !bIsPublic) return 1;
    if (!aIsPublic && bIsPublic) return -1;
    return b.docs.length - a.docs.length;
  });

  const children: IPureNode[] = entries.map(([, bucket]) => {
    bucket.docs.sort(sortByTitle);
    const leaves = bucket.docs.map(makeLeafNode);
    return makeBranchNode(bucket.label, bucket.docs.length, leaves);
  });

  return { content: rootLabel, children };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/components/knowledge/__tests__/buildKnowledgeTree.test.ts
```

Expected: All tests pass (13 tests).

- [ ] **Step 5: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/knowledge/buildKnowledgeTree.ts frontend/src/components/knowledge/__tests__/buildKnowledgeTree.test.ts
git commit -m "feat(frontend): add buildKnowledgeTree pure function with tests"
```

---

### Task 4: Create `KnowledgeMindmap` presentational component

**Files:**
- Create: `frontend/src/components/knowledge/KnowledgeMindmap.tsx`

**Why:** Isolates markmap-view lifecycle (ref, mount, update, destroy, click delegation) from business logic.

- [ ] **Step 1: Create the component**

Create file `frontend/src/components/knowledge/KnowledgeMindmap.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { Markmap } from 'markmap-view';
import type { IPureNode } from 'markmap-common';

const BRANCH_COLORS = ['#00C875', '#0086C0', '#6BBF59', '#9B51E0', '#FDAB3D', '#579BFC'];

function colorByDepth(node: IPureNode & { depth?: number }): string {
  const d = node.depth ?? 0;
  return BRANCH_COLORS[Math.min(d, BRANCH_COLORS.length - 1)];
}

interface KnowledgeMindmapProps {
  data: IPureNode;
  onNodeClick: (docId: string) => void;
}

export function KnowledgeMindmap({ data, onNodeClick }: KnowledgeMindmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const mmRef = useRef<Markmap | null>(null);
  const onNodeClickRef = useRef(onNodeClick);

  // Keep latest callback in ref to avoid re-binding listener on every render
  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  // Mount markmap once
  useEffect(() => {
    if (!svgRef.current) return;
    svgRef.current.innerHTML = '';
    mmRef.current = new Markmap(svgRef.current, {
      autoFit: true,
      duration: 300,
      maxWidth: 320,
      paddingX: 16,
      initialExpandLevel: 2,
      color: colorByDepth,
      zoom: true,
      pan: true,
    });

    // Click delegation: find the data-doc-id attribute on the clicked element
    const svg = svgRef.current;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;
      const hit = target.closest('[data-doc-id]');
      if (hit) {
        const docId = hit.getAttribute('data-doc-id');
        if (docId) onNodeClickRef.current(docId);
      }
    };
    svg.addEventListener('click', handleClick);

    return () => {
      svg.removeEventListener('click', handleClick);
      if (svgRef.current) svgRef.current.innerHTML = '';
      mmRef.current = null;
    };
  }, []);

  // Update data when the tree changes
  useEffect(() => {
    if (!mmRef.current) return;
    mmRef.current.setData(data);
    // Delay fit to allow layout to settle
    const id = window.setTimeout(() => mmRef.current?.fit(), 150);
    return () => window.clearTimeout(id);
  }, [data]);

  return (
    <div className="w-full h-full min-h-[500px] bg-white rounded-[10px] border border-[#E8ECF4]">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd frontend && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Run lint**

```bash
cd frontend && npx eslint --config eslint.config.js src/components/knowledge/KnowledgeMindmap.tsx
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/knowledge/KnowledgeMindmap.tsx
git commit -m "feat(frontend): add KnowledgeMindmap presentational component"
```

---

### Task 5: Create `KnowledgeGraph` orchestrator with preview drawer

**Files:**
- Create: `frontend/src/components/knowledge/KnowledgeGraph.tsx`
- Create: `frontend/src/components/knowledge/__tests__/KnowledgeGraph.test.tsx`

**Why:** Manages graphMode state, selected doc state, drawer open/close, and composes the tree builder with the mindmap component. Also handles document fetching trigger.

- [ ] **Step 1: Write failing component test**

Create file `frontend/src/components/knowledge/__tests__/KnowledgeGraph.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { setupFetchMock } from '../../../test/utils';
import { KnowledgeGraph } from '../KnowledgeGraph';

// Mock markmap-view to avoid JSDOM SVG layout issues in tests
vi.mock('markmap-view', () => ({
  Markmap: class {
    constructor(public el: SVGElement) {}
    setData = vi.fn();
    fit = vi.fn();
  },
}));

const mockDocs = [
  {
    id: 'doc-1', title: 'Design A', doc_type: 'proposal',
    project_id: 'proj-1', content_summary: 'Summary A',
    version: '1.0', author: 'Alice', status: 'final', category: 'design',
  },
  {
    id: 'doc-2', title: 'Safety B', doc_type: 'report',
    project_id: 'proj-1', content_summary: 'Summary B',
    version: '1.0', author: 'Bob', status: 'final', category: 'safety',
  },
];

const mockProjects = [
  {
    id: 'proj-1', name: 'Test Project', status: 'active',
    progress_pct: 50, team_members: [], stage: 'design',
  },
];

describe('KnowledgeGraph', () => {
  beforeEach(() => {
    setupFetchMock({
      '/api/knowledge/documents': { body: mockDocs },
      '/api/projects': { body: mockProjects },
    });
  });

  it('renders mode toggle buttons', async () => {
    render(<KnowledgeGraph />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /EPC分类/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /项目关联/i })).toBeInTheDocument();
    });
  });

  it('starts in category mode by default', async () => {
    render(<KnowledgeGraph />);
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /EPC分类/i });
      expect(btn.getAttribute('data-active')).toBe('true');
    });
  });

  it('switches to project mode when project button clicked', async () => {
    render(<KnowledgeGraph />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /项目关联/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /项目关联/i }));
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /项目关联/i });
      expect(btn.getAttribute('data-active')).toBe('true');
    });
  });

  it('shows empty state when no documents', async () => {
    setupFetchMock({
      '/api/knowledge/documents': { body: [] },
      '/api/projects': { body: [] },
    });
    render(<KnowledgeGraph />);
    await waitFor(() => {
      expect(screen.getByText(/暂无文档/)).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails (component doesn't exist)**

```bash
cd frontend && npx vitest run src/components/knowledge/__tests__/KnowledgeGraph.test.tsx
```

Expected: FAIL with "Cannot find module '../KnowledgeGraph'".

- [ ] **Step 3: Create the `KnowledgeGraph.tsx` component**

Create file `frontend/src/components/knowledge/KnowledgeGraph.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { Network, FolderTree, X } from 'lucide-react';
import { useKnowledgeStore } from '../../stores/knowledgeStore';
import { useProjectStore } from '../../stores/projectStore';
import { documentService } from '../../services/api';
import type { DocumentItem } from '../../types';
import DocumentPreview from '../documents/DocumentPreview';
import { KnowledgeMindmap } from './KnowledgeMindmap';
import { buildKnowledgeTree, type GraphMode } from './buildKnowledgeTree';

export function KnowledgeGraph() {
  const { documents, fetchDocuments, isLoading } = useKnowledgeStore();
  const { projects, fetchProjects } = useProjectStore();

  const [graphMode, setGraphMode] = useState<GraphMode>('category');
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);

  useEffect(() => {
    if (documents.length === 0) fetchDocuments();
    if (projects.length === 0) fetchProjects();
  }, [documents.length, projects.length, fetchDocuments, fetchProjects]);

  const tree = useMemo(
    () => buildKnowledgeTree(documents, projects, graphMode),
    [documents, projects, graphMode],
  );

  const handleNodeClick = async (docId: string) => {
    setIsLoadingDoc(true);
    try {
      const doc = await documentService.get(docId);
      setSelectedDoc(doc);
    } catch {
      // Swallow — toast system not available here; user sees no-op
    } finally {
      setIsLoadingDoc(false);
    }
  };

  const modeButtonClass = (mode: GraphMode) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      graphMode === mode
        ? 'bg-primary text-white'
        : 'bg-white text-light-text-secondary border border-[#E8ECF4] hover:bg-[#F4F6FC]'
    }`;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Mode toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="EPC分类"
          data-active={graphMode === 'category'}
          onClick={() => setGraphMode('category')}
          className={modeButtonClass('category')}
        >
          <Network size={14} />
          EPC分类
        </button>
        <button
          type="button"
          aria-label="项目关联"
          data-active={graphMode === 'project'}
          onClick={() => setGraphMode('project')}
          className={modeButtonClass('project')}
        >
          <FolderTree size={14} />
          项目关联
        </button>
      </div>

      {/* Mindmap area */}
      <div className="flex-1 min-h-[500px] relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-[#919AA3] text-sm">
            加载中...
          </div>
        ) : documents.length === 0 ? (
          <div className="flex items-center justify-center h-full text-[#919AA3] text-sm">
            暂无文档
          </div>
        ) : (
          <KnowledgeMindmap data={tree} onNodeClick={handleNodeClick} />
        )}
      </div>

      {/* Right-side preview drawer */}
      {selectedDoc && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedDoc(null)}
          />
          <div className="fixed right-0 top-0 h-full w-[560px] bg-white z-50 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8ECF4]">
              <span className="text-[15px] font-medium">文档预览</span>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-[6px] hover:bg-[#F4F6FC]"
                aria-label="关闭预览"
              >
                <X size={16} className="text-[#919AA3]" />
              </button>
            </div>
            <div className="flex-1 min-h-0 p-3">
              <DocumentPreview document={selectedDoc} onClose={() => setSelectedDoc(null)} />
            </div>
          </div>
        </>
      )}

      {isLoadingDoc && (
        <div className="fixed bottom-6 right-6 px-4 py-2 bg-black/70 text-white text-sm rounded-lg z-60">
          加载文档中...
        </div>
      )}
    </div>
  );
}
```

**Note:** `documentService.get(id)` is defined in `frontend/src/services/api.ts:495` and returns `Promise<DocumentItem>`. The implementation above uses it directly.

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd frontend && npx vitest run src/components/knowledge/__tests__/KnowledgeGraph.test.tsx
```

Expected: All 4 tests pass.

- [ ] **Step 5: Run TypeScript check + lint**

```bash
cd frontend && npx tsc --noEmit && npx eslint --config eslint.config.js src/components/knowledge/
```

Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/knowledge/KnowledgeGraph.tsx frontend/src/components/knowledge/__tests__/KnowledgeGraph.test.tsx
git commit -m "feat(frontend): add KnowledgeGraph orchestrator with preview drawer"
```

---

### Task 6: Wire view toggle into `KnowledgeBase.tsx`

**Files:**
- Modify: `frontend/src/pages/KnowledgeBase.tsx:42-53` (state), `:91-101` (header area)

**Why:** Exposes the new graph view through the existing knowledge base page.

- [ ] **Step 1: Add imports and view mode state**

Open `frontend/src/pages/KnowledgeBase.tsx`.

At the top, add the `Network` icon to the `lucide-react` import line (it's already importing several icons):

```tsx
import {
  Search,
  FileText,
  BookMarked,
  FolderOpen,
  UploadCloud,
  Clock,
  ThumbsUp,
  Loader2,
  List,      // NEW
  Network,   // NEW
} from 'lucide-react'
```

Add new import below the existing store import:

```tsx
import { useKnowledgeStore } from '../stores/knowledgeStore'
import { KnowledgeGraph } from '../components/knowledge/KnowledgeGraph'  // NEW
```

Inside the `KnowledgeBase` component, add a new state line just after `const [searchQuery, setSearchQuery] = useState('')`:

```tsx
const [viewMode, setViewMode] = useState<'list' | 'graph'>('list')
```

- [ ] **Step 2: Add the view toggle buttons to the header**

Find the header `<div>` block (around line 91). Modify the right side of the header to include the view toggle alongside the upload button:

Replace:

```tsx
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-medium font-heading text-light-text">企业智能知识库</h2>
          <span className="text-sm text-light-text-secondary mt-1 block">
            构建可进化的组织智能 · 当前检索库含 {documents.length} 份核心文档
          </span>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-colors">
          <UploadCloud size={16} /> 上传并学习
        </button>
      </div>
```

With:

```tsx
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-medium font-heading text-light-text">企业智能知识库</h2>
          <span className="text-sm text-light-text-secondary mt-1 block">
            构建可进化的组织智能 · 当前检索库含 {documents.length} 份核心文档
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="inline-flex items-center rounded-lg border border-[#E8ECF4] bg-white overflow-hidden">
            <button
              type="button"
              aria-label="列表视图"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-white'
                  : 'text-light-text-secondary hover:bg-[#F4F6FC]'
              }`}
            >
              <List size={14} /> 列表视图
            </button>
            <button
              type="button"
              aria-label="导图视图"
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'graph'
                  ? 'bg-primary text-white'
                  : 'text-light-text-secondary hover:bg-[#F4F6FC]'
              }`}
            >
              <Network size={14} /> 导图视图
            </button>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-colors">
            <UploadCloud size={16} /> 上传并学习
          </button>
        </div>
      </div>
```

- [ ] **Step 3: Wrap the existing list content area with conditional render**

Find the `{/* Content */}` block (the `<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">` and everything inside it). Wrap it with a conditional so it only renders in list mode. Add the `KnowledgeGraph` block for graph mode.

Replace the entire `{/* Content */}` section (starting with the comment `{/* Content */}` and ending with its matching closing `</div>` for the grid) with:

```tsx
      {/* Content */}
      {viewMode === 'list' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            {/* ... existing sidebar code unchanged ... */}
          </aside>

          {/* Main Area */}
          <main className="lg:col-span-3">
            {/* ... existing main area code unchanged ... */}
          </main>
        </div>
      ) : (
        <div className="h-[calc(100vh-260px)] min-h-[500px]">
          <KnowledgeGraph />
        </div>
      )}
```

**Important:** Do NOT actually replace the `{/* ... existing ... unchanged ... */}` comments with literal text — preserve the original sidebar and main area JSX exactly as they are. The only change is adding the `{viewMode === 'list' ? ( ... ) : ( <div><KnowledgeGraph /></div> )}` wrapper around the existing `<div className="grid ...">`.

Effectively the diff is:
1. Before the `<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">` opening tag, insert `{viewMode === 'list' ? (`
2. After the closing `</div>` of that grid, insert `) : (<div className="h-[calc(100vh-260px)] min-h-[500px]"><KnowledgeGraph /></div>)}`

- [ ] **Step 4: Run TypeScript + lint**

```bash
cd frontend && npx tsc --noEmit && npx eslint --config eslint.config.js src/pages/KnowledgeBase.tsx
```

Expected: both clean.

- [ ] **Step 5: Run full frontend test suite**

```bash
cd frontend && npx vitest run
```

Expected: all tests pass, including the new ones from Tasks 3 and 5.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/KnowledgeBase.tsx
git commit -m "feat(frontend): add view toggle for knowledge base mindmap"
```

---

### Task 7: Final verification + manual smoke test

**Files:** none (verification only)

- [ ] **Step 1: Run full backend test suite**

```bash
pytest tests/ -x -q
```

Expected: 509+ passed (baseline + any added tests), 0 failures.

- [ ] **Step 2: Run full frontend test suite**

```bash
cd frontend && npx vitest run
```

Expected: all passing.

- [ ] **Step 3: Run TypeScript check across the whole project**

```bash
cd frontend && npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Run ESLint across the whole project**

```bash
cd frontend && npx eslint --config eslint.config.js 'src/**/*.{ts,tsx}' 2>&1 | grep -E "^\s+\d+:\d+\s+error" || echo "No lint errors"
```

Expected: "No lint errors".

- [ ] **Step 5: Run ruff on backend**

```bash
ruff check src/ && ruff format --check src/
```

Expected: clean.

- [ ] **Step 6: Manual smoke test (optional but recommended)**

Start the dev servers:

```bash
# Terminal 1
uvicorn src.main:app --reload

# Terminal 2
cd frontend && npm run dev
```

Open http://localhost:5173/knowledge and verify:

- [ ] Page loads with list view by default
- [ ] Click "导图视图" button — page switches to mindmap
- [ ] Mindmap shows root "知识库 (25)" with category children (设计/施工/质量/安全/...)
- [ ] Click "项目关联" button — mindmap switches to project grouping
- [ ] Click a leaf document node — right-side drawer slides in with `DocumentPreview`
- [ ] Click the drawer close button — drawer closes
- [ ] Click "列表视图" button — returns to original list view, no state loss

- [ ] **Step 7: Create final summary commit if any fixes needed**

If Step 6 surfaces small issues (styling tweaks, minor logic fixes), fix them inline and commit with a descriptive message. Otherwise no additional commit needed.

```bash
# Example if fixes needed:
git add -u
git commit -m "fix(frontend): polish knowledge mindmap interaction details"
```

---

## Summary

| Task | Output | Est. time |
|------|--------|-----------|
| 1 | Backend `category` field + tests | 10 min |
| 2 | Frontend type update | 3 min |
| 3 | `buildKnowledgeTree` + 13 unit tests | 25 min |
| 4 | `KnowledgeMindmap` presentational component | 15 min |
| 5 | `KnowledgeGraph` container + 4 component tests | 25 min |
| 6 | Wire toggle into `KnowledgeBase.tsx` | 10 min |
| 7 | Final verification | 10 min |

**Total:** ~100 minutes

**Commits:** 6 (one per task 1–6) + 0–1 cleanup commit in task 7

---

## Key Invariants (do not violate)

1. **No new runtime dependencies** — `markmap-view` and `markmap-common` are already in `node_modules`.
2. **No new backend endpoints** — only `category` added to existing response.
3. **`ProjectStage.BIDDING` remains untouched** (deleted bidding module is separate from this feature).
4. **`DocumentPreview.tsx` is not modified** — strictly reused.
5. **List view behavior is completely preserved** — the existing grid, search, category sidebar must work unchanged when `viewMode === 'list'`.
6. **XSS safety** — all document titles must pass through `escapeHtml()` before entering HTML content strings.
