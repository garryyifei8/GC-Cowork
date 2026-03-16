"""In-memory HR CRUD store with seed data.

Manages employees, attendance records, leave requests, and salary records.
"""
from __future__ import annotations

from uuid import uuid4

from src.core.models import (
    ApprovalStatus,
    AttendanceRecord,
    AttendanceStatus,
    Employee,
    EmployeeStatus,
    LeaveRequest,
    LeaveType,
    SalaryRecord,
)

# ---------------------------------------------------------------------------
# Module-level stores
# ---------------------------------------------------------------------------

_employees: dict[str, Employee] = {}
_attendance: dict[str, AttendanceRecord] = {}
_leave_requests: dict[str, LeaveRequest] = {}
_salary_records: dict[str, SalaryRecord] = {}

_seeded: bool = False


# ---------------------------------------------------------------------------
# Salary calculation helper
# ---------------------------------------------------------------------------

def _calc_net(base: float, overtime: float, bonus: float, deductions: float,
              social: float, tax: float) -> float:
    return round(base + overtime + bonus - deductions - social - tax, 2)


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

def seed_hr() -> None:
    """Populate all HR stores with realistic demo data."""
    global _seeded
    if _seeded:
        return

    # ------------------------------------------------------------------
    # 10 Employees
    # ------------------------------------------------------------------
    employees_raw = [
        dict(
            id="emp-001", name="张工", department="工程部", position="项目经理",
            salary=18000.0, hire_date="2023-03-01", status=EmployeeStatus.ACTIVE,
            phone="13800000001", email="zhang.gong@cowork.com",
        ),
        dict(
            id="emp-002", name="李设计", department="设计部", position="主任设计师",
            salary=15000.0, hire_date="2023-06-15", status=EmployeeStatus.ACTIVE,
            phone="13800000002", email="li.sheji@cowork.com",
        ),
        dict(
            id="emp-003", name="刘采购", department="采购部", position="采购主管",
            salary=12000.0, hire_date="2024-01-10", status=EmployeeStatus.ACTIVE,
            phone="13800000003", email="liu.caigou@cowork.com",
        ),
        dict(
            id="emp-004", name="赵开发", department="开发部", position="高级开发",
            salary=20000.0, hire_date="2022-09-01", status=EmployeeStatus.ACTIVE,
            phone="13800000004", email="zhao.kaifa@cowork.com",
        ),
        dict(
            id="emp-005", name="陈咨询", department="咨询部", position="高级顾问",
            salary=16000.0, hire_date="2023-11-20", status=EmployeeStatus.ON_LEAVE,
            phone="13800000005", email="chen.zixun@cowork.com",
        ),
        dict(
            id="emp-006", name="林财务", department="财务部", position="财务经理",
            salary=14000.0, hire_date="2024-04-01", status=EmployeeStatus.ACTIVE,
            phone="13800000006", email="lin.caiwu@cowork.com",
        ),
        dict(
            id="emp-007", name="钱前端", department="开发部", position="前端工程师",
            salary=15000.0, hire_date="2024-07-15", status=EmployeeStatus.ACTIVE,
            phone="13800000007", email="qian.qianduan@cowork.com",
        ),
        dict(
            id="emp-008", name="王监理", department="工程部", position="总监理",
            salary=22000.0, hire_date="2022-01-15", status=EmployeeStatus.ACTIVE,
            phone="13800000008", email="wang.jianli@cowork.com",
        ),
        dict(
            id="emp-009", name="周运维", department="运维部", position="运维工程师",
            salary=13000.0, hire_date="2024-10-01", status=EmployeeStatus.ACTIVE,
            phone="13800000009", email="zhou.yunwei@cowork.com",
        ),
        dict(
            id="emp-010", name="吴产品", department="产品部", position="产品经理",
            salary=16000.0, hire_date="2023-08-01", status=EmployeeStatus.ACTIVE,
            phone="13800000010", email="wu.chanpin@cowork.com",
        ),
    ]
    for raw in employees_raw:
        emp = Employee(**raw)
        _employees[emp.id] = emp

    # ------------------------------------------------------------------
    # ~20 Attendance records for 2026-03 (dates 01-10)
    # Pattern: most NORMAL, 2-3 LATE, 1 LEAVE
    # ------------------------------------------------------------------
    attendance_data = [
        # date 01 — all 5 sampled employees normal
        ("emp-001", "2026-03-02", "08:52", "18:10", AttendanceStatus.NORMAL),
        ("emp-002", "2026-03-02", "08:58", "18:05", AttendanceStatus.NORMAL),
        ("emp-003", "2026-03-02", "09:02", "18:00", AttendanceStatus.LATE),
        ("emp-004", "2026-03-02", "08:45", "19:30", AttendanceStatus.NORMAL),
        ("emp-006", "2026-03-02", "08:50", "18:00", AttendanceStatus.NORMAL),
        # date 03
        ("emp-001", "2026-03-03", "08:55", "18:15", AttendanceStatus.NORMAL),
        ("emp-004", "2026-03-03", "08:40", "20:00", AttendanceStatus.NORMAL),
        ("emp-007", "2026-03-03", "09:15", "18:00", AttendanceStatus.LATE),
        ("emp-008", "2026-03-03", "08:30", "18:30", AttendanceStatus.NORMAL),
        ("emp-010", "2026-03-03", "08:58", "18:05", AttendanceStatus.NORMAL),
        # date 04
        ("emp-001", "2026-03-04", "08:50", "18:20", AttendanceStatus.NORMAL),
        ("emp-002", "2026-03-04", "09:20", "18:00", AttendanceStatus.LATE),
        ("emp-006", "2026-03-04", "08:55", "18:00", AttendanceStatus.NORMAL),
        ("emp-009", "2026-03-04", "08:48", "18:10", AttendanceStatus.NORMAL),
        # date 05
        ("emp-003", "2026-03-05", "08:58", "18:05", AttendanceStatus.NORMAL),
        ("emp-004", "2026-03-05", "08:42", "19:00", AttendanceStatus.NORMAL),
        ("emp-007", "2026-03-05", None, None, AttendanceStatus.LEAVE),
        # date 06
        ("emp-008", "2026-03-06", "08:35", "18:30", AttendanceStatus.NORMAL),
        ("emp-010", "2026-03-06", "08:55", "18:00", AttendanceStatus.NORMAL),
        # date 07 (emp-005 on leave, no check-in)
        ("emp-001", "2026-03-07", "08:53", "18:10", AttendanceStatus.NORMAL),
        ("emp-002", "2026-03-07", "08:57", "18:00", AttendanceStatus.NORMAL),
    ]
    for emp_id, date, check_in, check_out, status in attendance_data:
        record = AttendanceRecord(
            id=f"att-{emp_id}-{date}",
            employee_id=emp_id,
            date=date,
            check_in=check_in,
            check_out=check_out,
            status=status,
        )
        _attendance[record.id] = record

    # ------------------------------------------------------------------
    # 4 Leave requests
    # ------------------------------------------------------------------
    leave_data = [
        LeaveRequest(
            id="leave-001",
            employee_id="emp-007",
            leave_type=LeaveType.PERSONAL,
            start_date="2026-03-05",
            end_date="2026-03-05",
            days=1.0,
            reason="个人事务处理",
            status=ApprovalStatus.PENDING,
        ),
        LeaveRequest(
            id="leave-002",
            employee_id="emp-001",
            leave_type=LeaveType.ANNUAL,
            start_date="2026-02-20",
            end_date="2026-02-21",
            days=2.0,
            reason="年假",
            status=ApprovalStatus.APPROVED,
            approver="王总",
        ),
        LeaveRequest(
            id="leave-003",
            employee_id="emp-005",
            leave_type=LeaveType.SICK,
            start_date="2026-03-01",
            end_date="2026-03-14",
            days=10.0,
            reason="病假就医",
            status=ApprovalStatus.APPROVED,
            approver="王总",
        ),
        LeaveRequest(
            id="leave-004",
            employee_id="emp-003",
            leave_type=LeaveType.PERSONAL,
            start_date="2026-03-10",
            end_date="2026-03-12",
            days=3.0,
            reason="家庭事务",
            status=ApprovalStatus.REJECTED,
            approver="王总",
        ),
    ]
    for lr in leave_data:
        _leave_requests[lr.id] = lr

    # ------------------------------------------------------------------
    # Salary records: 3 months × 10 employees
    # net_salary = base + overtime + bonus - deductions - social - tax
    # ------------------------------------------------------------------
    # (emp_id, base, overtime, bonus, deductions, social, tax)
    salary_templates = {
        "emp-001": (18000, 800,  1500, 500, 2400, 2200),
        "emp-002": (15000, 500,  1000, 500, 2000, 1600),
        "emp-003": (12000, 300,   500, 500, 1800, 1100),
        "emp-004": (20000, 1200, 2000, 500, 2600, 2800),
        "emp-005": (16000, 600,  1200, 500, 2200, 1900),
        "emp-006": (14000, 400,   800, 500, 2000, 1500),
        "emp-007": (15000, 500,   800, 500, 2000, 1600),
        "emp-008": (22000, 1500, 2500, 500, 2800, 3200),
        "emp-009": (13000, 400,   600, 500, 1900, 1300),
        "emp-010": (16000, 600,  1000, 500, 2200, 1900),
    }

    months = ["2026-01", "2026-02", "2026-03"]
    for month in months:
        for emp_id, (base, overtime, bonus, deductions, social, tax) in salary_templates.items():
            net = _calc_net(base, overtime, bonus, deductions, social, tax)
            record = SalaryRecord(
                id=f"sal-{emp_id}-{month}",
                employee_id=emp_id,
                month=month,
                base_salary=float(base),
                overtime_pay=float(overtime),
                bonus=float(bonus),
                deductions=float(deductions),
                social_insurance=float(social),
                tax=float(tax),
                net_salary=net,
            )
            _salary_records[record.id] = record

    _seeded = True


