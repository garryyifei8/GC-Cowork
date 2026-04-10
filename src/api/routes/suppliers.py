"""
Supplier REST API endpoints.

GET    /api/suppliers                — list suppliers (?category= &status= &project_id=)
GET    /api/suppliers/{id}          — supplier detail
POST   /api/suppliers               — create supplier
PATCH  /api/suppliers/{id}          — update supplier
DELETE /api/suppliers/{id}          — delete supplier
GET    /api/suppliers/summary       — aggregated statistics
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.core.auth import require_auth
from src.stores.supplier_store import (
    create_supplier,
    delete_supplier,
    get_supplier,
    get_supplier_summary,
    list_suppliers,
    update_supplier,
)

router = APIRouter(prefix="/suppliers", tags=["suppliers"], dependencies=[Depends(require_auth)])


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class CreateSupplierRequest(BaseModel):
    name: str = Field(min_length=1, max_length=256)
    category: str  # material | equipment | subcontract | service | consulting
    contact_person: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    qualification: str = ""
    rating: int = Field(default=0, ge=0, le=5)
    status: str = "active"
    projects: list[str] = []
    notes: str = ""


class UpdateSupplierRequest(BaseModel):
    name: str | None = None
    category: str | None = None
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    address: str | None = None
    qualification: str | None = None
    rating: int | None = Field(default=None, ge=0, le=5)
    status: str | None = None
    projects: list[str] | None = None
    notes: str | None = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/summary")
async def supplier_summary():
    """Aggregated supplier statistics."""
    return get_supplier_summary()


@router.get("")
async def list_suppliers_endpoint(
    category: str | None = None,
    status: str | None = None,
    project_id: str | None = None,
):
    """List suppliers with optional filters."""
    items = list_suppliers(category=category, status=status, project_id=project_id)
    return [s.model_dump() for s in items]


@router.get("/{supplier_id}")
async def get_supplier_endpoint(supplier_id: str):
    """Get a single supplier by ID."""
    sup = get_supplier(supplier_id)
    if sup is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return sup.model_dump()


@router.post("", status_code=201)
async def create_supplier_endpoint(body: CreateSupplierRequest):
    """Create a new supplier."""
    sup = create_supplier(body.model_dump())
    return sup.model_dump()


@router.patch("/{supplier_id}")
async def update_supplier_endpoint(supplier_id: str, body: UpdateSupplierRequest):
    """Update an existing supplier."""
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    sup = update_supplier(supplier_id, updates)
    if sup is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return sup.model_dump()


@router.delete("/{supplier_id}", status_code=204)
async def delete_supplier_endpoint(supplier_id: str):
    """Delete a supplier by ID."""
    deleted = delete_supplier(supplier_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Supplier not found")
