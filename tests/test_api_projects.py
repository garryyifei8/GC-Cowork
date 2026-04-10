"""API tests for Projects, Tasks, Activities, Procurement, Process endpoints.

Seed data constants (from project_store.py and task_store.py):
  Projects: proj-001 (施工中/active), proj-002 (风险/risk), proj-003 (立项/planning)
            proj-004 … proj-010 (various stages)
  Tasks:    task-001-01 … task-010-03
  Procurement: proc-001 … proc-008 (under proj-001, proj-004, proj-006)
  Process:  prec-001 … prec-008 (under proj-001, proj-006)
"""

# ---------------------------------------------------------------------------
# Helper constants — all seeded IDs guaranteed to exist after each reset
# ---------------------------------------------------------------------------

PROJECT_ID = "proj-001"          # 省立博物馆EPC工程  stage=construction  status=active
PROJECT_ID_RISK = "proj-002"     # stage=construction  status=risk
PROJECT_ID_INIT = "proj-003"     # stage=initiation    status=planning
PROJECT_ID_DESIGN = "proj-004"   # stage=design        status=active
TASK_ID = "task-001-01"          # belongs to proj-001
TASK_ID_2 = "task-001-02"        # belongs to proj-001  (for conflict-test)
PROC_ID = "proc-001"             # belongs to proj-001
PROC_ID_006 = "proc-007"         # belongs to proj-006
PROCESS_ID = "prec-001"          # belongs to proj-001


# ===========================================================================
# TestProjectList
# ===========================================================================

class TestProjectList:
    """GET /api/projects — list all projects."""

    def test_list_projects(self, client):
        """Returns 200 with a list containing all 10 seed projects."""
        resp = client.get("/api/projects")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 10  # 10 seed projects
        ids = [p["id"] for p in data]
        assert PROJECT_ID in ids

    def test_list_projects_schema_fields(self, client):
        """Each project item has the required schema fields."""
        resp = client.get("/api/projects")
        assert resp.status_code == 200
        project = next(p for p in resp.json() if p["id"] == PROJECT_ID)
        for field in ("id", "name", "project_type", "stage", "status", "status_label",
                      "progress_pct", "team_size", "team_members"):
            assert field in project, f"Missing field: {field}"

    def test_list_projects_filter_status_active(self, client):
        """?status=active returns only active projects."""
        resp = client.get("/api/projects?status=active")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) > 0
        for p in data:
            assert p["status"] == "active"

    def test_list_projects_filter_status_risk(self, client):
        """?status=risk returns only risk projects."""
        resp = client.get("/api/projects?status=risk")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) > 0
        for p in data:
            assert p["status"] == "risk"

    def test_list_projects_filter_no_match(self, client):
        """?status=nonexistent returns an empty list."""
        resp = client.get("/api/projects?status=nonexistent_status")
        assert resp.status_code == 200
        assert resp.json() == []


# ===========================================================================
# TestProjectDetail
# ===========================================================================

