"""In-memory finance CRUD store with seed data.

Covers three finance entities:
  - ExpenseReport  (报销单)
  - BudgetLine     (预算行)
  - Invoice        (发票)
"""

from __future__ import annotations

from src.core.models import (
    BudgetLine,
    ExpenseCategory,
    ExpenseReport,
    ExpenseStatus,
    Invoice,
    InvoiceStatus,
)

# ---------------------------------------------------------------------------
# Module-level stores
# ---------------------------------------------------------------------------

_expenses: dict[str, ExpenseReport] = {}
_budgets: dict[str, BudgetLine] = {}
_invoices: dict[str, Invoice] = {}

_seeded: bool = False


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------


def seed_finance() -> None:
    """Populate the stores with canonical seed data for all three finance entities."""
    global _seeded
    if _seeded:
        return

    # ------------------------------------------------------------------
    # 8 expense reports
    # ------------------------------------------------------------------
    expense_data: list[ExpenseReport] = [
        ExpenseReport(
            id="exp-001",
            submitter="张工",
            project_id="proj-001",
            category=ExpenseCategory.TRAVEL,
            amount=3500,
            status=ExpenseStatus.APPROVED,
            submit_date="2026-02-15",
            description="差旅费报销 — 赴施工现场",
        ),
        ExpenseReport(
            id="exp-002",
            submitter="李设计",
            project_id="proj-002",
            category=ExpenseCategory.OFFICE,
            amount=1200,
            status=ExpenseStatus.PAID,
            submit_date="2026-02-20",
            description="办公用品采购",
        ),
        ExpenseReport(
            id="exp-003",
            submitter="赵开发",
            project_id="proj-001",
            category=ExpenseCategory.MATERIAL,
            amount=45000,
            status=ExpenseStatus.SUBMITTED,
            submit_date="2026-03-01",
            description="施工材料采购报销",
        ),
        ExpenseReport(
            id="exp-004",
            submitter="陈咨询",
            project_id="proj-003",
            category=ExpenseCategory.ENTERTAINMENT,
            amount=2800,
            status=ExpenseStatus.SUBMITTED,
            submit_date="2026-03-05",
            description="业务招待费",
        ),
        ExpenseReport(
            id="exp-005",
            submitter="刘采购",
            project_id="proj-002",
            category=ExpenseCategory.MATERIAL,
            amount=28000,
            status=ExpenseStatus.APPROVED,
            submit_date="2026-03-08",
            description="设备采购材料费报销",
        ),
        ExpenseReport(
            id="exp-006",
            submitter="王监理",
            project_id="proj-001",
            category=ExpenseCategory.TRAVEL,
            amount=5600,
            status=ExpenseStatus.SUBMITTED,
            submit_date="2026-03-10",
            description="监理出差差旅费",
        ),
        ExpenseReport(
            id="exp-007",
            submitter="钱前端",
            project_id=None,
            category=ExpenseCategory.OFFICE,
            amount=680,
            status=ExpenseStatus.DRAFT,
            submit_date="",
            description="个人办公设备耗材",
        ),
        ExpenseReport(
            id="exp-008",
            submitter="吴产品",
            project_id="proj-003",
            category=ExpenseCategory.OTHER,
            amount=15000,
            status=ExpenseStatus.REJECTED,
            submit_date="2026-02-28",
            description="其他费用 — 审核未通过",
        ),
    ]
    for exp in expense_data:
        _expenses[exp.id] = exp

    # ------------------------------------------------------------------
    # 12 budget lines — 3 projects × 4 categories
    # ------------------------------------------------------------------
    budget_data: list[BudgetLine] = [
        # proj-001 (总预算 1.2亿，单位：万元)
        BudgetLine(
            id="bgt-001",
            project_id="proj-001",
            category="设计费",
            planned_amount=800,
            actual_amount=620,
            fiscal_year=2026,
            quarter=1,
        ),
        BudgetLine(
            id="bgt-002",
            project_id="proj-001",
            category="施工费",
            planned_amount=6000,
            actual_amount=4500,
            fiscal_year=2026,
            quarter=1,
        ),
        BudgetLine(
            id="bgt-003",
            project_id="proj-001",
            category="材料费",
            planned_amount=3500,
            actual_amount=3200,
            fiscal_year=2026,
            quarter=1,
        ),
        BudgetLine(
            id="bgt-004",
            project_id="proj-001",
            category="咨询费",
            planned_amount=700,
            actual_amount=450,
            fiscal_year=2026,
            quarter=1,
        ),
        # proj-002 (总预算 450万)
        BudgetLine(
            id="bgt-005",
            project_id="proj-002",
            category="设计费",
            planned_amount=80,
            actual_amount=75,
            fiscal_year=2026,
            quarter=1,
        ),
        BudgetLine(
            id="bgt-006",
            project_id="proj-002",
            category="施工费",
            planned_amount=200,
            actual_amount=180,
            fiscal_year=2026,
            quarter=1,
        ),
        BudgetLine(
            id="bgt-007",
            project_id="proj-002",
            category="材料费",
            planned_amount=120,
            actual_amount=95,
            fiscal_year=2026,
            quarter=1,
        ),
        BudgetLine(
            id="bgt-008",
            project_id="proj-002",
            category="咨询费",
            planned_amount=50,
            actual_amount=30,
            fiscal_year=2026,
            quarter=1,
        ),
        # proj-003 (总预算 280万)
        BudgetLine(
            id="bgt-009",
            project_id="proj-003",
            category="设计费",
            planned_amount=60,
            actual_amount=55,
            fiscal_year=2026,
            quarter=1,
        ),
        BudgetLine(
            id="bgt-010",
            project_id="proj-003",
            category="施工费",
            planned_amount=100,
            actual_amount=40,
            fiscal_year=2026,
            quarter=1,
        ),
        BudgetLine(
            id="bgt-011",
            project_id="proj-003",
            category="材料费",
            planned_amount=80,
            actual_amount=20,
            fiscal_year=2026,
            quarter=1,
        ),
        BudgetLine(
            id="bgt-012",
            project_id="proj-003",
            category="咨询费",
            planned_amount=40,
            actual_amount=15,
            fiscal_year=2026,
            quarter=1,
        ),
    ]
    for bgt in budget_data:
        _budgets[bgt.id] = bgt

    # ------------------------------------------------------------------
    # 6 invoices
    # ------------------------------------------------------------------
    invoice_data: list[Invoice] = [
        Invoice(
            id="inv-001",
            vendor="中建五局",
            project_id="proj-001",
            amount=500000,
            invoice_date="2026-02-01",
            due_date="2026-03-01",
            status=InvoiceStatus.PAID,
            category="施工费",
        ),
        Invoice(
            id="inv-002",
            vendor="华为技术",
            project_id="proj-002",
            amount=180000,
            invoice_date="2026-02-15",
            due_date="2026-03-15",
            status=InvoiceStatus.PENDING,
            category="设备费",
        ),
        Invoice(
            id="inv-003",
            vendor="金蝶软件",
            project_id="proj-002",
            amount=50000,
            invoice_date="2026-01-20",
            due_date="2026-02-20",
            status=InvoiceStatus.OVERDUE,
            category="软件费",
        ),
        Invoice(
            id="inv-004",
            vendor="中科院设计院",
            project_id="proj-001",
            amount=320000,
            invoice_date="2026-03-01",
            due_date="2026-04-01",
            status=InvoiceStatus.PENDING,
            category="设计费",
        ),
        Invoice(
            id="inv-005",
            vendor="办公用品供应商",
            project_id=None,
            amount=12000,
            invoice_date="2026-03-05",
            due_date="2026-04-05",
            status=InvoiceStatus.PENDING,
            category="办公费",
        ),
        Invoice(
            id="inv-006",
            vendor="差旅服务公司",
            project_id="proj-003",
            amount=25000,
            invoice_date="2026-02-10",
            due_date="2026-03-10",
            status=InvoiceStatus.OVERDUE,
            category="差旅费",
        ),
    ]
    for inv in invoice_data:
        _invoices[inv.id] = inv

    _seeded = True


