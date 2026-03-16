"""Rule-based HR insights engine.

Produces structured insight dicts and summary metrics from in-memory HR data.
No LLM calls — all logic is deterministic rule evaluation.
"""
from __future__ import annotations

from collections import defaultdict


# ---------------------------------------------------------------------------
# Insight generation
# ---------------------------------------------------------------------------

def generate_hr_insights(
    employees: list,
    attendance: list,
    leaves: list,
) -> list[dict]:
    """Analyse HR data and return a list of insight dicts.

    Each insight dict has keys:
        title       (str)  — short human-readable headline
        description (str)  — detail text
        severity    (str)  — "warning" | "info" | "critical"
        category    (str)  — "attendance" | "leave" | "headcount" | "hr"

    Rules applied
    -------------
    1. Employee with LATE attendance count > 3 in current month → warning
    2. Multiple employees in the same department both on approved/pending leave
       simultaneously (overlapping date ranges) → warning
    3. Department headcount imbalance: if the largest dept has >3× the headcount
       of the smallest dept → info
    4. Employee whose status is ON_LEAVE but has no APPROVED (or PENDING) leave
       request → warning (data integrity issue)
    """
    insights: list[dict] = []

    # Build lookup structures
    emp_by_id: dict[str, object] = {e.id: e for e in employees}
    emp_dept: dict[str, str] = {e.id: e.department for e in employees}

    # ------------------------------------------------------------------
    # Rule 1: Frequent late arrivals (>3 times in any calendar month)
    # ------------------------------------------------------------------
    late_counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for rec in attendance:
        if rec.status.value == "late":
            month_key = rec.date[:7]  # "YYYY-MM"
            late_counts[rec.employee_id][month_key] += 1

    for emp_id, month_map in late_counts.items():
        for month_key, count in month_map.items():
            if count > 3:
                emp = emp_by_id.get(emp_id)
                emp_name = emp.name if emp else emp_id
                insights.append({
                    "title": f"频繁迟到预警：{emp_name}",
                    "description": (
                        f"{emp_name}（{emp_dept.get(emp_id, '')}）在 {month_key} 月共迟到 {count} 次，"
                        "超过警戒阈值（3次），请HR及时跟进。"
                    ),
                    "severity": "warning",
                    "category": "attendance",
                })

    # ------------------------------------------------------------------
    # Rule 2: Simultaneous leave conflicts within the same department
    # ------------------------------------------------------------------
    # Collect approved / pending leaves per department
    dept_leaves: dict[str, list] = defaultdict(list)
    for lr in leaves:
        if lr.status.value in ("approved", "pending"):
            dept = emp_dept.get(lr.employee_id)
            if dept:
                dept_leaves[dept].append(lr)

    for dept, dept_leave_list in dept_leaves.items():
        if len(dept_leave_list) < 2:
            continue
        # Check pairwise overlaps
        reported_pairs: set[tuple[str, str]] = set()
        for i, a in enumerate(dept_leave_list):
            for b in dept_leave_list[i + 1:]:
                if a.employee_id == b.employee_id:
                    continue
                # Overlap: not (a ends before b starts OR b ends before a starts)
                if not (a.end_date < b.start_date or b.end_date < a.start_date):
                    pair_key = tuple(sorted([a.employee_id, b.employee_id]))
                    if pair_key not in reported_pairs:
                        reported_pairs.add(pair_key)
                        emp_a = emp_by_id.get(a.employee_id)
                        emp_b = emp_by_id.get(b.employee_id)
                        name_a = emp_a.name if emp_a else a.employee_id
                        name_b = emp_b.name if emp_b else b.employee_id
                        insights.append({
                            "title": f"同部门假期冲突：{dept}",
                            "description": (
                                f"{dept} 的 {name_a} 与 {name_b} 请假时间存在重叠"
                                f"（{a.start_date} ~ {a.end_date} / {b.start_date} ~ {b.end_date}），"
                                "可能影响部门正常运转，建议协调排班。"
                            ),
                            "severity": "warning",
                            "category": "leave",
                        })

    # ------------------------------------------------------------------
    # Rule 3: Department headcount imbalance (largest > 3× smallest)
    # ------------------------------------------------------------------
    dept_counts: dict[str, int] = defaultdict(int)
    for emp in employees:
        if emp.status.value != "resigned":
            dept_counts[emp.department] += 1

    if dept_counts:
        max_dept = max(dept_counts, key=lambda d: dept_counts[d])
        min_dept = min(dept_counts, key=lambda d: dept_counts[d])
        max_count = dept_counts[max_dept]
        min_count = dept_counts[min_dept]
        if max_dept != min_dept and min_count > 0 and max_count > 3 * min_count:
            insights.append({
                "title": "部门人员配置不均衡",
                "description": (
                    f"{max_dept}（{max_count}人）与 {min_dept}（{min_count}人）人员规模差距超过3倍，"
                    "建议评估是否需要跨部门资源调配或补充招聘。"
                ),
                "severity": "info",
                "category": "headcount",
            })

    # ------------------------------------------------------------------
    # Rule 4: ON_LEAVE employee with no active leave request
    # ------------------------------------------------------------------
    employees_on_leave_status = {
        e.id for e in employees if e.status.value == "on_leave"
    }
    employees_with_active_leave = {
        lr.employee_id for lr in leaves if lr.status.value in ("approved", "pending")
    }
    orphaned = employees_on_leave_status - employees_with_active_leave
    for emp_id in orphaned:
        emp = emp_by_id.get(emp_id)
        emp_name = emp.name if emp else emp_id
        insights.append({
            "title": f"假期记录缺失：{emp_name}",
            "description": (
                f"{emp_name} 的员工状态为「休假中」，但系统中未找到对应的审批通过或待审假期申请，"
                "请HR核实并补录相关记录。"
            ),
            "severity": "warning",
            "category": "hr",
        })

    return insights


# ---------------------------------------------------------------------------
# HR summary metrics
# ---------------------------------------------------------------------------

def get_hr_summary(
    employees: list,
    attendance: list,
    leaves: list,
    salary_records: list,
) -> dict:
    """Return aggregated HR metrics for the dashboard summary card.

    Keys returned
    -------------
    total_employees         int
    active_count            int
    on_leave_count          int
    resigned_count          int
    department_distribution dict[str, int]  — active + on_leave headcount per dept
    avg_salary              float           — average base salary across all employees
    attendance_rate         float           — % of NORMAL records in recent attendance data
    """
    total = len(employees)
    active_count = sum(1 for e in employees if e.status.value == "active")
    on_leave_count = sum(1 for e in employees if e.status.value == "on_leave")
    resigned_count = sum(1 for e in employees if e.status.value == "resigned")

    dept_dist: dict[str, int] = defaultdict(int)
    for emp in employees:
        if emp.status.value != "resigned":
            dept_dist[emp.department] += 1

    avg_salary = (
        sum(e.salary for e in employees) / total if total > 0 else 0.0
    )

    # Attendance rate: NORMAL / total records (exclude LEAVE as absence-equivalent)
    if attendance:
        normal_count = sum(1 for r in attendance if r.status.value == "normal")
        attendance_rate = round(normal_count / len(attendance) * 100, 1)
    else:
        attendance_rate = 100.0

    return {
        "total_employees": total,
        "active_count": active_count,
        "on_leave_count": on_leave_count,
        "resigned_count": resigned_count,
        "department_distribution": dict(dept_dist),
        "avg_salary": round(avg_salary, 2),
        "attendance_rate": attendance_rate,
    }
