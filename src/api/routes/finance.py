"""
Finance REST API endpoints.

GET    /api/finance/expenses                — list expenses (?status=&project_id=&submitter=)
GET    /api/finance/expenses/{id}           — expense detail
POST   /api/finance/expenses               — create expense
PATCH  /api/finance/expenses/{id}          — update / approve expense

GET    /api/finance/budgets                — list budgets (?project_id=&fiscal_year=)
POST   /api/finance/budgets               — create budget line
PATCH  /api/finance/budgets/{id}          — update budget line

GET    /api/finance/invoices              — list invoices (?status=&project_id=)
POST   /api/finance/invoices             — create invoice
PATCH  /api/finance/invoices/{id}        — update invoice

GET    /api/finance/summary              — finance summary metrics
GET    /api/finance/insights             — rule-based finance insights
"""

from __future__ import annotations

import random

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, Field

from src.core.models import (
    BudgetLine,
    ExpenseCategory,
    ExpenseReport,
    ExpenseStatus,
    Invoice,
    InvoiceStatus,
)
from src.services.finance_insights import generate_finance_insights, get_finance_summary
from src.stores.finance_store import (
    create_budget,
    create_expense,
    create_invoice,
    get_expense,
    list_budgets,
    list_expenses,
    list_invoices,
    update_budget,
    update_expense,
    update_invoice,
)

# ---------------------------------------------------------------------------
# Router
# ---------------------------------------------------------------------------