# ---------------------------------------------------------------------------
# Employee CRUD
# ---------------------------------------------------------------------------

def list_employees(
    department: str | None = None,
    status: str | None = None,
) -> list[Employee]:
    """Return employees, optionally filtered by department and/or status."""
    result = list(_employees.values())
    if department is not None:
        result = [e for e in result if e.department == department]
    if status is not None:
        result = [e for e in result if e.status.value == status]
    return result


def get_employee(employee_id: str) -> Employee | None:
    """Return a single employee by ID, or None if not found."""
    return _employees.get(employee_id)


def create_employee(data: dict) -> Employee:
    """Create a new employee from a dict payload and persist it."""
    if "id" not in data:
        data = {**data, "id": str(uuid4())}
    emp = Employee(**data)
    _employees[emp.id] = emp
    return emp


def update_employee(employee_id: str, data: dict) -> Employee | None:
    """Apply partial updates to an existing employee.

    Returns None if the employee does not exist.
    """
    existing = _employees.get(employee_id)
    if existing is None:
        return None
    updated = existing.model_copy(update=data)
    _employees[employee_id] = updated
    return updated


# ---------------------------------------------------------------------------
# Attendance CRUD
# ---------------------------------------------------------------------------

def list_attendance(
    employee_id: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
) -> list[AttendanceRecord]:
    """Return attendance records with optional filters."""
    result = list(_attendance.values())
    if employee_id is not None:
        result = [r for r in result if r.employee_id == employee_id]
    if date_from is not None:
        result = [r for r in result if r.date >= date_from]
    if date_to is not None:
        result = [r for r in result if r.date <= date_to]
    return sorted(result, key=lambda r: (r.date, r.employee_id))


