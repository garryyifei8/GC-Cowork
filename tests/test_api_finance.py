"""API tests for Finance endpoints.

Routes under test (all prefixed with /api/finance):
  GET    /expenses                — list expenses (?status=&project_id=&submitter=)
  GET    /expenses/{id}          — expense detail
  POST   /expenses               — create expense
  PATCH  /expenses/{id}          — update / approve expense

  GET    /budgets                — list budgets (?project_id=&fiscal_year=)
  POST   /budgets                — create budget line
  PATCH  /budgets/{id}          — update budget line

  GET    /invoices               — list invoices (?status=&project_id=)
  POST   /invoices               — create invoice
  PATCH  /invoices/{id}         — update invoice

  GET    /summary                — finance summary KPIs
  GET    /insights               — rule-based finance insights

Seed data reference (from finance_store.py):
  Expenses  : exp-001 … exp-008
    exp-001 : 张工,       proj-001, travel,         3500,  approved
    exp-002 : 李设计,     proj-002, office,          1200,  paid
    exp-003 : 赵开发,     proj-001, material,       45000,  submitted
    exp-004 : 陈咨询,     proj-003, entertainment,  2800,  submitted
    exp-005 : 刘采购,     proj-002, material,       28000,  approved
    exp-006 : 王监理,     proj-001, travel,          5600,  submitted
    exp-007 : 钱前端,     None,     office,           680,  draft
    exp-008 : 吴产品,     proj-003, other,          15000,  rejected

  Budgets   : bgt-001 … bgt-012 (3 projects × 4 categories, all fiscal_year=2026, quarter=1)
    bgt-001 : proj-001, 设计费, planned=800,  actual=620
    bgt-002 : proj-001, 施工费, planned=6000, actual=4500
    bgt-003 : proj-001, 材料费, planned=3500, actual=3200
    bgt-004 : proj-001, 咨询费, planned=700,  actual=450
    bgt-005 : proj-002, 设计费, planned=80,   actual=75
    bgt-006 : proj-002, 施工费, planned=200,  actual=180
    bgt-007 : proj-002, 材料费, planned=120,  actual=95
    bgt-008 : proj-002, 咨询费, planned=50,   actual=30
    bgt-009 : proj-003, 设计费, planned=60,   actual=55
    bgt-010 : proj-003, 施工费, planned=100,  actual=40
    bgt-011 : proj-003, 材料费, planned=80,   actual=20
    bgt-012 : proj-003, 咨询费, planned=40,   actual=15

  Invoices  : inv-001 … inv-006
    inv-001 : 中建五局,       proj-001, 500000, paid
    inv-002 : 华为技术,       proj-002, 180000, pending
    inv-003 : 金蝶软件,       proj-002,  50000, overdue
    inv-004 : 中科院设计院,   proj-001, 320000, pending
    inv-005 : 办公用品供应商, None,      12000, pending
    inv-006 : 差旅服务公司,   proj-003,  25000, overdue
"""

# ---------------------------------------------------------------------------
# Seed data constants
# ---------------------------------------------------------------------------

EXPENSE_ID_APPROVED  = "exp-001"   # 张工,   proj-001, travel,       3500, approved
EXPENSE_ID_PAID      = "exp-002"   # 李设计,  proj-002, office,       1200, paid
EXPENSE_ID_SUBMITTED = "exp-003"   # 赵开发,  proj-001, material,    45000, submitted
EXPENSE_ID_DRAFT     = "exp-007"   # 钱前端,  None,     office,        680, draft
EXPENSE_ID_REJECTED  = "exp-008"   # 吴产品,  proj-003, other,       15000, rejected

BUDGET_ID            = "bgt-001"   # proj-001, 设计费, planned=800, actual=620
BUDGET_ID_PROJ2      = "bgt-005"   # proj-002, 设计费, planned=80,  actual=75

INVOICE_ID_PAID      = "inv-001"   # 中建五局,     proj-001, 500000, paid
INVOICE_ID_PENDING   = "inv-002"   # 华为技术,     proj-002, 180000, pending
INVOICE_ID_OVERDUE   = "inv-003"   # 金蝶软件,     proj-002,  50000, overdue


# ===========================================================================
# TestExpenseList
# ===========================================================================

