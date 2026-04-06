-- =============================================================================
-- Supabase / PostgreSQL Seed Data
-- Generated from Python in-memory store files
-- Date: 2026-03-17
-- =============================================================================

-- Disable row-level security checks during seeding
SET session_replication_role = replica;


-- =============================================================================
-- Section: roles
-- Source: src/core/permissions.py → get_default_roles()
-- =============================================================================

INSERT INTO roles (id, name, permissions, description, is_system) VALUES
  ('admin',           '系统管理员', ARRAY['*'],                                                                                              '系统管理，拥有所有权限',     TRUE),
  ('project_manager', '项目经理',   ARRAY['project:create','project:read','project:write','project:delete','task:create','task:read','task:write','task:delete','task:assign','report:read','report:create'], '项目管理权限', FALSE),
  ('team_member',     '团队成员',   ARRAY['project:read','task:read','task:write','document:read','document:write'],                         '普通团队成员权限',           FALSE),
  ('finance',         '财务人员',   ARRAY['finance:read','finance:write','finance:approve','project:read'],                                  '财务管理权限',               FALSE),
  ('hr',              '人事专员',   ARRAY['hr:read','hr:write','employee:read','employee:write'],                                            '人事管理权限',               FALSE),
  ('legal',           '法务人员',   ARRAY['legal:read','legal:write','contract:read','contract:write','project:read'],                       '法务管理权限',               FALSE),
  ('viewer',          '只读用户',   ARRAY['project:read','task:read','document:read','report:read'],                                         '只读权限',                   FALSE)
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: users
-- Source: src/core/auth.py → _DEMO_USERS
-- =============================================================================

INSERT INTO users (id, username, display_name, department, roles, is_active) VALUES
  ('user-001', 'admin',    '系统管理员',  '管理层',       ARRAY['admin'],           TRUE),
  ('user-002', 'zhangsan', '张工',       '项目管理部',    ARRAY['project_manager'], TRUE),
  ('user-003', 'lisi',     '李设计',     '技术部',        ARRAY['team_member'],     TRUE),
  ('user-004', 'wangwu',   '王财务',     '财务部',        ARRAY['finance'],         TRUE),
  ('user-005', 'viewer',   '访客',       '',              ARRAY['viewer'],          TRUE)
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: projects
-- Source: src/stores/project_store.py → seed_projects()
-- =============================================================================

INSERT INTO projects (id, name, project_type, stage, status, status_label, progress_pct, due_date, budget_display, budget, actual_spend) VALUES
  ('proj-001', '省立博物馆EPC工程',        'EPC / 展馆',    'construction', 'active',    '施工中',   68.0,  '2026-10-15', '1.2亿', 12000.0,  8160.0),
  ('proj-002', '发改委平台信息化二期',      '信息化开发',    'construction', 'risk',      '进度延误', 35.0,  '2026-06-30', '450万',  450.0,    198.0),
  ('proj-003', '智慧园区专项债可研',        '专项债咨询',    'initiation',   'planning',  '立项评估', 15.0,  '2026-04-20', '80万',   80.0,      12.0),
  ('proj-004', '市民服务中心智能化改造',    'EPC / 公建',    'design',       'active',    '设计阶段', 42.0,  '2026-12-31', '6800万', 6800.0,  1020.0),
  ('proj-005', '高新区数据中台建设',        '信息化开发',    'procurement',  'active',    '采购中',   55.0,  '2026-09-30', '1800万', 1800.0,   540.0),
  ('proj-006', '老旧小区改造EPC',           'EPC / 市政',    'acceptance',   'active',    '竣工验收', 92.0,  '2026-03-31', '3500万', 3500.0,  3220.0),
  ('proj-007', '交通枢纽专项债申报',        '专项债咨询',    'bidding',      'active',    '投标准备', 28.0,  '2026-05-15', '120万',  120.0,     18.0),
  ('proj-008', '省教育厅考试系统升级',      '信息化开发',    'construction', 'risk',      '资源不足', 20.0,  '2026-08-01', '960万',  960.0,    144.0),
  ('proj-009', '文化产业园区景观工程',      'EPC / 景观',    'settlement',   'completed', '结算审计', 100.0, '2026-01-15', '2200万', 2200.0,  2090.0),
  ('proj-010', '智慧水务监测平台',          '信息化开发',    'contract',     'planning',  '合同签订', 8.0,   '2027-03-01', '2600万', 2600.0,    52.0)
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: project_members
-- Source: project_store.py → team_members list per project
-- =============================================================================

INSERT INTO project_members (project_id, member_name) VALUES
  -- proj-001
  ('proj-001', '张工'), ('proj-001', '李设计'), ('proj-001', '王监理'),
  ('proj-001', '刘采购'), ('proj-001', '陈施工'), ('proj-001', '赵结构'),
  ('proj-001', '周机电'), ('proj-001', '吴幕墙'), ('proj-001', '郑消防'),
  ('proj-001', '孙智能'), ('proj-001', '钱景观'), ('proj-001', '冯展陈'),
  -- proj-002
  ('proj-002', '赵开发'), ('proj-002', '钱前端'), ('proj-002', '孙后端'),
  ('proj-002', '李测试'), ('proj-002', '周运维'), ('proj-002', '吴产品'),
  ('proj-002', '郑架构'), ('proj-002', '冯数据'),
  -- proj-003
  ('proj-003', '陈咨询'), ('proj-003', '林财务'), ('proj-003', '黄政策'),
  ('proj-003', '徐调研'), ('proj-003', '杨报告'),
  -- proj-004
  ('proj-004', '韩总工'), ('proj-004', '方设计'), ('proj-004', '吕结构'),
  ('proj-004', '马机电'), ('proj-004', '苗幕墙'), ('proj-004', '宋暖通'),
  ('proj-004', '唐智能'),
  -- proj-005
  ('proj-005', '何架构'), ('proj-005', '邓开发'), ('proj-005', '许数据'),
  ('proj-005', '萧测试'), ('proj-005', '曹运维'), ('proj-005', '汪产品'),
  -- proj-006
  ('proj-006', '丁项目'), ('proj-006', '蒋施工'), ('proj-006', '沈监理'),
  ('proj-006', '韩质检'), ('proj-006', '秦资料'), ('proj-006', '尤安全'),
  -- proj-007
  ('proj-007', '廖咨询'), ('proj-007', '余财务'), ('proj-007', '贾分析'),
  ('proj-007', '夏调研'),
  -- proj-008
  ('proj-008', '范开发'), ('proj-008', '石测试'), ('proj-008', '姚前端'),
  ('proj-008', '田后端'), ('proj-008', '彭运维'), ('proj-008', '潘安全'),
  ('proj-008', '蔡DBA'),
  -- proj-009
  ('proj-009', '薛景观'), ('proj-009', '雷施工'), ('proj-009', '贺绿化'),
  ('proj-009', '倪水系'),
  -- proj-010
  ('proj-010', '武产品'), ('proj-010', '严架构'), ('proj-010', '金开发'),
  ('proj-010', '魏测试'), ('proj-010', '陶运维'), ('proj-010', '柳数据')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- Section: project_risks
-- Source: project_store.py → risks list per project (only projects with risks)
-- =============================================================================

INSERT INTO project_risks (project_id, title, description, severity, owner) VALUES
  ('proj-001', '幕墙材料供货延迟',   '进口Low-E玻璃交期延长2周，影响A区封闭节点',                   'medium', '刘采购'),
  ('proj-002', '前端开发阻塞',       '前端页面开发因后端接口文档未确认处于阻塞状态',                 'high',   '钱前端'),
  ('proj-002', '进度严重滞后',       '当前进度35%，距截止日期不足3个月，存在延期风险',               'high',   '郑架构'),
  ('proj-006', '验收时间紧迫',       '距竣工验收截止仅剩20天，资料归档尚未完成',                     'medium', '秦资料'),
  ('proj-008', '测试环境未就绪',     '高并发压测方案因测试环境未部署处于阻塞状态',                   'high',   '彭运维'),
  ('proj-008', '人力资源不足',       '前端重构与题库迁移并行，开发资源紧张',                         'medium', '范开发')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- Section: project_milestones
-- Source: project_store.py → milestones list per project
-- =============================================================================

