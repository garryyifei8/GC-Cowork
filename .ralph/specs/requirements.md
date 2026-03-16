# Technical Specifications — AI原生项目协作平台

> Source PRD: AI原生项目协作平台_PRD.md v1.0 (2026-03-09)
> Applicable scope: 政府专项债咨询 / 展馆博物馆EPC / 信息化智能化项目

---

## 1. System Architecture

### 1.1 Five-Layer Architecture

| Layer | Components | Responsibility |
|-------|-----------|----------------|
| Interaction Layer | Conversational UI, interactive cards, kanban view, mobile-responsive | Sole user touchpoint, multi-modal interaction |
| Agent Orchestration | Intent recognition, Agent routing, multi-Agent coordination, session management | Parse intent, route to specialized Agents |
| Agent Skills | Project, Finance, Legal, Procurement, HR, Bidding, Document, Knowledge Agents | Domain-specific business capabilities |
| Core Engines | Knowledge base engine, workflow engine, permission engine, learning engine | Platform infrastructure components |
| Data & Integration | Project data, document storage, external system APIs, vector database | Data persistence, external system integration |

### 1.2 Technology Stack

| Domain | Primary | Fallback |
|--------|---------|----------|
| LLM | DeepSeek-V3 / Qwen-Max | GLM-4 / Wenxin Yiyan |
| Vector DB | Milvus (domestic open source) | PgVector / Weaviate |
| Workflow Engine | Flowable + AI dynamic routing extension | Camunda / custom |
| Document Processing | Apache Tika + PaddleOCR | Baidu OCR API |
| Frontend | React / Vue 3 + Ant Design | Element Plus |
| Backend | Spring Boot 3 / Python FastAPI | Go Gin |
| Embedding Model | BGE-M3 (BAAI open source) | Qwen text-embedding |
| Message Queue | RocketMQ (Alibaba open source) | Kafka |
| Deployment | Private deployment on domestic GPU servers | Hybrid cloud |

**CRITICAL**: All LLM inference must use domestic Chinese models. Data must not leave China (compliance with 数据安全法 and 个人信息保护法).

**Model routing strategy**: Simple tasks → lightweight model (Qwen-7B); complex tasks → large parameter model.

---

## 2. Multi-Agent System

### 2.1 Agent Catalog

| Agent | Domain | Core Capabilities |
|-------|--------|------------------|
| Dispatch Agent (调度) | Universal routing | Intent recognition, Agent routing, multi-Agent coordination |
| 项目管理Agent | Project lifecycle | Progress tracking, milestone management, risk alerts, resource scheduling |
| 财务Agent | Finance | Expense audit, budget analysis, fund planning, invoice verification |
| 法务Agent | Legal/contracts | Contract clause review, risk annotation, compliance checks |
| 采购Agent | Procurement | Supplier matching, price comparison, procurement tracking |
| 人事Agent | HR | Attendance tracking, performance aggregation, recruitment tracking, policy Q&A |
| 投标Agent | Bidding | Tender monitoring, proposal framework generation, win probability scoring |
| 文档Agent | Documents | Document generation, template filling, format conversion, version management, smart summaries |
| 知识Agent | Knowledge mgmt | Experience retrieval, case recommendations, standards lookup, onboarding guidance |

### 2.2 Collaboration Patterns

**Serial (串行)**: Tasks flow sequentially between Agents. Example: Purchase request → 采购Agent → 财务Agent → 项目管理Agent.

**Parallel (并行)**: Multiple Agents work simultaneously, Dispatch Agent aggregates results. Example: Project kickoff evaluation — 法务Agent + 财务Agent + 采购Agent + 项目管理Agent produce individual reports → combined 《项目启动评估综合报告》.

**Human-in-the-loop (人机协同)**: Agent completes initial work, then @mentions real employees for confirmation. **MANDATORY human confirmation for**: amounts, contract signing, approval releases.

### 2.3 Agent Learning & Evolution

- **Feedback loop**: Employee "adopt/modify/reject" responses are recorded and used to improve Agent behavior
- **Knowledge injection**: New policies/processes automatically update corresponding Agent knowledge context
- **Behavior pattern learning**: Agents proactively suggest based on high-frequency operation patterns
- **Skill plugin architecture**: Agent capabilities developed as hot-swappable Skill plugins

---

## 3. Enterprise Knowledge Base

### 3.1 Knowledge Categories

| Type | Content Examples | Source |
|------|-----------------|--------|
| Project knowledge | Project plans, construction records, acceptance reports, lessons learned | Project delivery process |
| Regulations | Company management policies, approval workflows, job manuals | Management releases |
| Industry knowledge | Special bond policy documents, EPC industry standards, IT standards | External collection + internal compilation |
| Template library | Contract templates, proposal templates, report templates, official document templates | Historical accumulation |
| Supplier database | Supplier qualifications, historical cooperation ratings, price records | Procurement department |

### 3.2 Knowledge Base Capabilities

- **Smart ingestion**: Auto-extract summary, tag, link to project/department upon upload. Supported formats: PDF, Word, Excel, images
- **Semantic retrieval**: Natural language queries via RAG architecture — matches semantics not just keywords
- **Context-aware recommendations**: Push relevant knowledge based on employee's current project/task context
- **Version management**: Templates and policy documents support versioning; auto-prompt for latest version
- **Permission isolation**: Knowledge access controlled by classification level and department

---

## 4. Core Business Scenarios

### 4.1 Project Full Lifecycle

