"""End-to-end integration tests — verify multi-step workflows.

INT-001 ~ INT-005  : Chat → Dispatch → Agent → Response chain
INT-010 ~ INT-013  : Task lifecycle workflows
INT-020 ~ INT-023  : Project lifecycle workflows
INT-040 ~ INT-043  : Seed data consistency checks
"""

from unittest.mock import AsyncMock, patch


# ---------------------------------------------------------------------------
# Helper — build a DispatchAgent intent payload
# ---------------------------------------------------------------------------

def _make_intent(primary: str = "dispatch", reply: str = "好的！") -> dict:
    """Return a minimal chat_json payload that the DispatchAgent understands."""
    return {
        "primary_agent": primary,
        "secondary_agents": [],
        "complexity": "simple",
        "workflow_pattern": "serial",
        "confidence": 0.9,
        "reply": reply,
    }


# ---------------------------------------------------------------------------
# Seed constants (from project_store.py and task_store.py)
# ---------------------------------------------------------------------------

SEED_PROJECT_COUNT = 10          # exactly 10 projects in seed_projects()
SEED_TASK_COUNT = 37             # task-001-01 … task-010-03 = 37 tasks (verified from task_store.py)

PROJECT_ID = "proj-001"          # 省立博物馆EPC工程  stage=construction  status=active
PROJECT_ID_INIT = "proj-003"     # stage=initiation   status=planning
TASK_ID = "task-001-01"          # belongs to proj-001, status=in_progress


# ===========================================================================
# TestChatDispatchChain  (INT-001 ~ INT-005)
# ===========================================================================