INSERT INTO project_milestones (project_id, name, date, status) VALUES
  -- proj-001
  ('proj-001', '主体结构封顶',   '2025-12-20', 'completed'),
  ('proj-001', '幕墙工程完工',   '2026-05-15', 'in_progress'),
  ('proj-001', '机电系统联调',   '2026-06-30', 'pending'),
  ('proj-001', '竣工验收',       '2026-10-15', 'pending'),
  -- proj-002
  ('proj-002', '需求评审通过',   '2026-02-15', 'completed'),
  ('proj-002', '后端API联调',    '2026-04-30', 'in_progress'),
  ('proj-002', 'UAT测试',        '2026-05-30', 'pending'),
  ('proj-002', '上线交付',       '2026-06-30', 'pending'),
  -- proj-003
  ('proj-003', '可研报告完成',       '2026-03-25', 'in_progress'),
  ('proj-003', '专项债申报提交',     '2026-04-10', 'pending'),
  ('proj-003', '财政评审通过',       '2026-04-20', 'pending'),
  -- proj-004
  ('proj-004', '方案设计评审',   '2026-03-30', 'completed'),
  ('proj-004', '施工图设计完成', '2026-06-30', 'in_progress'),
  ('proj-004', '采购招标',       '2026-08-15', 'pending'),
  ('proj-004', '竣工验收',       '2026-12-31', 'pending'),
  -- proj-005
  ('proj-005', '数据治理规范发布',   '2026-03-01', 'completed'),
  ('proj-005', 'ETL工具采购完成',    '2026-04-30', 'in_progress'),
  ('proj-005', '数据仓库上线',       '2026-07-31', 'pending'),
  ('proj-005', '项目验收',           '2026-09-30', 'pending'),
  -- proj-006
  ('proj-006', '主体施工完成', '2025-11-30', 'completed'),
  ('proj-006', '市政管网接通', '2026-01-15', 'completed'),
  ('proj-006', '分户验收',     '2026-03-20', 'in_progress'),
  ('proj-006', '竣工备案',     '2026-03-31', 'pending'),
  -- proj-007
  ('proj-007', '投标文件提交', '2026-04-05', 'in_progress'),
  ('proj-007', '开标评审',     '2026-04-20', 'pending'),
  ('proj-007', '中标公示',     '2026-05-15', 'pending'),
  -- proj-008
  ('proj-008', '需求冻结',           '2026-03-15', 'completed'),
  ('proj-008', '核心模块开发完成',   '2026-05-31', 'in_progress'),
  ('proj-008', '全量压力测试通过',   '2026-07-01', 'pending'),
  ('proj-008', '上线交付',           '2026-08-01', 'pending'),
  -- proj-009
  ('proj-009', '景观方案设计', '2025-04-30', 'completed'),
  ('proj-009', '土建施工完成', '2025-08-31', 'completed'),
  ('proj-009', '绿化种植完成', '2025-11-15', 'completed'),
  ('proj-009', '竣工验收',     '2025-12-20', 'completed'),
  ('proj-009', '结算审计',     '2026-01-15', 'in_progress'),
  -- proj-010
  ('proj-010', '合同签订', '2026-03-01', 'completed'),
  ('proj-010', '需求调研', '2026-05-01', 'in_progress'),
  ('proj-010', '系统设计', '2026-08-01', 'pending'),
  ('proj-010', '开发实施', '2027-01-01', 'pending'),
  ('proj-010', '项目验收', '2027-03-01', 'pending')
ON CONFLICT DO NOTHING;


-- =============================================================================
-- Section: tasks
-- Source: src/stores/task_store.py → seed_tasks()
-- =============================================================================

INSERT INTO tasks (id, project_id, name, assignee, status, priority, due_date, description) VALUES
  -- proj-001: 省立博物馆EPC工程
  ('task-001-01', 'proj-001', '完成展厅A区幕墙施工',   '吴幕墙', 'in_progress', 'high',   '2026-04-15', '展厅A区全部幕墙单元安装及打胶收边'),
  ('task-001-02', 'proj-001', '机电安装调试',           '周机电', 'in_progress', 'high',   '2026-05-01', '强弱电、暖通、给排水系统安装及联调'),
  ('task-001-03', 'proj-001', '消防系统验收准备',       '郑消防', 'todo',        'medium', '2026-05-20', '整理消防竣工资料，联系消防主管部门预约验收'),
  ('task-001-04', 'proj-001', '展陈设计深化',           '冯展陈', 'review',      'medium', '2026-04-30', '展陈施工图深化及业主审核'),
  ('task-001-05', 'proj-001', '智能化系统布线',         '孙智能', 'todo',        'medium', '2026-06-15', '智能照明、门禁、安防等系统综合布线施工'),
  -- proj-002: 发改委平台信息化二期
  ('task-002-01', 'proj-002', '后端API开发',             '赵开发', 'in_progress', 'high',   '2026-04-10', '核心业务模块RESTful API开发'),
  ('task-002-02', 'proj-002', '数据迁移方案设计',       '冯数据', 'todo',        'high',   '2026-04-20', '一期存量数据清洗、映射及迁移方案编制'),
  ('task-002-03', 'proj-002', '前端页面开发',           '钱前端', 'blocked',     'high',   '2026-04-25', '等待后端接口文档确认后方可开始，当前处于阻塞状态'),
  ('task-002-04', 'proj-002', '系统集成测试',           '李测试', 'todo',        'medium', '2026-05-15', '全模块联调及压力测试'),
  ('task-002-05', 'proj-002', '用户培训材料编写',       '吴产品', 'todo',        'low',    '2026-06-01', '操作手册、视频教程及培训PPT制作'),
  -- proj-003: 智慧园区专项债可研
  ('task-003-01', 'proj-003', '项目可研报告编制',       '杨报告', 'in_progress', 'high',   '2026-03-25', '完成投资可行性研究报告正文编写'),
  ('task-003-02', 'proj-003', '专项债申报材料准备',     '林财务', 'todo',        'high',   '2026-04-01', '按财政部要求整理专项债项目申报全套资料'),
  ('task-003-03', 'proj-003', '竞品调研分析',           '徐调研', 'done',        'medium', '2026-03-15', '调研3个同类智慧园区项目，形成对标分析报告'),
  ('task-003-04', 'proj-003', '技术方案初稿',           '陈咨询', 'todo',        'medium', '2026-04-10', '智慧园区信息化系统技术架构方案初稿'),
  -- proj-004: 市民服务中心智能化改造
  ('task-004-01', 'proj-004', '智能化系统方案设计',     '方设计', 'in_progress', 'high',   '2026-04-30', '含楼宇自控、安防监控、智能照明、会议系统等子系统方案设计'),
  ('task-004-02', 'proj-004', '结构加固方案评审',       '吕结构', 'review',      'high',   '2026-04-15', '既有建筑结构安全鉴定及加固设计方案内部评审'),
  ('task-004-03', 'proj-004', 'BIM模型创建',            '韩总工', 'in_progress', 'medium', '2026-05-20', '基于Revit创建建筑+结构+机电全专业BIM模型'),
  ('task-004-04', 'proj-004', '暖通空调系统选型',       '宋暖通', 'todo',        'medium', '2026-05-30', '中央空调系统选型比较及能耗分析报告'),
  -- proj-005: 高新区数据中台建设
  ('task-005-01', 'proj-005', '数据治理规范制定',       '许数据', 'done',        'high',   '2026-03-01', '数据标准、数据质量规范、元数据管理规范编制'),
  ('task-005-02', 'proj-005', 'ETL工具采购评估',        '何架构', 'in_progress', 'high',   '2026-04-10', '对DataX、Kettle、SeaTunnel等ETL工具进行POC测试对比'),
  ('task-005-03', 'proj-005', '数据仓库架构设计',       '邓开发', 'in_progress', 'high',   '2026-04-25', 'ODS/DWD/DWS/ADS分层架构设计及主题域划分'),
  ('task-005-04', 'proj-005', 'API网关选型',            '汪产品', 'todo',        'medium', '2026-05-10', '数据服务API网关技术选型（Kong/APISIX/自研）'),
  -- proj-006: 老旧小区改造EPC
  ('task-006-01', 'proj-006', '竣工资料归档',   '秦资料', 'in_progress', 'high',   '2026-03-20', '整理全套竣工图纸、隐蔽工程记录、检验批验收资料'),
  ('task-006-02', 'proj-006', '质量验收检查',   '韩质检', 'in_progress', 'high',   '2026-03-25', '分户验收及公共区域质量检查整改'),
  ('task-006-03', 'proj-006', '绿化补种移交',   '蒋施工', 'todo',        'medium', '2026-03-28', '小区绿化补种及景观设施移交物业'),
  -- proj-007: 交通枢纽专项债申报
  ('task-007-01', 'proj-007', '投标文件编制',     '廖咨询', 'in_progress', 'high',   '2026-04-01', '编制项目投标书技术标及商务标'),
  ('task-007-02', 'proj-007', '项目收益测算',     '余财务', 'in_progress', 'high',   '2026-03-28', '交通枢纽项目专项债收益与融资自求平衡测算'),
  ('task-007-03', 'proj-007', '政策合规性审查',   '贾分析', 'todo',        'medium', '2026-04-05', '核查项目是否符合最新专项债资金使用范围及合规要求'),
  -- proj-008: 省教育厅考试系统升级
  ('task-008-01', 'proj-008', '高并发压测方案',       '彭运维', 'blocked', 'high',   '2026-04-15', '模拟50万并发在线考试场景压力测试，等待测试环境部署'),
  ('task-008-02', 'proj-008', '题库迁移开发',         '田后端', 'in_progress', 'high', '2026-05-01', '将旧系统题库数据迁移至新架构，含试题格式转换'),
  ('task-008-03', 'proj-008', '前端考试界面重构',     '姚前端', 'todo',        'high',   '2026-05-20', '基于React重构在线考试界面，支持PC/平板双端适配'),
  ('task-008-04', 'proj-008', '安全等保测评准备',     '潘安全', 'todo',        'medium', '2026-06-15', '按等保三级要求准备系统安全测评相关材料'),
  -- proj-009: 文化产业园区景观工程
  ('task-009-01', 'proj-009', '结算审计配合',   '薛景观', 'in_progress', 'high',   '2026-03-30', '配合审计单位完成工程量复核及结算审计'),
  ('task-009-02', 'proj-009', '质保期维护计划', '贺绿化', 'done',        'medium', '2026-02-28', '编制绿化养护及景观设施两年质保期维护方案'),
  -- proj-010: 智慧水务监测平台
  ('task-010-01', 'proj-010', '需求调研',       '武产品', 'in_progress', 'high',   '2026-04-15', '走访水务局各科室，梳理水质监测、管网监控、洪涝预警需求'),
  ('task-010-02', 'proj-010', '技术架构预研',   '严架构', 'todo',        'high',   '2026-04-30', 'IoT平台选型、时序数据库选型、大屏可视化技术预研'),
  ('task-010-03', 'proj-010', '合同附件整理',   '金开发', 'done',        'medium', '2026-03-10', '整理合同技术附件、验收标准及里程碑付款节点')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: activity_events
