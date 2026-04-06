"""In-memory process record CRUD store with seed data."""

from __future__ import annotations

from src.core.models import ProcessRecord, ProcessRecordType

# ---------------------------------------------------------------------------
# Module-level store
# ---------------------------------------------------------------------------

_records: dict[str, ProcessRecord] = {}
_seeded: bool = False


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------


def seed_processes() -> None:
    """Populate the store with seed process records for EPC projects."""
    global _seeded
    if _seeded:
        return

    seed_data = [
        # proj-001: 省立博物馆EPC工程
        ProcessRecord(
            id="prec-001",
            project_id="proj-001",
            record_type=ProcessRecordType.DAILY_LOG,
            title="A区幕墙安装进度",
            date="2026-03-12",
            author="陈施工",
            content="今日完成A区3-5层幕墙龙骨安装，共计安装铝合金龙骨48根。下午进行玻璃面板试装2块，效果良好。明日计划继续6-8层龙骨安装。",
            status="normal",
            related_stage="construction",
        ),
        ProcessRecord(
            id="prec-002",
            project_id="proj-001",
            record_type=ProcessRecordType.QUALITY_CHECK,
            title="B区钢结构焊接质量抽检",
            date="2026-03-10",
            author="王监理",
            content="对B区二层钢结构焊接节点进行抽检，共抽查20个焊接点。发现3处焊缝存在气孔缺陷，不合格率15%，超出5%允许范围。已要求施工单位整改并复检。",
            status="issue",
            related_stage="construction",
        ),
        ProcessRecord(
            id="prec-003",
            project_id="proj-001",
            record_type=ProcessRecordType.MATERIAL_ENTRY,
            title="Low-E玻璃第三批到货验收",
            date="2026-03-11",
            author="刘采购",
            content="第三批Low-E中空玻璃到场120片，规格2400x1500mm。外观检查合格，抽取5片送检。厚度、透光率、遮阳系数均符合设计要求。验收合格入库。",
            status="normal",
            related_stage="construction",
        ),
        ProcessRecord(
            id="prec-004",
            project_id="proj-001",
            record_type=ProcessRecordType.HIDDEN_WORK,
            title="C区预埋件验收",
            date="2026-03-08",
            author="王监理",
            content="C区一层幕墙预埋件隐蔽工程验收。共计验收预埋件86个，位置偏差均在允许范围内(±10mm)，锚固深度满足设计要求。验收合格，可进行后续幕墙安装。",
            status="normal",
            related_stage="construction",
        ),
        ProcessRecord(
            id="prec-005",
            project_id="proj-001",
            record_type=ProcessRecordType.SAFETY_CHECK,
            title="高空作业安全专项检查",
            date="2026-03-09",
            author="陈施工",
            content="对幕墙安装高空作业区域进行安全检查。检查内容：脚手架搭设、安全网、防坠落装置、个人防护用品佩戴。发现2名工人未正确系挂安全带，已当场纠正并进行安全教育。",
            status="normal",
            related_stage="construction",
        ),
        # proj-006: 老旧小区改造EPC
        ProcessRecord(
            id="prec-006",
            project_id="proj-006",
            record_type=ProcessRecordType.DAILY_LOG,
            title="管网接通施工记录",
            date="2026-01-15",
            author="蒋施工",
            content="完成B区生活给水管网与市政管网接通作业。接口采用法兰连接，打压测试1.5MPa保持30分钟无渗漏。同步完成污水管网接通。",
            status="normal",
            related_stage="construction",
        ),
        ProcessRecord(
            id="prec-007",
            project_id="proj-006",
            record_type=ProcessRecordType.SAFETY_CHECK,
            title="深基坑作业安全检查",
            date="2026-01-10",
            author="尤安全",
            content="对管网施工深基坑(深度2.5m)进行安全检查。支护系统完好，排水设施正常运行，临边防护到位。发现局部坑壁有裂缝迹象，已安排监测并加密观测频次。",
            status="issue",
            related_stage="construction",
        ),
        ProcessRecord(
            id="prec-008",
            project_id="proj-006",
            record_type=ProcessRecordType.INSPECTION,
            title="外墙保温施工巡检",
            date="2026-01-12",
            author="沈监理",
            content="巡检A栋外墙保温施工。保温板粘贴平整，锚固钉数量符合规范要求(每平米6个)。网格布搭接长度满足100mm要求。整体施工质量良好。",
            status="normal",
            related_stage="construction",
        ),
    ]

    for record in seed_data:
        _records[record.id] = record

    _seeded = True


# ---------------------------------------------------------------------------
# CRUD functions
# ---------------------------------------------------------------------------


def list_by_project(
    project_id: str,
    record_type: str | None = None,
) -> list[ProcessRecord]:
    """Return all process records for a project, optionally filtered by type."""
    records = [r for r in _records.values() if r.project_id == project_id]
    if record_type is not None:
        records = [r for r in records if r.record_type == record_type or r.record_type.value == record_type]
    return sorted(records, key=lambda r: r.date, reverse=True)


def get(record_id: str) -> ProcessRecord | None:
    """Return a single process record by ID."""
    return _records.get(record_id)


def create(project_id: str, data: dict) -> ProcessRecord:
    """Create a new process record."""
    record = ProcessRecord(project_id=project_id, **data)
    _records[record.id] = record
    return record


def update(record_id: str, updates: dict) -> ProcessRecord | None:
    """Apply updates to an existing process record."""
    existing = _records.get(record_id)
    if existing is None:
        return None
    updated = existing.model_copy(update=updates)
    _records[record_id] = updated
    return updated
