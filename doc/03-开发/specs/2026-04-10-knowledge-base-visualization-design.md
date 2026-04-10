# 知识库可视化导图 · 设计文档

**日期**: 2026-04-10
**作者**: Claude (设计协助) + 项目团队
**状态**: 已批准，待实施

---

## 1. 背景与目标

### 1.1 现状

当前知识库页面 ([frontend/src/pages/KnowledgeBase.tsx](../../../frontend/src/pages/KnowledgeBase.tsx)) 只提供扁平的卡片列表视图。用户通过左侧的文档类型筛选器（报告/方案/模板/纪要）浏览文档，或使用关键词搜索。随着文档数量增长（当前种子数据 25 份，分布在 8 个 EPC 专业分类与 4+ 个项目中），用户难以快速把握整个知识库的结构与分布。

### 1.2 目标

在知识库页面增加一个**可视化导图视图**，清晰地呈现文档的组织结构，支持用户从"分类"和"项目"两个视角系统性浏览知识资产。

### 1.3 非目标（显式排除）

- ❌ 基于语义/内容的知识图谱（非结构化关系挖掘）
- ❌ 作者视图、标签云、doc_type 视图（未来扩展）
- ❌ 节点拖拽、手动编辑结构、自定义分类
- ❌ 全文搜索图谱内节点（保留给列表视图的智能检索）
- ❌ 后端树聚合接口（当前规模客户端构建足够）

---

## 2. 用户故事

**作为项目经理**，我希望打开知识库后切换到"导图视图"，一眼看到公司累积了哪些专业领域的知识（设计/施工/质量/合同...），点击任意文档即可在右侧预览内容，不用来回跳转。

**作为新入职员工**，我希望通过"项目关联导图"快速了解每个项目有哪些历史资料，帮助我熟悉公司过往做过的项目。

---

## 3. 设计概览

### 3.1 视觉布局

```
┌─────────────────────────────────────────────────────────────┐
│ 企业智能知识库                              [上传并学习]     │
│ 构建可进化的组织智能 · 当前检索库含 25 份核心文档             │
├─────────────────────────────────────────────────────────────┤
│ 🔍 [搜索框]                                  [智能检索]     │
├─────────────────────────────────────────────────────────────┤
│ [📋 列表视图] [🗺 导图视图]    ← 视图切换（新增）            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  当 viewMode === 'graph' 时显示 KnowledgeGraph 组件：        │
│                                                              │
│  [EPC 分类] [项目关联]  ← 导图模式切换                       │
│  ┌────────────────────────────────────────────────┐         │
│  │                                                 │         │
│  │       知识库                                    │         │
│  │       ├── 设计 (4)                              │         │
│  │       │   ├── 展陈设计方案(深化版)    ← click → 右抽屉预览 │
│  │       │   └── ...                               │         │
│  │       ├── 施工 (2)                              │         │
│  │       ├── 质量 (4)                              │         │
│  │       └── ...                                   │         │
│  │       （markmap 原生水平展开动画）               │         │
│  └────────────────────────────────────────────────┘         │
│                                                              │
└─────────────────────────────────────────────────────────────┘

点击叶子节点时，右侧滑出 DocumentPreview 抽屉（复用现有组件）。
```

### 3.2 架构与数据流

```
┌─ KnowledgeBase.tsx ────────────────────────────────────────┐
│                                                             │
│  [列表] [导图]  ← viewMode state                            │
│                                                             │
│  if viewMode === 'list':  <existing list UI>                │
│  if viewMode === 'graph': <KnowledgeGraph />                │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─ KnowledgeGraph.tsx ───────────────────────────────────────┐
│                                                             │
│  [EPC分类] [项目关联]  ← graphMode state                    │
│                                                             │
│  useMemo: buildKnowledgeTree(docs, projects, graphMode)     │
│                         │                                   │
│                         ▼                                   │
│                    <KnowledgeMindmap                        │
│                       data={treeRoot}                       │
│                       onNodeClick={setSelectedDoc} />       │
│                                                             │
│  {selectedDoc && <SlideDrawer>                              │
│                    <DocumentPreview doc={selectedDoc} /> }  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

纯客户端数据流：
  knowledgeStore.documents  ─┐
  projectStore.projects      ├─► useMemo ─► MindmapNode tree
  graphMode                  ─┘                    │
                                                    ▼
                                        Markmap.create(svg, opts, root)
```

---

## 4. 组件拆分

| 组件 | 路径 | 职责 | 预估代码量 |
|------|------|------|-----------|
| `KnowledgeBase.tsx`（改） | `frontend/src/pages/KnowledgeBase.tsx` | 顶部增加视图切换按钮，条件渲染 `<KnowledgeGraph />` | +15 行 |
| `KnowledgeGraph.tsx`（新） | `frontend/src/components/knowledge/KnowledgeGraph.tsx` | 视图容器：模式切换 + 树构建 + 抽屉状态 | ~120 行 |
| `KnowledgeMindmap.tsx`（新） | `frontend/src/components/knowledge/KnowledgeMindmap.tsx` | 纯渲染组件：接收 tree 数据 + 点击回调，内部调用 `Markmap.create`，管理 SVG ref 与实例生命周期 | ~80 行 |
| `buildKnowledgeTree.ts`（新） | `frontend/src/components/knowledge/buildKnowledgeTree.ts` | 纯函数：`(docs, projects, mode) => MindmapNode`，无 React 依赖 | ~60 行 |