Stages: 立项 → 投标 → 中标 → 签约 → 设计 → 采购 → 施工/实施 → 验收 → 结算 → 归档

| Stage | AI Capabilities |
|-------|----------------|
| 立项 | 投标Agent monitors tender websites, matches company qualifications, pushes matches; conversational generation of feasibility report draft |
| 投标 | Auto-decompose tender requirements, generate proposal framework, retrieve similar project performance from knowledge base; AI win probability scoring |
| 执行 | 项目管理Agent daily progress deviation summary, auto-generate weekly reports; risk detection triggers alert workflows |
| 结算 | 财务Agent auto-reconciles contract amounts vs. actual spend, annotates discrepancies, generates settlement list draft |
| 归档 | 知识Agent auto-extracts lessons learned, structured entry into knowledge base for future project reference |

### 4.2 Cross-Department Workflows

#### Finance Workflows
- **Expense reimbursement**: AI pre-audit invoice authenticity and compliance → auto-match budget categories → flag anomalies for human review
- **Budget management**: Real-time budget utilization monitoring → overspend alerts → auto-notify project manager and finance head
- **Fund planning**: Auto-generate monthly cash requirement forecast based on project progress → push to CFO

#### Legal Workflows
- **Contract review**: Upload contract → 法务Agent annotates risk clauses → compare with standard templates → generate revision suggestions
- **Compliance scan**: New policy triggers automatic compliance impact scan across active projects → generate adjustment recommendations

#### Procurement Workflows
- **Purchase request**: Employee describes need → Agent recommends historical suppliers and reference prices → auto-generate purchase requisition
- **Supplier evaluation**: Aggregate delivery quality, pricing, lead time data → generate supplier scorecard

#### HR Workflows
- **Attendance**: Anomalies auto-notified → employee submits correction/leave via conversation → Agent routes through approval workflow
- **Performance**: Auto-extract employee participation and contribution from project data → assist in generating initial performance assessments

---

## 5. Interaction Design

### 5.1 Conversational UI as Primary Interface
- Main interface centered on conversation window (not traditional menu navigation)
- Supports text, voice, images, file attachments (multi-modal input)
- All features accessible via natural language commands

### 5.2 Interactive Card System

| Card Type | Description | Use Cases |
|-----------|-------------|-----------|
| Action cards | Task cards with buttons (approve/reject, view details, assign to…) | Approval flows, task assignment |
| Data cards | Data summaries with embedded charts (Gantt, budget pie chart) | Project reports, data analysis |
| Form cards | Fill forms directly in conversation, no page redirects | Expense forms, leave requests, purchase orders |
| File cards | Document preview, online editing, version comparison | Contract review, document collaboration |

### 5.3 Supplementary Views (accessible via conversation commands)
- **Kanban**: Task status by project/department
- **Calendar**: Milestones and deadlines
- **Gantt chart**: Project timeline and dependencies
- **Dashboard**: Management overview with custom KPIs

---

## 6. Non-Functional Requirements

### 6.1 Performance

| Metric | Requirement |
|--------|-------------|
| Agent response time | Simple Q&A < 3s; complex analysis < 15s |
| Concurrent users | 200+ simultaneous online users |
| Knowledge retrieval | Million-document retrieval < 2s (vector similarity) |
| System availability | 99.5% during business hours |

### 6.2 Security & Compliance

- **Encryption**: Full-link TLS 1.3; field-level database encryption
- **Data sovereignty**: LLM inference data must NOT leave China
- **Compliance**: 数据安全法, 个人信息保护法
- **Audit logging**: Full operation log recording with audit traceability
- **Data desensitization**: Sensitive data (contract amounts, salaries) desensitized before entering LLM context
- **Access control**: RBAC + ABAC fine-grained control; minimum necessary access principle
- **Security standard**: 等保三级 (Level 3 Information Security Protection) for government project data

### 6.3 Scalability & Extensibility

- **Skill plugin architecture**: Hot-swappable Agent capabilities
- **Workflow customization**: Visual workflow template editor for business users
- **External integration**: Standard API gateway for OA, ERP, financial systems
- **Model portability**: Multi-model switching; not locked to single LLM provider

### 6.4 Deployment

Private deployment on domestic GPU servers (Huawei Ascend / Haiguang AI).
Auxiliary capabilities may optionally use domestic cloud APIs.

---

## 7. Implementation Phases

| Phase | Duration | Key Deliverables | Priority |
|-------|----------|-----------------|----------|
| P0: Foundation | 8-10 weeks | Conversational engine, universal Agent, knowledge base foundation, permission system, basic UI | Critical |
| P1: Core Scenarios | 8-10 weeks | 项目管理Agent, 文档Agent, 投标Agent, project kanban, workflow engine | High |
| P2: Functional Agents | 8-10 weeks | 财务/法务/采购/人事Agent, cross-department workflows, interactive card system | Medium |
| P3: Intelligent Evolution | Continuous | Feedback learning, behavior prediction, smart recommendations, analytics dashboard | Ongoing |

Agile development: 2-week sprints. Start P0 with 1-2 pilot projects before full rollout.

---

## 8. Success Metrics

| Dimension | Target |
|-----------|--------|
| Information sync speed | Project info reaches all stakeholders < 5 minutes |
| Coordination cost reduction | Human coordination effort reduced 50%+ |
| Knowledge reuse improvement | Knowledge reuse rate improved 60%+ |
| Decision efficiency | Approval cycle shortened 30%+ |
