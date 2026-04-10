"""Data stores for the AI-native project collaboration platform.

When USE_SUPABASE=true, monkey-patches all store modules to use Supabase implementations.
Call `patch_stores_for_supabase()` at startup before any API routes are invoked.
"""

import importlib
import sys


def patch_stores_for_supabase():
    """Replace memory store modules with Supabase-backed implementations.

    This patches sys.modules so that `from src.stores.project_store import list_projects`
    transparently returns the Supabase version.
    """
    store_names = [
        "project_store",
        "task_store",
        "activity_store",
        "document_store",
        "hr_store",
        "finance_store",
        "oa_store",
        "procurement_store",
        "process_store",
        "legal_store",
        "audit_store",
        "supervision_store",
        "supplier_store",
    ]

    for name in store_names:
        memory_key = f"src.stores.{name}"
        supabase_key = f"src.stores.supabase.{name}"
        try:
            sb_module = importlib.import_module(supabase_key)
            sys.modules[memory_key] = sb_module
        except ImportError as e:
            print(f"⚠️ Could not load Supabase store {name}: {e}")
            # Keep the memory version as fallback