# ---------------------------------------------------------------------------
# Expense CRUD
# ---------------------------------------------------------------------------


def list_expenses(
    status: str | None = None,
    project_id: str | None = None,
    submitter: str | None = None,
) -> list[ExpenseReport]:
    """Return all expenses, optionally filtered by status, project_id, or submitter."""
    results = list(_expenses.values())
    if status is not None:
        results = [e for e in results if e.status.value == status]
    if project_id is not None:
        results = [e for e in results if e.project_id == project_id]
    if submitter is not None:
        results = [e for e in results if e.submitter == submitter]
    return results


def get_expense(expense_id: str) -> ExpenseReport | None:
    """Return a single expense report by ID, or None if not found."""
    return _expenses.get(expense_id)


def create_expense(data: dict) -> ExpenseReport:
    """Create a new expense report from a dict and persist it."""
    if "category" in data and isinstance(data["category"], str):
        data["category"] = ExpenseCategory(data["category"])
    if "status" in data and isinstance(data["status"], str):
        data["status"] = ExpenseStatus(data["status"])
    expense = ExpenseReport(**data)
    _expenses[expense.id] = expense
    return expense


def update_expense(expense_id: str, data: dict) -> ExpenseReport | None:
    """Apply a partial update to an existing expense report.

    Returns None if the expense does not exist.
    """
    existing = _expenses.get(expense_id)
    if existing is None:
        return None
    if "category" in data and isinstance(data["category"], str):
        data["category"] = ExpenseCategory(data["category"])
    if "status" in data and isinstance(data["status"], str):
        data["status"] = ExpenseStatus(data["status"])
    updated = existing.model_copy(update=data)
    _expenses[expense_id] = updated
    return updated