class TestExpenseList:
    """GET /api/finance/expenses."""

    def test_list_expenses_returns_all_seed(self, client):
        """Returns 200 with all 8 seeded expense reports."""
        resp = client.get("/api/finance/expenses")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 8
        ids = [e["id"] for e in data]
        assert EXPENSE_ID_APPROVED in ids
        assert EXPENSE_ID_DRAFT in ids

    def test_list_expenses_schema_fields(self, client):
        """Each expense item contains all expected schema fields."""
        resp = client.get("/api/finance/expenses")
        assert resp.status_code == 200
        exp = next(e for e in resp.json() if e["id"] == EXPENSE_ID_APPROVED)
        for field in ("id", "submitter", "project_id", "category", "amount",
                      "description", "receipts_count", "submit_date", "status",
                      "approver", "payment_date"):
            assert field in exp, f"Missing field: {field}"

    def test_list_expenses_seed_data_values(self, client):
        """Spot-check known seed values for exp-001."""
        resp = client.get("/api/finance/expenses")
        assert resp.status_code == 200
        exp = next(e for e in resp.json() if e["id"] == EXPENSE_ID_APPROVED)
        assert exp["submitter"] == "张工"
        assert exp["project_id"] == "proj-001"
        assert exp["category"] == "travel"
        assert exp["amount"] == 3500.0
        assert exp["status"] == "approved"

    def test_list_expenses_filter_by_status_submitted(self, client):
        """?status=submitted returns only the 3 submitted expense reports."""
        resp = client.get("/api/finance/expenses?status=submitted")
        assert resp.status_code == 200
        data = resp.json()
        # exp-003, exp-004, exp-006 are submitted
        assert len(data) == 3
        for exp in data:
            assert exp["status"] == "submitted"

    def test_list_expenses_filter_by_status_approved(self, client):
        """?status=approved returns only the 2 approved expense reports."""
        resp = client.get("/api/finance/expenses?status=approved")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        for exp in data:
            assert exp["status"] == "approved"
        ids = [e["id"] for e in data]
        assert EXPENSE_ID_APPROVED in ids

    def test_list_expenses_filter_by_project_id(self, client):
        """?project_id=proj-001 returns only expenses for that project."""
        resp = client.get("/api/finance/expenses?project_id=proj-001")
        assert resp.status_code == 200
        data = resp.json()
        # exp-001, exp-003, exp-006 belong to proj-001
        assert len(data) == 3
        for exp in data:
            assert exp["project_id"] == "proj-001"

    def test_list_expenses_filter_by_submitter(self, client):
        """?submitter=张工 returns only that submitter's expenses."""
        resp = client.get("/api/finance/expenses?submitter=张工")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["id"] == EXPENSE_ID_APPROVED
        assert data[0]["submitter"] == "张工"

    def test_list_expenses_filter_no_match(self, client):
        """?submitter=不存在 returns an empty list."""
        resp = client.get("/api/finance/expenses?submitter=不存在")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_expenses_filter_status_draft(self, client):
        """?status=draft returns only the 1 draft expense."""
        resp = client.get("/api/finance/expenses?status=draft")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 1
        assert data[0]["id"] == EXPENSE_ID_DRAFT
        assert data[0]["status"] == "draft"


# ===========================================================================
# TestExpenseDetail
# ===========================================================================