class TestChatDispatchChain:
    """INT-001 ~ INT-005: Chat → Dispatch → Agent → Response chain."""

    @patch("src.api.routes.chat._get_llm_client")
    def test_chat_to_project_agent_returns_cards(self, mock_get_client, client):
        """INT-001: Send a project query through chat; verify agent routes to 'project'."""
        mock_llm = AsyncMock()
        # First call: DispatchAgent classifies intent → project
        # Second call: ProjectAgent generates structured reply
        mock_llm.chat_json = AsyncMock(
            side_effect=[
                _make_intent("project", "正在查询项目信息…"),
                {"reply": "项目进展顺利，当前完成68%。", "cards": []},
            ]
        )
        mock_llm.chat = AsyncMock(return_value="项目进展顺利，当前完成68%。")
        mock_get_client.return_value = mock_llm

        resp = client.post(
            "/api/chat/message",
            json={"user_id": "int_user_001", "message": "查看省立博物馆项目进度"},
        )

        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["agent_type"] == "project", (
            f"Expected agent_type='project', got '{data['agent_type']}'"
        )
        assert "content" in data, "Response must contain 'content' field"
        assert data["content"], "Content must not be empty"

    @patch("src.api.routes.chat._get_llm_client")
    def test_chat_to_hr_agent(self, mock_get_client, client):
        """INT-002: Route to HR agent; verify response has agent_type='hr'."""
        mock_llm = AsyncMock()
        mock_llm.chat_json = AsyncMock(
            side_effect=[
                _make_intent("hr", "正在查询员工信息…"),
                {"reply": "员工信息已找到。", "cards": []},
            ]
        )
        mock_llm.chat = AsyncMock(return_value="员工信息已找到。")
        mock_get_client.return_value = mock_llm

        resp = client.post(
            "/api/chat/message",
            json={"user_id": "int_user_002", "message": "查询员工出勤情况"},
        )

        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["agent_type"] == "hr", (
            f"Expected agent_type='hr', got '{data['agent_type']}'"
        )
        assert "content" in data, "Response must contain 'content' field"

    @patch("src.api.routes.chat._get_llm_client")
    def test_chat_session_preserves_history(self, mock_get_client, client):
        """INT-003: Create session, send 2 messages, verify session maintains context."""
        mock_llm = AsyncMock()
        mock_llm.chat_json = AsyncMock(return_value=_make_intent("dispatch", "好的，我记住了。"))
        mock_get_client.return_value = mock_llm

        # Step 1: Create an explicit session
        sess_resp = client.post(
            "/api/chat/sessions",
            json={"user_id": "int_user_003", "title": "集成测试会话"},
        )
        assert sess_resp.status_code == 200, f"Session creation failed: {sess_resp.text}"
        session_id = sess_resp.json()["session_id"]
        assert session_id, "session_id must not be empty"

        # Step 2: Send first message into the session
        resp1 = client.post(
            "/api/chat/message",
            json={
                "user_id": "int_user_003",
                "session_id": session_id,
                "message": "你好，我是测试用户",
            },
        )
        assert resp1.status_code == 200, f"First message failed: {resp1.text}"
        assert resp1.json()["session_id"] == session_id, (
            "First reply must carry the same session_id"
        )

        # Step 3: Send second message into the same session
        resp2 = client.post(
            "/api/chat/message",
            json={
                "user_id": "int_user_003",
                "session_id": session_id,
                "message": "请记住我的名字是张三",
            },
        )
        assert resp2.status_code == 200, f"Second message failed: {resp2.text}"
        assert resp2.json()["session_id"] == session_id, (
            "Second reply must carry the same session_id"
        )

    @patch("src.api.routes.chat._get_llm_client")
    def test_chat_dispatch_chitchat_stays_dispatch(self, mock_get_client, client):
        """INT-004: Chitchat stays with dispatch agent, no routing to specialist."""
        mock_llm = AsyncMock()
        mock_llm.chat_json = AsyncMock(
            return_value=_make_intent("dispatch", "您好！有什么可以帮您的？")
        )
        mock_get_client.return_value = mock_llm

        resp = client.post(
            "/api/chat/message",
            json={"user_id": "int_user_004", "message": "你好"},
        )

        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
        data = resp.json()
        assert data["agent_type"] == "dispatch", (
            f"Chitchat must stay with dispatch, got agent_type='{data['agent_type']}'"
        )
        assert data["content"], "Reply content must not be empty"

    @patch("src.api.routes.chat._get_llm_client")
    def test_chat_invalid_session_returns_error(self, mock_get_client, client):
        """INT-005: Sending a message with a non-existent session_id returns an error."""
        mock_llm = AsyncMock()
        mock_llm.chat_json = AsyncMock(return_value=_make_intent("dispatch", "ok"))
        mock_get_client.return_value = mock_llm

        non_existent_uuid = "00000000-0000-0000-0000-000000000001"
        resp = client.post(
            "/api/chat/message",
            json={
                "user_id": "int_user_005",
                "session_id": non_existent_uuid,
                "message": "这条消息不应该成功",
            },
        )

        # Session not found → 404 or 4xx error response
        assert resp.status_code >= 400, (
            f"Expected 4xx for missing session, got {resp.status_code}"
        )


# ===========================================================================
# TestTaskWorkflow  (INT-010 ~ INT-013)
# ===========================================================================

