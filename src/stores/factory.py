"""Store factory — switches between Memory and Supabase implementations.

Usage in API routes:
    from src.stores.factory import get_project_store

    # Returns either memory or supabase implementation based on USE_SUPABASE env
    store = get_project_store()
    projects = store.list_projects()
"""

from __future__ import annotations

import importlib
from functools import lru_cache

from src.db.client import use_supabase


def _get_store_module(store_name: str):
    """Dynamically import the correct store module."""
    if use_supabase():
        module_path = f"src.stores.supabase.{store_name}"
    else:
        module_path = f"src.stores.{store_name}"
    return importlib.import_module(module_path)


@lru_cache(maxsize=1)
def get_project_store():
    return _get_store_module("project_store")


@lru_cache(maxsize=1)
def get_task_store():
    return _get_store_module("task_store")


@lru_cache(maxsize=1)
def get_activity_store():
    return _get_store_module("activity_store")


@lru_cache(maxsize=1)
def get_document_store():
    return _get_store_module("document_store")


@lru_cache(maxsize=1)
def get_hr_store():
    return _get_store_module("hr_store")


@lru_cache(maxsize=1)
def get_finance_store():
    return _get_store_module("finance_store")


@lru_cache(maxsize=1)
def get_oa_store():
    return _get_store_module("oa_store")


@lru_cache(maxsize=1)
def get_procurement_store():
    return _get_store_module("procurement_store")


@lru_cache(maxsize=1)
def get_process_store():
    return _get_store_module("process_store")


@lru_cache(maxsize=1)
def get_legal_store():
    return _get_store_module("legal_store")


@lru_cache(maxsize=1)
def get_audit_store():
    return _get_store_module("audit_store")


@lru_cache(maxsize=1)
def get_supervision_store():
    return _get_store_module("supervision_store")


@lru_cache(maxsize=1)
def get_supplier_store():
    return _get_store_module("supplier_store")