def create_attendance(data: dict) -> AttendanceRecord:
    """Create a new attendance record from a dict payload."""
    if "id" not in data:
        data = {**data, "id": str(uuid4())}
    record = AttendanceRecord(**data)
    _attendance[record.id] = record
    return record


# ---------------------------------------------------------------------------
# Leave Request CRUD
# ---------------------------------------------------------------------------

def list_leave_requests(
    employee_id: str | None = None,
    status: str | None = None,
) -> list[LeaveRequest]:
    """Return leave requests with optional filters."""
    result = list(_leave_requests.values())
    if employee_id is not None:
        result = [r for r in result if r.employee_id == employee_id]
    if status is not None:
        result = [r for r in result if r.status.value == status]
    return result


def create_leave_request(data: dict) -> LeaveRequest:
    """Create a new leave request from a dict payload."""
    if "id" not in data:
        data = {**data, "id": str(uuid4())}
    lr = LeaveRequest(**data)
    _leave_requests[lr.id] = lr
    return lr


def update_leave_request(leave_id: str, data: dict) -> LeaveRequest | None:
    """Apply partial updates to a leave request (e.g. approve/reject).

    Returns None if not found.
    """
    existing = _leave_requests.get(leave_id)
    if existing is None:
        return None
    updated = existing.model_copy(update=data)
    _leave_requests[leave_id] = updated
    return updated


# ---------------------------------------------------------------------------
# Salary Record CRUD
# ---------------------------------------------------------------------------

def list_salary_records(
    employee_id: str | None = None,
    month: str | None = None,
) -> list[SalaryRecord]:
    """Return salary records with optional filters."""
    result = list(_salary_records.values())
    if employee_id is not None:
        result = [r for r in result if r.employee_id == employee_id]
    if month is not None:
        result = [r for r in result if r.month == month]
    return sorted(result, key=lambda r: (r.month, r.employee_id))


def create_salary_record(data: dict) -> SalaryRecord:
    """Create a new salary record from a dict payload.

    Automatically computes net_salary if not provided.
    """
    if "id" not in data:
        data = {**data, "id": str(uuid4())}
    if "net_salary" not in data or data.get("net_salary") == 0:
        data["net_salary"] = _calc_net(
            data.get("base_salary", 0),
            data.get("overtime_pay", 0),
            data.get("bonus", 0),
            data.get("deductions", 0),
            data.get("social_insurance", 0),
            data.get("tax", 0),
        )
    record = SalaryRecord(**data)
    _salary_records[record.id] = record
    return record