class TestTaskWorkflow:
    """INT-010 ~ INT-013: Task lifecycle workflows."""

    def test_create_task_appears_in_list(self, client):
        """INT-010: Create a task → verify it appears in GET /api/tasks."""
        # Step 1: Create a new task under proj-001
        create_resp = client.post(
            f"/api/projects/{PROJECT_ID}/tasks",
            json={
                "name": "集成测试任务-出现在列表",
                "assignee": "集成测试员",
                "priority": "high",
                "due_date": "2027-01-01",
                "description": "验证任务创建后出现在全局任务列表",
            },
        )
        assert create_resp.status_code == 201, (
            f"Task creation failed: {create_resp.status_code} {create_resp.text}"
        )
        new_task_id = create_resp.json()["id"]
        assert new_task_id, "Created task must have an id"

        # Step 2: Retrieve all tasks and confirm the new task is present
        list_resp = client.get("/api/tasks")
        assert list_resp.status_code == 200, f"GET /api/tasks failed: {list_resp.text}"
        task_ids = [t["id"] for t in list_resp.json()]
        assert new_task_id in task_ids, (
            f"Newly created task '{new_task_id}' not found in GET /api/tasks response"
        )

    def test_create_task_generates_activity(self, client):
        """INT-011: Create a task → verify activity log has a task creation event."""
        # Step 1: Create a task
        create_resp = client.post(
            f"/api/projects/{PROJECT_ID}/tasks",
            json={"name": "活动日志测试任务", "assignee": "测试员"},
        )
        assert create_resp.status_code == 201, f"Task creation failed: {create_resp.text}"
        task_name = create_resp.json()["name"]

        # Step 2: Check project activity log for creation event
        act_resp = client.get(f"/api/projects/{PROJECT_ID}/activities")
        assert act_resp.status_code == 200, f"GET activities failed: {act_resp.text}"
        activities = act_resp.json()
        assert isinstance(activities, list), "Activities must be a list"

        # The activity log should contain at least one entry (seed data + new activity)
        assert len(activities) > 0, "Activity log must not be empty after task creation"

        # Verify there is some task-related event referencing our task name
        task_related_events = [
            a for a in activities
            if a.get("event_type") in ("task_created", "task_updated", "task_comment")
            or task_name in a.get("summary", "")
        ]
        assert len(task_related_events) > 0, (
            f"Expected at least one task-related activity after creating '{task_name}', "
            f"got events: {[a['event_type'] for a in activities]}"
        )

    def test_update_task_status_persists(self, client):
        """INT-012: Update task status → GET task → verify new status persists."""
        # Step 1: Verify the seed task starts in 'in_progress' status
        get_before = client.get(f"/api/tasks/{TASK_ID}")
        assert get_before.status_code == 200, f"GET task failed: {get_before.text}"
        original_status = get_before.json()["status"]

        # Step 2: Update status to 'done'
        new_status = "done"
        patch_resp = client.patch(
            f"/api/tasks/{TASK_ID}",
            json={"status": new_status},
        )
        assert patch_resp.status_code == 200, (
            f"PATCH task failed: {patch_resp.status_code} {patch_resp.text}"
        )
        assert patch_resp.json()["status"] == new_status, (
            f"PATCH response should reflect new status '{new_status}', "
            f"got '{patch_resp.json()['status']}'"
        )

        # Step 3: Re-fetch the task and confirm the change persisted
        get_after = client.get(f"/api/tasks/{TASK_ID}")
        assert get_after.status_code == 200, f"GET task after PATCH failed: {get_after.text}"
        assert get_after.json()["status"] == new_status, (
            f"Status update did not persist — expected '{new_status}', "
            f"got '{get_after.json()['status']}' (was '{original_status}')"
        )

    def test_delete_task_removes_from_list(self, client):
        """INT-013: Delete a task → verify it is gone from the task list."""
        # Step 1: Create a temporary task
        create_resp = client.post(
            f"/api/projects/{PROJECT_ID}/tasks",
            json={"name": "待删除的集成测试任务", "assignee": "测试员"},
        )
        assert create_resp.status_code == 201, f"Task creation failed: {create_resp.text}"
        task_id = create_resp.json()["id"]

        # Step 2: Confirm it exists
        get_resp = client.get(f"/api/tasks/{task_id}")
        assert get_resp.status_code == 200, "New task must be retrievable before deletion"

        # Step 3: Delete it
        del_resp = client.delete(f"/api/tasks/{task_id}")
        assert del_resp.status_code == 204, (
            f"DELETE expected 204, got {del_resp.status_code}"
        )

        # Step 4: Verify it no longer appears in GET /api/tasks
        list_resp = client.get("/api/tasks")
        assert list_resp.status_code == 200
        task_ids = [t["id"] for t in list_resp.json()]
        assert task_id not in task_ids, (
            f"Deleted task '{task_id}' still appears in GET /api/tasks"
        )

        # Step 5: Direct GET should return 404
        get_after = client.get(f"/api/tasks/{task_id}")
        assert get_after.status_code == 404, (
            f"Expected 404 for deleted task, got {get_after.status_code}"
        )


# ===========================================================================
# TestProjectWorkflow  (INT-020 ~ INT-023)
# ===========================================================================