# ---------------------------------------------------------------------------
# Budget CRUD
# ---------------------------------------------------------------------------


def list_budgets(
    project_id: str | None = None,
    fiscal_year: int | None = None,
) -> list[BudgetLine]:
    """Return all budget lines, optionally filtered by project_id or fiscal_year."""
    results = list(_budgets.values())
    if project_id is not None:
        results = [b for b in results if b.project_id == project_id]
    if fiscal_year is not None:
        results = [b for b in results if b.fiscal_year == fiscal_year]
    return results


def get_budget(budget_id: str) -> BudgetLine | None:
    """Return a single budget line by ID, or None if not found."""
    return _budgets.get(budget_id)


def create_budget(data: dict) -> BudgetLine:
    """Create a new budget line from a dict and persist it."""
    budget = BudgetLine(**data)
    _budgets[budget.id] = budget
    return budget


def update_budget(budget_id: str, data: dict) -> BudgetLine | None:
    """Apply a partial update to an existing budget line.

    Returns None if the budget line does not exist.
    """
    existing = _budgets.get(budget_id)
    if existing is None:
        return None
    updated = existing.model_copy(update=data)
    _budgets[budget_id] = updated
    return updated


# ---------------------------------------------------------------------------
# Invoice CRUD
# ---------------------------------------------------------------------------


def list_invoices(
    status: str | None = None,
    project_id: str | None = None,
) -> list[Invoice]:
    """Return all invoices, optionally filtered by status or project_id."""
    results = list(_invoices.values())
    if status is not None:
        results = [i for i in results if i.status.value == status]
    if project_id is not None:
        results = [i for i in results if i.project_id == project_id]
    return results


def get_invoice(invoice_id: str) -> Invoice | None:
    """Return a single invoice by ID, or None if not found."""
    return _invoices.get(invoice_id)


def create_invoice(data: dict) -> Invoice:
    """Create a new invoice from a dict and persist it."""
    if "status" in data and isinstance(data["status"], str):
        data["status"] = InvoiceStatus(data["status"])
    invoice = Invoice(**data)
    _invoices[invoice.id] = invoice
    return invoice


def update_invoice(invoice_id: str, data: dict) -> Invoice | None:
    """Apply a partial update to an existing invoice.

    Returns None if the invoice does not exist.
    """
    existing = _invoices.get(invoice_id)
    if existing is None:
        return None
    if "status" in data and isinstance(data["status"], str):
        data["status"] = InvoiceStatus(data["status"])
    updated = existing.model_copy(update=data)
    _invoices[invoice_id] = updated
    return updated


# ---------------------------------------------------------------------------
# Supabase delegation — when USE_SUPABASE=true, override all exports
# ---------------------------------------------------------------------------
from src.db.client import use_supabase as _use_sb  # noqa: E402

if _use_sb():
    from src.stores.supabase.finance_store import *  # noqa: E402,F401,F403
