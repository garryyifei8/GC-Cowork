# 牛油果协作平台 · 两周上线冲刺 Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 14 天内将 GC_TeamWork 从 ~68% 就绪度推进到可灰度上线的生产级质量，补齐向量库、容器化、监控、LLM 流式、前端 E2E 五大上线阻塞项。

**Architecture:** 三波冲刺（Wave 1 串行奠基 → Wave 2 并行补能 → Wave 3 收尾灰度）。Wave 1 决定部署环境与核心功能（pgvector + Docker），必须先完成；Wave 2 三条工作流互不冲突，可由 subagent 并行执行；Wave 3 回归测试 + 灰度发布。

**Tech Stack:**
- 向量检索：Supabase Postgres + pgvector 扩展 + FastEmbed (bge-small-zh-v1.5, 512 维)
- 容器化：Docker 多阶段构建 + docker-compose + 阿里云 ECS/ACR
- 监控：structlog (JSON 日志) + Sentry (错误追踪) + /metrics (Prometheus 文本格式)
- LLM：DeepSeek API + SSE 流式 + 指数退避重试 + 超时熔断
- 前端测试：Playwright (5 条关键路径 E2E)

---

## 工作分支与 Worktree

**工作分支：** `feat/launch-sprint`
**Worktree 路径：** `.worktrees/launch-sprint/`
**目标合并：** `master`（通过 PR，每个 Wave 一次 PR）

---

## 时间轴（14 天冲刺）

| 日期 | Day | Wave | 工作内容 | 执行模式 |
|---|---|---|---|---|
| 2026-04-11 (周六) | 1 | 1 | Wave 1 启动：plans 定稿 + pgvector migration + deps | 主会话 |
| 2026-04-12 (周日) | 2 | 1 | PgVectorStore + FastEmbedModel 实现 + 单元测试 | subagent |
| 2026-04-13 (周一) | 3 | 1 | KnowledgeRAG 接入 + API 路由切换 + 集成测试 | subagent |
| 2026-04-14 (周二) | 4 | 1 | Dockerfile (前后端) + docker-compose + 冒烟测试 | subagent |
| 2026-04-15 (周三) | 5 | 1 | 阿里云 ACR/ECS 部署文档 + Wave 1 PR 合并 | 主会话 |
| 2026-04-16 (周四) | 6 | 2 | Wave 2 并行启动（三个 subagent）+ Wave 2 详细计划 | 主会话 |
| 2026-04-17 (周五) | 7 | 2 | 监控埋点 / LLM 流式 / E2E 框架 同步推进 | subagent × 3 |
| 2026-04-18 (周六) | 8 | 2 | 三条工作流功能完成 | subagent × 3 |
| 2026-04-19 (周日) | 9 | 2 | 三条工作流集成联调 + Wave 2 PR | 主会话 |
| 2026-04-20 (周一) | 10 | 3 | 全量回归测试 + bug fix buffer | 主会话 |
| 2026-04-21 (周二) | 11 | 3 | 阿里云灰度部署（预发环境） | 主会话 |
| 2026-04-22 (周三) | 12 | 3 | 灰度验证 + 性能调优 + 负载测试 | 主会话 |
| 2026-04-23 (周四) | 13 | 3 | 生产部署 + 监控告警确认 | 主会话 |
| 2026-04-24 (周五) | 14 | 3 | 上线 buffer / 回滚演练 / 文档交付 | 主会话 |

**关键里程碑：**
- **M1 (Day 5)**：Wave 1 合并，后端可容器化运行，知识库 RAG 端到端可用
- **M2 (Day 9)**：Wave 2 合并，监控/LLM/E2E 就位，具备灰度条件
- **M3 (Day 11)**：预发环境灰度成功
- **M4 (Day 13)**：生产上线

---

## Wave 1：pgvector + Docker（Day 1-5）

**详细计划文件：** `doc/03-开发/plans/2026-04-11-wave1-pgvector-docker.md`

**执行模式：** subagent-driven-development（每个 Task 派一个 fresh subagent）

**工作流 A — pgvector RAG 接入（Day 1-3）**
- 添加 `asyncpg`、`pgvector`、`fastembed` 依赖到 `requirements.txt`
- 创建 Supabase migration：`enable extension vector; create table knowledge_embeddings (...)`
- 在 `src/knowledge/rag.py` 实现 `PgVectorStore(VectorStore)` 类
- 在 `src/knowledge/rag.py` 实现 `FastEmbedModel(EmbeddingModel)` 类
- `KnowledgeRAG.initialize()` 根据 `VECTOR_DB_BACKEND` 环境变量选择 backend
- 新增 `src/knowledge/dependencies.py` 提供 `get_rag()` FastAPI 依赖
- 改造 `src/api/routes/knowledge.py:81-118` 的 `/search` 端点调用 RAG
- 改造 `src/agents/knowledge.py:37-57` 的 `_build_knowledge_context()` 调用 RAG
- 新增 CLI 脚本 `scripts/ingest_knowledge.py` 用于将现有文档批量向量化入库
- 端到端集成测试（用真实 Supabase 连接）