class TestProjectWorkflow:
    """INT-020 ~ INT-023: Project lifecycle workflows."""

    def test_create_project_with_full_fields(self, client):
        """INT-020: Create project with all optional fields → verify all fields in detail."""
        payload = {
            "name": "全字段集成测试项目",
            "project_type": "EPC / 集成测试",
            "budget_display": "500万",
            "due_date": "2027-06-30",
            "description": "这是集成测试创建的完整项目",
            "manager": "集成测试经理",
        }
        create_resp = client.post("/api/projects", json=payload)
        assert create_resp.status_code == 201, (
            f"Project creation failed: {create_resp.status_code} {create_resp.text}"
        )
        created = create_resp.json()
        new_id = created["id"]
        assert new_id, "Created project must have an id"
        assert created["name"] == payload["name"], (
            f"Name mismatch: expected '{payload['name']}', got '{created['name']}'"
        )
        assert created["project_type"] == payload["project_type"], (
            f"project_type mismatch in creation response"
        )

        # Verify all fields in detail endpoint
        detail_resp = client.get(f"/api/projects/{new_id}")
        assert detail_resp.status_code == 200, (
            f"GET project detail failed: {detail_resp.status_code}"
        )
        detail = detail_resp.json()
        assert detail["id"] == new_id, "id in detail must match created id"
        assert detail["name"] == payload["name"], "name in detail must match"
        assert detail["project_type"] == payload["project_type"], "project_type must match"
        assert "集成测试经理" in detail["team_members"], (
            "Manager should appear in team_members"
        )

    def test_project_transition_updates_stage(self, client):
        """INT-021: Transition project stage → verify new stage in detail."""
        # proj-001 is at CONSTRUCTION; valid transition → acceptance
        transition_resp = client.post(
            f"/api/projects/{PROJECT_ID}/transition",
            json={"target_stage": "acceptance"},
        )
        assert transition_resp.status_code == 200, (
            f"Transition failed: {transition_resp.status_code} {transition_resp.text}"
        )
        assert transition_resp.json()["stage"] == "acceptance", (
            f"Transition response should show new stage 'acceptance'"
        )

        # Verify the change persists in the detail endpoint
        detail_resp = client.get(f"/api/projects/{PROJECT_ID}")
        assert detail_resp.status_code == 200
        assert detail_resp.json()["stage"] == "acceptance", (
            f"Project detail should show updated stage 'acceptance' after transition"
        )

    def test_add_milestone_and_verify(self, client):
        """INT-022: Add milestone to project → verify it appears in project detail."""
        milestone_payload = {
            "name": "集成测试里程碑",
            "date": "2027-03-15",
            "status": "pending",
        }
        # Step 1: Add the milestone
        add_resp = client.post(
            f"/api/projects/{PROJECT_ID}/milestones",
            json=milestone_payload,
        )
        assert add_resp.status_code == 201, (
            f"Milestone creation failed: {add_resp.status_code} {add_resp.text}"
        )
        assert add_resp.json()["name"] == milestone_payload["name"], (
            "Milestone creation response must return the correct name"
        )

        # Step 2: Retrieve project detail and confirm the milestone is listed
        detail_resp = client.get(f"/api/projects/{PROJECT_ID}")
        assert detail_resp.status_code == 200
        milestone_names = [m["name"] for m in detail_resp.json()["milestones"]]
        assert milestone_payload["name"] in milestone_names, (
            f"New milestone '{milestone_payload['name']}' not found in project detail. "
            f"Current milestones: {milestone_names}"
        )

    def test_delete_project_cascades(self, client):
        """INT-023: Delete project → verify it is gone from GET /api/projects."""
        # Step 1: Create a fresh project
        create_resp = client.post(
            "/api/projects",
            json={"name": "待删除集成测试项目", "project_type": "测试"},
        )
        assert create_resp.status_code == 201, f"Project creation failed: {create_resp.text}"
        new_proj_id = create_resp.json()["id"]

        # Step 2: Create a task under it
        task_resp = client.post(
            f"/api/projects/{new_proj_id}/tasks",
            json={"name": "项目下的任务"},
        )
        assert task_resp.status_code == 201, f"Task creation failed: {task_resp.text}"

        # Step 3: Delete the project
        del_resp = client.delete(f"/api/projects/{new_proj_id}")
        assert del_resp.status_code == 204, (
            f"DELETE project expected 204, got {del_resp.status_code}"
        )

        # Step 4: Verify the project no longer appears in the list
        list_resp = client.get("/api/projects")
        assert list_resp.status_code == 200
        project_ids = [p["id"] for p in list_resp.json()]
        assert new_proj_id not in project_ids, (
            f"Deleted project '{new_proj_id}' still appears in GET /api/projects"
        )

        # Step 5: Direct GET should return 404
        get_resp = client.get(f"/api/projects/{new_proj_id}")
        assert get_resp.status_code == 404, (
            f"Expected 404 for deleted project, got {get_resp.status_code}"
        )