### 4.1 设计理由

- **`KnowledgeMindmap`** 封装 markmap-view 的命令式 API（`Markmap.create`、`setData`、`destroy`），把 SVG ref 管理、实例生命周期、事件绑定的复杂度隔离在 ~80 行内。未来若替换渲染库（例如换成 d3 或 react-flow），只需重写这一个文件。
- **`buildKnowledgeTree`** 是纯函数，完全可单元测试，把"文档分组逻辑"与 React hooks、DOM 彻底解耦。边界情况（空列表、缺失 project_id、未知 category）都可通过 vitest 覆盖。
- **`KnowledgeGraph`** 是编排者：管理模式切换、抽屉开关、选中文档状态。只协调数据与子组件，不含复杂渲染或业务逻辑。
- **`KnowledgeBase.tsx`** 改动最小化：只增加 viewMode state 和一个切换按钮 + 条件渲染，保持现有列表视图完全不变。

---

## 5. 数据结构

### 5.1 树节点类型

使用 markmap-view 原生的 `INode` 结构（不引入 markmap-lib，零新依赖）：

```typescript
export interface MindmapNode {
  content: string;                // 节点显示文本（支持 HTML 片段）
  children?: MindmapNode[];
  payload?: { docId?: string };   // 叶子节点携带文档 ID 用于点击回调
}
```

### 5.2 EPC 分类视图

按 `DocumentItem.category` 分组。预定义显示顺序与中文标签：

```typescript
const CATEGORY_ORDER = [
  'design', 'construction', 'quality', 'safety',
  'completion', 'contract', 'change', 'general',
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
```

示例输出：

```
知识库 (25)
├── 设计 (4)
│   ├── 展陈设计方案(深化版)
│   ├── 智能化系统施工图纸
│   ├── 发改委信息化二期技术方案
│   └── 需求规格说明书
├── 施工 (2)
├── 质量 (4)
├── 安全 (2)
├── 竣工 (1)
├── 合同 (4)
├── 变更 (2)
└── 通用 (6)
```

### 5.3 项目关联视图

按 `DocumentItem.project_id` 分组，用 `projectStore` 将 ID 映射为项目名。`project_id == null` 的文档归入虚拟节点"公共模板/通用文档"。

```
知识库 (25)
├── 博物馆EPC项目 (15)
│   ├── 智慧园区EPC项目全流程复盘记录_V1.2
│   └── ...
├── 发改委信息化二期 (4)
├── 智慧园区专项债咨询 (3)
├── 智慧水务需求调研 (1)
└── 📋 公共模板/通用文档 (3)
    ├── EPC项目投标书模板
    └── 2026年Q1项目周报汇总
```

### 5.4 排序规则

- **根节点**：类别按 `CATEGORY_ORDER` 预定义顺序；项目按文档数量降序
- **叶子节点**：文档在所属组内按 `title` 字典序

### 5.5 空状态

- 若 `documents.length === 0`：显示"暂无文档"占位（与列表视图一致的样式）
- 若某分类下无文档：该分类节点不出现（不显示空组）

---

## 6. Markmap 渲染与点击处理

### 6.1 渲染生命周期

```typescript
// KnowledgeMindmap.tsx 核心伪代码
const svgRef = useRef<SVGSVGElement>(null);
const mmRef = useRef<Markmap | null>(null);

// 挂载时创建实例
useEffect(() => {
  if (!svgRef.current) return;
  mmRef.current = Markmap.create(
    svgRef.current,
    { duration: 300, zoom: true, pan: true, maxWidth: 320 },
    data,
  );
  return () => {
    mmRef.current?.destroy();
    mmRef.current = null;
  };
}, []); // 仅挂载一次

// 数据变化时更新
useEffect(() => {
  if (!mmRef.current) return;
  mmRef.current.setData(data);
  mmRef.current.fit();
}, [data]);
```

### 6.2 点击事件绑定（事件委托）

为避免依赖 markmap 内部 API（便于未来升级），使用 HTML content + data attribute + 容器事件委托：

```typescript
// 构建树时，叶子节点 content 为 HTML：
// content: `<span data-doc-id="${doc.id}">${escapeHtml(doc.title)}</span>`

useEffect(() => {
  const svg = svgRef.current;
  if (!svg) return;
  const handleClick = (e: MouseEvent) => {
    const target = (e.target as Element).closest('[data-doc-id]');
    if (target) {
      const docId = target.getAttribute('data-doc-id');
      if (docId) onNodeClick(docId);
    }
  };
  svg.addEventListener('click', handleClick);
  return () => svg.removeEventListener('click', handleClick);
}, [onNodeClick]);
```

### 6.3 XSS 防护

