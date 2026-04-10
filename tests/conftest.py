"""Shared fixtures for test isolation across the test suite."""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock

from src.core.auth import UserToken, require_auth


@pytest.fixture(autouse=True)
def _reset_stores():
    """Reset all in-memory Store seed data before each test.

    Each store uses a module-level _seeded guard that prevents re-seeding.
    We clear that guard and the underlying dicts so seed functions
    re-populate fresh data, giving every test a clean baseline.
    """
    import src.stores.project_store as _ps
    import src.stores.task_store as _ts
    import src.stores.activity_store as _as
    import src.stores.document_store as _ds
    import src.stores.hr_store as _hs
    import src.stores.finance_store as _fs
    import src.stores.oa_store as _os
    import src.stores.procurement_store as _prs
    import src.stores.process_store as _pcs
    import src.stores.legal_store as _ls
    import src.stores.audit_store as _aus
    import src.stores.supervision_store as _ss

    # Reset seeded flags so seed_* functions repopulate fresh data
    _ps._seeded = False
    _ts._seeded = False
    _as._seeded = False
    _ds._seeded = False
    _hs._seeded = False
    _fs._seeded = False
    _os._seeded = False
    _prs._seeded = False
    _pcs._seeded = False
    _ls._seeded = False
    _aus._seeded = False
    _ss._seeded = False

    # Clear existing store dicts using the actual variable names in each module
    _ps._projects.clear()
    _ts._tasks.clear()
    _as._activities.clear()
    _ds._documents.clear()
    _hs._employees.clear()
    _hs._attendance.clear()
    _hs._leave_requests.clear()
    _hs._salary_records.clear()
    _fs._expenses.clear()
    _fs._budgets.clear()
    _fs._invoices.clear()
    _os._notices.clear()
    _os._vehicle_requests.clear()
    _prs._packages.clear()
    _pcs._records.clear()
    _ls._contracts.clear()
    _aus._store.clear()
    _ss._store.clear()

    from src.stores.project_store import seed_projects
    from src.stores.task_store import seed_tasks
    from src.stores.activity_store import seed_activities
    from src.stores.document_store import seed_documents
    from src.stores.hr_store import seed_hr
    from src.stores.finance_store import seed_finance
    from src.stores.oa_store import seed_oa
    from src.stores.procurement_store import seed_procurement
    from src.stores.process_store import seed_processes
    from src.stores.legal_store import seed_contracts
    from src.stores.audit_store import seed_audit_reports
    from src.stores.supervision_store import seed_supervision_records

    seed_projects()
    seed_tasks()
    seed_activities()
    seed_documents()
    seed_hr()
    seed_finance()
    seed_oa()
    seed_procurement()
    seed_processes()
    seed_contracts()
    seed_audit_reports()
    seed_supervision_records()

    yield


def _fake_admin_user():
    """Return a fake admin user for dependency override."""
    return UserToken(
        user_id="user-001",
        username="admin",
        role="admin",
        department="管理层",
    )


@pytest.fixture
def client():
    from src.main import app

    app.dependency_overrides[require_auth] = _fake_admin_user
    yield TestClient(app)
    app.dependency_overrides.pop(require_auth, None)


@pytest.fixture
def raw_client():
    """TestClient without auth dependency override — for testing auth itself."""
    from src.main import app

    app.dependency_overrides.pop(require_auth, None)
    yield TestClient(app)


@pytest.fixture
def mock_llm():
    mock = AsyncMock()
    mock.chat.return_value = "模拟回复"
    mock.chat_json.return_value = {"reply": "ok", "cards": []}
    return mock
