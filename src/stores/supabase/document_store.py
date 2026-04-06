"""Supabase-backed document store.

Drop-in replacement for src/stores/document_store.py.
Uses the same function signatures so API routes work unchanged.
"""

from __future__ import annotations

from src.db.client import get_client as get_supabase

# ---------------------------------------------------------------------------
# Document CRUD
# ---------------------------------------------------------------------------


def list_documents(
    project_id: str | None = None,
    doc_type: str | None = None,
    status: str | None = None,
    category: str | None = None,
) -> list[dict]:
    """Return all documents, optionally filtered."""
    sb = get_supabase()
    q = sb.table("documents").select("*")
    if project_id is not None:
        q = q.eq("project_id", project_id)
    if doc_type is not None:
        q = q.eq("doc_type", doc_type)
    if status is not None:
        q = q.eq("status", status)
    if category is not None:
        q = q.eq("category", category)
    return q.execute().data or []


def get_document(document_id: str) -> dict | None:
    """Return a single document by ID, or None if not found."""
    sb = get_supabase()
    r = sb.table("documents").select("*").eq("id", document_id).execute()
    return r.data[0] if r.data else None


def create_document(document: dict) -> dict:
    """Insert a new document into the store and return it."""
    sb = get_supabase()
    data = document if isinstance(document, dict) else document.model_dump()
    return sb.table("documents").insert(data).execute().data[0]


def update_document(document_id: str, updates: dict) -> dict | None:
    """Apply a dict of updates to an existing document and return it."""
    sb = get_supabase()
    r = sb.table("documents").update(updates).eq("id", document_id).execute()
    return r.data[0] if r.data else None


def delete_document(document_id: str) -> bool:
    """Delete a document. Returns True if found and deleted."""
    sb = get_supabase()
    r = sb.table("documents").delete().eq("id", document_id).execute()
    return bool(r.data)


def seed_documents() -> None:
    """No-op: Supabase seed data is loaded via seed.sql."""
    pass