**工作流 B — Docker + 阿里云部署（Day 4-5）**
- 创建根 `Dockerfile`（多阶段：Python 3.11-slim builder → runtime）
- 创建 `frontend/Dockerfile`（node:20-alpine builder → nginx:alpine runtime）
- 创建 `.dockerignore`、`frontend/.dockerignore`
- 创建 `docker-compose.yml`（backend + frontend + 可选 local-pg for dev）
- 创建 `.env.production.example`
- 创建 `deploy/aliyun-deploy.md`（ACR 推送 + ECS pull + systemd/compose 启动步骤）
- 扩展 `.github/workflows/ci.yml` 添加 docker-build job

**Wave 1 验收标准：**
1. `docker compose up` 后访问 `http://localhost/` 能看到前端，`http://localhost:8000/health` 返回 200
2. 向知识库导入至少 10 条文档后，`POST /api/knowledge/search` 返回语义相关结果（余弦相似度 > 0.5）
3. `KnowledgeAgent` 在聊天中能引用 RAG 检索的知识片段
4. `pytest tests/ -v` 全绿，包括新增的 `test_pgvector_store.py` 和 `test_fastembed_model.py`
5. `docker build .` 后端镜像 < 600MB，前端镜像 < 50MB
6. 阿里云 ECS 上拉取 ACR 镜像能正常启动（文档验证通过）

---

## Wave 2：监控 + LLM 流式 + 前端 E2E（Day 6-9）

**详细计划文件：** `doc/03-开发/plans/2026-04-16-wave2-observability-streaming-e2e.md`（Wave 1 完成后产出）

**执行模式：** 三个 subagent 并行推进，互不冲突

### 工作流 C — 可观测性（监控埋点）
- 新增 `src/core/logging.py`：structlog 配置，JSON 输出到 stdout
- 新增 `src/core/observability.py`：Sentry 初始化（`SENTRY_DSN` 环境变量）
- 新增 `src/api/routes/metrics.py`：`/metrics` 返回 Prometheus 文本格式（请求计数、延迟 P50/P95、错误率）
- 在 `src/main.py` startup 中初始化 logging + Sentry
- 在 FastAPI middleware 中注入 request_id + 结构化访问日志
- 所有现有的 `print()` / `logging.info()` 切换为 `structlog.get_logger()`
- 测试：`test_logging.py` 验证 JSON 字段、`test_metrics.py` 验证端点返回格式

### 工作流 D — LLM 流式响应与可靠性
- 改造 `src/llm/client.py`（或现有 LLM 调用入口）：新增 `stream_chat()` 异步生成器
- 在 `src/api/routes/chat.py` 新增 `POST /api/chat/stream` SSE 端点
- 新增指数退避重试装饰器：`@retry_llm(max_attempts=3, base_delay=1.0)`，处理 429/500/timeout
- 超时熔断：`httpx.AsyncClient(timeout=30)`，超时抛 `LLMTimeoutError`
- 前端 `frontend/src/services/api.ts` 新增 `streamChat(messages, onToken)` 使用 `EventSource`
- 前端 `frontend/src/pages/Chat.tsx` 接入流式显示
- 测试：`test_llm_streaming.py`（mock httpx），`test_retry.py`（模拟 429 后成功）

### 工作流 E — 前端 E2E 测试（5 条关键路径）
- 安装 Playwright：`cd frontend && npm i -D @playwright/test && npx playwright install chromium`
- 创建 `frontend/e2e/playwright.config.ts`
- E2E 用例 1：登录 → Overview 页面加载 → 看到项目卡片
- E2E 用例 2：Projects → 创建项目 → 列表刷新
- E2E 用例 3：Chat → 发送消息 → DispatchAgent 响应
- E2E 用例 4：Knowledge Base → 搜索 → 结果高亮
- E2E 用例 5：Tasks → 创建任务 → 拖拽状态变更
- CI 集成：`.github/workflows/ci.yml` 新增 `e2e` job

**Wave 2 验收标准：**
1. 后端日志为 JSON 格式，包含 request_id / user_id / latency_ms
2. Sentry 能捕获未处理异常并上报（测试用故意抛错端点验证）
3. `/metrics` 端点返回 Prometheus 可解析的文本
4. `POST /api/chat/stream` 能流式返回 token，前端 Chat 页面实时显示
5. DeepSeek 返回 429 时自动重试 3 次
6. 5 条 Playwright E2E 全部通过，CI 中稳定运行
7. Wave 2 PR 通过 code review 合并

