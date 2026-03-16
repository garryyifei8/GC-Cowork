"""
HR REST API endpoints.

GET    /api/hr/employees                — list employees (?department= &status=)
GET    /api/hr/employees/{id}          — employee detail
POST   /api/hr/employees               — create employee
PATCH  /api/hr/employees/{id}          — update employee

GET    /api/hr/attendance              — list attendance (?employee_id= &date_from= &date_to=)
POST   /api/hr/attendance              — create attendance record

GET    /api/hr/leaves                  — list leave requests (?employee_id= &status=)
POST   /api/hr/leaves                  — create leave request
PATCH  /api/hr/leaves/{id}            — approve / reject leave

GET    /api/hr/salary                  — list salary records (?employee_id= &month=)

GET    /api/hr/summary                 — HR summary metrics
GET    /api/hr/insights                — rule-based HR insights
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.services.hr_insights import generate_hr_insights, get_hr_summary
from src.stores.hr_store import (
    create_attendance,
    create_employee,
    create_leave_request,
    create_salary_record,
    get_employee,
    list_attendance,
    list_employees,
    list_leave_requests,
    list_salary_records,
    update_employee,
    update_leave_request,
)

router = APIRouter(prefix="/hr", tags=["hr"])


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class EmployeeListItem(BaseModel):
    id: str
    name: str
    department: str
    position: str
    hire_date: str
    salary: float
    status: str
    phone: str
    email: str


class CreateEmployeeRequest(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    department: str = Field(min_length=1, max_length=64)
    position: str = Field(min_length=1, max_length=64)
    hire_date: str
    salary: float = Field(gt=0)
    status: str = "active"
    phone: str = ""
    email: str = ""
    emergency_contact: str = ""


class UpdateEmployeeRequest(BaseModel):
    name: str | None = None
    department: str | None = None
    position: str | None = None
    salary: float | None = None
    status: str | None = None
    phone: str | None = None
    email: str | None = None
    emergency_contact: str | None = None


class AttendanceListItem(BaseModel):
    id: str
    employee_id: str
    date: str
    check_in: str | None
    check_out: str | None
    status: str


class CreateAttendanceRequest(BaseModel):
    employee_id: str
    date: str
    check_in: str | None = None
    check_out: str | None = None
    status: str = "normal"


class LeaveListItem(BaseModel):
    id: str
    employee_id: str
    leave_type: str
    start_date: str
    end_date: str
    days: float
    reason: str
    status: str
    approver: str | None


class CreateLeaveRequest(BaseModel):
    employee_id: str
    leave_type: str
    start_date: str
    end_date: str
    days: float = Field(gt=0)
    reason: str = ""


class UpdateLeaveRequest(BaseModel):
    status: str | None = None
    approver: str | None = None


class SalaryListItem(BaseModel):
    id: str
    employee_id: str
    month: str
    base_salary: float
    overtime_pay: float
    bonus: float
    deductions: float
    social_insurance: float
    tax: float
    net_salary: float


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _enum_val(v) -> str:
    """Safely extract enum value — handles both Enum and plain str after model_copy."""
    return v.value if hasattr(v, "value") else str(v)


def _to_employee_item(emp) -> EmployeeListItem:
    return EmployeeListItem(
        id=emp.id,
        name=emp.name,
        department=emp.department,
        position=emp.position,
        hire_date=emp.hire_date,
        salary=emp.salary,
        status=_enum_val(emp.status),
        phone=emp.phone,
        email=emp.email,
    )


def _to_attendance_item(rec) -> AttendanceListItem:
    return AttendanceListItem(
        id=rec.id,
        employee_id=rec.employee_id,
        date=rec.date,
        check_in=rec.check_in,
        check_out=rec.check_out,
        status=_enum_val(rec.status),
    )


def _to_leave_item(lr) -> LeaveListItem:
    return LeaveListItem(
        id=lr.id,
        employee_id=lr.employee_id,
        leave_type=_enum_val(lr.leave_type),
        start_date=lr.start_date,
        end_date=lr.end_date,
        days=lr.days,
        reason=lr.reason,
        status=_enum_val(lr.status),
        approver=lr.approver,
    )


def _to_salary_item(rec) -> SalaryListItem:
    return SalaryListItem(
        id=rec.id,
        employee_id=rec.employee_id,
        month=rec.month,
        base_salary=rec.base_salary,
        overtime_pay=rec.overtime_pay,
        bonus=rec.bonus,
        deductions=rec.deductions,
        social_insurance=rec.social_insurance,
        tax=rec.tax,
        net_salary=rec.net_salary,
    )


# ---------------------------------------------------------------------------
# Employee endpoints
# ---------------------------------------------------------------------------


@router.get("/employees", response_model=list[EmployeeListItem])
async def list_employees_endpoint(
    department: str | None = None,
    status: str | None = None,
):
    employees = list_employees(department=department, status=status)
    return [_to_employee_item(e) for e in employees]


@router.get("/employees/{employee_id}", response_model=EmployeeListItem)
async def get_employee_endpoint(employee_id: str):
    emp = get_employee(employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")
    return _to_employee_item(emp)


@router.post("/employees", response_model=EmployeeListItem, status_code=201)
async def create_employee_endpoint(req: CreateEmployeeRequest):
    emp = create_employee(req.model_dump())
    return _to_employee_item(emp)


@router.patch("/employees/{employee_id}", response_model=EmployeeListItem)
async def update_employee_endpoint(employee_id: str, req: UpdateEmployeeRequest):
    updates = req.model_dump(exclude_none=True)
    updated = update_employee(employee_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Employee {employee_id} not found")
    return _to_employee_item(updated)


# ---------------------------------------------------------------------------
# Attendance endpoints
# ---------------------------------------------------------------------------


@router.get("/attendance", response_model=list[AttendanceListItem])
async def list_attendance_endpoint(
    employee_id: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
):
    records = list_attendance(
        employee_id=employee_id,
        date_from=date_from,
        date_to=date_to,
    )
    return [_to_attendance_item(r) for r in records]


@router.post("/attendance", response_model=AttendanceListItem, status_code=201)
async def create_attendance_endpoint(req: CreateAttendanceRequest):
    record = create_attendance(req.model_dump())
    return _to_attendance_item(record)


# ---------------------------------------------------------------------------
# Leave request endpoints
# ---------------------------------------------------------------------------


@router.get("/leaves", response_model=list[LeaveListItem])
async def list_leaves_endpoint(
    employee_id: str | None = None,
    status: str | None = None,
):
    leaves = list_leave_requests(employee_id=employee_id, status=status)
    return [_to_leave_item(lr) for lr in leaves]


@router.post("/leaves", response_model=LeaveListItem, status_code=201)
async def create_leave_endpoint(req: CreateLeaveRequest):
    lr = create_leave_request(req.model_dump())
    return _to_leave_item(lr)


@router.patch("/leaves/{leave_id}", response_model=LeaveListItem)
async def update_leave_endpoint(leave_id: str, req: UpdateLeaveRequest):
    updates = req.model_dump(exclude_none=True)
    updated = update_leave_request(leave_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Leave request {leave_id} not found")
    return _to_leave_item(updated)


# ---------------------------------------------------------------------------
# Salary endpoints
# ---------------------------------------------------------------------------


@router.get("/salary", response_model=list[SalaryListItem])
async def list_salary_endpoint(
    employee_id: str | None = None,
    month: str | None = None,
):
    records = list_salary_records(employee_id=employee_id, month=month)
    return [_to_salary_item(r) for r in records]


# ---------------------------------------------------------------------------
# Summary & Insights
# ---------------------------------------------------------------------------


@router.get("/summary")
async def hr_summary_endpoint():
    """Return aggregated HR metrics: headcounts, department distribution, avg salary, attendance rate."""
    employees = list_employees()
    attendance = list_attendance()
    leaves = list_leave_requests()
    salary_records = list_salary_records()
    return get_hr_summary(employees, attendance, leaves, salary_records)


@router.get("/insights")
async def hr_insights_endpoint():
    """Return rule-based HR insights covering attendance, leave conflicts, and headcount balance."""
    employees = list_employees()
    attendance = list_attendance()
    leaves = list_leave_requests()
    insights = generate_hr_insights(employees, attendance, leaves)
    return {"insights": insights, "total": len(insights)}
