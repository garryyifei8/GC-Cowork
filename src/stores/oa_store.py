"""In-memory OA CRUD store with seed data.

Manages notices and vehicle requests.
"""
from __future__ import annotations

from uuid import uuid4

from src.core.models import (
    ApprovalStatus,
    Notice,
    NoticeType,
    VehicleRequest,
)

# ---------------------------------------------------------------------------
# Module-level stores
# ---------------------------------------------------------------------------

_notices: dict[str, Notice] = {}
_vehicle_requests: dict[str, VehicleRequest] = {}

_seeded: bool = False


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

def seed_oa() -> None:
    """Populate OA stores with realistic demo data."""
    global _seeded
    if _seeded:
        return

    # ------------------------------------------------------------------
    # Notices
    # ------------------------------------------------------------------
    notices_raw = [
        Notice(
            id="notice-001",
            title="系统维护通知",
            content="系统将于2026年3月15日22:00-24:00进行例行维护升级，届时平台将暂停服务，请提前保存工作。",
            type=NoticeType.SYSTEM,
        ),
        Notice(
            id="notice-002",
            title="关于清明节放假安排的通知",
            content="根据国务院办公厅通知精神，2026年清明节放假安排如下：4月4日至4月6日放假调休，共3天。4月7日（星期二）上班。请各部门提前安排好工作。",
            type=NoticeType.ANNOUNCEMENT,
        ),
        Notice(
            id="notice-003",
            title="您的年假申请已通过",
            content="您提交的2026年2月20日-21日年假申请已由王总审批通过，共2天。",
            type=NoticeType.APPROVAL_RESULT,
            target_user="emp-001",
            is_read=True,
        ),
        Notice(
            id="notice-004",
            title="报销单EXP-003已打款",
            content="您提交的差旅报销单（金额¥2,850.00）已完成财务打款，请查收。",
            type=NoticeType.APPROVAL_RESULT,
            target_user="emp-001",
        ),
        Notice(
            id="notice-005",
            title="新员工入职培训通知",
            content="定于2026年3月20日上午9:00在3楼会议室举办新员工入职培训，请相关部门负责人安排新员工准时参加。培训内容包括：公司制度、安全规范、系统使用指南。",
            type=NoticeType.ANNOUNCEMENT,
        ),
        Notice(
            id="notice-006",
            title="3月考勤异常提醒",
            content="系统检测到您本月有1次迟到记录（3月3日），请注意考勤规范。如有特殊情况请及时提交补卡申请。",
            type=NoticeType.SYSTEM,
            target_user="emp-007",
        ),
        Notice(
            id="notice-007",
            title="项目周报提交提醒",
            content="本周五（3月14日）17:00前请提交本周项目进展周报，逾期将影响绩效考核。",
            type=NoticeType.SYSTEM,
        ),
    ]
    for n in notices_raw:
        _notices[n.id] = n

    # ------------------------------------------------------------------
    # Vehicle requests
    # ------------------------------------------------------------------
    vehicle_data = [
        VehicleRequest(
            id="veh-001",
            applicant="emp-001",
            date="2026-03-10",
            origin="公司总部",
            destination="发改委",
            reason="项目汇报材料提交",
            status=ApprovalStatus.APPROVED,
            approver="王总",
        ),
        VehicleRequest(
            id="veh-002",
            applicant="emp-004",
            date="2026-03-14",
            origin="公司总部",
            destination="博物馆项目现场",
            reason="现场技术支持",
            status=ApprovalStatus.PENDING,
        ),
        VehicleRequest(
            id="veh-003",
            applicant="emp-001",
            date="2026-03-18",
            origin="公司总部",
            destination="市住建局",
            reason="专项债咨询对接会议",
            status=ApprovalStatus.PENDING,
        ),
    ]
    for vr in vehicle_data:
        _vehicle_requests[vr.id] = vr

    _seeded = True


# ---------------------------------------------------------------------------
# Notice CRUD
# ---------------------------------------------------------------------------

def list_notices(
    target_user: str | None = None,
    notice_type: str | None = None,
    is_read: bool | None = None,
) -> list[Notice]:
    """Return notices with optional filters. Broadcasts (target_user=None) included for all users."""
    result = list(_notices.values())
    if target_user is not None:
        result = [n for n in result if n.target_user is None or n.target_user == target_user]
    if notice_type is not None:
        result = [n for n in result if (n.type.value if hasattr(n.type, 'value') else n.type) == notice_type]
    if is_read is not None:
        result = [n for n in result if n.is_read == is_read]
    return sorted(result, key=lambda n: n.created_at, reverse=True)


def get_notice(notice_id: str) -> Notice | None:
    return _notices.get(notice_id)


def create_notice(data: dict) -> Notice:
    if "id" not in data:
        data = {**data, "id": str(uuid4())}
    notice = Notice(**data)
    _notices[notice.id] = notice
    return notice


def update_notice(notice_id: str, data: dict) -> Notice | None:
    existing = _notices.get(notice_id)
    if existing is None:
        return None
    updated = existing.model_copy(update=data)
    _notices[notice_id] = updated
    return updated


# ---------------------------------------------------------------------------
# Vehicle Request CRUD
# ---------------------------------------------------------------------------

def list_vehicle_requests(
    applicant: str | None = None,
    status: str | None = None,
) -> list[VehicleRequest]:
    result = list(_vehicle_requests.values())
    if applicant is not None:
        result = [v for v in result if v.applicant == applicant]
    if status is not None:
        result = [v for v in result if (v.status.value if hasattr(v.status, 'value') else v.status) == status]
    return sorted(result, key=lambda v: v.created_at, reverse=True)


def get_vehicle_request(request_id: str) -> VehicleRequest | None:
    return _vehicle_requests.get(request_id)


def create_vehicle_request(data: dict) -> VehicleRequest:
    if "id" not in data:
        data = {**data, "id": str(uuid4())}
    vr = VehicleRequest(**data)
    _vehicle_requests[vr.id] = vr
    return vr


def update_vehicle_request(request_id: str, data: dict) -> VehicleRequest | None:
    existing = _vehicle_requests.get(request_id)
    if existing is None:
        return None
    updated = existing.model_copy(update=data)
    _vehicle_requests[request_id] = updated
    return updated