---

## Wave 3：灰度发布与上线（Day 10-14）

**执行模式：** 主会话主导，关键操作前必须确认

### Day 10：全量回归
- [ ] 运行全部 pytest（含 integration 标记）
- [ ] 运行全部 Playwright E2E
- [ ] 手工检查 TOP 10 业务流程
- [ ] 修复 bug buffer

### Day 11：阿里云预发部署
- [ ] 确认 ACR 仓库、ECS 实例、Supabase 生产项目就位
- [ ] ECS 上 `docker compose -f docker-compose.prod.yml up -d`
- [ ] Supabase 生产库执行 migration + seed
- [ ] 烟囱测试：登录、Chat、知识库、创建项目

### Day 12：灰度验证 + 性能
- [ ] 配置 Sentry 告警规则（错误率 > 1% 时通知）
- [ ] 压力测试：`locust` 或 `k6` 模拟 50 并发用户 10 分钟
- [ ] 检查 P95 延迟 < 2s，错误率 < 0.5%
- [ ] 调优：根据 metrics 针对性优化

### Day 13：生产上线
- [ ] 切换 DNS 或负载均衡到生产实例
- [ ] 监控 Sentry + /metrics 30 分钟
- [ ] 发布通告

### Day 14：Buffer
- [ ] 回滚演练（手册验证）
- [ ] 交付上线文档 `doc/03-开发/上线运维手册.md`
- [ ] 复盘会议纪要

---

## Agent 分工

| Agent | 适用工作流 | 选用理由 |
|---|---|---|
| `Explore` | 代码探查、状态报告 | 只读、快 |
| `full-stack-development:python-pro` | 工作流 A（pgvector） | Python/FastAPI 专家 |
| `full-stack-development:deployment-engineer` | 工作流 B（Docker/阿里云） | CI/CD + 容器化专家 |
| `full-stack-development:observability-engineer` | 工作流 C（监控） | structlog/Prometheus/Sentry 专家 |
| `full-stack-development:fastapi-pro` | 工作流 D（LLM 流式） | SSE + async 专家 |
| `full-stack-development:test-automator` | 工作流 E（Playwright E2E） | 测试自动化专家 |
| `superpowers:code-reviewer` | 每个 Wave 合并前 | 独立 review |

---

## 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|---|---|---|---|
| Supabase pgvector 扩展版本不兼容 | 中 | 高 | Day 1 立即在 dev 环境验证 `create extension vector;` |
| FastEmbed 中文 bge 模型下载失败 | 低 | 中 | Docker 构建时预下载模型到镜像层 |
| DeepSeek 生产额度不足 | 低 | 高 | Day 2 确认月度配额，必要时提额 |
| Playwright 在 CI 不稳定 | 高 | 中 | 用 `retry: 2` + 独立 playwright CI job |
| 阿里云 ECS 首次配置阻塞 | 中 | 高 | Day 5 提前跑通部署文档，不等到 Day 11 |
| 两周时间不足 | 中 | 高 | Wave 3 的 Day 14 作为 buffer；若 Day 10 仍有 P0 bug，推迟上线至 Day 15-16 |

---

## 执行规则

1. **每个 Wave 一个 PR**，不混合 Wave 之间的改动
2. **Commit 规范：** Conventional Commits，scope 使用 `backend` / `frontend` / `infra` / `docs`
3. **每个 Task 完成后立刻 commit**，不攒大 commit
4. **subagent 完成后**，主会话用 `superpowers:code-reviewer` skill 做独立 review
5. **任何 Task 失败**：不跳过，不绕开，停下来定位根因
6. **每日简报：** 主会话在每日结束时更新 `doc/03-开发/plans/progress.md`（sprint 进度）

---

## 与 spec 的对照（覆盖度自检）

| 上线阻塞项（原 spec） | Wave | 工作流 | 覆盖情况 |
|---|---|---|---|
| ①向量数据库未接入 | 1 | A | ✅ pgvector + FastEmbed |
| ②容器化与部署配置缺失 | 1 | B | ✅ Dockerfile + compose + 阿里云 |
| ③前端 E2E 测试缺失 | 2 | E | ✅ Playwright 5 条关键路径 |
| ④生产级监控缺失 | 2 | C | ✅ structlog + Sentry + /metrics |
| ⑤LLM 流式与重试不完善 | 2 | D | ✅ SSE + retry + timeout |

**全部覆盖。** 额外收益：Wave 3 灰度流程、回滚演练、上线文档。

---

## 下一步

Master Plan 完成后：
1. 产出 `2026-04-11-wave1-pgvector-docker.md` 详细 TDD 计划
2. 等用户确认后启动 Wave 1 Task 1（添加依赖）

**plan owner：** 主会话（Claude Opus 4.6）
**最后更新：** 2026-04-11