class TestExpenseDetail:
    """GET /api/finance/expenses/{id}."""

    def test_get_expense_happy_path(self, client):
        """Returns 200 with correct expense data for a known ID."""
        resp = client.get(f"/api/finance/expenses/{EXPENSE_ID_APPROVED}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == EXPENSE_ID_APPROVED
        assert data["submitter"] == "张工"
        assert data["project_id"] == "proj-001"
        assert data["category"] == "travel"
        assert data["amount"] == 3500.0
        assert data["status"] == "approved"

    def test_get_expense_no_project(self, client):
        """Returns 200 for expense with no project_id (exp-007)."""
        resp = client.get(f"/api/finance/expenses/{EXPENSE_ID_DRAFT}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == EXPENSE_ID_DRAFT
        assert data["project_id"] is None
        assert data["submitter"] == "钱前端"

    def test_get_expense_not_found(self, client):
        """Returns 404 for a non-existent expense ID."""
        resp = client.get("/api/finance/expenses/exp-does-not-exist")
        assert resp.status_code == 404

    def test_get_expense_rejected(self, client):
        """Returns 200 for rejected expense with correct status."""
        resp = client.get(f"/api/finance/expenses/{EXPENSE_ID_REJECTED}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "rejected"
        assert data["submitter"] == "吴产品"


# ===========================================================================
# TestCreateExpense
# ===========================================================================

class TestCreateExpense:
    """POST /api/finance/expenses."""

    def test_create_expense_happy_path(self, client):
        """POST returns 201 with the newly created expense report."""
        payload = {
            "submitter": "新测试员工",
            "project_id": "proj-001",
            "category": "travel",
            "amount": 1500.0,
            "description": "测试差旅费",
            "receipts_count": 2,
            "submit_date": "2026-04-01",
        }
        resp = client.post("/api/finance/expenses", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["submitter"] == "新测试员工"
        assert data["project_id"] == "proj-001"
        assert data["category"] == "travel"
        assert data["amount"] == 1500.0
        assert data["description"] == "测试差旅费"
        assert data["receipts_count"] == 2
        assert "id" in data

    def test_create_expense_default_status_is_draft(self, client):
        """Newly created expense defaults to draft status."""
        payload = {
            "submitter": "默认状态员工",
            "category": "office",
            "amount": 500.0,
        }
        resp = client.post("/api/finance/expenses", json=payload)
        assert resp.status_code == 201
        assert resp.json()["status"] == "draft"

    def test_create_expense_is_retrievable(self, client):
        """Newly created expense can be retrieved via GET /expenses/{id}."""
        payload = {
            "submitter": "可查验员工",
            "category": "material",
            "amount": 8000.0,
            "description": "材料采购",
        }
        create_resp = client.post("/api/finance/expenses", json=payload)
        assert create_resp.status_code == 201
        new_id = create_resp.json()["id"]

        get_resp = client.get(f"/api/finance/expenses/{new_id}")
        assert get_resp.status_code == 200
        assert get_resp.json()["submitter"] == "可查验员工"

    def test_create_expense_appears_in_list(self, client):
        """Newly created expense appears in the expenses list."""
        payload = {
            "submitter": "列表验证员工",
            "category": "entertainment",
            "amount": 2200.0,
        }
        create_resp = client.post("/api/finance/expenses", json=payload)
        assert create_resp.status_code == 201
        new_id = create_resp.json()["id"]

        list_resp = client.get("/api/finance/expenses")
        ids = [e["id"] for e in list_resp.json()]
        assert new_id in ids

    def test_create_expense_missing_submitter_fails(self, client):
        """POST without required submitter field returns 422."""
        payload = {
            "category": "travel",
            "amount": 1000.0,
        }
        resp = client.post("/api/finance/expenses", json=payload)
        assert resp.status_code == 422

    def test_create_expense_invalid_amount_zero_fails(self, client):
        """POST with amount <= 0 returns 422 (Field gt=0)."""
        payload = {
            "submitter": "无效金额员工",
            "category": "travel",
            "amount": 0,
        }
        resp = client.post("/api/finance/expenses", json=payload)
        assert resp.status_code == 422

    def test_create_expense_invalid_category_returns_400(self, client):
        """POST with an invalid category value returns 400."""
        payload = {
            "submitter": "无效类别员工",
            "category": "invalid_category",
            "amount": 1000.0,
        }
        resp = client.post("/api/finance/expenses", json=payload)
        assert resp.status_code == 400

    def test_create_expense_no_project_id(self, client):
        """POST without project_id creates an expense with project_id=None."""
        payload = {
            "submitter": "无项目员工",
            "category": "other",
            "amount": 300.0,
        }
        resp = client.post("/api/finance/expenses", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["project_id"] is None


# ===========================================================================
# TestUpdateExpense
# ===========================================================================

class TestUpdateExpense:
    """PATCH /api/finance/expenses/{id}."""

    def test_approve_expense(self, client):
        """PATCH transitions a submitted expense to approved status with approver."""
        resp = client.patch(
            f"/api/finance/expenses/{EXPENSE_ID_SUBMITTED}",
            json={"status": "approved", "approver": "财务总监"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == EXPENSE_ID_SUBMITTED
        assert data["status"] == "approved"
        assert data["approver"] == "财务总监"

    def test_reject_expense(self, client):
        """PATCH transitions a submitted expense to rejected status."""
        resp = client.patch(
            f"/api/finance/expenses/{EXPENSE_ID_SUBMITTED}",
            json={"status": "rejected", "approver": "财务总监"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "rejected"

    def test_update_expense_amount(self, client):
        """PATCH amount field updates the expense amount."""
        resp = client.patch(
            f"/api/finance/expenses/{EXPENSE_ID_DRAFT}",
            json={"amount": 999.0},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["amount"] == 999.0
        # Other fields remain unchanged
        assert data["submitter"] == "钱前端"

    def test_update_expense_payment_date(self, client):
        """PATCH payment_date records when the expense was paid."""
        resp = client.patch(
            f"/api/finance/expenses/{EXPENSE_ID_APPROVED}",
            json={"status": "paid", "payment_date": "2026-04-10"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "paid"
        assert data["payment_date"] == "2026-04-10"

    def test_update_expense_persists_change(self, client):
        """Updated approver is reflected in subsequent GET call."""
        client.patch(
            f"/api/finance/expenses/{EXPENSE_ID_SUBMITTED}",
            json={"approver": "新审批人"},
        )
        get_resp = client.get(f"/api/finance/expenses/{EXPENSE_ID_SUBMITTED}")
        assert get_resp.status_code == 200
        assert get_resp.json()["approver"] == "新审批人"

    def test_update_expense_not_found(self, client):
        """PATCH non-existent expense ID returns 404."""
        resp = client.patch(
            "/api/finance/expenses/exp-does-not-exist",
            json={"status": "approved"},
        )
        assert resp.status_code == 404

    def test_update_expense_invalid_status_returns_400(self, client):
        """PATCH with an invalid status value returns 400."""
        resp = client.patch(
            f"/api/finance/expenses/{EXPENSE_ID_SUBMITTED}",
            json={"status": "invalid_status"},
        )
        assert resp.status_code == 400


# ===========================================================================
# TestBudgetList
# ===========================================================================

class TestBudgetList:
    """GET /api/finance/budgets."""

    def test_list_budgets_returns_all_seed(self, client):
        """Returns 200 with all 12 seeded budget lines."""
        resp = client.get("/api/finance/budgets")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 12
        ids = [b["id"] for b in data]
        assert BUDGET_ID in ids

    def test_list_budgets_schema_fields(self, client):
        """Each budget item contains all expected schema fields."""
        resp = client.get("/api/finance/budgets")
        assert resp.status_code == 200
        bgt = next(b for b in resp.json() if b["id"] == BUDGET_ID)
        for field in ("id", "project_id", "category", "planned_amount",
                      "actual_amount", "fiscal_year", "quarter", "notes"):
            assert field in bgt, f"Missing field: {field}"

    def test_list_budgets_seed_data_values(self, client):
        """Spot-check known seed values for bgt-001."""
        resp = client.get("/api/finance/budgets")
        assert resp.status_code == 200
        bgt = next(b for b in resp.json() if b["id"] == BUDGET_ID)
        assert bgt["project_id"] == "proj-001"
        assert bgt["category"] == "设计费"
        assert bgt["planned_amount"] == 800.0
        assert bgt["actual_amount"] == 620.0
        assert bgt["fiscal_year"] == 2026
        assert bgt["quarter"] == 1

    def test_list_budgets_filter_by_project_id(self, client):
        """?project_id=proj-001 returns only the 4 budget lines for that project."""
        resp = client.get("/api/finance/budgets?project_id=proj-001")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 4
        for bgt in data:
            assert bgt["project_id"] == "proj-001"

    def test_list_budgets_filter_by_fiscal_year(self, client):
        """?fiscal_year=2026 returns all 12 budget lines (all seeded as 2026)."""
        resp = client.get("/api/finance/budgets?fiscal_year=2026")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 12
        for bgt in data:
            assert bgt["fiscal_year"] == 2026

    def test_list_budgets_filter_fiscal_year_no_match(self, client):
        """?fiscal_year=2020 returns an empty list."""
        resp = client.get("/api/finance/budgets?fiscal_year=2020")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_budgets_filter_project_no_match(self, client):
        """?project_id=proj-999 returns an empty list."""
        resp = client.get("/api/finance/budgets?project_id=proj-999")
        assert resp.status_code == 200
        assert resp.json() == []


# ===========================================================================
# TestCreateBudget
# ===========================================================================

class TestCreateBudget:
    """POST /api/finance/budgets."""

    def test_create_budget_happy_path(self, client):
        """POST returns 201 with the newly created budget line."""
        payload = {
            "project_id": "proj-001",
            "category": "测试类别",
            "planned_amount": 5000.0,
            "actual_amount": 0.0,
            "fiscal_year": 2026,
            "quarter": 2,
            "notes": "新增预算行",
        }
        resp = client.post("/api/finance/budgets", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["project_id"] == "proj-001"
        assert data["category"] == "测试类别"
        assert data["planned_amount"] == 5000.0
        assert data["actual_amount"] == 0.0
        assert data["fiscal_year"] == 2026
        assert data["quarter"] == 2
        assert data["notes"] == "新增预算行"
        assert "id" in data

    def test_create_budget_defaults(self, client):
        """POST with minimal payload uses correct defaults."""
        payload = {
            "category": "默认类别",
            "planned_amount": 1000.0,
        }
        resp = client.post("/api/finance/budgets", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["fiscal_year"] == 2026
        assert data["quarter"] == 1
        assert data["actual_amount"] == 0.0
        assert data["notes"] == ""

    def test_create_budget_is_retrievable_in_list(self, client):
        """Newly created budget appears in the budget list."""
        payload = {
            "category": "列表验证类别",
            "planned_amount": 2500.0,
            "project_id": "proj-002",
        }
        create_resp = client.post("/api/finance/budgets", json=payload)
        assert create_resp.status_code == 201
        new_id = create_resp.json()["id"]

        list_resp = client.get("/api/finance/budgets?project_id=proj-002")
        ids = [b["id"] for b in list_resp.json()]
        assert new_id in ids

    def test_create_budget_missing_category_fails(self, client):
        """POST without category returns 422 (min_length=1 violated)."""
        payload = {"planned_amount": 1000.0}
        resp = client.post("/api/finance/budgets", json=payload)
        assert resp.status_code == 422

    def test_create_budget_invalid_amount_zero_fails(self, client):
        """POST with planned_amount <= 0 returns 422 (Field gt=0)."""
        payload = {
            "category": "施工费",
            "planned_amount": 0,
        }
        resp = client.post("/api/finance/budgets", json=payload)
        assert resp.status_code == 422

    def test_create_budget_invalid_quarter_out_of_range(self, client):
        """POST with quarter=5 returns 422 (Field le=4 violated)."""
        payload = {
            "category": "施工费",
            "planned_amount": 1000.0,
            "quarter": 5,
        }
        resp = client.post("/api/finance/budgets", json=payload)
        assert resp.status_code == 422


# ===========================================================================
# TestUpdateBudget
# ===========================================================================

class TestUpdateBudget:
    """PATCH /api/finance/budgets/{id}."""

    def test_update_budget_actual_amount(self, client):
        """PATCH actual_amount updates the budget line."""
        resp = client.patch(
            f"/api/finance/budgets/{BUDGET_ID}",
            json={"actual_amount": 750.0},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == BUDGET_ID
        assert data["actual_amount"] == 750.0
        # Planned amount should be unchanged
        assert data["planned_amount"] == 800.0

    def test_update_budget_notes(self, client):
        """PATCH notes field updates only the notes."""
        resp = client.patch(
            f"/api/finance/budgets/{BUDGET_ID}",
            json={"notes": "已审核追加预算"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["notes"] == "已审核追加预算"
        assert data["category"] == "设计费"

    def test_update_budget_planned_amount(self, client):
        """PATCH planned_amount revises the budget allocation."""
        resp = client.patch(
            f"/api/finance/budgets/{BUDGET_ID}",
            json={"planned_amount": 900.0},
        )
        assert resp.status_code == 200
        assert resp.json()["planned_amount"] == 900.0

    def test_update_budget_persists_change(self, client):
        """Updated actual_amount is reflected in subsequent list call."""
        client.patch(
            f"/api/finance/budgets/{BUDGET_ID}",
            json={"actual_amount": 777.0},
        )
        list_resp = client.get("/api/finance/budgets?project_id=proj-001")
        bgt = next(b for b in list_resp.json() if b["id"] == BUDGET_ID)
        assert bgt["actual_amount"] == 777.0

    def test_update_budget_not_found(self, client):
        """PATCH non-existent budget ID returns 404."""
        resp = client.patch(
            "/api/finance/budgets/bgt-does-not-exist",
            json={"actual_amount": 100.0},
        )
        assert resp.status_code == 404


# ===========================================================================
# TestInvoiceList
# ===========================================================================

class TestInvoiceList:
    """GET /api/finance/invoices."""

    def test_list_invoices_returns_all_seed(self, client):
        """Returns 200 with all 6 seeded invoices."""
        resp = client.get("/api/finance/invoices")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) == 6
        ids = [i["id"] for i in data]
        assert INVOICE_ID_PAID in ids
        assert INVOICE_ID_OVERDUE in ids

    def test_list_invoices_schema_fields(self, client):
        """Each invoice item contains all expected schema fields."""
        resp = client.get("/api/finance/invoices")
        assert resp.status_code == 200
        inv = next(i for i in resp.json() if i["id"] == INVOICE_ID_PAID)
        for field in ("id", "project_id", "vendor", "amount", "invoice_date",
                      "due_date", "status", "category"):
            assert field in inv, f"Missing field: {field}"

    def test_list_invoices_seed_data_values(self, client):
        """Spot-check known seed values for inv-001."""
        resp = client.get("/api/finance/invoices")
        assert resp.status_code == 200
        inv = next(i for i in resp.json() if i["id"] == INVOICE_ID_PAID)
        assert inv["vendor"] == "中建五局"
        assert inv["project_id"] == "proj-001"
        assert inv["amount"] == 500000.0
        assert inv["status"] == "paid"
        assert inv["category"] == "施工费"

    def test_list_invoices_filter_by_status_pending(self, client):
        """?status=pending returns only the 3 pending invoices."""
        resp = client.get("/api/finance/invoices?status=pending")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 3
        for inv in data:
            assert inv["status"] == "pending"

    def test_list_invoices_filter_by_status_overdue(self, client):
        """?status=overdue returns only the 2 overdue invoices."""
        resp = client.get("/api/finance/invoices?status=overdue")
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) == 2
        for inv in data:
            assert inv["status"] == "overdue"
        ids = [i["id"] for i in data]
        assert INVOICE_ID_OVERDUE in ids

    def test_list_invoices_filter_by_project_id(self, client):
        """?project_id=proj-001 returns only invoices for proj-001."""
        resp = client.get("/api/finance/invoices?project_id=proj-001")
        assert resp.status_code == 200
        data = resp.json()
        # inv-001 and inv-004 belong to proj-001
        assert len(data) == 2
        for inv in data:
            assert inv["project_id"] == "proj-001"

    def test_list_invoices_filter_no_match(self, client):
        """?project_id=proj-999 returns an empty list."""
        resp = client.get("/api/finance/invoices?project_id=proj-999")
        assert resp.status_code == 200
        assert resp.json() == []


# ===========================================================================
# TestCreateInvoice
# ===========================================================================

class TestCreateInvoice:
    """POST /api/finance/invoices."""

    def test_create_invoice_happy_path(self, client):
        """POST returns 201 with the newly created invoice."""
        payload = {
            "vendor": "测试供应商",
            "project_id": "proj-002",
            "amount": 75000.0,
            "invoice_date": "2026-04-01",
            "due_date": "2026-05-01",
            "status": "pending",
            "category": "测试费用",
        }
        resp = client.post("/api/finance/invoices", json=payload)
        assert resp.status_code == 201
        data = resp.json()
        assert data["vendor"] == "测试供应商"
        assert data["project_id"] == "proj-002"
        assert data["amount"] == 75000.0
        assert data["status"] == "pending"
        assert data["category"] == "测试费用"
        assert "id" in data

    def test_create_invoice_default_status_is_pending(self, client):
        """POST without explicit status defaults to pending."""
        payload = {
            "vendor": "默认状态供应商",
            "amount": 10000.0,
        }
        resp = client.post("/api/finance/invoices", json=payload)
        assert resp.status_code == 201
        assert resp.json()["status"] == "pending"

    def test_create_invoice_is_retrievable_in_list(self, client):
        """Newly created invoice appears in the invoices list."""
        payload = {
            "vendor": "列表验证供应商",
            "amount": 5000.0,
        }
        create_resp = client.post("/api/finance/invoices", json=payload)
        assert create_resp.status_code == 201
        new_id = create_resp.json()["id"]

        list_resp = client.get("/api/finance/invoices")
        ids = [i["id"] for i in list_resp.json()]
        assert new_id in ids

    def test_create_invoice_missing_vendor_fails(self, client):
        """POST without required vendor field returns 422."""
        payload = {"amount": 10000.0}
        resp = client.post("/api/finance/invoices", json=payload)
        assert resp.status_code == 422

    def test_create_invoice_invalid_amount_zero_fails(self, client):
        """POST with amount <= 0 returns 422 (Field gt=0)."""
        payload = {
            "vendor": "无效金额供应商",
            "amount": 0,
        }
        resp = client.post("/api/finance/invoices", json=payload)
        assert resp.status_code == 422

    def test_create_invoice_invalid_status_returns_400(self, client):
        """POST with an invalid status value returns 400."""
        payload = {
            "vendor": "无效状态供应商",
            "amount": 5000.0,
            "status": "invalid_status",
        }
        resp = client.post("/api/finance/invoices", json=payload)
        assert resp.status_code == 400

    def test_create_invoice_no_project_id(self, client):
        """POST without project_id creates an invoice with project_id=None."""
        payload = {
            "vendor": "无项目供应商",
            "amount": 3000.0,
        }
        resp = client.post("/api/finance/invoices", json=payload)
        assert resp.status_code == 201
        assert resp.json()["project_id"] is None


# ===========================================================================
# TestUpdateInvoice
# ===========================================================================

class TestUpdateInvoice:
    """PATCH /api/finance/invoices/{id}."""

    def test_mark_invoice_paid(self, client):
        """PATCH transitions a pending invoice to paid status."""
        resp = client.patch(
            f"/api/finance/invoices/{INVOICE_ID_PENDING}",
            json={"status": "paid"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == INVOICE_ID_PENDING
        assert data["status"] == "paid"

    def test_mark_overdue_invoice_paid(self, client):
        """PATCH transitions an overdue invoice to paid status."""
        resp = client.patch(
            f"/api/finance/invoices/{INVOICE_ID_OVERDUE}",
            json={"status": "paid"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "paid"

    def test_update_invoice_due_date(self, client):
        """PATCH due_date extends the payment deadline."""
        resp = client.patch(
            f"/api/finance/invoices/{INVOICE_ID_PENDING}",
            json={"due_date": "2026-06-30"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["due_date"] == "2026-06-30"
        # Other fields remain unchanged
        assert data["vendor"] == "华为技术"

    def test_update_invoice_amount(self, client):
        """PATCH amount field updates the invoice total."""
        resp = client.patch(
            f"/api/finance/invoices/{INVOICE_ID_PENDING}",
            json={"amount": 200000.0},
        )
        assert resp.status_code == 200
        assert resp.json()["amount"] == 200000.0

    def test_update_invoice_category(self, client):
        """PATCH category field updates the invoice category."""
        resp = client.patch(
            f"/api/finance/invoices/{INVOICE_ID_PENDING}",
            json={"category": "修订后类别"},
        )
        assert resp.status_code == 200
        assert resp.json()["category"] == "修订后类别"

    def test_update_invoice_persists_change(self, client):
        """Invoice status change is reflected in the list endpoint."""
        client.patch(
            f"/api/finance/invoices/{INVOICE_ID_PENDING}",
            json={"status": "paid"},
        )
        list_resp = client.get("/api/finance/invoices?status=paid")
        ids = [i["id"] for i in list_resp.json()]
        assert INVOICE_ID_PENDING in ids

    def test_update_invoice_not_found(self, client):
        """PATCH non-existent invoice ID returns 404."""
        resp = client.patch(
            "/api/finance/invoices/inv-does-not-exist",
            json={"status": "paid"},
        )
        assert resp.status_code == 404

    def test_update_invoice_invalid_status_returns_400(self, client):
        """PATCH with an invalid status value returns 400."""
        resp = client.patch(
            f"/api/finance/invoices/{INVOICE_ID_PENDING}",
            json={"status": "unknown_status"},
        )
        assert resp.status_code == 400


# ===========================================================================
# TestFinanceSummary
# ===========================================================================

class TestFinanceSummary:
    """GET /api/finance/summary."""

    def test_summary_returns_200(self, client):
        """Returns 200 with a finance summary dict."""
        resp = client.get("/api/finance/summary")
        assert resp.status_code == 200

    def test_summary_schema_fields(self, client):
        """Summary contains all required KPI fields."""
        resp = client.get("/api/finance/summary")
        assert resp.status_code == 200
        data = resp.json()
        for field in ("total_expenses", "pending_approvals",
                      "budget_utilization_rate", "overdue_invoices",
                      "monthly_expense_trend"):
            assert field in data, f"Missing field: {field}"

    def test_summary_total_expenses(self, client):
        """total_expenses equals the sum of all 8 seeded expense amounts.

        Seed amounts: 3500 + 1200 + 45000 + 2800 + 28000 + 5600 + 680 + 15000 = 101780
        """
        resp = client.get("/api/finance/summary")
        assert resp.status_code == 200
        data = resp.json()
        expected_total = 3500 + 1200 + 45000 + 2800 + 28000 + 5600 + 680 + 15000
        assert data["total_expenses"] == float(expected_total)

    def test_summary_pending_approvals(self, client):
        """pending_approvals counts expenses with status=submitted (3 records).

        Submitted: exp-003 (赵开发), exp-004 (陈咨询), exp-006 (王监理)
        """
        resp = client.get("/api/finance/summary")
        assert resp.status_code == 200
        assert resp.json()["pending_approvals"] == 3

    def test_summary_overdue_invoices(self, client):
        """overdue_invoices counts invoices with status=overdue (2 records).

        Overdue: inv-003 (金蝶软件), inv-006 (差旅服务公司)
        """
        resp = client.get("/api/finance/summary")
        assert resp.status_code == 200
        assert resp.json()["overdue_invoices"] == 2

    def test_summary_budget_utilization_rate_range(self, client):
        """budget_utilization_rate is between 0.0 and 1.0 (exclusive upper)."""
        resp = client.get("/api/finance/summary")
        assert resp.status_code == 200
        rate = resp.json()["budget_utilization_rate"]
        assert isinstance(rate, (int, float))
        assert 0.0 <= rate <= 1.0

    def test_summary_monthly_expense_trend_is_list(self, client):
        """monthly_expense_trend is a list of month/amount dicts in ascending order."""
        resp = client.get("/api/finance/summary")
        assert resp.status_code == 200
        trend = resp.json()["monthly_expense_trend"]
        assert isinstance(trend, list)
        assert len(trend) > 0
        # Each entry should have month and amount keys
        for entry in trend:
            assert "month" in entry
            assert "amount" in entry
            assert isinstance(entry["amount"], (int, float))

    def test_summary_monthly_trend_sorted_ascending(self, client):
        """Monthly expense trend entries are sorted in ascending month order."""
        resp = client.get("/api/finance/summary")
        assert resp.status_code == 200
        trend = resp.json()["monthly_expense_trend"]
        months = [e["month"] for e in trend]
        assert months == sorted(months)


# ===========================================================================
# TestFinanceInsights
# ===========================================================================

class TestFinanceInsights:
    """GET /api/finance/insights."""

    def test_insights_returns_200(self, client):
        """Returns 200 with an insights response dict."""
        resp = client.get("/api/finance/insights")
        assert resp.status_code == 200

    def test_insights_schema(self, client):
        """Response contains 'insights' list and 'count' integer."""
        resp = client.get("/api/finance/insights")
        assert resp.status_code == 200
        data = resp.json()
        assert "insights" in data
        assert "count" in data
        assert isinstance(data["insights"], list)
        assert isinstance(data["count"], int)
        assert data["count"] == len(data["insights"])

    def test_insights_each_item_has_required_keys(self, client):
        """Each insight item has title, description, severity, category fields."""
        resp = client.get("/api/finance/insights")
        assert resp.status_code == 200
        insights = resp.json()["insights"]
        for insight in insights:
            for key in ("title", "description", "severity", "category"):
                assert key in insight, f"Insight missing key: {key}"

    def test_insights_severity_values(self, client):
        """All insight severity values are one of the expected set."""
        resp = client.get("/api/finance/insights")
        assert resp.status_code == 200
        valid_severities = {"warning", "info", "critical"}
        for insight in resp.json()["insights"]:
            assert insight["severity"] in valid_severities

    def test_insights_category_values(self, client):
        """All insight category values are one of the expected set."""
        resp = client.get("/api/finance/insights")
        assert resp.status_code == 200
        valid_categories = {"budget", "invoice", "expense"}
        for insight in resp.json()["insights"]:
            assert insight["category"] in valid_categories

    def test_insights_detects_overdue_invoices(self, client):
        """Insights include a critical overdue-invoice entry (2 overdue invoices in seed)."""
        resp = client.get("/api/finance/insights")
        assert resp.status_code == 200
        insights = resp.json()["insights"]
        critical = [i for i in insights if i["severity"] == "critical" and i["category"] == "invoice"]
        assert len(critical) >= 1

    def test_insights_detects_budget_overrun(self, client):
        """Insights include a warning for budget lines with >90% utilisation.

        bgt-005: 设计费 proj-002 — actual=75/planned=80 = 93.75% > 90% → should trigger.
        """
        resp = client.get("/api/finance/insights")
        assert resp.status_code == 200
        insights = resp.json()["insights"]
        budget_warnings = [i for i in insights if i["category"] == "budget" and i["severity"] == "warning"]
        assert len(budget_warnings) >= 1

    def test_insights_count_is_positive(self, client):
        """At least one insight is generated from the seed data."""
        resp = client.get("/api/finance/insights")
        assert resp.status_code == 200
        assert resp.json()["count"] > 0