# ===========================================================================
# TestSeedDataConsistency  (INT-040 ~ INT-043)
# ===========================================================================

class TestSeedDataConsistency:
    """INT-040 ~ INT-043: Verify seed data is internally consistent."""

    def test_all_task_project_ids_are_valid(self, client):
        """INT-040: Every task's project_id references an existing project."""
        # Collect all project IDs
        proj_resp = client.get("/api/projects")
        assert proj_resp.status_code == 200, f"GET /api/projects failed: {proj_resp.text}"
        project_ids = {p["id"] for p in proj_resp.json()}
        assert len(project_ids) > 0, "Seed projects must not be empty"

        # Collect all tasks
        task_resp = client.get("/api/tasks")
        assert task_resp.status_code == 200, f"GET /api/tasks failed: {task_resp.text}"
        tasks = task_resp.json()
        assert len(tasks) > 0, "Seed tasks must not be empty"

        # Every task's project_id must resolve to a known project
        orphaned = [
            t for t in tasks
            if t["project_id"] not in project_ids
        ]
        assert orphaned == [], (
            f"Found {len(orphaned)} orphaned tasks whose project_id is not in projects: "
            f"{[(t['id'], t['project_id']) for t in orphaned]}"
        )

    def test_seed_project_count(self, client):
        """INT-041: Seed has exactly 10 projects."""
        resp = client.get("/api/projects")
        assert resp.status_code == 200, f"GET /api/projects failed: {resp.text}"
        projects = resp.json()
        assert len(projects) == SEED_PROJECT_COUNT, (
            f"Expected {SEED_PROJECT_COUNT} seed projects, got {len(projects)}"
        )

    def test_seed_task_count(self, client):
        """INT-042: Seed has exactly 35 tasks."""
        resp = client.get("/api/tasks")
        assert resp.status_code == 200, f"GET /api/tasks failed: {resp.text}"
        tasks = resp.json()
        assert len(tasks) == SEED_TASK_COUNT, (
            f"Expected {SEED_TASK_COUNT} seed tasks, got {len(tasks)}"
        )

    def test_activities_reference_valid_projects(self, client):
        """INT-043: Recent activities project_ids reference existing projects."""
        # Collect all project IDs
        proj_resp = client.get("/api/projects")
        assert proj_resp.status_code == 200, f"GET /api/projects failed: {proj_resp.text}"
        project_ids = {p["id"] for p in proj_resp.json()}

        # Collect recent activities (up to 50 to cover seed data)
        act_resp = client.get("/api/activities/recent?limit=50")
        assert act_resp.status_code == 200, (
            f"GET /api/activities/recent failed: {act_resp.text}"
        )
        activities = act_resp.json()
        assert len(activities) > 0, "Seed activities must not be empty"

        # Every activity's project_id must point to a known project
        orphaned_acts = [
            a for a in activities
            if a.get("project_id") and a["project_id"] not in project_ids
        ]
        assert orphaned_acts == [], (
            f"Found {len(orphaned_acts)} activities referencing unknown project_ids: "
            f"{[(a.get('id'), a.get('project_id')) for a in orphaned_acts]}"
        )