router = APIRouter(prefix="/finance", tags=["finance"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------


class ExpenseListItem(BaseModel):
    id: str
    submitter: str
    project_id: str | None
    category: str
    amount: float
    description: str
    receipts_count: int
    submit_date: str | None = None
    status: str
    approver: str | None
    payment_date: str | None


class CreateExpenseRequest(BaseModel):
    submitter: str = Field(min_length=1)
    project_id: str | None = None
    category: str
    amount: float = Field(gt=0)
    description: str = ""
    receipts_count: int = 0
    submit_date: str = ""


class UpdateExpenseRequest(BaseModel):
    status: str | None = None
    approver: str | None = None
    payment_date: str | None = None
    description: str | None = None
    amount: float | None = None


class BudgetListItem(BaseModel):
    id: str
    project_id: str | None
    category: str
    planned_amount: float
    actual_amount: float
    fiscal_year: int
    quarter: int
    notes: str


class CreateBudgetRequest(BaseModel):
    project_id: str | None = None
    category: str = Field(min_length=1)
    planned_amount: float = Field(gt=0)
    actual_amount: float = 0
    fiscal_year: int = 2026
    quarter: int = Field(default=1, ge=1, le=4)
    notes: str = ""


class UpdateBudgetRequest(BaseModel):
    planned_amount: float | None = None
    actual_amount: float | None = None
    notes: str | None = None
    quarter: int | None = None


class InvoiceListItem(BaseModel):
    id: str
    project_id: str | None
    vendor: str
    amount: float
    invoice_date: str
    due_date: str
    status: str
    category: str


class CreateInvoiceRequest(BaseModel):
    vendor: str = Field(min_length=1)
    project_id: str | None = None
    amount: float = Field(gt=0)
    invoice_date: str = ""
    due_date: str = ""
    status: str = "pending"
    category: str = ""


class UpdateInvoiceRequest(BaseModel):
    status: str | None = None
    due_date: str | None = None
    amount: float | None = None
    category: str | None = None


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _enum_val(v) -> str:
    """Safely extract enum value — handles both Enum and plain str after model_copy."""
    return v.value if hasattr(v, "value") else str(v)


def _expense_to_item(exp: ExpenseReport) -> ExpenseListItem:
    return ExpenseListItem(
        id=exp.id,
        submitter=exp.submitter,
        project_id=exp.project_id,
        category=_enum_val(exp.category),
        amount=exp.amount,
        description=exp.description,
        receipts_count=exp.receipts_count,
        submit_date=exp.submit_date,
        status=_enum_val(exp.status),
        approver=exp.approver,
        payment_date=exp.payment_date,
    )


def _budget_to_item(bgt: BudgetLine) -> BudgetListItem:
    return BudgetListItem(
        id=bgt.id,
        project_id=bgt.project_id,
        category=bgt.category,
        planned_amount=bgt.planned_amount,
        actual_amount=bgt.actual_amount,
        fiscal_year=bgt.fiscal_year,
        quarter=bgt.quarter,
        notes=bgt.notes,
    )


def _invoice_to_item(inv: Invoice) -> InvoiceListItem:
    return InvoiceListItem(
        id=inv.id,
        project_id=inv.project_id,
        vendor=inv.vendor,
        amount=inv.amount,
        invoice_date=inv.invoice_date,
        due_date=inv.due_date,
        status=_enum_val(inv.status),
        category=inv.category,
    )


# ---------------------------------------------------------------------------
# Expense endpoints
# ---------------------------------------------------------------------------


@router.get("/expenses", response_model=list[ExpenseListItem])
async def list_expenses_endpoint(
    status: str | None = None,
    project_id: str | None = None,
    submitter: str | None = None,
):
    """List expense reports with optional filters."""
    expenses = list_expenses(status=status, project_id=project_id, submitter=submitter)
    return [_expense_to_item(e) for e in expenses]


@router.get("/expenses/{expense_id}", response_model=ExpenseListItem)
async def get_expense_endpoint(expense_id: str):
    """Retrieve a single expense report by ID."""
    expense = get_expense(expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail=f"Expense {expense_id} not found")
    return _expense_to_item(expense)


@router.post("/expenses", response_model=ExpenseListItem, status_code=201)
async def create_expense_endpoint(req: CreateExpenseRequest):
    """Create a new expense report."""
    try:
        category = ExpenseCategory(req.category)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category '{req.category}'. Valid values: {[c.value for c in ExpenseCategory]}",
        )
    data = req.model_dump()
    data["category"] = category
    expense = create_expense(data)
    return _expense_to_item(expense)


@router.patch("/expenses/{expense_id}", response_model=ExpenseListItem)
async def update_expense_endpoint(expense_id: str, req: UpdateExpenseRequest):
    """Partially update an expense report (e.g. approve or reject)."""
    updates = req.model_dump(exclude_none=True)
    if "status" in updates:
        try:
            updates["status"] = ExpenseStatus(updates["status"])
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{updates['status']}'. Valid values: {[s.value for s in ExpenseStatus]}",
            )
    updated = update_expense(expense_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Expense {expense_id} not found")
    return _expense_to_item(updated)


# ---------------------------------------------------------------------------
# Budget endpoints
# ---------------------------------------------------------------------------


@router.get("/budgets", response_model=list[BudgetListItem])
async def list_budgets_endpoint(
    project_id: str | None = None,
    fiscal_year: int | None = None,
):
    """List budget lines with optional filters."""
    budgets = list_budgets(project_id=project_id, fiscal_year=fiscal_year)
    return [_budget_to_item(b) for b in budgets]


@router.post("/budgets", response_model=BudgetListItem, status_code=201)
async def create_budget_endpoint(req: CreateBudgetRequest):
    """Create a new budget line."""
    budget = create_budget(req.model_dump())
    return _budget_to_item(budget)


@router.patch("/budgets/{budget_id}", response_model=BudgetListItem)
async def update_budget_endpoint(budget_id: str, req: UpdateBudgetRequest):
    """Partially update a budget line."""
    updates = req.model_dump(exclude_none=True)
    updated = update_budget(budget_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Budget {budget_id} not found")
    return _budget_to_item(updated)


# ---------------------------------------------------------------------------
# Invoice endpoints
# ---------------------------------------------------------------------------


@router.get("/invoices", response_model=list[InvoiceListItem])
async def list_invoices_endpoint(
    status: str | None = None,
    project_id: str | None = None,
):
    """List invoices with optional filters."""
    invoices = list_invoices(status=status, project_id=project_id)
    return [_invoice_to_item(i) for i in invoices]


@router.post("/invoices", response_model=InvoiceListItem, status_code=201)
async def create_invoice_endpoint(req: CreateInvoiceRequest):
    """Create a new invoice."""
    try:
        status = InvoiceStatus(req.status)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{req.status}'. Valid values: {[s.value for s in InvoiceStatus]}",
        )
    data = req.model_dump()
    data["status"] = status
    invoice = create_invoice(data)
    return _invoice_to_item(invoice)


@router.patch("/invoices/{invoice_id}", response_model=InvoiceListItem)
async def update_invoice_endpoint(invoice_id: str, req: UpdateInvoiceRequest):
    """Partially update an invoice (e.g. mark as paid)."""
    updates = req.model_dump(exclude_none=True)
    if "status" in updates:
        try:
            updates["status"] = InvoiceStatus(updates["status"])
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status '{updates['status']}'. Valid values: {[s.value for s in InvoiceStatus]}",
            )
    updated = update_invoice(invoice_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found")
    return _invoice_to_item(updated)


# ---------------------------------------------------------------------------
# Analytics endpoints
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# AI Receipt parsing (mock)
# ---------------------------------------------------------------------------


class ReceiptParseResult(BaseModel):
    amount: float
    date: str
    category: str
    vendor: str
    description: str
    confidence: float


@router.post("/expenses/parse-receipt", response_model=ReceiptParseResult)
async def parse_receipt_endpoint(file: UploadFile = File(...)):
    """Mock AI receipt parsing — returns plausible data based on filename hints."""
    filename = (file.filename or "receipt.jpg").lower()
    # Consume file to avoid resource leak
    await file.read()

    # Infer category/vendor from filename hints
    if "taxi" in filename or "滴滴" in filename or "uber" in filename or "出租" in filename:
        category, vendor, desc = "travel", "滴滴出行", "出差交通费"
        amount = round(random.uniform(30, 200), 2)
    elif "hotel" in filename or "酒店" in filename or "住宿" in filename:
        category, vendor, desc = "travel", "如家酒店", "出差住宿费"
        amount = round(random.uniform(200, 800), 2)
    elif "餐" in filename or "meal" in filename or "饭" in filename:
        category, vendor, desc = "entertainment", "商务宴请", "业务招待费"
        amount = round(random.uniform(100, 500), 2)
    elif "办公" in filename or "office" in filename or "文具" in filename:
        category, vendor, desc = "office", "得力办公", "办公用品采购"
        amount = round(random.uniform(50, 300), 2)
    else:
        categories = [
            ("travel", "高铁票务", "出差交通费"),
            ("office", "京东企业购", "办公设备采购"),
            ("material", "建材供应商", "项目物料采购"),
            ("other", "其他供应商", "其他费用"),
        ]
        category, vendor, desc = random.choice(categories)
        amount = round(random.uniform(50, 2000), 2)

    return ReceiptParseResult(
        amount=amount,
        date="2026-03-13",
        category=category,
        vendor=vendor,
        description=desc,
        confidence=round(random.uniform(0.85, 0.98), 2),
    )


@router.get("/summary")
async def finance_summary_endpoint():
    """Return aggregated finance KPIs for the dashboard summary card."""
    expenses = list_expenses()
    budgets = list_budgets()
    invoices = list_invoices()
    return get_finance_summary(expenses, budgets, invoices)


@router.get("/insights")
async def finance_insights_endpoint():
    """Return rule-based finance insights (no LLM)."""
    expenses = list_expenses()
    budgets = list_budgets()
    invoices = list_invoices()
    insights = generate_finance_insights(expenses, budgets, invoices)
    return {"insights": insights, "count": len(insights)}
