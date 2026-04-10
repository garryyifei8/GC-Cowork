"""Supabase-backed Supplier store — stub for future implementation.

When USE_SUPABASE=true, this module is loaded in place of the memory store.
Currently raises NotImplementedError so the memory store is the active default.
"""

from __future__ import annotations


def seed_suppliers() -> None:
    """No-op — Supabase is seeded via migrations."""
    pass


def list_suppliers(
    category: str | None = None,
    status: str | None = None,
    project_id: str | None = None,
) -> list:
    raise NotImplementedError("Supabase supplier_store not yet implemented")


def get_supplier(supplier_id: str):
    raise NotImplementedError("Supabase supplier_store not yet implemented")


def create_supplier(data: dict):
    raise NotImplementedError("Supabase supplier_store not yet implemented")


def update_supplier(supplier_id: str, data: dict):
    raise NotImplementedError("Supabase supplier_store not yet implemented")


def delete_supplier(supplier_id: str) -> bool:
    raise NotImplementedError("Supabase supplier_store not yet implemented")


def get_supplier_summary() -> dict:
    raise NotImplementedError("Supabase supplier_store not yet implemented")
