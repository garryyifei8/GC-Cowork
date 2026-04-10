"""Supabase integration tests -- skipped unless USE_SUPABASE=true.

These tests verify that the Supabase-backed store implementations provide
the same functional API as the in-memory stores, including:
  - DotDict attribute access and model_dump/model_copy compatibility
  - EnumStr .value property for enum-like fields
  - CRUD operations for projects, tasks, and activities
  - Store factory correctly switching between memory and Supabase backends

To run these tests:
    USE_SUPABASE=true SUPABASE_URL=http://127.0.0.1:54321 \\
        SUPABASE_SERVICE_ROLE_KEY=<key> python -m pytest tests/test_supabase_integration.py -v
"""

from __future__ import annotations

import os
import uuid

import pytest

# ---------------------------------------------------------------------------
# Module-level skip marker: all tests in this file are skipped when Supabase
# is not enabled.  Keeps the normal CI/dev `pytest` run clean.
# ---------------------------------------------------------------------------

pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        os.environ.get("USE_SUPABASE", "false").lower() not in ("true", "1", "yes"),
        reason="Supabase not enabled (set USE_SUPABASE=true to run)",
    ),
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _unique_id(prefix: str = "test") -> str:
    """Generate a unique ID for test records to avoid collisions."""
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


# ===========================================================================
# TestSupabaseConnection
# ===========================================================================


class TestSupabaseConnection:
    """Verify basic database connectivity via the PostgREST client."""

    def test_connection_works(self):
        """get_client() returns a SupabaseClient that can reach the database."""
        from src.db.client import get_client

        client = get_client()
        assert client is not None
        assert client.rest_url.endswith("/rest/v1")

    def test_client_returns_data(self):
        """A simple SELECT on the projects table returns seed data."""
        from src.db.client import get_client

        client = get_client()
        result = client.from_("projects").select("id").limit(1).execute()
        assert result.data is not None
        assert len(result.data) >= 1
        # Each row should be a DotDict with attribute access
        row = result.data[0]
        assert hasattr(row, "id") or "id" in row

    def test_use_supabase_flag_is_true(self):
        """When USE_SUPABASE=true, the use_supabase() helper returns True."""
        from src.db.client import use_supabase

        assert use_supabase() is True


# ===========================================================================
# TestDotDict
# ===========================================================================


class TestDotDict:
    """Verify the DotDict compatibility layer used by Supabase results."""

    def test_attribute_access(self):
        """DotDict allows accessing keys as attributes."""
        from src.db.client import DotDict

        d = DotDict({"id": "proj-001", "name": "Test Project"})
        assert d.id == "proj-001"
        assert d.name == "Test Project"

    def test_attribute_error_on_missing_key(self):
        """Accessing a missing key raises AttributeError, not KeyError."""
        from src.db.client import DotDict

        d = DotDict({"id": "proj-001"})
        with pytest.raises(AttributeError, match="no attribute"):
            _ = d.nonexistent_field

    def test_model_dump_returns_plain_dict(self):
        """model_dump() returns a plain dict (no DotDict, no EnumStr)."""
        from src.db.client import DotDict, EnumStr

        d = DotDict({"stage": EnumStr("construction"), "count": 5})
        dumped = d.model_dump()
        assert isinstance(dumped, dict)
        assert not isinstance(dumped, DotDict)
        # EnumStr values should be unwrapped to plain str
        assert type(dumped["stage"]) is str
        assert dumped["stage"] == "construction"
        assert dumped["count"] == 5

    def test_model_copy_with_update(self):
        """model_copy(update=...) returns a new DotDict with merged values."""
        from src.db.client import DotDict

        original = DotDict({"id": "proj-001", "status": "active"})
        copied = original.model_copy(update={"status": "risk"})
        assert copied.status == "risk"
        assert copied.id == "proj-001"
        # Original is not mutated
        assert original.status == "active"

    def test_model_copy_without_update(self):
        """model_copy() without update returns a shallow copy."""
        from src.db.client import DotDict

        original = DotDict({"id": "proj-001"})
        copied = original.model_copy()
        assert copied == original
        assert copied is not original


# ===========================================================================
# TestEnumStr
# ===========================================================================


