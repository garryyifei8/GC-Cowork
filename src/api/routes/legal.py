"""FastAPI routes for legal / contract management."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from src.core.exceptions import PlatformError
from src.stores.legal_store import (
    create_contract,
    get_contract,
    get_legal_summary,
    list_contracts,
    update_contract,
)

router = APIRouter(prefix="/legal", tags=["legal"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class ContractResponse(BaseModel):
    id: str
    title: str
    contract_type: str
    party_a: str
    party_b: str
    project_id: str | None = None
    amount: float
    sign_date: str
    start_date: str
    end_date: str
    status: str
    risk_level: str
    key_terms: str
    responsible: str


class ContractCreateRequest(BaseModel):
    title: str
    contract_type: str
    party_a: str
    party_b: str
    project_id: str | None = None
    amount: float
    sign_date: str
    start_date: str
    end_date: str
    status: str = "draft"
    risk_level: str = "low"
    key_terms: str
    responsible: str


class ContractUpdateRequest(BaseModel):
    title: str | None = None
    contract_type: str | None = None
    party_a: str | None = None
    party_b: str | None = None
    project_id: str | None = None
    amount: float | None = None
    sign_date: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    status: str | None = None
    risk_level: str | None = None
    key_terms: str | None = None
    responsible: str | None = None


class LegalSummaryResponse(BaseModel):
    total: int
    active: int
    expiring_soon: int
    total_amount: float
    by_type: dict[str, int]
    by_status: dict[str, int]
    high_risk_count: int
    expiring_soon_contracts: list[str]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/contracts", response_model=list[ContractResponse])
def list_contracts_endpoint(
    status: str | None = Query(default=None, description="Filter by contract status"),
    contract_type: str | None = Query(default=None, description="Filter by contract type"),
    project_id: str | None = Query(default=None, description="Filter by associated project ID"),
) -> list[ContractResponse]:
    """Return all contracts, with optional filtering by status, type, or project."""
    try:
        contracts = list_contracts(
            status=status,
            contract_type=contract_type,
            project_id=project_id,
        )
        return [ContractResponse(**c.model_dump()) for c in contracts]
    except PlatformError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/contracts/{contract_id}", response_model=ContractResponse)
def get_contract_endpoint(contract_id: str) -> ContractResponse:
    """Return a single contract by its ID."""
    try:
        contract = get_contract(contract_id)
        if contract is None:
            raise HTTPException(
                status_code=404,
                detail=f"Contract '{contract_id}' not found.",
            )
        return ContractResponse(**contract.model_dump())
    except HTTPException:
        raise
    except PlatformError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.post("/contracts", response_model=ContractResponse, status_code=201)
def create_contract_endpoint(payload: ContractCreateRequest) -> ContractResponse:
    """Create a new contract record."""
    try:
        contract = create_contract(payload.model_dump())
        return ContractResponse(**contract.model_dump())
    except PlatformError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.patch("/contracts/{contract_id}", response_model=ContractResponse)
def update_contract_endpoint(
    contract_id: str,
    payload: ContractUpdateRequest,
) -> ContractResponse:
    """Partially update an existing contract."""
    try:
        contract = update_contract(
            contract_id,
            payload.model_dump(exclude_none=True),
        )
        if contract is None:
            raise HTTPException(
                status_code=404,
                detail=f"Contract '{contract_id}' not found.",
            )
        return ContractResponse(**contract.model_dump())
    except HTTPException:
        raise
    except PlatformError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc


@router.get("/summary", response_model=LegalSummaryResponse)
def get_summary_endpoint() -> LegalSummaryResponse:
    """Return aggregate legal/contract statistics for the dashboard."""
    try:
        summary = get_legal_summary()
        return LegalSummaryResponse(**summary)
    except PlatformError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from exc