class TestProjectDetail:
    """GET /api/projects/{id}."""

    def test_get_project(self, client):
        """Returns 200 with full project detail including tasks."""
        resp = client.get(f"/api/projects/{PROJECT_ID}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == PROJECT_ID
        assert data["name"] == "省立博物馆EPC工程"
        assert data["stage"] == "construction"
        assert data["status"] == "active"
        assert "tasks" in data
        assert "milestones" in data
        assert "risks" in data
        assert isinstance(data["tasks"], list)
        assert len(data["tasks"]) > 0

    def test_get_project_includes_risk_fields(self, client):
        """Project detail includes budget_amount and actual_spend."""
        resp = client.get(f"/api/projects/{PROJECT_ID}")
        assert resp.status_code == 200
        data = resp.json()
        assert "budget_amount" in data
        assert "actual_spend" in data
        assert data["budget_amount"] == 12000.0
        assert data["actual_spend"] == 8160.0

    def test_get_project_not_found(self, client):
        """Returns 404 for non-existent project ID."""
        resp = client.get("/api/projects/does-not-exist")
        assert resp.status_code == 404


# ===========================================================================
# TestProjectCRUD
# ===========================================================================

class TestProjectCRUD:
    """POST / PATCH / DELETE /api/projects."""

    def test_create_project(self, client):
        """POST creates a new project and returns 201 with the project item."""
        payload = {
            "name": "测试新建工程",
            "project_type": "EPC / 测试",
            "budget_display": "100万",
            "due_date": "2027-01-01",
            "description": "测试描述",
            "manager": "测试经理",
        }
        resp = client.post("/api/projects", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "测试新建工程"
        assert data["project_type"] == "EPC / 测试"
        assert "id" in data
        # Verify project is retrievable via GET
        new_id = data["id"]
        get_resp = client.get(f"/api/projects/{new_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["id"] == new_id

    def test_create_project_with_manager_in_team(self, client):
        """Manager provided in create request appears in team_members."""
        payload = {"name": "Manager Test", "manager": "王经理"}
        resp = client.post("/api/projects", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert "王经理" in data["team_members"]

    def test_create_project_missing_name_fails(self, client):
        """POST without required name field returns 422 validation error."""
        resp = client.post("/api/projects", json={"project_type": "EPC"})
        assert resp.status_code == 422

    def test_update_project(self, client):
        """PATCH performs partial update and returns updated project."""
        payload = {"status": "risk", "progress_pct": 75.0}
        resp = client.patch(f"/api/projects/{PROJECT_ID}", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == PROJECT_ID
        assert data["status"] == "risk"
        assert data["progress_pct"] == 75.0

    def test_update_project_not_found(self, client):
        """PATCH non-existent project returns 404."""
        resp = client.patch("/api/projects/no-such-project", json={"status": "active"})
        assert resp.status_code == 404

    def test_delete_project(self, client):
        """DELETE removes the project and subsequent GET returns 404."""
        resp = client.delete(f"/api/projects/{PROJECT_ID}")
        assert resp.status_code == 204
        get_resp = client.get(f"/api/projects/{PROJECT_ID}")
        assert get_resp.status_code == 404

    def test_delete_project_not_found(self, client):
        """DELETE non-existent project returns 404."""
        resp = client.delete("/api/projects/no-such-project")
        assert resp.status_code == 404


# ===========================================================================
# TestProjectTransition
# ===========================================================================

class TestProjectTransition:
    """POST /api/projects/{id}/transition."""

    def test_transition_valid(self, client):
        """Transition proj-001 from construction -> acceptance (valid)."""
        # proj-001 is at CONSTRUCTION; valid next stage is ACCEPTANCE
        resp = client.post(
            f"/api/projects/{PROJECT_ID}/transition",
            json={"target_stage": "acceptance"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["stage"] == "acceptance"

    def test_transition_updates_status_label(self, client):
        """Transition also updates status_label to the Chinese label."""
        resp = client.post(
            f"/api/projects/{PROJECT_ID}/transition",
            json={"target_stage": "acceptance"},
        )
        assert resp.status_code == 200
        assert resp.json()["status_label"] == "验收"

    def test_transition_invalid_stage_value(self, client):
        """Transitioning to an unknown stage value returns 400.

        The app's http_exception_handler wraps the HTTPException detail dict
        as str(exc.detail) inside the 'message' field, so we check for the
        INVALID_STAGE keyword inside that message string.
        """
        resp = client.post(
            f"/api/projects/{PROJECT_ID}/transition",
            json={"target_stage": "flying_to_moon"},
        )
        assert resp.status_code == 400
        body = resp.json()
        # The outer error_code from the handler is HTTP_400
        assert body["error_code"] == "HTTP_400"
        # The original dict detail is serialised into the 'message' string
        assert "INVALID_STAGE" in body["message"]

    def test_transition_invalid_flow(self, client):
        """Transitioning to a stage not reachable from current returns 400.

        Same response shape as above — detail dict embedded in 'message' string.
        """
        # proj-001 is at CONSTRUCTION; going back to DESIGN is not allowed
        resp = client.post(
            f"/api/projects/{PROJECT_ID}/transition",
            json={"target_stage": "design"},
        )
        assert resp.status_code == 400
        body = resp.json()
        assert body["error_code"] == "HTTP_400"
        assert "INVALID_TRANSITION" in body["message"]

    def test_transition_project_not_found(self, client):
        """Transition for unknown project returns 404."""
        resp = client.post(
            "/api/projects/no-such/transition",
            json={"target_stage": "acceptance"},
        )
        assert resp.status_code == 404


# ===========================================================================
# TestTaskEndpoints
# ===========================================================================

class TestTaskEndpoints:
    """Task CRUD across /api/tasks and /api/projects/{id}/tasks."""

    def test_list_all_tasks(self, client):
        """GET /api/tasks returns all tasks across all projects."""
        resp = client.get("/api/tasks")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Each item must have project_name field (TaskWithProject)
        for item in data:
            assert "project_name" in item

    def test_list_all_tasks_filter_status(self, client):
        """GET /api/tasks?status=in_progress filters correctly."""
        resp = client.get("/api/tasks?status=in_progress")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) > 0
        for t in data:
            assert t["status"] == "in_progress"

    def test_list_all_tasks_filter_assignee(self, client):
        """GET /api/tasks?assignee=吴幕墙 returns tasks for that assignee."""
        resp = client.get("/api/tasks?assignee=吴幕墙")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) > 0
        for t in data:
            assert t["assignee"] == "吴幕墙"

    def test_list_project_tasks(self, client):
        """GET /api/projects/{id}/tasks returns tasks for that project."""
        resp = client.get(f"/api/projects/{PROJECT_ID}/tasks")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 5  # proj-001 has 5 seed tasks
        for t in data:
            assert t["project_id"] == PROJECT_ID

    def test_list_project_tasks_not_found(self, client):
        """GET tasks for non-existent project returns 404."""
        resp = client.get("/api/projects/no-such-project/tasks")
        assert resp.status_code == 404

    def test_create_task(self, client):
        """POST /api/projects/{id}/tasks creates a new task and returns 201."""
        payload = {
            "name": "新建测试任务",
            "assignee": "测试人员",
            "priority": "high",
            "due_date": "2026-12-31",
            "description": "这是一个测试任务",
        }
        resp = client.post(f"/api/projects/{PROJECT_ID}/tasks", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "新建测试任务"
        assert data["assignee"] == "测试人员"
        assert data["priority"] == "high"
        assert data["project_id"] == PROJECT_ID
        assert data["status"] == "todo"  # default status

    def test_create_task_verifiable_via_list(self, client):
        """Newly created task appears in the project task list."""
        payload = {"name": "可查验任务"}
        client.post(f"/api/projects/{PROJECT_ID}/tasks", json=payload)
        list_resp = client.get(f"/api/projects/{PROJECT_ID}/tasks")
        names = [t["name"] for t in list_resp.json()]
        assert "可查验任务" in names

    def test_create_task_project_not_found(self, client):
        """POST task to non-existent project returns 404."""
        resp = client.post(
            "/api/projects/no-such-project/tasks",
            json={"name": "任务"},
        )
        assert resp.status_code == 404

    def test_get_task(self, client):
        """GET /api/tasks/{id} returns the correct task."""
        resp = client.get(f"/api/tasks/{TASK_ID}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == TASK_ID
        assert data["project_id"] == PROJECT_ID
        assert data["name"] == "完成展厅A区幕墙施工"

    def test_get_task_not_found(self, client):
        """GET /api/tasks/{id} for non-existent task returns 404."""
        resp = client.get("/api/tasks/no-such-task")
        assert resp.status_code == 404

    def test_update_task(self, client):
        """PATCH /api/tasks/{id} performs partial update."""
        payload = {"status": "done", "assignee": "更新人员"}
        resp = client.patch(f"/api/tasks/{TASK_ID}", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "done"
        assert data["assignee"] == "更新人员"

    def test_update_task_not_found(self, client):
        """PATCH non-existent task returns 404."""
        resp = client.patch("/api/tasks/no-such-task", json={"status": "done"})
        assert resp.status_code == 404

    def test_delete_task(self, client):
        """DELETE /api/tasks/{id} removes the task (204) and GET returns 404."""
        resp = client.delete(f"/api/tasks/{TASK_ID}")
        assert resp.status_code == 204
        get_resp = client.get(f"/api/tasks/{TASK_ID}")
        assert get_resp.status_code == 404

    def test_delete_task_not_found(self, client):
        """DELETE non-existent task returns 404."""
        resp = client.delete("/api/tasks/no-such-task")
        assert resp.status_code == 404


# ===========================================================================
# TestMilestoneEndpoints
# ===========================================================================

class TestMilestoneEndpoints:
    """Milestone CRUD under /api/projects/{id}/milestones."""

    def test_create_milestone(self, client):
        """POST /api/projects/{id}/milestones creates a milestone (201)."""
        payload = {"name": "测试里程碑", "date": "2027-01-01", "status": "pending"}
        resp = client.post(f"/api/projects/{PROJECT_ID}/milestones", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "测试里程碑"
        assert data["status"] == "pending"

    def test_create_milestone_appears_in_project(self, client):
        """Newly created milestone appears in the project detail milestones list."""
        payload = {"name": "验证里程碑", "date": "2027-02-01", "status": "pending"}
        client.post(f"/api/projects/{PROJECT_ID}/milestones", json=payload)
        detail_resp = client.get(f"/api/projects/{PROJECT_ID}")
        milestone_names = [m["name"] for m in detail_resp.json()["milestones"]]
        assert "验证里程碑" in milestone_names

    def test_update_milestone(self, client):
        """PATCH /api/projects/{id}/milestones/0 updates the first milestone."""
        # proj-001 has milestones[0] = "主体结构封顶"
        payload = {"status": "completed", "name": "主体结构封顶-更新"}
        resp = client.patch(f"/api/projects/{PROJECT_ID}/milestones/0", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "completed"
        assert data["name"] == "主体结构封顶-更新"

    def test_update_milestone_not_found(self, client):
        """PATCH out-of-range milestone index returns 404."""
        resp = client.patch(
            f"/api/projects/{PROJECT_ID}/milestones/9999",
            json={"status": "completed"},
        )
        assert resp.status_code == 404

    def test_delete_milestone(self, client):
        """DELETE /api/projects/{id}/milestones/0 removes the first milestone."""
        # proj-001 starts with 4 milestones
        before_resp = client.get(f"/api/projects/{PROJECT_ID}")
        before_count = len(before_resp.json()["milestones"])

        resp = client.delete(f"/api/projects/{PROJECT_ID}/milestones/0")
        assert resp.status_code == 204

        after_resp = client.get(f"/api/projects/{PROJECT_ID}")
        after_count = len(after_resp.json()["milestones"])
        assert after_count == before_count - 1

    def test_delete_milestone_not_found(self, client):
        """DELETE out-of-range milestone index returns 404."""
        resp = client.delete(f"/api/projects/{PROJECT_ID}/milestones/9999")
        assert resp.status_code == 404


# ===========================================================================
# TestRiskEndpoints
# ===========================================================================

class TestRiskEndpoints:
    """Risk CRUD under /api/projects/{id}/risks."""

    def test_create_risk(self, client):
        """POST /api/projects/{id}/risks creates a risk (201)."""
        payload = {
            "description": "测试风险描述",
            "level": "high",
            "mitigation": "尽快处理",
        }
        resp = client.post(f"/api/projects/{PROJECT_ID}/risks", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["description"] == "测试风险描述"
        assert data["severity"] == "high"

    def test_create_risk_appears_in_project(self, client):
        """Newly created risk appears in project detail risks list."""
        payload = {"description": "可查验风险", "level": "medium"}
        client.post(f"/api/projects/{PROJECT_ID}/risks", json=payload)
        detail = client.get(f"/api/projects/{PROJECT_ID}").json()
        descriptions = [r["description"] for r in detail["risks"]]
        assert "可查验风险" in descriptions

    def test_update_risk(self, client):
        """PATCH /api/projects/{id}/risks/0 updates the first risk."""
        # proj-001 has 1 seed risk at index 0
        payload = {"description": "已更新的风险描述", "level": "critical"}
        resp = client.patch(f"/api/projects/{PROJECT_ID}/risks/0", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["description"] == "已更新的风险描述"
        assert data["severity"] == "critical"

    def test_update_risk_not_found(self, client):
        """PATCH out-of-range risk index returns 404."""
        resp = client.patch(
            f"/api/projects/{PROJECT_ID}/risks/9999",
            json={"description": "x"},
        )
        assert resp.status_code == 404

    def test_delete_risk(self, client):
        """DELETE /api/projects/{id}/risks/0 removes the first risk."""
        before_resp = client.get(f"/api/projects/{PROJECT_ID}")
        before_count = len(before_resp.json()["risks"])

        resp = client.delete(f"/api/projects/{PROJECT_ID}/risks/0")
        assert resp.status_code == 204

        after_resp = client.get(f"/api/projects/{PROJECT_ID}")
        after_count = len(after_resp.json()["risks"])
        assert after_count == before_count - 1

    def test_delete_risk_not_found(self, client):
        """DELETE out-of-range risk index returns 404."""
        resp = client.delete(f"/api/projects/{PROJECT_ID}/risks/9999")
        assert resp.status_code == 404


# ===========================================================================
# TestTeamEndpoints
# ===========================================================================

class TestTeamEndpoints:
    """Team member management under /api/projects/{id}/team."""

    def test_add_team_member(self, client):
        """POST /api/projects/{id}/team adds a member (201) and returns updated list."""
        resp = client.post(
            f"/api/projects/{PROJECT_ID}/team",
            json={"name": "新团队成员"},
        )
        assert resp.status_code == 201
        members = resp.json()
        assert "新团队成员" in members

    def test_add_team_member_duplicate_conflict(self, client):
        """POST same member twice returns 409."""
        # 张工 is already in proj-001 seed data
        resp = client.post(
            f"/api/projects/{PROJECT_ID}/team",
            json={"name": "张工"},
        )
        assert resp.status_code == 409

    def test_replace_team(self, client):
        """PUT /api/projects/{id}/team replaces the entire member list."""
        new_members = ["成员A", "成员B", "成员C"]
        resp = client.put(
            f"/api/projects/{PROJECT_ID}/team",
            json={"members": new_members},
        )
        assert resp.status_code == 200
        result = resp.json()
        assert result == new_members

    def test_remove_team_member(self, client):
        """DELETE /api/projects/{id}/team/{name} removes the member (204)."""
        # 张工 is in proj-001
        resp = client.delete(f"/api/projects/{PROJECT_ID}/team/张工")
        assert resp.status_code == 204
        detail = client.get(f"/api/projects/{PROJECT_ID}").json()
        assert "张工" not in detail["team_members"]

    def test_remove_team_member_not_found(self, client):
        """DELETE a member not on the team returns 404."""
        resp = client.delete(f"/api/projects/{PROJECT_ID}/team/不存在的人")
        assert resp.status_code == 404


# ===========================================================================
# TestActivityEndpoints
# ===========================================================================

class TestActivityEndpoints:
    """Activity log endpoints."""

    def test_list_project_activities(self, client):
        """GET /api/projects/{id}/activities returns activity list."""
        resp = client.get(f"/api/projects/{PROJECT_ID}/activities")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) > 0
        for item in data:
            assert item["project_id"] == PROJECT_ID
            assert "event_type" in item
            assert "actor" in item
            assert "summary" in item
            assert "created_at" in item

    def test_list_project_activities_not_found(self, client):
        """GET activities for non-existent project returns 404."""
        resp = client.get("/api/projects/no-such-project/activities")
        assert resp.status_code == 404

    def test_list_recent_activities(self, client):
        """GET /api/activities/recent returns recent activities (default limit=10)."""
        resp = client.get("/api/activities/recent")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) <= 10

    def test_list_recent_activities_custom_limit(self, client):
        """GET /api/activities/recent?limit=5 returns at most 5 items."""
        resp = client.get("/api/activities/recent?limit=5")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) <= 5

    def test_list_recent_activities_invalid_limit(self, client):
        """GET /api/activities/recent?limit=0 fails validation (422)."""
        resp = client.get("/api/activities/recent?limit=0")
        assert resp.status_code == 422


# ===========================================================================
# TestTaskCommentEndpoints
# ===========================================================================

class TestTaskCommentEndpoints:
    """Task comment CRUD at /api/tasks/{task_id}/comments."""

    def test_create_task_comment(self, client):
        """POST /api/tasks/{task_id}/comments creates a comment (201)."""
        payload = {"content": "This is a test comment", "author": "测试用户"}
        resp = client.post(f"/api/tasks/{TASK_ID}/comments", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["event_type"] == "task_comment"
        assert data["actor"] == "测试用户"
        assert data["summary"] == "This is a test comment"
        assert data["project_id"] == PROJECT_ID

    def test_create_task_comment_default_author(self, client):
        """POST without author uses the default author name."""
        payload = {"content": "Default author comment"}
        resp = client.post(f"/api/tasks/{TASK_ID}/comments", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["actor"] == "当前用户"

    def test_create_task_comment_appears_in_list(self, client):
        """Newly created comment appears in GET /api/tasks/{id}/comments."""
        payload = {"content": "Verifiable comment", "author": "验证者"}
        client.post(f"/api/tasks/{TASK_ID}/comments", json=payload)

        list_resp = client.get(f"/api/tasks/{TASK_ID}/comments")
        assert list_resp.status_code == 200
        summaries = [c["summary"] for c in list_resp.json()]
        assert "Verifiable comment" in summaries

    def test_list_task_comments_empty(self, client):
        """GET comments for a task with no comments returns empty list."""
        # task-001-02 has no seed comments
        resp = client.get(f"/api/tasks/{TASK_ID_2}/comments")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_create_task_comment_task_not_found(self, client):
        """POST comment on non-existent task returns 404."""
        payload = {"content": "orphan comment"}
        resp = client.post("/api/tasks/no-such-task/comments", json=payload)
        assert resp.status_code == 404

    def test_list_task_comments_task_not_found(self, client):
        """GET comments for non-existent task returns 404."""
        resp = client.get("/api/tasks/no-such-task/comments")
        assert resp.status_code == 404

    def test_create_task_comment_empty_content_fails(self, client):
        """POST with empty content string fails validation (422)."""
        payload = {"content": ""}
        resp = client.post(f"/api/tasks/{TASK_ID}/comments", json=payload)
        assert resp.status_code == 422


# ===========================================================================
# TestProcurementEndpoints
# ===========================================================================

class TestProcurementEndpoints:
    """Procurement endpoints under /api/projects/{id}/procurement."""

    def test_list_procurements(self, client):
        """GET /api/projects/{id}/procurement returns items list."""
        resp = client.get(f"/api/projects/{PROJECT_ID}/procurement")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert isinstance(data["items"], list)
        assert len(data["items"]) == 4  # proj-001 has 4 seed packages

    def test_list_procurements_project_not_found(self, client):
        """GET procurement for non-existent project returns 404."""
        resp = client.get("/api/projects/no-such-project/procurement")
        assert resp.status_code == 404

    def test_create_procurement(self, client):
        """POST /api/projects/{id}/procurement creates a new package (201)."""
        payload = {
            "name": "测试采购包",
            "category": "材料",
            "budget_amount": 100.0,
            "plan_date": "2026-06-01",
            "responsible": "测试采购员",
        }
        resp = client.post(f"/api/projects/{PROJECT_ID}/procurement", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "测试采购包"
        assert data["project_id"] == PROJECT_ID

    def test_update_procurement_status(self, client):
        """PUT /api/projects/{id}/procurement/{pkg_id} updates status."""
        payload = {"status": "contracted"}
        resp = client.put(
            f"/api/projects/{PROJECT_ID}/procurement/{PROC_ID}",
            json=payload,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "contracted"

    def test_update_procurement_not_found(self, client):
        """PUT with non-existent package ID returns 404."""
        resp = client.put(
            f"/api/projects/{PROJECT_ID}/procurement/no-such-pkg",
            json={"status": "contracted"},
        )
        assert resp.status_code == 404


# ===========================================================================
# TestProcessEndpoints
# ===========================================================================

class TestProcessEndpoints:
    """Process record endpoints under /api/projects/{id}/processes."""

    def test_list_processes(self, client):
        """GET /api/projects/{id}/processes returns items list."""
        resp = client.get(f"/api/projects/{PROJECT_ID}/processes")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        items = data["items"]
        assert isinstance(items, list)
        assert len(items) == 5  # proj-001 has 5 seed records

    def test_list_processes_filter_type(self, client):
        """GET ?record_type=daily_log returns only daily log records."""
        resp = client.get(f"/api/projects/{PROJECT_ID}/processes?record_type=daily_log")
        assert resp.status_code == 200
        data = resp.json()
        items = data["items"]
        assert len(items) > 0
        for item in items:
            assert item["record_type"] == "daily_log"

    def test_list_processes_project_not_found(self, client):
        """GET processes for non-existent project returns 404."""
        resp = client.get("/api/projects/no-such-project/processes")
        assert resp.status_code == 404

    def test_create_process(self, client):
        """POST /api/projects/{id}/processes creates a new record (201)."""
        payload = {
            "record_type": "daily_log",
            "title": "测试施工日志",
            "date": "2026-04-06",
            "author": "测试作者",
            "content": "今日施工情况正常，无安全事故。",
            "status": "normal",
        }
        resp = client.post(f"/api/projects/{PROJECT_ID}/processes", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "测试施工日志"
        assert data["project_id"] == PROJECT_ID
        assert data["author"] == "测试作者"

    def test_create_process_appears_in_list(self, client):
        """Newly created process record appears in subsequent list call."""
        payload = {
            "record_type": "quality_check",
            "title": "可查验质量检查",
            "date": "2026-04-06",
            "author": "检查员",
            "content": "质量检查正常。",
            "status": "normal",
        }
        client.post(f"/api/projects/{PROJECT_ID}/processes", json=payload)
        list_resp = client.get(f"/api/projects/{PROJECT_ID}/processes")
        titles = [r["title"] for r in list_resp.json()["items"]]
        assert "可查验质量检查" in titles