class TestEnumStr:
    """Verify the EnumStr wrapper for enum-like fields."""

    def test_value_property(self):
        """EnumStr has a .value property that returns the string itself."""
        from src.db.client import EnumStr

        s = EnumStr("construction")
        assert s.value == "construction"
        assert s == "construction"

    def test_is_str_subclass(self):
        """EnumStr is a subclass of str, so it works in string comparisons."""
        from src.db.client import EnumStr

        s = EnumStr("done")
        assert isinstance(s, str)
        assert s == "done"
        assert s.upper() == "DONE"

    def test_pydantic_schema(self):
        """EnumStr provides a Pydantic core schema (str type)."""
        from src.db.client import EnumStr

        # Should not raise
        schema = EnumStr.__get_pydantic_core_schema__(EnumStr, None)
        assert schema is not None


# ===========================================================================
# TestProjectStore
# ===========================================================================


class TestProjectStore:
    """Verify Supabase project store matches memory store API."""

    def test_list_projects(self):
        """list_projects() returns a non-empty list of project dicts."""
        from src.stores.supabase.project_store import list_projects

        projects = list_projects()
        assert isinstance(projects, list)
        assert len(projects) >= 1
        # Each project should have standard fields
        p = projects[0]
        assert "id" in p
        assert "name" in p

    def test_list_projects_filter_status(self):
        """list_projects(status='active') returns only active projects."""
        from src.stores.supabase.project_store import list_projects

        projects = list_projects(status="active")
        assert isinstance(projects, list)
        for p in projects:
            assert p["status"] == "active" or p.get("status") == "active"

    def test_get_project(self):
        """get_project('proj-001') returns the project with related data."""
        from src.stores.supabase.project_store import get_project

        p = get_project("proj-001")
        assert p is not None
        assert p["id"] == "proj-001"
        # Should have enriched fields
        assert "team_members" in p
        assert "risks" in p
        assert "milestones" in p

    def test_get_project_not_found(self):
        """get_project() for non-existent ID returns None."""
        from src.stores.supabase.project_store import get_project

        result = get_project("nonexistent-project-id-xyz")
        assert result is None

    def test_create_and_delete_project(self):
        """create_project() inserts a record, delete_project() removes it."""
        from src.stores.supabase.project_store import (
            create_project,
            delete_project,
            get_project,
        )

        test_id = _unique_id("proj")
        data = {
            "id": test_id,
            "name": "Integration Test Project",
            "project_type": "test",
            "stage": "initiation",
            "status": "planning",
            "status_label": "test",
            "progress_pct": 0.0,
            "team_members": ["Tester A"],
        }

        try:
            created = create_project(data)
            assert created["id"] == test_id
            assert created["name"] == "Integration Test Project"

            # Verify it exists
            fetched = get_project(test_id)
            assert fetched is not None
            assert fetched["name"] == "Integration Test Project"
        finally:
            # Cleanup
            delete_project(test_id)

    def test_update_project(self):
        """update_project() applies partial updates and returns the result."""
        from src.stores.supabase.project_store import (
            create_project,
            delete_project,
            update_project,
        )

        test_id = _unique_id("proj")
        data = {
            "id": test_id,
            "name": "Update Test Project",
            "project_type": "test",
            "stage": "initiation",
            "status": "planning",
            "status_label": "test",
            "progress_pct": 0.0,
        }

        try:
            create_project(data)
            updated = update_project(test_id, {"progress_pct": 50.0, "status": "active"})
            assert updated is not None
            assert updated["progress_pct"] == 50.0
            assert updated["status"] == "active"
        finally:
            delete_project(test_id)

    def test_delete_project_returns_true(self):
        """delete_project() returns True when the project exists."""
        from src.stores.supabase.project_store import create_project, delete_project

        test_id = _unique_id("proj")
        create_project({
            "id": test_id,
            "name": "Delete Test",
            "project_type": "test",
            "stage": "initiation",
            "status": "planning",
            "status_label": "test",
            "progress_pct": 0.0,
        })
        result = delete_project(test_id)
        assert result is True

    def test_delete_project_nonexistent_returns_false(self):
        """delete_project() returns False for non-existent project."""
        from src.stores.supabase.project_store import delete_project

        result = delete_project("nonexistent-delete-target-xyz")
        assert result is False


