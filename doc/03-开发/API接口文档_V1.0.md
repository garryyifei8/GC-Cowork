# API接口文档 V1.0

| 属性 | 值 |
|------|------|
| 版本 | V1.0 |
| 日期 | 2026-03-16 |
| 状态 | 初稿 |
| 基础URL | `http://localhost:8000/api` |
| 协议 | HTTP/HTTPS |
| 数据格式 | JSON |

---

## 目录

1. [通用说明](#1-通用说明)
2. [健康检查 (Health)](#2-健康检查-health)
3. [AI对话 (Chat)](#3-ai对话-chat)
4. [项目管理 (Projects)](#4-项目管理-projects)
5. [任务管理 (Tasks)](#5-任务管理-tasks)
6. [活动日志 (Activities)](#6-活动日志-activities)
7. [投标管理 (Bidding)](#7-投标管理-bidding)
8. [仪表盘 (Dashboard)](#8-仪表盘-dashboard)
9. [人事管理 (HR)](#9-人事管理-hr)
10. [财务管理 (Finance)](#10-财务管理-finance)
11. [OA办公 (OA)](#11-oa办公-oa)

---

## 1. 通用说明

### 1.1 请求格式

- Content-Type: `application/json`
- 字符编码: UTF-8

### 1.2 错误响应格式

**422 校验错误：**
```json
{
  "error_code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "detail": {
    "errors": [
      {"field": "body.message", "message": "String should have at least 1 character", "type": "string_too_short"}
    ]
  }
}
```

**业务错误（404等）：**
```json
{
  "error_code": "PROJECT_NOT_FOUND",
  "message": "Project proj-999 not found",
  "detail": {"project_id": "proj-999"}
}
```

### 1.3 通用字段枚举

| 枚举 | 可选值 |
|------|--------|
| 项目状态 | `active` / `risk` / `planning` / `completed` |
| 项目阶段 | `initiation` / `bidding` / `contract` / `design` / `procurement` / `construction` / `acceptance` / `settlement` / `archived` |
| 任务状态 | `todo` / `in_progress` / `review` / `done` / `blocked` |
| 任务优先级 | `high` / `medium` / `low` |
| 审批状态 | `pending` / `approved` / `rejected` |

---

## 2. 健康检查 (Health)

### GET /api/health

健康检查端点，用于监控服务状态。

**响应 200：**
```json
{
  "status": "ok",
  "version": "0.1.0",
  "app_name": "GC-TeamWork"
}
```

---

## 3. AI对话 (Chat)

### 3.1 POST /api/chat

简单对话端点，前端主要使用的对话接口。

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | string | 是 | 用户消息（1-4096字符，不可为空白） |
| context | array | 否 | 对话历史上下文 `[{role, content}]` |

**请求示例：**
```json
{
  "message": "当前项目进度如何？",
  "context": [
    {"role": "user", "content": "你好"},
    {"role": "agent", "content": "您好！请问有什么可以帮您？"}
  ]
}
```

**响应 200：**
| 字段 | 类型 | 说明 |
|------|------|------|
| reply | string | AI回复文本 |
| agent_type | string | 处理Agent类型 |
| cards | array | 交互卡片列表 |

**响应示例：**
```json
{
  "reply": "当前共有10个项目在管理中，以下是进度概览...",
  "agent_type": "project",
  "cards": [
    {
      "card_type": "progress",
      "title": "项目进度总览",
      "data": {
        "overall": 45,
        "projects": [
          {"id": "proj-001", "name": "省立博物馆EPC工程", "progress_pct": 68, "status": "active"}
        ]
      },
      "actions": [{"label": "查看详情"}, {"label": "风险分析"}]
    }
  ]
}
```

### 3.2 POST /api/chat/stream

SSE流式对话端点。返回 `text/event-stream`。

**请求体：** 同 POST /api/chat

**SSE事件类型：**

| 事件 | 数据格式 | 说明 |
|------|---------|------|
| token | `{"content": "..."}` | 逐token输出的文本片段 |
| done | `{"agent_type": "...", "cards": [...], "full_content": "..."}` | 流结束，包含完整回复和卡片 |
| error | `{"error": "..."}` | 错误信息 |

**SSE响应示例：**
```
event: token
data: {"content": "当前"}

event: token
data: {"content": "共有"}

event: done
data: {"agent_type": "project", "cards": [...], "full_content": "当前共有10个项目..."}
```

### 3.3 POST /api/chat/message

会话消息端点，带session管理。

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| session_id | UUID | 否 | 会话ID（为空时自动创建） |
| user_id | string | 是 | 用户ID（1-128字符） |
| message | string | 是 | 用户消息（1-4096字符） |

**响应 200：**
| 字段 | 类型 | 说明 |
|------|------|------|
| session_id | UUID | 会话ID |
| message_id | UUID | 消息ID |
| content | string | AI回复内容 |
| agent_type | string | 处理Agent类型 |
| cards | array | 交互卡片 |
| requires_human_confirmation | boolean | 是否需要人工确认 |

### 3.4 POST /api/chat/sessions

创建新会话。

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | string | 是 | 用户ID |
| title | string | 否 | 会话标题 |

**响应 200：**
```json
{
  "session_id": "uuid",
  "user_id": "user1",
  "title": "新对话",
  "message_count": 0
}
```

### 3.5 GET /api/chat/sessions

列出用户的所有会话。

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | string | 是 | 用户ID |

**响应 200：** `SessionSummary[]`

---

## 4. 项目管理 (Projects)

### 4.1 GET /api/projects

列出所有项目。

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 按状态筛选（active/risk/planning/completed） |

**响应 200：** `ProjectListItem[]`
```json
[
  {
    "id": "proj-001",
    "name": "省立博物馆EPC工程",
    "project_type": "EPC / 展馆",
    "stage": "construction",
    "status": "active",
    "status_label": "施工中",
    "progress_pct": 68.0,
    "due_date": "2026-10-15",
    "budget": "1.2亿",
    "team_size": 12,
    "team_members": ["张工", "李设计", ...]
  }
]
```

### 4.2 GET /api/projects/{project_id}

获取项目详情（含任务列表）。

**响应 200：** `ProjectDetail`（扩展ProjectListItem，增加budget_amount, actual_spend, risks, milestones, tasks）

### 4.3 POST /api/projects

创建新项目。

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 项目名称（1-256字符） |
| project_type | string | 否 | 项目类型 |
| budget_display | string | 否 | 预算显示文本 |

**响应 201：** `ProjectListItem`

### 4.4 PATCH /api/projects/{project_id}

部分更新项目。

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 项目名称 |
| status | string | 否 | 项目状态 |
| status_label | string | 否 | 状态标签 |
| progress_pct | float | 否 | 进度百分比 |
| due_date | string | 否 | 截止日期 |

**响应 200：** `ProjectListItem`

### 4.5 DELETE /api/projects/{project_id}

删除项目。

**响应 204：** 无内容

### 4.6 POST /api/projects/{project_id}/transition

推进项目阶段。

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| target_stage | string | 是 | 目标阶段枚举值 |

**响应 200：** `ProjectListItem`

**错误响应 400：**
```json
{
  "error_code": "INVALID_TRANSITION",
  "message": "无法从「施工/实施」转换到「立项」",
  "current_stage": "construction",
  "valid_transitions": [{"value": "acceptance", "label": "验收"}]
}
```

### 4.7 GET /api/projects/{project_id}/tasks

列出项目下的所有任务。

**响应 200：** `TaskListItem[]`

### 4.8 POST /api/projects/{project_id}/tasks

在项目下创建任务。

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 任务名称（1-256字符） |
| assignee | string | 否 | 负责人 |
| priority | string | 否 | 优先级（默认medium） |
| due_date | string | 否 | 截止日期 |
| description | string | 否 | 描述 |

**响应 201：** `TaskListItem`

### 4.9 GET /api/projects/{project_id}/activities

获取项目活动日志。

**响应 200：** `ActivityListItem[]`

### 4.10 GET /api/projects/{project_id}/documents

获取项目文档列表。

**响应 200：** `DocumentListItem[]`

### 4.11 里程碑管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/projects/{project_id}/milestones` | 创建里程碑 |
| PATCH | `/api/projects/{project_id}/milestones/{milestone_id}` | 更新里程碑（按索引） |
| DELETE | `/api/projects/{project_id}/milestones/{milestone_id}` | 删除里程碑（按索引） |

**创建里程碑请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 里程碑名称 |
| date | string | 否 | 日期 |
| status | string | 否 | 状态（pending/completed/delayed，默认pending） |

### 4.12 风险管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/projects/{project_id}/risks` | 创建风险 |
| PATCH | `/api/projects/{project_id}/risks/{risk_id}` | 更新风险（按索引） |
| DELETE | `/api/projects/{project_id}/risks/{risk_id}` | 删除风险（按索引） |

**创建风险请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| description | string | 是 | 风险描述 |
| level | string | 否 | 风险等级（low/medium/high/critical，默认medium） |
| mitigation | string | 否 | 缓解措施 |

### 4.13 团队成员管理

| 方法 | 路径 | 说明 |
|------|------|------|
| PUT | `/api/projects/{project_id}/team` | 替换整个团队成员列表 |
| POST | `/api/projects/{project_id}/team` | 添加团队成员 |
| DELETE | `/api/projects/{project_id}/team/{member_name}` | 移除团队成员 |

### 4.14 采购管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/{project_id}/procurement` | 获取项目采购包列表 |
| PUT | `/api/projects/{project_id}/procurement/{pkg_id}` | 更新采购包 |

**采购包响应：**
```json
{
  "items": [
    {
      "id": "pkg1",
      "project_id": "proj-001",
      "name": "钢结构采购包",
      "category": "材料设备",
      "supplier": "XX公司",
      "budget_amount": 5000000,
      "actual_amount": 4800000,
      "status": "contracted",
      "plan_date": "2026-03-01",
      "arrival_date": "2026-04-15",
      "responsible": "张三"
    }
  ]
}
```

### 4.15 过程记录管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/projects/{project_id}/processes?record_type=` | 获取过程记录（可按类型筛选） |
| POST | `/api/projects/{project_id}/processes` | 创建过程记录 |

---

## 5. 任务管理 (Tasks)

### 5.1 GET /api/tasks

列出全局所有任务（跨项目）。

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| assignee | string | 否 | 按负责人筛选 |
| status | string | 否 | 按状态筛选 |
| priority | string | 否 | 按优先级筛选 |

**响应 200：** `TaskWithProject[]`（在TaskListItem基础上增加project_name字段）

### 5.2 GET /api/tasks/{task_id}

获取单个任务详情。

**响应 200：** `TaskListItem`

### 5.3 PATCH /api/tasks/{task_id}

更新任务。

**请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 否 | 任务名称 |
| assignee | string | 否 | 负责人 |
| status | string | 否 | 状态（todo/in_progress/review/done/blocked） |
| priority | string | 否 | 优先级（high/medium/low） |
| due_date | string | 否 | 截止日期 |
| description | string | 否 | 描述 |

**响应 200：** `TaskListItem`

### 5.4 DELETE /api/tasks/{task_id}

删除任务。

**响应 204：** 无内容

---

## 6. 活动日志 (Activities)

### GET /api/activities/recent

获取全局最近活动日志。

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | int | 否 | 返回数量限制（1-100，默认10） |

**响应 200：** `ActivityListItem[]`
```json
[
  {
    "id": "act-001",
    "project_id": "proj-001",
    "event_type": "task_updated",
    "actor": "张工",
    "summary": "任务 '幕墙安装' 已更新",
    "detail": {"task_id": "t1", "updates": {"status": "done"}},
    "created_at": "2026-03-16T10:30:00"
  }
]
```

---

## 7. 投标管理 (Bidding)

### 7.1 GET /api/bidding/opportunities

列出投标机会。

**查询参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 否 | 按类别筛选 |
| status | string | 否 | 按状态筛选 |

**响应 200：** `BiddingListItem[]`
```json
[
  {
    "id": "bid-001",
    "title": "XX市博物馆装修工程",
    "source": "政府采购网",
    "publish_date": "2026-03-10",
    "deadline": "2026-04-10",
    "budget_amount": "5000万",
    "region": "华东",
    "category": "EPC",
    "status": "monitoring",
    "match_score": 85.0
  }
]
```

### 7.2 GET /api/bidding/opportunities/{opp_id}

获取单个投标机会详情。

**响应 200：** `BiddingListItem`

---

## 8. 仪表盘 (Dashboard)

### 8.1 GET /api/dashboard/metrics

获取仪表盘聚合指标。

**响应 200：** `DashboardMetrics`
```json
{
  "total_projects": 10,
  "active_projects": 6,
  "at_risk_projects": 2,
  "completed_projects": 1,
  "total_tasks": 45,
  "overdue_tasks": 5,
  "completion_rate": 35.6,
  "stage_distribution": {"施工/实施": 3, "设计": 1, "立项": 1, "...": "..."},
  "task_status_distribution": {"todo": 12, "in_progress": 15, "done": 10, "blocked": 3},
  "budget_summary": [
    {"project_id": "proj-001", "project_name": "省立博物馆EPC工程", "budget_amount": 12000.0, "actual_spend": 8160.0}
  ],
  "project_risks": [
    {"project_id": "proj-002", "project_name": "发改委平台信息化二期", "risk_score": 78.5, "risk_level": "high", "top_risk": "进度严重滞后"}
  ],
  "ai_insights": [
    {"title": "进度预警", "description": "发改委平台信息化二期进度仅35%...", "severity": "warning", "project_id": "proj-002"}
  ]
}
```

### 8.2 GET /api/dashboard/suggestions

获取AI建议列表。

**响应 200：** `SuggestionItem[]`
```json
[
  {
    "id": "sug-001",
    "type": "resource_optimization",
    "title": "建议加派前端人力",
    "description": "发改委项目前端开发阻塞...",
    "priority": "high",
    "project_id": "proj-002",
    "suggested_action": {"action_type": "assign_resource", "params": {"role": "frontend"}}
  }
]
```

---

## 9. 人事管理 (HR)

### 9.1 员工管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/hr/employees?department=&status=` | 列出员工 |
| GET | `/api/hr/employees/{employee_id}` | 员工详情 |
| POST | `/api/hr/employees` | 创建员工 |
| PATCH | `/api/hr/employees/{employee_id}` | 更新员工 |

**创建员工请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 姓名 |
| department | string | 是 | 部门 |
| position | string | 是 | 职位 |
| hire_date | string | 是 | 入职日期 |
| salary | float | 是 | 薪资（>0） |
| status | string | 否 | 状态（默认active） |
| phone | string | 否 | 电话 |
| email | string | 否 | 邮箱 |

### 9.2 考勤管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/hr/attendance?employee_id=&date_from=&date_to=` | 列出考勤记录 |
| POST | `/api/hr/attendance` | 创建考勤记录 |

### 9.3 请假管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/hr/leaves?employee_id=&status=` | 列出请假申请 |
| POST | `/api/hr/leaves` | 创建请假申请 |
| PATCH | `/api/hr/leaves/{leave_id}` | 审批请假（更新status和approver） |

**创建请假请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| employee_id | string | 是 | 员工ID |
| leave_type | string | 是 | 请假类型（annual/sick/personal/maternity） |
| start_date | string | 是 | 开始日期 |
| end_date | string | 是 | 结束日期 |
| days | float | 是 | 天数（>0） |
| reason | string | 否 | 原因 |

### 9.4 薪资查询

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/hr/salary?employee_id=&month=` | 列出薪资记录 |

### 9.5 HR汇总与洞察

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/hr/summary` | HR汇总指标（在职人数、部门分布、平均薪资、出勤率） |
| GET | `/api/hr/insights` | 规则引擎生成的HR洞察（考勤异常、请假冲突、人力平衡） |

---

## 10. 财务管理 (Finance)

### 10.1 报销管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/finance/expenses?status=&project_id=&submitter=` | 列出报销单 |
| GET | `/api/finance/expenses/{expense_id}` | 报销单详情 |
| POST | `/api/finance/expenses` | 创建报销单 |
| PATCH | `/api/finance/expenses/{expense_id}` | 更新/审批报销单 |

**创建报销单请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| submitter | string | 是 | 提交人 |
| project_id | string | 否 | 关联项目ID |
| category | string | 是 | 费用类别（travel/office/entertainment/material/other） |
| amount | float | 是 | 金额（>0） |
| description | string | 否 | 描述 |
| receipts_count | int | 否 | 票据数量 |
| submit_date | string | 否 | 提交日期 |

**报销状态流转：** `draft` -> `submitted` -> `approved` / `rejected` -> `paid`

### 10.2 预算管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/finance/budgets?project_id=&fiscal_year=` | 列出预算行 |
| POST | `/api/finance/budgets` | 创建预算行 |
| PATCH | `/api/finance/budgets/{budget_id}` | 更新预算行 |

### 10.3 发票管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/finance/invoices?status=&project_id=` | 列出发票 |
| POST | `/api/finance/invoices` | 创建发票 |
| PATCH | `/api/finance/invoices/{invoice_id}` | 更新发票 |

**发票状态：** `pending` / `paid` / `overdue`

### 10.4 AI票据识别

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/finance/expenses/parse-receipt` | AI票据解析（Mock） |

**请求：** `multipart/form-data`，字段 `file` 为上传的票据图片。

**响应 200：**
```json
{
  "amount": 156.50,
  "date": "2026-03-13",
  "category": "travel",
  "vendor": "滴滴出行",
  "description": "出差交通费",
  "confidence": 0.92
}
```

### 10.5 财务汇总与洞察

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/finance/summary` | 财务KPI汇总（报销总额、预算执行率、逾期发票等） |
| GET | `/api/finance/insights` | 规则引擎生成的财务洞察 |

---

## 11. OA办公 (OA)

### 11.1 通知管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/oa/notices?target_user=&type=&is_read=` | 列出通知 |
| POST | `/api/oa/notices` | 创建通知 |
| PATCH | `/api/oa/notices/{notice_id}` | 更新通知（标记已读等） |

**创建通知请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 通知标题 |
| content | string | 是 | 通知内容 |
| type | string | 否 | 类型（system/announcement/approval_result，默认system） |
| target_user | string | 否 | 目标用户（null为全员广播） |

### 11.2 用车申请管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/oa/vehicle-requests?applicant=&status=` | 列出用车申请 |
| POST | `/api/oa/vehicle-requests` | 创建用车申请 |
| PATCH | `/api/oa/vehicle-requests/{request_id}` | 审批用车申请 |

**创建用车申请请求体：**
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| applicant | string | 是 | 申请人 |
| date | string | 是 | 用车日期 |
| origin | string | 是 | 出发地 |
| destination | string | 是 | 目的地 |
| reason | string | 否 | 事由 |

---

## 附录：卡片类型速查

AI对话返回的 `cards` 数组中，每张卡片的 `card_type` 对应不同的前端交互控件：

| card_type | 名称 | data结构 | 说明 |
|-----------|------|---------|------|
| data | 数据卡片 | `{key: value}` | 通用键值数据展示 |
| action | 操作卡片 | `{}` + actions | 提供操作按钮 |
| alert | 预警卡片 | `{severity: "warning/danger/info/success"}` | 风险/异常提示 |
| task_list | 任务列表 | `{tasks: [...]}` | 可交互任务列表控件 |
| kanban | 看板 | `{tasks: [...]}` | 拖拽看板控件 |
| progress | 进度图 | `{overall, projects: [...]}` | 柱状进度图 |
| table | 表格 | `{projects: [...]}` 或 `{headers, rows}` 或 `{packages: [...]}` | 表格控件 |
| chart | 图表 | `{distribution: {...}}` 或 `{stages: {...}}` | 环形/柱状图表 |
| file | 文件 | `{filename, type, size, author}` | 文件信息卡片 |
| report | 报告 | `{sections: [{title, content}]}` | 长文本报告 |

---

*文档结束*