-- Source: src/stores/activity_store.py → seed_activities()
-- Timestamps computed as: NOW() - interval 'N days'  (relative to 2026-03-17)
-- =============================================================================

INSERT INTO activity_events (id, project_id, event_type, actor, summary, detail, created_at) VALUES
  -- proj-001
  ('act-001-01', 'proj-001', 'stage_transition', '张工',  '项目从设计阶段推进到施工阶段',              '{"before":{"stage":"design"},"after":{"stage":"construction"}}'::jsonb,                                                                 NOW() - INTERVAL '28 days'),
  ('act-001-02', 'proj-001', 'task_created',     '张工',  '创建任务「完成展厅A区幕墙施工」',           '{"task_id":"task-001-01","task_name":"完成展厅A区幕墙施工"}'::jsonb,                                                                     NOW() - INTERVAL '25 days'),
  ('act-001-03', 'proj-001', 'task_created',     '张工',  '创建任务「机电安装调试」',                  '{"task_id":"task-001-02","task_name":"机电安装调试"}'::jsonb,                                                                            NOW() - INTERVAL '24 days'),
  ('act-001-04', 'proj-001', 'task_updated',     '王监理','更新任务「消防系统验收准备」的优先级为中',  '{"task_id":"task-001-03","before":{"priority":"low"},"after":{"priority":"medium"}}'::jsonb,                                             NOW() - INTERVAL '18 days'),
  ('act-001-05', 'proj-001', 'status_changed',   '张工',  '项目进度更新至68%',                         '{"before":{"progress_pct":55.0},"after":{"progress_pct":68.0}}'::jsonb,                                                                 NOW() - INTERVAL '5 days'),
  ('act-001-06', 'proj-001', 'task_updated',     '冯展陈','任务「展陈设计深化」状态变更为评审中',      '{"task_id":"task-001-04","before":{"status":"in_progress"},"after":{"status":"review"}}'::jsonb,                                         NOW() - INTERVAL '3 days'),
  ('act-001-07', 'proj-001', 'task_created',     '孙智能','创建任务「智能化系统布线」',                '{"task_id":"task-001-05","task_name":"智能化系统布线"}'::jsonb,                                                                          NOW() - INTERVAL '2 days'),
  -- proj-002
  ('act-002-01', 'proj-002', 'stage_transition', '吴产品','项目从采购阶段推进到施工阶段',              '{"before":{"stage":"procurement"},"after":{"stage":"construction"}}'::jsonb,                                                              NOW() - INTERVAL '30 days'),
  ('act-002-02', 'proj-002', 'task_created',     '赵开发','创建任务「后端API开发」',                   '{"task_id":"task-002-01","task_name":"后端API开发"}'::jsonb,                                                                             NOW() - INTERVAL '27 days'),
  ('act-002-03', 'proj-002', 'status_changed',   '吴产品','项目状态变更为风险预警 — 进度延误',         '{"before":{"status":"active","status_label":"开发中"},"after":{"status":"risk","status_label":"进度延误"}}'::jsonb,                       NOW() - INTERVAL '14 days'),
  ('act-002-04', 'proj-002', 'task_updated',     '钱前端','任务「前端页面开发」状态变更为阻塞',        '{"task_id":"task-002-03","before":{"status":"todo"},"after":{"status":"blocked"}}'::jsonb,                                               NOW() - INTERVAL '10 days'),
  ('act-002-05', 'proj-002', 'task_created',     '赵开发','创建任务「系统集成测试」',                  '{"task_id":"task-002-04","task_name":"系统集成测试"}'::jsonb,                                                                            NOW() - INTERVAL '8 days'),
  ('act-002-06', 'proj-002', 'task_updated',     '赵开发','更新任务「后端API开发」截止日期延后至4月10日','{"task_id":"task-002-01","before":{"due_date":"2026-03-25"},"after":{"due_date":"2026-04-10"}}'::jsonb,                               NOW() - INTERVAL '4 days'),
  -- proj-003
  ('act-003-01', 'proj-003', 'task_created',     '陈咨询','创建任务「项目可研报告编制」',             '{"task_id":"task-003-01","task_name":"项目可研报告编制"}'::jsonb,                                                                         NOW() - INTERVAL '22 days'),
  ('act-003-02', 'proj-003', 'task_created',     '陈咨询','创建任务「竞品调研分析」',                 '{"task_id":"task-003-03","task_name":"竞品调研分析"}'::jsonb,                                                                             NOW() - INTERVAL '20 days'),
  ('act-003-03', 'proj-003', 'task_updated',     '徐调研','任务「竞品调研分析」状态变更为已完成',      '{"task_id":"task-003-03","before":{"status":"in_progress"},"after":{"status":"done"}}'::jsonb,                                           NOW() - INTERVAL '12 days'),
  ('act-003-04', 'proj-003', 'status_changed',   '陈咨询','项目进度更新至15%',                         '{"before":{"progress_pct":8.0},"after":{"progress_pct":15.0}}'::jsonb,                                                                  NOW() - INTERVAL '7 days'),
  ('act-003-05', 'proj-003', 'task_created',     '黄政策','创建任务「专项债申报材料准备」',           '{"task_id":"task-003-02","task_name":"专项债申报材料准备"}'::jsonb,                                                                       NOW() - INTERVAL '5 days'),
  -- proj-004
  ('act-004-01', 'proj-004', 'stage_transition', '韩总工','项目从签约阶段推进到设计阶段',              '{"before":{"stage":"contract"},"after":{"stage":"design"}}'::jsonb,                                                                       NOW() - INTERVAL '26 days'),
  ('act-004-02', 'proj-004', 'task_created',     '韩总工','创建任务「智能化系统方案设计」',           '{"task_id":"task-004-01","task_name":"智能化系统方案设计"}'::jsonb,                                                                       NOW() - INTERVAL '24 days'),
  ('act-004-03', 'proj-004', 'task_created',     '吕结构','创建任务「结构加固方案评审」',             '{"task_id":"task-004-02","task_name":"结构加固方案评审"}'::jsonb,                                                                         NOW() - INTERVAL '21 days'),
  ('act-004-04', 'proj-004', 'task_updated',     '吕结构','任务「结构加固方案评审」状态变更为评审中', '{"task_id":"task-004-02","before":{"status":"in_progress"},"after":{"status":"review"}}'::jsonb,                                         NOW() - INTERVAL '9 days'),
  ('act-004-05', 'proj-004', 'task_created',     '韩总工','创建任务「BIM模型创建」',                  '{"task_id":"task-004-03","task_name":"BIM模型创建"}'::jsonb,                                                                             NOW() - INTERVAL '15 days'),
  ('act-004-06', 'proj-004', 'status_changed',   '韩总工','项目进度更新至42%',                         '{"before":{"progress_pct":30.0},"after":{"progress_pct":42.0}}'::jsonb,                                                                  NOW() - INTERVAL '3 days'),
  -- proj-005
  ('act-005-01', 'proj-005', 'stage_transition', '何架构','项目从设计阶段推进到采购阶段',              '{"before":{"stage":"design"},"after":{"stage":"procurement"}}'::jsonb,                                                                    NOW() - INTERVAL '20 days'),
  ('act-005-02', 'proj-005', 'task_created',     '许数据','创建任务「数据治理规范制定」',             '{"task_id":"task-005-01","task_name":"数据治理规范制定"}'::jsonb,                                                                         NOW() - INTERVAL '19 days'),
  ('act-005-03', 'proj-005', 'task_updated',     '许数据','任务「数据治理规范制定」状态变更为已完成', '{"task_id":"task-005-01","before":{"status":"in_progress"},"after":{"status":"done"}}'::jsonb,                                           NOW() - INTERVAL '11 days'),
  ('act-005-04', 'proj-005', 'task_created',     '何架构','创建任务「ETL工具采购评估」',              '{"task_id":"task-005-02","task_name":"ETL工具采购评估"}'::jsonb,                                                                          NOW() - INTERVAL '14 days'),
  ('act-005-05', 'proj-005', 'task_created',     '邓开发','创建任务「数据仓库架构设计」',             '{"task_id":"task-005-03","task_name":"数据仓库架构设计"}'::jsonb,                                                                         NOW() - INTERVAL '12 days'),
  ('act-005-06', 'proj-005', 'status_changed',   '何架构','项目进度更新至55%',                         '{"before":{"progress_pct":45.0},"after":{"progress_pct":55.0}}'::jsonb,                                                                  NOW() - INTERVAL '2 days'),
  ('act-005-07', 'proj-005', 'task_created',     '汪产品','创建任务「API网关选型」',                  '{"task_id":"task-005-04","task_name":"API网关选型"}'::jsonb,                                                                             NOW() - INTERVAL '1 day'),
  -- proj-006
  ('act-006-01', 'proj-006', 'stage_transition', '丁项目','项目从施工阶段推进到验收阶段',              '{"before":{"stage":"construction"},"after":{"stage":"acceptance"}}'::jsonb,                                                               NOW() - INTERVAL '15 days'),
  ('act-006-02', 'proj-006', 'task_created',     '秦资料','创建任务「竣工资料归档」',                  '{"task_id":"task-006-01","task_name":"竣工资料归档"}'::jsonb,                                                                            NOW() - INTERVAL '14 days'),
  ('act-006-03', 'proj-006', 'task_created',     '韩质检','创建任务「质量验收检查」',                  '{"task_id":"task-006-02","task_name":"质量验收检查"}'::jsonb,                                                                            NOW() - INTERVAL '13 days'),
  ('act-006-04', 'proj-006', 'status_changed',   '丁项目','项目进度更新至92%',                         '{"before":{"progress_pct":85.0},"after":{"progress_pct":92.0}}'::jsonb,                                                                  NOW() - INTERVAL '6 days'),
  ('act-006-05', 'proj-006', 'task_created',     '蒋施工','创建任务「绿化补种移交」',                  '{"task_id":"task-006-03","task_name":"绿化补种移交"}'::jsonb,                                                                            NOW() - INTERVAL '4 days'),
  -- proj-007
  ('act-007-01', 'proj-007', 'stage_transition', '廖咨询','项目从立项阶段推进到投标阶段',              '{"before":{"stage":"initiation"},"after":{"stage":"bidding"}}'::jsonb,                                                                   NOW() - INTERVAL '23 days'),
  ('act-007-02', 'proj-007', 'task_created',     '廖咨询','创建任务「投标文件编制」',                  '{"task_id":"task-007-01","task_name":"投标文件编制"}'::jsonb,                                                                            NOW() - INTERVAL '20 days'),
  ('act-007-03', 'proj-007', 'task_created',     '余财务','创建任务「项目收益测算」',                  '{"task_id":"task-007-02","task_name":"项目收益测算"}'::jsonb,                                                                            NOW() - INTERVAL '18 days'),
  ('act-007-04', 'proj-007', 'status_changed',   '廖咨询','项目进度更新至28%',                         '{"before":{"progress_pct":15.0},"after":{"progress_pct":28.0}}'::jsonb,                                                                  NOW() - INTERVAL '6 days'),
  ('act-007-05', 'proj-007', 'task_created',     '贾分析','创建任务「政策合规性审查」',               '{"task_id":"task-007-03","task_name":"政策合规性审查"}'::jsonb,                                                                           NOW() - INTERVAL '3 days'),
  ('act-007-06', 'proj-007', 'task_updated',     '余财务','更新任务「项目收益测算」截止日期为3月28日', '{"task_id":"task-007-02","before":{"due_date":"2026-04-05"},"after":{"due_date":"2026-03-28"}}'::jsonb,                                  NOW() - INTERVAL '2 days'),
  -- proj-008
  ('act-008-01', 'proj-008', 'stage_transition', '范开发','项目从采购阶段推进到施工阶段',              '{"before":{"stage":"procurement"},"after":{"stage":"construction"}}'::jsonb,                                                              NOW() - INTERVAL '29 days'),
  ('act-008-02', 'proj-008', 'task_created',     '彭运维','创建任务「高并发压测方案」',               '{"task_id":"task-008-01","task_name":"高并发压测方案"}'::jsonb,                                                                           NOW() - INTERVAL '25 days'),
  ('act-008-03', 'proj-008', 'task_updated',     '彭运维','任务「高并发压测方案」状态变更为阻塞 — 等待测试环境','{"task_id":"task-008-01","before":{"status":"todo"},"after":{"status":"blocked"}}'::jsonb,                                    NOW() - INTERVAL '16 days'),
  ('act-008-04', 'proj-008', 'status_changed',   '范开发','项目状态变更为风险预警 — 资源不足',         '{"before":{"status":"active","status_label":"开发中"},"after":{"status":"risk","status_label":"资源不足"}}'::jsonb,                      NOW() - INTERVAL '12 days'),
  ('act-008-05', 'proj-008', 'task_created',     '田后端','创建任务「题库迁移开发」',                  '{"task_id":"task-008-02","task_name":"题库迁移开发"}'::jsonb,                                                                            NOW() - INTERVAL '10 days'),
  ('act-008-06', 'proj-008', 'task_created',     '姚前端','创建任务「前端考试界面重构」',             '{"task_id":"task-008-03","task_name":"前端考试界面重构"}'::jsonb,                                                                         NOW() - INTERVAL '7 days'),
  ('act-008-07', 'proj-008', 'status_changed',   '范开发','项目进度更新至20%',                         '{"before":{"progress_pct":12.0},"after":{"progress_pct":20.0}}'::jsonb,                                                                  NOW() - INTERVAL '1 day'),
  -- proj-009
  ('act-009-01', 'proj-009', 'stage_transition', '薛景观','项目从验收阶段推进到结算阶段',              '{"before":{"stage":"acceptance"},"after":{"stage":"settlement"}}'::jsonb,                                                                NOW() - INTERVAL '22 days'),
  ('act-009-02', 'proj-009', 'task_created',     '薛景观','创建任务「结算审计配合」',                  '{"task_id":"task-009-01","task_name":"结算审计配合"}'::jsonb,                                                                            NOW() - INTERVAL '20 days'),
  ('act-009-03', 'proj-009', 'task_created',     '贺绿化','创建任务「质保期维护计划」',               '{"task_id":"task-009-02","task_name":"质保期维护计划"}'::jsonb,                                                                           NOW() - INTERVAL '18 days'),
  ('act-009-04', 'proj-009', 'task_updated',     '贺绿化','任务「质保期维护计划」状态变更为已完成',   '{"task_id":"task-009-02","before":{"status":"in_progress"},"after":{"status":"done"}}'::jsonb,                                           NOW() - INTERVAL '8 days'),
  ('act-009-05', 'proj-009', 'status_changed',   '薛景观','项目进度更新至100%',                        '{"before":{"progress_pct":95.0},"after":{"progress_pct":100.0}}'::jsonb,                                                                 NOW() - INTERVAL '5 days'),
  -- proj-010
  ('act-010-01', 'proj-010', 'stage_transition', '武产品','项目从投标阶段推进到签约阶段',              '{"before":{"stage":"bidding"},"after":{"stage":"contract"}}'::jsonb,                                                                      NOW() - INTERVAL '17 days'),
  ('act-010-02', 'proj-010', 'task_created',     '武产品','创建任务「需求调研」',                      '{"task_id":"task-010-01","task_name":"需求调研"}'::jsonb,                                                                                NOW() - INTERVAL '15 days'),
  ('act-010-03', 'proj-010', 'task_created',     '金开发','创建任务「合同附件整理」',                  '{"task_id":"task-010-03","task_name":"合同附件整理"}'::jsonb,                                                                            NOW() - INTERVAL '14 days'),
  ('act-010-04', 'proj-010', 'task_updated',     '金开发','任务「合同附件整理」状态变更为已完成',      '{"task_id":"task-010-03","before":{"status":"in_progress"},"after":{"status":"done"}}'::jsonb,                                           NOW() - INTERVAL '7 days'),
  ('act-010-05', 'proj-010', 'task_created',     '严架构','创建任务「技术架构预研」',                  '{"task_id":"task-010-02","task_name":"技术架构预研"}'::jsonb,                                                                            NOW() - INTERVAL '6 days'),
  ('act-010-06', 'proj-010', 'status_changed',   '武产品','项目进度更新至8%',                          '{"before":{"progress_pct":3.0},"after":{"progress_pct":8.0}}'::jsonb,                                                                    NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: bidding_opportunities
-- Source: src/stores/bidding_store.py → seed_bidding()
-- =============================================================================

INSERT INTO bidding_opportunities (id, title, source, publish_date, deadline, budget_amount, region, category, status, match_score, project_id) VALUES
  ('bid-001', '某市文化中心EPC总承包',         '中国政府采购网',       '2026-03-01', '2026-04-15', '8000万',  '华东', 'EPC / 展馆',  'monitoring', 85.0, NULL),
  ('bid-002', 'XX区智慧城市管理平台建设',      '全国公共资源交易平台', '2026-03-05', '2026-04-25', '1200万',  '华南', '信息化开发',  'analyzing',  72.0, NULL),
  ('bid-003', '省级博物馆数字化展示升级',      '中国政府采购网',       '2026-03-10', '2026-05-10', '3500万',  '华中', 'EPC / 展馆',  'monitoring', 91.0, NULL),
  ('bid-004', '新城区基础设施专项债咨询',      '地方财政局',           '2026-03-08', '2026-05-20', '150万',   '西南', '专项债咨询',  'preparing',  88.0, NULL),
  ('bid-005', '市级档案馆智能化改造工程',      '中国政府采购网',       '2026-03-06', '2026-04-30', '4200万',  '华东', 'EPC / 公建',  'monitoring', 78.0, NULL),
  ('bid-006', '教育信息化三通两平台升级',      '全国公共资源交易平台', '2026-03-09', '2026-05-05', '680万',   '华北', '信息化开发',  'analyzing',  65.0, NULL),
  ('bid-007', '产业园区污水处理PPP项目咨询',  '地方财政局',           '2026-02-28', '2026-04-10', '200万',   '华中', '专项债咨询',  'submitted',  82.0, NULL),
  ('bid-008', '某市体育中心EPC总承包',         '中国政府采购网',       '2026-03-11', '2026-06-01', '2.5亿',   '华东', 'EPC / 公建',  'monitoring', 93.0, NULL)
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: documents
-- Source: src/stores/document_store.py → seed_documents()
-- =============================================================================

INSERT INTO documents (id, title, doc_type, project_id, category, content_summary, version, author, status) VALUES
  -- proj-001 documents
  ('doc-001', '智慧园区EPC项目全流程复盘记录_V1.2',    'report',   'proj-001', 'general',      '对博物馆EPC项目从立项到施工各阶段的经验与教训进行系统性复盘',                                                                         '1.2', '王项目', 'final'),
  ('doc-101', '展陈设计方案(深化版)',                   'proposal', 'proj-001', 'design',       '博物馆常设展厅及临展厅展陈深化设计方案，含平面布局、展线流程、灯光设计',                                                              '2.0', '方设计', 'final'),
  ('doc-102', '智能化系统施工图纸',                     'proposal', 'proj-001', 'design',       '楼宇自控、安防监控、智能照明、综合布线等子系统施工图纸全套',                                                                          '1.5', '方设计', 'review'),
  ('doc-103', '结构加固设计变更说明',                   'proposal', 'proj-001', 'change',       '二层展厅区域因展品荷载调整，结构加固方案变更说明及费用影响评估',                                                                      '1.0', '方设计', 'final'),
  ('doc-104', '施工组织设计(总)',                        'report',   'proj-001', 'construction', '项目总施工组织设计，含总平面布置、施工进度网络计划、主要施工方案',                                                                    '3.0', '张工',   'final'),
  ('doc-105', '2026年3月施工日志汇总',                  'report',   'proj-001', 'construction', '3月份每日施工记录汇总，含天气、人员、机械、材料进场及施工内容',                                                                       '1.0', '张工',   'final'),
  ('doc-106', '混凝土试块抗压强度报告',                 'report',   'proj-001', 'quality',      '各层混凝土试块28天标准养护抗压强度试验报告，全部合格',                                                                                '1.0', '赵质检', 'final'),
  ('doc-107', '隐蔽工程验收记录(地基基础)',             'report',   'proj-001', 'quality',      '地基基础工程隐蔽验收记录表，含桩基检测报告、地基承载力试验记录',                                                                      '1.0', '赵质检', 'final'),
  ('doc-108', '材料进场检验台账',                       'report',   'proj-001', 'quality',      '钢筋、水泥、砂石、玻璃幕墙等主要材料进场复检报告台账',                                                                               '1.0', '刘采购', 'review'),
  ('doc-109', '安全生产专项方案(高空作业)',             'proposal', 'proj-001', 'safety',       '幕墙安装及展厅吊顶施工高空作业安全专项方案，含应急预案',                                                                              '1.0', '王监理', 'final'),
  ('doc-110', '2026年Q1安全检查记录',                   'report',   'proj-001', 'safety',       '每周安全巡检记录汇总，3月发现2项整改项均已闭合',                                                                                      '1.0', '王监理', 'final'),
  ('doc-111', '竣工图纸(建筑专业)',                     'report',   'proj-001', 'completion',   '建筑专业竣工图纸，反映实际施工变更后的最终状态',                                                                                      '1.0', '方设计', 'draft'),
  ('doc-112', 'EPC总承包合同',                          'template', 'proj-001', 'contract',     '与业主签订的EPC总承包合同，含合同价、工期、质量标准及付款条件',                                                                      '1.0', '李法务', 'final'),
  ('doc-113', '幕墙分包合同',                           'template', 'proj-001', 'contract',     '幕墙工程专业分包合同，含工程量清单、施工要求、验收标准',                                                                              '1.0', '李法务', 'final'),
  ('doc-114', '工程变更令 GBG-007',                     'report',   'proj-001', 'change',       '展厅B区展柜由定制改为标准品，减少造价约35万，工期缩短5天',                                                                            '1.0', '张工',   'final'),
  -- proj-002 documents
  ('doc-002', '发改委信息化二期技术方案',               'proposal', 'proj-002', 'design',       '信息化平台二期系统架构设计、技术选型、模块划分及实施路线规划',                                                                        '2.1', '赵开发', 'review'),
  ('doc-201', '需求规格说明书',                         'proposal', 'proj-002', 'design',       '信息化平台功能需求、非功能需求、接口需求详细说明',                                                                                    '3.0', '武产品', 'final'),
  ('doc-202', '测试报告(UAT)',                           'report',   'proj-002', 'quality',      '用户验收测试报告，92个测试用例通过率98.9%，2个低优先级缺陷待修复',                                                                    '1.0', '钱前端', 'review'),
  ('doc-203', '部署运维手册',                           'report',   'proj-002', 'general',      '系统部署架构、运维监控、故障排查及灾备恢复操作手册',                                                                                  '1.0', '赵开发', 'draft'),
  -- proj-003 documents
  ('doc-005', '智慧园区专项债可研报告(初稿)',           'proposal', 'proj-003', 'general',      '智慧园区建设项目专项债券申报可行性研究报告初稿，含项目背景、建设内容、投资估算',                                                      '0.1', '陈咨询', 'draft'),
  ('doc-301', '项目投资估算表',                         'report',   'proj-003', 'general',      '分项投资估算明细及资金筹措方案',                                                                                                      '1.0', '陈咨询', 'review'),
  ('doc-302', '还款来源分析报告',                       'report',   'proj-003', 'general',      '项目收入预测、还款计划及偿债能力分析',                                                                                                '0.2', '陈咨询', 'draft'),
  -- proj-010 documents
  ('doc-012', '智慧水务需求调研纪要',                   'minutes',  'proj-010', 'general',      '与水务局各科室需求调研会议纪要，记录水质监测、管网监控、洪涝预警等核心需求',                                                          '1.0', '武产品', 'final'),
  -- Global / template documents (no project)
  ('doc-003', 'EPC项目投标书模板',                      'template', NULL,       'contract',     '适用于各类EPC总承包项目的标准化投标文件模板，含商务标、技术标及资质证明附件清单',                                                    '3.0', '李法务', 'final'),
  ('doc-004', '2026年Q1项目周报汇总',                   'report',   NULL,       'general',      '2026年第一季度所有在建项目进度、风险、资金情况综合周报汇编',                                                                          '1.0', '项目管理部', 'final'),
  ('doc-011', '标准化合同模板(信息化类)',               'template', NULL,       'contract',     '适用于政府信息化项目的标准合同模板，含商务条款、技术条款、验收标准',                                                                  '2.0', '李法务', 'final')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: employees
-- Source: src/stores/hr_store.py → seed_hr() employees
-- =============================================================================

INSERT INTO employees (id, name, department, position, salary, hire_date, status, phone, email) VALUES
  ('emp-001', '张工',   '工程部', '项目经理',   18000.0, '2023-03-01', 'active',   '13800000001', 'zhang.gong@cowork.com'),
  ('emp-002', '李设计', '设计部', '主任设计师', 15000.0, '2023-06-15', 'active',   '13800000002', 'li.sheji@cowork.com'),
  ('emp-003', '刘采购', '采购部', '采购主管',   12000.0, '2024-01-10', 'active',   '13800000003', 'liu.caigou@cowork.com'),
  ('emp-004', '赵开发', '开发部', '高级开发',   20000.0, '2022-09-01', 'active',   '13800000004', 'zhao.kaifa@cowork.com'),
  ('emp-005', '陈咨询', '咨询部', '高级顾问',   16000.0, '2023-11-20', 'on_leave', '13800000005', 'chen.zixun@cowork.com'),
  ('emp-006', '林财务', '财务部', '财务经理',   14000.0, '2024-04-01', 'active',   '13800000006', 'lin.caiwu@cowork.com'),
  ('emp-007', '钱前端', '开发部', '前端工程师', 15000.0, '2024-07-15', 'active',   '13800000007', 'qian.qianduan@cowork.com'),
  ('emp-008', '王监理', '工程部', '总监理',     22000.0, '2022-01-15', 'active',   '13800000008', 'wang.jianli@cowork.com'),
  ('emp-009', '周运维', '运维部', '运维工程师', 13000.0, '2024-10-01', 'active',   '13800000009', 'zhou.yunwei@cowork.com'),
  ('emp-010', '吴产品', '产品部', '产品经理',   16000.0, '2023-08-01', 'active',   '13800000010', 'wu.chanpin@cowork.com')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: attendance_records
-- Source: src/stores/hr_store.py → seed_hr() attendance_data
-- id format: att-{emp_id}-{date}
-- =============================================================================

INSERT INTO attendance_records (id, employee_id, date, check_in, check_out, status) VALUES
  ('att-emp-001-2026-03-02', 'emp-001', '2026-03-02', '08:52', '18:10', 'normal'),
  ('att-emp-002-2026-03-02', 'emp-002', '2026-03-02', '08:58', '18:05', 'normal'),
  ('att-emp-003-2026-03-02', 'emp-003', '2026-03-02', '09:02', '18:00', 'late'),
  ('att-emp-004-2026-03-02', 'emp-004', '2026-03-02', '08:45', '19:30', 'normal'),
  ('att-emp-006-2026-03-02', 'emp-006', '2026-03-02', '08:50', '18:00', 'normal'),
  ('att-emp-001-2026-03-03', 'emp-001', '2026-03-03', '08:55', '18:15', 'normal'),
  ('att-emp-004-2026-03-03', 'emp-004', '2026-03-03', '08:40', '20:00', 'normal'),
  ('att-emp-007-2026-03-03', 'emp-007', '2026-03-03', '09:15', '18:00', 'late'),
  ('att-emp-008-2026-03-03', 'emp-008', '2026-03-03', '08:30', '18:30', 'normal'),
  ('att-emp-010-2026-03-03', 'emp-010', '2026-03-03', '08:58', '18:05', 'normal'),
  ('att-emp-001-2026-03-04', 'emp-001', '2026-03-04', '08:50', '18:20', 'normal'),
  ('att-emp-002-2026-03-04', 'emp-002', '2026-03-04', '09:20', '18:00', 'late'),
  ('att-emp-006-2026-03-04', 'emp-006', '2026-03-04', '08:55', '18:00', 'normal'),
  ('att-emp-009-2026-03-04', 'emp-009', '2026-03-04', '08:48', '18:10', 'normal'),
  ('att-emp-003-2026-03-05', 'emp-003', '2026-03-05', '08:58', '18:05', 'normal'),
  ('att-emp-004-2026-03-05', 'emp-004', '2026-03-05', '08:42', '19:00', 'normal'),
  ('att-emp-007-2026-03-05', 'emp-007', '2026-03-05', NULL,    NULL,    'leave'),
  ('att-emp-008-2026-03-06', 'emp-008', '2026-03-06', '08:35', '18:30', 'normal'),
  ('att-emp-010-2026-03-06', 'emp-010', '2026-03-06', '08:55', '18:00', 'normal'),
  ('att-emp-001-2026-03-07', 'emp-001', '2026-03-07', '08:53', '18:10', 'normal'),
  ('att-emp-002-2026-03-07', 'emp-002', '2026-03-07', '08:57', '18:00', 'normal')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: leave_requests
-- Source: src/stores/hr_store.py → seed_hr() leave_data
-- =============================================================================

INSERT INTO leave_requests (id, employee_id, leave_type, start_date, end_date, days, reason, status, approver) VALUES
  ('leave-001', 'emp-007', 'personal', '2026-03-05', '2026-03-05', 1.0,  '个人事务处理', 'pending',  NULL),
  ('leave-002', 'emp-001', 'annual',   '2026-02-20', '2026-02-21', 2.0,  '年假',         'approved', '王总'),
  ('leave-003', 'emp-005', 'sick',     '2026-03-01', '2026-03-14', 10.0, '病假就医',     'approved', '王总'),
  ('leave-004', 'emp-003', 'personal', '2026-03-10', '2026-03-12', 3.0,  '家庭事务',     'rejected', '王总')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: salary_records
-- Source: src/stores/hr_store.py → seed_hr() salary_templates × 3 months
-- net = base + overtime + bonus - deductions - social - tax
-- =============================================================================

INSERT INTO salary_records (id, employee_id, month, base_salary, overtime_pay, bonus, deductions, social_insurance, tax, net_salary) VALUES
  -- emp-001: (18000, 800, 1500, 500, 2400, 2200) net=15200
  ('sal-emp-001-2026-01', 'emp-001', '2026-01', 18000, 800,  1500, 500, 2400, 2200, 15200.00),
  ('sal-emp-001-2026-02', 'emp-001', '2026-02', 18000, 800,  1500, 500, 2400, 2200, 15200.00),
  ('sal-emp-001-2026-03', 'emp-001', '2026-03', 18000, 800,  1500, 500, 2400, 2200, 15200.00),
  -- emp-002: (15000, 500, 1000, 500, 2000, 1600) net=12400
  ('sal-emp-002-2026-01', 'emp-002', '2026-01', 15000, 500,  1000, 500, 2000, 1600, 12400.00),
  ('sal-emp-002-2026-02', 'emp-002', '2026-02', 15000, 500,  1000, 500, 2000, 1600, 12400.00),
  ('sal-emp-002-2026-03', 'emp-002', '2026-03', 15000, 500,  1000, 500, 2000, 1600, 12400.00),
  -- emp-003: (12000, 300, 500, 500, 1800, 1100) net=9400
  ('sal-emp-003-2026-01', 'emp-003', '2026-01', 12000, 300,  500,  500, 1800, 1100, 9400.00),
  ('sal-emp-003-2026-02', 'emp-003', '2026-02', 12000, 300,  500,  500, 1800, 1100, 9400.00),
  ('sal-emp-003-2026-03', 'emp-003', '2026-03', 12000, 300,  500,  500, 1800, 1100, 9400.00),
  -- emp-004: (20000, 1200, 2000, 500, 2600, 2800) net=17300
  ('sal-emp-004-2026-01', 'emp-004', '2026-01', 20000, 1200, 2000, 500, 2600, 2800, 17300.00),
  ('sal-emp-004-2026-02', 'emp-004', '2026-02', 20000, 1200, 2000, 500, 2600, 2800, 17300.00),
  ('sal-emp-004-2026-03', 'emp-004', '2026-03', 20000, 1200, 2000, 500, 2600, 2800, 17300.00),
  -- emp-005: (16000, 600, 1200, 500, 2200, 1900) net=13200
  ('sal-emp-005-2026-01', 'emp-005', '2026-01', 16000, 600,  1200, 500, 2200, 1900, 13200.00),
  ('sal-emp-005-2026-02', 'emp-005', '2026-02', 16000, 600,  1200, 500, 2200, 1900, 13200.00),
  ('sal-emp-005-2026-03', 'emp-005', '2026-03', 16000, 600,  1200, 500, 2200, 1900, 13200.00),
  -- emp-006: (14000, 400, 800, 500, 2000, 1500) net=11200
  ('sal-emp-006-2026-01', 'emp-006', '2026-01', 14000, 400,  800,  500, 2000, 1500, 11200.00),
  ('sal-emp-006-2026-02', 'emp-006', '2026-02', 14000, 400,  800,  500, 2000, 1500, 11200.00),
  ('sal-emp-006-2026-03', 'emp-006', '2026-03', 14000, 400,  800,  500, 2000, 1500, 11200.00),
  -- emp-007: (15000, 500, 800, 500, 2000, 1600) net=12200
  ('sal-emp-007-2026-01', 'emp-007', '2026-01', 15000, 500,  800,  500, 2000, 1600, 12200.00),
  ('sal-emp-007-2026-02', 'emp-007', '2026-02', 15000, 500,  800,  500, 2000, 1600, 12200.00),
  ('sal-emp-007-2026-03', 'emp-007', '2026-03', 15000, 500,  800,  500, 2000, 1600, 12200.00),
  -- emp-008: (22000, 1500, 2500, 500, 2800, 3200) net=19500
  ('sal-emp-008-2026-01', 'emp-008', '2026-01', 22000, 1500, 2500, 500, 2800, 3200, 19500.00),
  ('sal-emp-008-2026-02', 'emp-008', '2026-02', 22000, 1500, 2500, 500, 2800, 3200, 19500.00),
  ('sal-emp-008-2026-03', 'emp-008', '2026-03', 22000, 1500, 2500, 500, 2800, 3200, 19500.00),
  -- emp-009: (13000, 400, 600, 500, 1900, 1300) net=10300
  ('sal-emp-009-2026-01', 'emp-009', '2026-01', 13000, 400,  600,  500, 1900, 1300, 10300.00),
  ('sal-emp-009-2026-02', 'emp-009', '2026-02', 13000, 400,  600,  500, 1900, 1300, 10300.00),
  ('sal-emp-009-2026-03', 'emp-009', '2026-03', 13000, 400,  600,  500, 1900, 1300, 10300.00),
  -- emp-010: (16000, 600, 1000, 500, 2200, 1900) net=13000 (corrected: 16000+600+1000-500-2200-1900=13000)
  ('sal-emp-010-2026-01', 'emp-010', '2026-01', 16000, 600,  1000, 500, 2200, 1900, 13000.00),
  ('sal-emp-010-2026-02', 'emp-010', '2026-02', 16000, 600,  1000, 500, 2200, 1900, 13000.00),
  ('sal-emp-010-2026-03', 'emp-010', '2026-03', 16000, 600,  1000, 500, 2200, 1900, 13000.00)
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: expense_reports
-- Source: src/stores/finance_store.py → seed_finance() expense_data
-- =============================================================================

INSERT INTO expense_reports (id, submitter, project_id, category, amount, status, submit_date, description) VALUES
  ('exp-001', '张工',   'proj-001', 'travel',        3500,  'approved',  '2026-02-15', '差旅费报销 — 赴施工现场'),
  ('exp-002', '李设计', 'proj-002', 'office',        1200,  'paid',      '2026-02-20', '办公用品采购'),
  ('exp-003', '赵开发', 'proj-001', 'material',      45000, 'submitted', '2026-03-01', '施工材料采购报销'),
  ('exp-004', '陈咨询', 'proj-003', 'entertainment', 2800,  'submitted', '2026-03-05', '业务招待费'),
  ('exp-005', '刘采购', 'proj-002', 'material',      28000, 'approved',  '2026-03-08', '设备采购材料费报销'),
  ('exp-006', '王监理', 'proj-001', 'travel',        5600,  'submitted', '2026-03-10', '监理出差差旅费'),
  ('exp-007', '钱前端', NULL,       'office',        680,   'draft',     NULL,         '个人办公设备耗材'),
  ('exp-008', '吴产品', 'proj-003', 'other',         15000, 'rejected',  '2026-02-28', '其他费用 — 审核未通过')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: budget_lines
-- Source: src/stores/finance_store.py → seed_finance() budget_data
-- =============================================================================

INSERT INTO budget_lines (id, project_id, category, planned_amount, actual_amount, fiscal_year, quarter) VALUES
  -- proj-001
  ('bgt-001', 'proj-001', '设计费', 800,  620,  2026, 1),
  ('bgt-002', 'proj-001', '施工费', 6000, 4500, 2026, 1),
  ('bgt-003', 'proj-001', '材料费', 3500, 3200, 2026, 1),
  ('bgt-004', 'proj-001', '咨询费', 700,  450,  2026, 1),
  -- proj-002
  ('bgt-005', 'proj-002', '设计费', 80,   75,   2026, 1),
  ('bgt-006', 'proj-002', '施工费', 200,  180,  2026, 1),
  ('bgt-007', 'proj-002', '材料费', 120,  95,   2026, 1),
  ('bgt-008', 'proj-002', '咨询费', 50,   30,   2026, 1),
  -- proj-003
  ('bgt-009', 'proj-003', '设计费', 60,   55,   2026, 1),
  ('bgt-010', 'proj-003', '施工费', 100,  40,   2026, 1),
  ('bgt-011', 'proj-003', '材料费', 80,   20,   2026, 1),
  ('bgt-012', 'proj-003', '咨询费', 40,   15,   2026, 1)
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: invoices
-- Source: src/stores/finance_store.py → seed_finance() invoice_data
-- =============================================================================

INSERT INTO invoices (id, vendor, project_id, amount, invoice_date, due_date, status, category) VALUES
  ('inv-001', '中建五局',       'proj-001', 500000, '2026-02-01', '2026-03-01', 'paid',    '施工费'),
  ('inv-002', '华为技术',       'proj-002', 180000, '2026-02-15', '2026-03-15', 'pending', '设备费'),
  ('inv-003', '金蝶软件',       'proj-002',  50000, '2026-01-20', '2026-02-20', 'overdue', '软件费'),
  ('inv-004', '中科院设计院',   'proj-001', 320000, '2026-03-01', '2026-04-01', 'pending', '设计费'),
  ('inv-005', '办公用品供应商', NULL,        12000, '2026-03-05', '2026-04-05', 'pending', '办公费'),
  ('inv-006', '差旅服务公司',   'proj-003',  25000, '2026-02-10', '2026-03-10', 'overdue', '差旅费')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: notices
-- Source: src/stores/oa_store.py → seed_oa() notices_raw
-- =============================================================================

INSERT INTO notices (id, title, content, type, target_user, is_read) VALUES
  ('notice-001', '系统维护通知',           '系统将于2026年3月15日22:00-24:00进行例行维护升级，届时平台将暂停服务，请提前保存工作。',                                                                                                                                  'system',          NULL,      FALSE),
  ('notice-002', '关于清明节放假安排的通知','根据国务院办公厅通知精神，2026年清明节放假安排如下：4月4日至4月6日放假调休，共3天。4月7日（星期二）上班。请各部门提前安排好工作。',                                                                                       'announcement',    NULL,      FALSE),
  ('notice-003', '您的年假申请已通过',       '您提交的2026年2月20日-21日年假申请已由王总审批通过，共2天。',                                                                                                                                                                'approval_result', 'emp-001', TRUE),
  ('notice-004', '报销单EXP-003已打款',      '您提交的差旅报销单（金额¥2,850.00）已完成财务打款，请查收。',                                                                                                                                                               'approval_result', 'emp-001', FALSE),
  ('notice-005', '新员工入职培训通知',       '定于2026年3月20日上午9:00在3楼会议室举办新员工入职培训，请相关部门负责人安排新员工准时参加。培训内容包括：公司制度、安全规范、系统使用指南。',                                                                            'announcement',    NULL,      FALSE),
  ('notice-006', '3月考勤异常提醒',         '系统检测到您本月有1次迟到记录（3月3日），请注意考勤规范。如有特殊情况请及时提交补卡申请。',                                                                                                                                  'system',          'emp-007', FALSE),
  ('notice-007', '项目周报提交提醒',         '本周五（3月14日）17:00前请提交本周项目进展周报，逾期将影响绩效考核。',                                                                                                                                                       'system',          NULL,      FALSE)
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: vehicle_requests
-- Source: src/stores/oa_store.py → seed_oa() vehicle_data
-- =============================================================================

INSERT INTO vehicle_requests (id, applicant, date, origin, destination, reason, status, approver) VALUES
  ('veh-001', 'emp-001', '2026-03-10', '公司总部', '发改委',         '项目汇报材料提交',         'approved', '王总'),
  ('veh-002', 'emp-004', '2026-03-14', '公司总部', '博物馆项目现场', '现场技术支持',             'pending',  NULL),
  ('veh-003', 'emp-001', '2026-03-18', '公司总部', '市住建局',       '专项债咨询对接会议',       'pending',  NULL)
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: procurement_packages
-- Source: src/stores/procurement_store.py → seed_procurement()
-- =============================================================================

INSERT INTO procurement_packages (id, project_id, name, category, supplier, budget_amount, actual_amount, status, plan_date, arrival_date, responsible, notes) VALUES
  ('proc-001', 'proj-001', '幕墙玻璃采购',    '材料', '南玻集团',     580.0, 545.0,  'delivering',  '2026-01-15', '2026-04-20', '刘采购', '进口Low-E玻璃，分三批到货，第三批预计4月20日到场'),
  ('proc-002', 'proj-001', '机电设备采购',    '设备', '格力电器',     420.0, 398.0,  'inspecting',  '2025-11-01', '2026-02-28', '周机电', '中央空调及新风系统设备，已到货待验收'),
  ('proc-003', 'proj-001', '展陈布展分包',    '分包', NULL,          1200.0, NULL,   'bidding',     '2026-03-20', NULL,         '冯展陈', '展陈设计与布展施工一体化分包，正在招标评审'),
  ('proc-004', 'proj-001', '消防工程分包',    '分包', '中消安防',     380.0, 365.0,  'completed',   '2025-08-01', '2026-01-20', '郑消防', '消防工程已完工并通过消防验收'),
  ('proc-005', 'proj-004', '智能化设备采购',  '设备', NULL,           860.0, NULL,   'planning',    '2026-08-15', NULL,         '唐智能', '含楼宇自控、安防监控、智能照明系统设备'),
  ('proc-006', 'proj-004', '暖通设备采购',    '设备', NULL,           520.0, NULL,   'planning',    '2026-09-01', NULL,         '宋暖通', '变频多联机及新风系统，待设计方案确定后启动采购'),
  ('proc-007', 'proj-006', '市政管材采购',    '材料', '金牛管业',     280.0, 268.0,  'completed',   '2025-06-01', '2025-07-15', '丁项目', '给排水管材及配件，已全部进场'),
  ('proc-008', 'proj-006', '绿化苗木采购',    '材料', '城市绿化公司', 150.0, 142.0,  'completed',   '2025-09-01', '2025-10-10', '丁项目', '小区绿化改造苗木，已种植完成')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: process_records
-- Source: src/stores/process_store.py → seed_processes()
-- =============================================================================

INSERT INTO process_records (id, project_id, record_type, title, date, author, content, status, related_stage) VALUES
  ('prec-001', 'proj-001', 'daily_log',     'A区幕墙安装进度',             '2026-03-12', '陈施工', '今日完成A区3-5层幕墙龙骨安装，共计安装铝合金龙骨48根。下午进行玻璃面板试装2块，效果良好。明日计划继续6-8层龙骨安装。',                                                                                                        'normal', 'construction'),
  ('prec-002', 'proj-001', 'quality_check', 'B区钢结构焊接质量抽检',       '2026-03-10', '王监理', '对B区二层钢结构焊接节点进行抽检，共抽查20个焊接点。发现3处焊缝存在气孔缺陷，不合格率15%，超出5%允许范围。已要求施工单位整改并复检。',                                                                                           'issue',  'construction'),
  ('prec-003', 'proj-001', 'material_entry','Low-E玻璃第三批到货验收',     '2026-03-11', '刘采购', '第三批Low-E中空玻璃到场120片，规格2400x1500mm。外观检查合格，抽取5片送检。厚度、透光率、遮阳系数均符合设计要求。验收合格入库。',                                                                                                 'normal', 'construction'),
  ('prec-004', 'proj-001', 'hidden_work',   'C区预埋件验收',               '2026-03-08', '王监理', 'C区一层幕墙预埋件隐蔽工程验收。共计验收预埋件86个，位置偏差均在允许范围内(±10mm)，锚固深度满足设计要求。验收合格，可进行后续幕墙安装。',                                                                                          'normal', 'construction'),
  ('prec-005', 'proj-001', 'safety_check',  '高空作业安全专项检查',         '2026-03-09', '陈施工', '对幕墙安装高空作业区域进行安全检查。检查内容：脚手架搭设、安全网、防坠落装置、个人防护用品佩戴。发现2名工人未正确系挂安全带，已当场纠正并进行安全教育。',                                                                    'normal', 'construction'),
  ('prec-006', 'proj-006', 'daily_log',     '管网接通施工记录',             '2026-01-15', '蒋施工', '完成B区生活给水管网与市政管网接通作业。接口采用法兰连接，打压测试1.5MPa保持30分钟无渗漏。同步完成污水管网接通。',                                                                                                                'normal', 'construction'),
  ('prec-007', 'proj-006', 'safety_check',  '深基坑作业安全检查',           '2026-01-10', '尤安全', '对管网施工深基坑(深度2.5m)进行安全检查。支护系统完好，排水设施正常运行，临边防护到位。发现局部坑壁有裂缝迹象，已安排监测并加密观测频次。',                                                                                    'issue',  'construction'),
  ('prec-008', 'proj-006', 'inspection',    '外墙保温施工巡检',             '2026-01-12', '沈监理', '巡检A栋外墙保温施工。保温板粘贴平整，锚固钉数量符合规范要求(每平米6个)。网格布搭接长度满足100mm要求。整体施工质量良好。',                                                                                                       'normal', 'construction')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: contracts
-- Source: src/stores/legal_store.py → seed_contracts()
-- =============================================================================

INSERT INTO contracts (id, title, contract_type, party_a, party_b, project_id, amount, sign_date, start_date, end_date, status, risk_level, key_terms, responsible) VALUES
  ('CTR-2024-001', '南方电网500kV输变电工程EPC总承包合同',
   'construction', '国债建设咨询有限公司', '广东送变电工程有限公司',
   'PRJ-2024-001', 128500000.00, '2024-01-15', '2024-02-01', '2025-12-31',
   'active', 'high',
   '工期24个月；质保期5年；逾期违约金按合同总价0.1%/天计算；不可抗力条款适用；争议由广州仲裁委员会仲裁',
   '张伟'),
  ('CTR-2024-002', '城市地下综合管廊工程设计咨询服务合同',
   'consulting', '国债建设咨询有限公司', '中国市政工程华北设计研究总院',
   'PRJ-2024-002', 3200000.00, '2024-03-01', '2024-03-15', '2024-11-30',
   'active', 'low',
   '按阶段付款：方案设计30%，初步设计40%，施工图设计30%；成果需通过政府审查；知识产权归甲方所有',
   '李明'),
  ('CTR-2024-003', '高速公路改扩建工程监理服务合同',
   'service', '国债建设咨询有限公司', '湖南省交通工程监理咨询有限公司',
   'PRJ-2024-003', 8760000.00, '2024-02-20', '2024-03-01', '2026-02-28',
   'active', 'medium',
   '监理范围包括质量、进度、投资三大控制及合同、信息、安全管理；监理人员配置不低于合同约定标准；月度报告制度',
   '王芳'),
  ('CTR-2024-004', '建筑材料采购框架协议（钢材类）',
   'procurement', '国债建设咨询有限公司', '宝武钢铁集团有限公司',
   NULL, 45000000.00, '2024-01-05', '2024-01-10', '2024-12-31',
   'active', 'medium',
   '框架协议有效期1年；价格与市场指数挂钩每季度调整；最低采购量2000吨；交货期：订单确认后15个工作日内',
   '陈强'),
  ('CTR-2023-008', '水利枢纽工程岩土勘察服务合同',
   'service', '国债建设咨询有限公司', '长江水利委员会综合勘测局',
   'PRJ-2023-008', 1850000.00, '2023-06-01', '2023-06-15', '2024-01-31',
   'completed', 'low',
   '勘察成果需满足《岩土工程勘察规范》GB50021要求；报告提交后30日内完成审查；争议由双方协商解决',
   '刘洋'),
  ('CTR-2023-012', '智慧工地信息化管理平台采购合同',
   'procurement', '国债建设咨询有限公司', '广联达科技股份有限公司',
   'PRJ-2024-001', 980000.00, '2023-11-20', '2023-12-01', '2025-11-30',
   'active', 'low',
   '软件许可证2年；包含系统集成、培训及运维服务；SLA保证系统可用性不低于99.5%；数据安全符合等保三级要求',
   '赵静'),
  ('CTR-2024-007', '新能源光伏电站EPC工程总承包合同',
   'construction', '国债建设咨询有限公司', '中国电力建设股份有限公司',
   'PRJ-2024-007', 215000000.00, '2024-04-10', '2024-05-01', '2025-04-30',
   'active', 'high',
   '装机容量200MW；并网调试期3个月；质保期25年（组件）/2年（土建）；政府补贴风险由乙方承担；FIDIC银皮书适用',
   '孙磊'),
  ('CTR-2024-009', '项目管理咨询服务合同（已终止）',
   'consulting', '国债建设咨询有限公司', '北京中咨工程建设监理有限公司',
   'PRJ-2024-009', 2400000.00, '2024-02-01', '2024-02-15', '2025-02-14',
   'terminated', 'medium',
   '因项目停工双方协商提前终止；已完成工作量按比例结算；终止协议于2024-08-30签署；无违约责任认定',
   '周欣')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: audit_reports
-- Source: src/stores/audit_store.py → seed_audit_reports()
-- =============================================================================

INSERT INTO audit_reports (id, title, audit_type, project_id, auditor, start_date, end_date, status, findings_count, risk_level, summary) VALUES
  ('audit-001', '2024年度财务合规审计报告',
   'financial', NULL, '王建国', '2024-01-08', '2024-01-26',
   'completed', 7, 'medium',
   '对2023年度全公司财务账目进行全面审计，发现7项一般性问题，主要集中于费用报销流程不规范及合同台账管理缺失，已提出整改意见并跟踪落实。'),
  ('audit-002', '南沙液化天然气接收站EPC项目质量合规审计',
   'compliance', 'proj-001', '李晓梅', '2024-03-11', '2024-03-29',
   'completed', 3, 'low',
   '项目质量管理体系运行良好，施工记录完整，检验批次合格率达98.6%，发现3项轻微不符合项，已完成整改闭环。'),
  ('audit-003', '大亚湾石化园区工程安全生产专项审计',
   'safety', 'proj-002', '张伟', '2024-05-06', '2024-05-24',
   'follow_up', 12, 'high',
   '审计发现高处作业防护措施不足、危化品存储区域标识缺失等12项安全隐患，其中2项属重大隐患，已责令停工整改，目前处于整改跟踪阶段。'),
  ('audit-004', '粤港澳大湾区综合管廊工程进度与造价审计',
   'project', 'proj-003', '陈志强', '2024-07-15', NULL,
   'in_progress', 5, 'medium',
   '正在对项目进度偏差及工程变更索赔进行专项审计，已初步发现5处工程量核算偏差，涉及金额约380万元，审计工作持续推进中。'),
  ('audit-005', '深圳国际会展中心配套工程年度合规检查',
   'compliance', 'proj-004', '刘芳', '2024-09-02', NULL,
   'in_progress', 2, 'low',
   '对项目分包管理、材料采购及劳务用工合规性进行审计，目前已完成现场核查阶段，发现2项合同签署程序瑕疵，正在整理审计报告。'),
  ('audit-006', 'Q3季度全公司内控体系专项审计',
   'financial', NULL, '赵磊', '2024-10-14', NULL,
   'planned', 0, 'low',
   '计划对第三季度各部门内部控制执行情况进行全面审查，重点关注采购审批权限执行、资金使用合规性及固定资产管理，审计尚未开始。')
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Section: supervision_records
-- Source: src/stores/supervision_store.py → seed_supervision_records()
-- =============================================================================

INSERT INTO supervision_records (id, project_id, record_type, title, date, inspector, location, content, status, issues_found, photos) VALUES
  ('sup-001', 'proj-001', 'patrol',  '基础工程日常巡视检查',
   '2025-03-03', '王建国', 'A区基础施工段',
   '对基础钢筋绑扎工序进行巡视，钢筋间距符合设计要求，绑扎质量良好，混凝土保护层厚度达标，施工工艺规范。',
   'normal', 0,
   ARRAY['patrol_20250303_001.jpg', 'patrol_20250303_002.jpg']),
  ('sup-002', 'proj-001', 'witness', '地下室底板混凝土浇筑旁站',
   '2025-03-05', '李敏华', '地下室底板区域',
   '对地下室底板混凝土浇筑全程旁站监督，检查混凝土坍落度、浇筑顺序及振捣质量，混凝土强度等级C35，共浇筑方量320m³，浇筑过程符合规范要求。',
   'normal', 0,
   ARRAY['witness_20250305_001.jpg']),
  ('sup-003', 'proj-001', 'issue',   '主体结构钢筋偏位质量问题',
   '2025-03-08', '王建国', 'B区3层剪力墙',
   '巡视发现B区3层部分剪力墙竖向钢筋偏位超出允许偏差，最大偏位达18mm，超过规范允许值10mm，已签发监理通知单要求施工单位整改。',
   'issue',  3,
   ARRAY['issue_20250308_001.jpg', 'issue_20250308_002.jpg', 'issue_20250308_003.jpg']),
  ('sup-004', 'proj-001', 'meeting', '工程质量专题监理例会',
   '2025-03-10', '张志远', '项目部会议室',
   '召开质量专题例会，通报近期质量问题及整改情况，讨论下阶段施工质量控制重点，建设单位、施工单位、监理单位三方参与，形成会议纪要并签字确认。',
   'resolved', 0,
   ARRAY[]::TEXT[]),
  ('sup-005', 'proj-002', 'patrol',  '外墙保温施工质量巡视',
   '2025-03-11', '赵丽萍', 'C座外立面',
   '对外墙岩棉保温板粘贴施工进行巡视，检查粘结面积、锚固件数量及间距，发现局部保温板粘结面积不足50%，要求施工单位立即整改，重新进行粘贴施工。',
   'issue',  2,
   ARRAY['patrol_20250311_001.jpg', 'patrol_20250311_002.jpg']),
  ('sup-006', 'proj-002', 'witness', '屋面防水层施工旁站记录',
   '2025-03-13', '赵丽萍', 'D座屋面',
   '对屋面SBS改性沥青防水卷材施工进行旁站，检查基层处理、卷材搭接宽度（≥100mm）、热熔粘结质量及细部节点处理，施工质量符合设计及规范要求，验收合格。',
   'normal', 0,
   ARRAY['witness_20250313_001.jpg', 'witness_20250313_002.jpg']),
  ('sup-007', 'proj-002', 'issue',   '消防管道安装质量问题整改复查',
   '2025-03-14', '刘海峰', 'B座地下室消防泵房',
   '对前期发现的消防管道支架间距超标问题进行复查，施工单位已按整改要求增设支架，支架间距符合规范要求（水平管≤2.5m），整改到位，问题已关闭。',
   'resolved', 1,
   ARRAY['issue_20250314_001.jpg']),
  ('sup-008', 'proj-003', 'patrol',  '道路工程路基压实度巡视',
   '2025-03-15', '陈志强', '市政道路K0+000至K0+500段',
   '对市政道路路基填筑压实施工进行巡视，检查压实机械配备、压实遍数及碾压搭接宽度，现场取样送检压实度，检测结果满足设计要求（≥96%），施工质量合格。',
   'normal', 0,
   ARRAY['patrol_20250315_001.jpg', 'patrol_20250315_002.jpg', 'patrol_20250315_003.jpg'])
ON CONFLICT (id) DO NOTHING;


-- =============================================================================
-- Re-enable row-level security
-- =============================================================================
SET session_replication_role = DEFAULT;