# ===========================================================================
# TestTaskStore
# ===========================================================================


class TestTaskStore:
    """Verify Supabase task store matches memory store API."""

    def _create_test_task(self, project_id: str = "proj-001") -> str:
        """Helper: insert a test task and return its ID."""
        from src.stores.supabase.task_store import create_task

        task_id = _unique_id("task")
        create_task({
            "id": task_id,
            "project_id": project_id,
            "name": "Integration Test Task",
            "assignee": "Tester",
            "status": "todo",
            "priority": "medium",
            "description": "Created by integration test",
        })
        return task_id

    def _delete_test_task(self, task_id: str) -> None:
        """Helper: delete a test task for cleanup."""
        from src.stores.supabase.task_store import delete_task

        delete_task(task_id)

    def test_list_all_tasks(self):
        """list_all_tasks() returns seed tasks."""
        from src.stores.supabase.task_store import list_all_tasks

        tasks = list_all_tasks()
        assert isinstance(tasks, list)
        assert len(tasks) >= 1

    def test_list_tasks_by_project(self):
        """list_tasks(project_id) returns tasks only for that project."""
        from src.stores.supabase.task_store import list_tasks

        tasks = list_tasks("proj-001")
        assert isinstance(tasks, list)
        assert len(tasks) >= 1
        for t in tasks:
            assert t["project_id"] == "proj-001"

    def test_create_and_get_task(self):
        """create_task() inserts a task; get_task() retrieves it."""
        from src.stores.supabase.task_store import get_task

        task_id = self._create_test_task()
        try:
            fetched = get_task(task_id)
            assert fetched is not None
            assert fetched["id"] == task_id
            assert fetched["name"] == "Integration Test Task"
        finally:
            self._delete_test_task(task_id)

    def test_update_task(self):
        """update_task() applies partial updates to an existing task."""
        from src.stores.supabase.task_store import update_task

        task_id = self._create_test_task()
        try:
            updated = update_task(task_id, {"status": "in_progress", "assignee": "Updated Tester"})
            assert updated is not None
            assert updated["status"] == "in_progress"
            assert updated["assignee"] == "Updated Tester"
        finally:
            self._delete_test_task(task_id)

    def test_delete_task(self):
        """delete_task() removes the task and returns True."""
        from src.stores.supabase.task_store import create_task, delete_task, get_task

        task_id = _unique_id("task")
        create_task({
            "id": task_id,
            "project_id": "proj-001",
            "name": "Deletable Task",
            "status": "todo",
            "priority": "low",
            "description": "",
        })
        result = delete_task(task_id)
        assert result is True
        # Confirm it is gone
        assert get_task(task_id) is None

    def test_list_all_tasks_filter_status(self):
        """list_all_tasks(status='in_progress') filters by status."""
        from src.stores.supabase.task_store import list_all_tasks

        tasks = list_all_tasks(status="in_progress")
        assert isinstance(tasks, list)
        for t in tasks:
            assert t["status"] == "in_progress"


# ===========================================================================
# TestActivityStore
# ===========================================================================


class TestActivityStore:
    """Verify Supabase activity store."""

    def test_list_recent_activities(self):
        """list_recent_activities() returns recent activity events."""
        from src.stores.supabase.activity_store import list_recent_activities

        activities = list_recent_activities(limit=5)
        assert isinstance(activities, list)
        assert len(activities) <= 5

    def test_create_and_get_activity(self):
        """create_activity() inserts an activity; get_activity() retrieves it."""
        from src.stores.supabase.activity_store import create_activity, get_activity

        act_id = _unique_id("act")
        data = {
            "id": act_id,
            "project_id": "proj-001",
            "event_type": "test_event",
            "actor": "Integration Test",
            "summary": "Test activity from integration test",
            "detail": {"test": True},
        }

        try:
            created = create_activity(data)
            assert created["id"] == act_id

            fetched = get_activity(act_id)
            assert fetched is not None
            assert fetched["event_type"] == "test_event"
            assert fetched["summary"] == "Test activity from integration test"
        finally:
            # Clean up: delete via direct client call
            from src.db.client import get_client

            get_client().from_("activity_events").delete().eq("id", act_id).execute()


