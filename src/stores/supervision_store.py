"""In-memory store for supervision (监理) records."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field

RecordType = Literal["patrol", "witness", "issue", "meeting"]
RecordStatus = Literal["normal", "issue", "resolved", "closed"]


class SupervisionRecord(BaseModel):
    id: str
    project_id: str
    record_type: RecordType
    title: str
    date: date
    inspector: str
    location: str
    content: str
    status: RecordStatus
    issues_found: int = 0
    photos: list[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


_store: dict[str, SupervisionRecord] = {}
_seeded: bool = False


def seed_supervision_records() -> None:
    global _seeded
    if _seeded:
        return

    records = [
        SupervisionRecord(
            id="sup-001",
            project_id="proj-001",
            record_type="patrol",
            title="基础工程日常巡视检查",
            date=date(2025, 3, 3),
            inspector="王建国",
            location="A区基础施工段",
            content="对基础钢筋绑扎工序进行巡视，钢筋间距符合设计要求，绑扎质量良好，混凝土保护层厚度达标，施工工艺规范。",
            status="normal",
            issues_found=0,
            photos=["patrol_20250303_001.jpg", "patrol_20250303_002.jpg"],
        ),
        SupervisionRecord(
            id="sup-002",
            project_id="proj-001",
            record_type="witness",
            title="地下室底板混凝土浇筑旁站",
            date=date(2025, 3, 5),
            inspector="李敏华",
            location="地下室底板区域",
            content="对地下室底板混凝土浇筑全程旁站监督，检查混凝土坍落度、浇筑顺序及振捣质量，混凝土强度等级C35，共浇筑方量320m³，浇筑过程符合规范要求。",
            status="normal",
            issues_found=0,
            photos=["witness_20250305_001.jpg"],
        ),
        SupervisionRecord(
            id="sup-003",
            project_id="proj-001",
            record_type="issue",
            title="主体结构钢筋偏位质量问题",
            date=date(2025, 3, 8),
            inspector="王建国",
            location="B区3层剪力墙",
            content="巡视发现B区3层部分剪力墙竖向钢筋偏位超出允许偏差，最大偏位达18mm，超过规范允许值10mm，已签发监理通知单要求施工单位整改。",
            status="issue",
            issues_found=3,
            photos=["issue_20250308_001.jpg", "issue_20250308_002.jpg", "issue_20250308_003.jpg"],
        ),
        SupervisionRecord(
            id="sup-004",
            project_id="proj-001",
            record_type="meeting",
            title="工程质量专题监理例会",
            date=date(2025, 3, 10),
            inspector="张志远",
            location="项目部会议室",
            content="召开质量专题例会，通报近期质量问题及整改情况，讨论下阶段施工质量控制重点，建设单位、施工单位、监理单位三方参与，形成会议纪要并签字确认。",
            status="resolved",
            issues_found=0,
            photos=[],
        ),
        SupervisionRecord(
            id="sup-005",
            project_id="proj-002",
            record_type="patrol",
            title="外墙保温施工质量巡视",
            date=date(2025, 3, 11),
            inspector="赵丽萍",
            location="C座外立面",
            content="对外墙岩棉保温板粘贴施工进行巡视，检查粘结面积、锚固件数量及间距，发现局部保温板粘结面积不足50%，要求施工单位立即整改，重新进行粘贴施工。",
            status="issue",
            issues_found=2,
            photos=["patrol_20250311_001.jpg", "patrol_20250311_002.jpg"],
        ),
        SupervisionRecord(
            id="sup-006",
            project_id="proj-002",
            record_type="witness",
            title="屋面防水层施工旁站记录",
            date=date(2025, 3, 13),
            inspector="赵丽萍",
            location="D座屋面",
            content="对屋面SBS改性沥青防水卷材施工进行旁站，检查基层处理、卷材搭接宽度（≥100mm）、热熔粘结质量及细部节点处理，施工质量符合设计及规范要求，验收合格。",
            status="normal",
            issues_found=0,
            photos=["witness_20250313_001.jpg", "witness_20250313_002.jpg"],
        ),
        SupervisionRecord(
            id="sup-007",
            project_id="proj-002",
            record_type="issue",
            title="消防管道安装质量问题整改复查",
            date=date(2025, 3, 14),
            inspector="刘海峰",
            location="B座地下室消防泵房",
            content="对前期发现的消防管道支架间距超标问题进行复查，施工单位已按整改要求增设支架，支架间距符合规范要求（水平管≤2.5m），整改到位，问题已关闭。",
            status="resolved",
            issues_found=1,
            photos=["issue_20250314_001.jpg"],
        ),
        SupervisionRecord(
            id="sup-008",
            project_id="proj-003",
            record_type="patrol",
            title="道路工程路基压实度巡视",
            date=date(2025, 3, 15),
            inspector="陈志强",
            location="市政道路K0+000至K0+500段",
            content="对市政道路路基填筑压实施工进行巡视，检查压实机械配备、压实遍数及碾压搭接宽度，现场取样送检压实度，检测结果满足设计要求（≥96%），施工质量合格。",
            status="normal",
            issues_found=0,
            photos=["patrol_20250315_001.jpg", "patrol_20250315_002.jpg", "patrol_20250315_003.jpg"],
        ),
    ]

    for record in records:
        _store[record.id] = record

    _seeded = True


def list_records(
    project_id: str | None = None,
    record_type: RecordType | None = None,
    status: RecordStatus | None = None,
) -> list[SupervisionRecord]:
    seed_supervision_records()
    results = list(_store.values())
    if project_id is not None:
        results = [r for r in results if r.project_id == project_id]
    if record_type is not None:
        results = [r for r in results if r.record_type == record_type]
    if status is not None:
        results = [r for r in results if r.status == status]
    return sorted(results, key=lambda r: r.date, reverse=True)


def get_record(record_id: str) -> SupervisionRecord | None:
    seed_supervision_records()
    return _store.get(record_id)


def create_record(data: dict) -> SupervisionRecord:
    seed_supervision_records()
    record_id = data.get("id") or f"sup-{uuid4().hex[:8]}"
    now = datetime.utcnow()
    record = SupervisionRecord(
        id=record_id,
        created_at=now,
        updated_at=now,
        **{k: v for k, v in data.items() if k not in ("id", "created_at", "updated_at")},
    )
    _store[record.id] = record
    return record


def update_record(record_id: str, updates: dict) -> SupervisionRecord | None:
    seed_supervision_records()
    existing = _store.get(record_id)
    if existing is None:
        return None
    updated_data = existing.model_dump()
    for key, value in updates.items():
        if key not in ("id", "created_at") and value is not None:
            updated_data[key] = value
    updated_data["updated_at"] = datetime.utcnow()
    updated = SupervisionRecord(**updated_data)
    _store[record.id if (record := updated) else record_id] = updated
    _store[record_id] = updated
    return updated


def get_supervision_summary(project_id: str | None = None) -> dict:
    seed_supervision_records()
    records = list_records(project_id=project_id)

    today = date.today()
    current_month_records = [r for r in records if r.date.year == today.year and r.date.month == today.month]

    total = len(records)
    issues_open = sum(1 for r in records if r.status == "issue")
    issues_resolved = sum(1 for r in records if r.status == "resolved")
    issues_closed = sum(1 for r in records if r.status == "closed")
    inspections_this_month = len([r for r in current_month_records if r.record_type in ("patrol", "witness")])
    total_issues_found = sum(r.issues_found for r in records)

    by_type: dict[str, int] = {}
    for r in records:
        by_type[r.record_type] = by_type.get(r.record_type, 0) + 1

    return {
        "total": total,
        "issues_open": issues_open,
        "issues_resolved": issues_resolved,
        "issues_closed": issues_closed,
        "inspections_this_month": inspections_this_month,
        "total_issues_found": total_issues_found,
        "by_type": by_type,
    }