文档标题进入 HTML content 前必须 escape：

```typescript
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;',
    '"': '&quot;', "'": '&#39;',
  })[c]!);
}
```

---

## 7. 后端与类型改动

### 7.1 后端

**`src/api/routes/knowledge.py`**：在 `KnowledgeDocResponse` 增加 `category` 字段，并在两处 `return` 语句（list 和 get 端点）中填充 `category=doc.category`。

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
    category: str  # NEW: EPC分类 (design/construction/quality/...)
```

`DocumentItem` 模型已包含 `category` 字段，无需改动。无需迁移。

### 7.2 前端类型

**`frontend/src/stores/knowledgeStore.ts`**：`KnowledgeDoc` 接口新增 `category: string`。

**`frontend/src/types/index.ts`**（如存在 DocumentItem 类型）：同步新增 `category: string`。

### 7.3 Store 扩展

无需扩展。`knowledgeStore.documents` 和 `projectStore.projects` 都已在现有 store 中可用。

---

## 8. 测试策略

### 8.1 单元测试

**`buildKnowledgeTree.test.ts`**（vitest）：
- 空文档数组 → 返回根节点 `content="知识库 (0)"`，children 为空
- 3 个文档分布在 2 个类别 → 正确分组、正确计数
- 文档 category 为未知值（不在 CATEGORY_ORDER 中）→ 归入"通用"节点
- 项目视图下 `project_id=null` 的文档 → 归入"公共模板/通用文档"节点
- 排序：分类按预定义顺序，文档在组内字典序

### 8.2 组件测试

**`KnowledgeGraph.test.tsx`**（vitest + happy-dom）：
- 切换 `graphMode` 时调用 buildKnowledgeTree 并传给 Markmap 组件（mock 后验证 props）
- 点击文档节点（模拟 `onNodeClick('doc-101')`）→ 设置 selectedDoc state → 抽屉打开
- 点击抽屉关闭按钮 → selectedDoc 清空 → 抽屉消失

**`KnowledgeMindmap.test.tsx`**（可选）：
- mock markmap-view 模块，验证 `Markmap.create` 被调用且参数正确
- 数据变化触发 `setData`
- 卸载触发 `destroy`

### 8.3 后端测试

**`tests/test_api_knowledge.py`**：验证 `GET /api/knowledge/documents` 响应包含 `category` 字段。

### 8.4 手动测试清单

- [ ] 列表视图 → 导图视图切换流畅
- [ ] EPC 分类视图显示所有 8 个分类，计数正确
- [ ] 项目关联视图显示所有项目 + 公共模板节点
- [ ] 点击叶子节点 → 右侧抽屉滑出 → 显示文档预览
- [ ] 抽屉关闭按钮可关闭
- [ ] 导图支持缩放（滚轮）、平移（拖拽）、节点折叠（点击分支节点）
- [ ] 切换视图时 markmap 实例正确销毁/重建，无内存泄漏

---

## 9. 不做的事（YAGNI 显式清单）

保持范围收敛：

- ❌ 不新增后端树聚合接口（`GET /api/knowledge/tree`）
- ❌ 不引入 d3 / reactflow / cytoscape（markmap-view 已足够）
- ❌ 不做第三、第四种视图（作者/doc_type/标签云）
- ❌ 不做图谱节点搜索（搜索留给列表视图）
- ❌ 不做节点拖拽、关系线、手动编辑结构
- ❌ 不做知识图谱语义关联（需 RAG，未来独立项目）
- ❌ 不做导图导出（PNG/SVG）— 以后有需求再加
- ❌ 不做 dark mode 专属配色 — markmap 默认主题已可接受

---

## 10. 风险与不确定性

### 10.1 markmap-view API 细节
`Markmap.setData()` 和 `fit()` 的确切签名需要在实施时从 `node_modules/markmap-view/dist/*.d.ts` 确认。若 API 不同，调整对应 useEffect 实现，不影响整体架构。

### 10.2 HTML content 支持
markmap 是否原生支持 content 字段为 HTML 而非纯文本需要验证。若不支持，回退方案：将文档 ID 作为 `payload`，通过 markmap 的节点数据回调获取（需要使用 markmap 的内部数据结构）。这会稍微增加 `KnowledgeMindmap` 组件的复杂度但不影响其他部分。

### 10.3 大量文档性能
当前 25 份种子数据的渲染性能无问题。若未来文档超过 500 份，markmap 的渲染可能变慢，届时可考虑：
- 按分类限制初始展开层级（仅展开到第一层）
- 或升级到后端聚合 + 虚拟滚动

---

## 11. 验收标准

- [x] 用户已批准设计方案
- [ ] 所有组件文件创建完成，代码通过 tsc、eslint、prettier
- [ ] `buildKnowledgeTree` 单元测试覆盖全部边界情况
- [ ] `KnowledgeGraph` 组件测试覆盖视图切换与节点点击
- [ ] 后端 `category` 字段测试通过
- [ ] 手动测试清单全部通过
- [ ] 代码已合并到 master，通过 pytest + tsc + eslint + ruff 全套验证