# ===========================================================================
# TestStoreFactory
# ===========================================================================


class TestStoreFactory:
    """Verify the factory switches to Supabase stores when enabled."""

    def test_factory_returns_supabase_project_store(self):
        """get_project_store() returns the Supabase module, not memory."""
        from src.stores.factory import get_project_store

        store = get_project_store()
        # The Supabase module path should contain 'supabase'
        assert "supabase" in store.__name__

    def test_factory_returns_supabase_task_store(self):
        """get_task_store() returns the Supabase module, not memory."""
        from src.stores.factory import get_task_store

        store = get_task_store()
        assert "supabase" in store.__name__

    def test_factory_returns_supabase_activity_store(self):
        """get_activity_store() returns the Supabase module, not memory."""
        from src.stores.factory import get_activity_store

        store = get_activity_store()
        assert "supabase" in store.__name__

    def test_dotdict_results_have_model_dump(self):
        """DotDict results from Supabase queries expose model_dump()."""
        from src.db.client import get_client

        client = get_client()
        result = client.from_("projects").select("id, name").limit(1).execute()
        assert len(result.data) >= 1
        row = result.data[0]
        assert callable(getattr(row, "model_dump", None))
        dumped = row.model_dump()
        assert isinstance(dumped, dict)
        assert "id" in dumped

    def test_dotdict_results_have_model_copy(self):
        """DotDict results from Supabase queries expose model_copy()."""
        from src.db.client import get_client

        client = get_client()
        result = client.from_("projects").select("id, name").limit(1).execute()
        row = result.data[0]
        assert callable(getattr(row, "model_copy", None))
        copied = row.model_copy(update={"name": "Overridden"})
        assert copied["name"] == "Overridden"

    def test_enum_str_wrapper_on_stage_field(self):
        """Stage fields from Supabase results work with .value access."""
        from src.db.client import get_client

        client = get_client()
        result = client.from_("projects").select("stage").limit(1).execute()
        row = result.data[0]
        stage = row["stage"]
        # EnumStr wraps string values with a .value property
        assert hasattr(stage, "value")
        assert stage.value == str(stage)


# ===========================================================================
# TestDataConsistency
# ===========================================================================


class TestDataConsistency:
    """Verify seed data counts match between memory seed and Supabase seed.sql."""

    # These counts match the seed_projects() / seed_tasks() in memory stores
    # and the INSERT statements in supabase/seed.sql.
    EXPECTED_PROJECT_COUNT = 10
    EXPECTED_TASK_COUNT = 37  # sum of tasks across all 10 projects

    def test_project_count_matches_seed(self):
        """Supabase has the same number of seed projects as the memory store."""
        from src.stores.supabase.project_store import list_projects

        projects = list_projects()
        assert len(projects) >= self.EXPECTED_PROJECT_COUNT

    def test_task_count_matches_seed(self):
        """Supabase has the same number of seed tasks as the memory store."""
        from src.stores.supabase.task_store import list_all_tasks

        tasks = list_all_tasks()
        assert len(tasks) >= self.EXPECTED_TASK_COUNT

    def test_seed_project_ids_present(self):
        """All 10 canonical seed project IDs exist in Supabase."""
        from src.stores.supabase.project_store import get_project

        expected_ids = [f"proj-{str(i).zfill(3)}" for i in range(1, 11)]
        for pid in expected_ids:
            p = get_project(pid)
            assert p is not None, f"Seed project {pid} not found in Supabase"

    def test_seed_project_001_has_correct_name(self):
        """proj-001 in Supabase has the expected Chinese name."""
        from src.stores.supabase.project_store import get_project

        p = get_project("proj-001")
        assert p is not None
        assert p["name"] == "省立博物馆EPC工程"

    def test_seed_task_belongs_to_correct_project(self):
        """task-001-01 in Supabase belongs to proj-001."""
        from src.stores.supabase.task_store import get_task

        t = get_task("task-001-01")
        assert t is not None
        assert t["project_id"] == "proj-001"
