-- ============================================================================
-- 牛油果CoWork — 初始数据库 Schema
-- 29张业务表 + 自动更新触发器 + 索引
-- ============================================================================

-- 自动更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. 用户与角色
-- ============================================================================

CREATE TABLE users (
    id              TEXT PRIMARY KEY,
    auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    username        TEXT UNIQUE NOT NULL,
    display_name    TEXT NOT NULL DEFAULT '',
    email           TEXT,
    phone           TEXT,
    department      TEXT NOT NULL DEFAULT '',
    roles           TEXT[] NOT NULL DEFAULT '{}',
    attributes      JSONB NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE roles (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    permissions     TEXT[] NOT NULL DEFAULT '{}',
    description     TEXT,
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_roles_updated BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. 项目管理核心
-- ============================================================================

CREATE TABLE projects (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    project_type    TEXT NOT NULL DEFAULT '',
    stage           TEXT NOT NULL DEFAULT 'initiation'
                    CHECK (stage IN ('initiation','bidding','contract','design',
                           'procurement','construction','acceptance','settlement','archived')),
    status          TEXT NOT NULL DEFAULT 'planning'
                    CHECK (status IN ('active','risk','planning','completed')),
    status_label    TEXT NOT NULL DEFAULT '',
    progress_pct    NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (progress_pct >= 0 AND progress_pct <= 100),
    budget          NUMERIC(14,2),
    actual_spend    NUMERIC(14,2),
    budget_display  TEXT,
    due_date        DATE,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_stage ON projects(stage);
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE project_members (
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    member_name     TEXT NOT NULL,
    employee_id     TEXT,
    role_in_project TEXT,
    PRIMARY KEY (project_id, member_name)
);
CREATE INDEX idx_project_members_project ON project_members(project_id);

CREATE TABLE project_risks (
    id              TEXT PRIMARY KEY DEFAULT 'risk-' || substr(gen_random_uuid()::text, 1, 8),
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    severity        TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high','critical')),
    owner           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_risks_project ON project_risks(project_id);
CREATE TRIGGER trg_project_risks_updated BEFORE UPDATE ON project_risks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE project_milestones (
    id              TEXT PRIMARY KEY DEFAULT 'ms-' || substr(gen_random_uuid()::text, 1, 8),
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    date            DATE,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','overdue')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_project_milestones_project ON project_milestones(project_id);
CREATE TRIGGER trg_project_milestones_updated BEFORE UPDATE ON project_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. 任务
-- ============================================================================

CREATE TABLE tasks (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    assignee        TEXT,
    status          TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','review','done','blocked')),
    priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
    due_date        DATE,
    description     TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE TRIGGER trg_tasks_updated BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. 活动日志
-- ============================================================================

CREATE TABLE activity_events (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL,
    actor           TEXT NOT NULL,
    summary         TEXT NOT NULL,
    detail          JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_events_project ON activity_events(project_id);
CREATE INDEX idx_activity_events_created ON activity_events(created_at DESC);

-- ============================================================================
-- 5. 投标管理
-- ============================================================================

CREATE TABLE bidding_opportunities (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    source          TEXT NOT NULL DEFAULT '',
    publish_date    DATE,
    deadline        DATE,
    budget_amount   TEXT,
    region          TEXT NOT NULL DEFAULT '',
    category        TEXT NOT NULL DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'monitoring'
                    CHECK (status IN ('monitoring','analyzing','preparing','submitted','won','lost')),
    match_score     NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (match_score >= 0 AND match_score <= 100),
    project_id      TEXT REFERENCES projects(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_bidding_status ON bidding_opportunities(status);
CREATE TRIGGER trg_bidding_updated BEFORE UPDATE ON bidding_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. 文档管理
-- ============================================================================

CREATE TABLE documents (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    doc_type        TEXT NOT NULL DEFAULT 'report',
    project_id      TEXT REFERENCES projects(id) ON DELETE SET NULL,
    content_summary TEXT NOT NULL DEFAULT '',
    version         TEXT NOT NULL DEFAULT '1.0',
    author          TEXT NOT NULL DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','final')),
    category        TEXT NOT NULL DEFAULT 'general'
                    CHECK (category IN ('general','design','construction','quality',
                           'safety','completion','contract','change')),
    storage_path    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_project ON documents(project_id);
CREATE INDEX idx_documents_category ON documents(category);
CREATE TRIGGER trg_documents_updated BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. 人事管理
-- ============================================================================

CREATE TABLE employees (
    id              TEXT PRIMARY KEY,
    user_id         TEXT REFERENCES users(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    department      TEXT NOT NULL,
    position        TEXT NOT NULL,
    hire_date       DATE NOT NULL,
    salary          NUMERIC(12,2) NOT NULL,
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','on_leave','resigned')),
    phone           TEXT NOT NULL DEFAULT '',
    email           TEXT NOT NULL DEFAULT '',
    emergency_contact TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);
CREATE TRIGGER trg_employees_updated BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE project_members ADD CONSTRAINT fk_project_members_employee
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;

CREATE TABLE attendance_records (
    id              TEXT PRIMARY KEY,
    employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date            DATE NOT NULL,
    check_in        TIME,
    check_out       TIME,
    status          TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal','late','absent','leave')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (employee_id, date)
);
CREATE INDEX idx_attendance_employee ON attendance_records(employee_id);
CREATE TRIGGER trg_attendance_updated BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE leave_requests (
    id              TEXT PRIMARY KEY,
    employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_type      TEXT NOT NULL CHECK (leave_type IN ('annual','sick','personal','maternity')),
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    days            NUMERIC(4,1) NOT NULL,
    reason          TEXT NOT NULL DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    approver        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leave_employee ON leave_requests(employee_id);
CREATE TRIGGER trg_leave_updated BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE salary_records (
    id              TEXT PRIMARY KEY,
    employee_id     TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    month           TEXT NOT NULL,
    base_salary     NUMERIC(12,2) NOT NULL,
    overtime_pay    NUMERIC(12,2) NOT NULL DEFAULT 0,
    bonus           NUMERIC(12,2) NOT NULL DEFAULT 0,
    deductions      NUMERIC(12,2) NOT NULL DEFAULT 0,
    social_insurance NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax             NUMERIC(12,2) NOT NULL DEFAULT 0,
    net_salary      NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_salary_employee ON salary_records(employee_id);
CREATE TRIGGER trg_salary_updated BEFORE UPDATE ON salary_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. 财务管理
-- ============================================================================

CREATE TABLE expense_reports (
    id              TEXT PRIMARY KEY,
    submitter       TEXT NOT NULL,
    project_id      TEXT REFERENCES projects(id) ON DELETE SET NULL,
    category        TEXT NOT NULL CHECK (category IN ('travel','office','entertainment','material','other')),
    amount          NUMERIC(14,2) NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    receipts_count  INT NOT NULL DEFAULT 0,
    submit_date     DATE,
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','approved','rejected','paid')),
    approver        TEXT,
    payment_date    DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_expense_status ON expense_reports(status);
CREATE TRIGGER trg_expense_updated BEFORE UPDATE ON expense_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE budget_lines (
    id              TEXT PRIMARY KEY,
    project_id      TEXT REFERENCES projects(id) ON DELETE SET NULL,
    category        TEXT NOT NULL,
    planned_amount  NUMERIC(14,2) NOT NULL,
    actual_amount   NUMERIC(14,2) NOT NULL DEFAULT 0,
    fiscal_year     INT NOT NULL DEFAULT 2026,
    quarter         INT NOT NULL DEFAULT 1,
    notes           TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_budget_project ON budget_lines(project_id);
CREATE TRIGGER trg_budget_updated BEFORE UPDATE ON budget_lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE invoices (
    id              TEXT PRIMARY KEY,
    project_id      TEXT REFERENCES projects(id) ON DELETE SET NULL,
    vendor          TEXT NOT NULL,
    amount          NUMERIC(14,2) NOT NULL,
    invoice_date    DATE,
    due_date        DATE,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue')),
    category        TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. OA 办公
-- ============================================================================

CREATE TABLE notices (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    content         TEXT NOT NULL,
    type            TEXT NOT NULL DEFAULT 'system' CHECK (type IN ('system','announcement','approval_result')),
    target_user     TEXT,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notices_target ON notices(target_user);
CREATE TRIGGER trg_notices_updated BEFORE UPDATE ON notices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE vehicle_requests (
    id              TEXT PRIMARY KEY,
    applicant       TEXT NOT NULL,
    date            DATE NOT NULL,
    origin          TEXT NOT NULL,
    destination     TEXT NOT NULL,
    reason          TEXT NOT NULL DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    approver        TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_vehicle_updated BEFORE UPDATE ON vehicle_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. 采购管理
-- ============================================================================

CREATE TABLE procurement_packages (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    category        TEXT NOT NULL DEFAULT '',
    supplier        TEXT,
    budget_amount   NUMERIC(14,2),
    actual_amount   NUMERIC(14,2),
    status          TEXT NOT NULL DEFAULT 'planning'
                    CHECK (status IN ('planning','bidding','evaluating','contracted','delivering','inspecting','completed')),
    plan_date       DATE,
    arrival_date    DATE,
    responsible     TEXT,
    notes           TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_procurement_project ON procurement_packages(project_id);
CREATE TRIGGER trg_procurement_updated BEFORE UPDATE ON procurement_packages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. 过程管理
-- ============================================================================

CREATE TABLE process_records (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    record_type     TEXT NOT NULL CHECK (record_type IN ('daily_log','quality_check','inspection','material_entry','hidden_work','safety_check')),
    title           TEXT NOT NULL,
    date            DATE NOT NULL,
    author          TEXT NOT NULL,
    content         TEXT NOT NULL DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal','issue','resolved')),
    attachments     TEXT[] NOT NULL DEFAULT '{}',
    related_stage   TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_process_project ON process_records(project_id);
CREATE TRIGGER trg_process_updated BEFORE UPDATE ON process_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 12. 法务/合同管理
-- ============================================================================

CREATE TABLE contracts (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    contract_type   TEXT NOT NULL DEFAULT 'service' CHECK (contract_type IN ('service','construction','procurement','consulting','design')),
    party_a         TEXT NOT NULL DEFAULT '',
    party_b         TEXT NOT NULL DEFAULT '',
    project_id      TEXT REFERENCES projects(id) ON DELETE SET NULL,
    amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
    sign_date       DATE,
    start_date      DATE,
    end_date        DATE,
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','completed','terminated','expired')),
    risk_level      TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high')),
    key_terms       TEXT NOT NULL DEFAULT '',
    responsible     TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE TRIGGER trg_contracts_updated BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 13. 审计管理
-- ============================================================================

CREATE TABLE audit_reports (
    id              TEXT PRIMARY KEY,
    title           TEXT NOT NULL,
    audit_type      TEXT NOT NULL CHECK (audit_type IN ('financial','compliance','project','safety')),
    project_id      TEXT REFERENCES projects(id) ON DELETE SET NULL,
    auditor         TEXT NOT NULL DEFAULT '',
    start_date      DATE,
    end_date        DATE,
    status          TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','in_progress','completed','follow_up')),
    findings_count  INT NOT NULL DEFAULT 0,
    risk_level      TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low','medium','high','critical')),
    summary         TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_status ON audit_reports(status);
CREATE TRIGGER trg_audit_updated BEFORE UPDATE ON audit_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 14. 监理管理
-- ============================================================================

CREATE TABLE supervision_records (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    record_type     TEXT NOT NULL CHECK (record_type IN ('patrol','witness','issue','meeting')),
    title           TEXT NOT NULL,
    date            DATE NOT NULL,
    inspector       TEXT NOT NULL DEFAULT '',
    location        TEXT NOT NULL DEFAULT '',
    content         TEXT NOT NULL DEFAULT '',
    status          TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal','issue','resolved','closed')),
    issues_found    INT NOT NULL DEFAULT 0,
    photos          TEXT[] NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_supervision_project ON supervision_records(project_id);
CREATE TRIGGER trg_supervision_updated BEFORE UPDATE ON supervision_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 15. 自动化规则
-- ============================================================================

CREATE TABLE automation_rules (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    trigger_type    TEXT NOT NULL CHECK (trigger_type IN ('schedule','event','threshold')),
    trigger_config  JSONB NOT NULL DEFAULT '{}',
    action_type     TEXT NOT NULL CHECK (action_type IN ('notify','update_status','create_task','escalate')),
    action_config   JSONB NOT NULL DEFAULT '{}',
    last_run        TIMESTAMPTZ,
    run_count       INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_automation_updated BEFORE UPDATE ON automation_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
