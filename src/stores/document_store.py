"""In-memory document CRUD store with seed data."""

from __future__ import annotations

from src.core.models import DocumentItem

# ---------------------------------------------------------------------------
# Module-level store
# ---------------------------------------------------------------------------

_documents: dict[str, DocumentItem] = {}
_seeded: bool = False


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------


def seed_documents() -> None:
    """Populate the store with seed documents."""
    global _seeded
    if _seeded:
        return

    seed_data = [
        # ==================================================================
        # proj-001: 博物馆EPC项目 — 完整EPC资料体系
        # ==================================================================
        # 设计类
        DocumentItem(
            id="doc-001",
            title="智慧园区EPC项目全流程复盘记录_V1.2",
            doc_type="report",
            project_id="proj-001",
            category="general",
            content_summary="对博物馆EPC项目从立项到施工各阶段的经验与教训进行系统性复盘",
            version="1.2",
            author="王项目",
            status="final",
        ),
        DocumentItem(
            id="doc-101",
            title="展陈设计方案(深化版)",
            doc_type="proposal",
            project_id="proj-001",
            category="design",
            content_summary="博物馆常设展厅及临展厅展陈深化设计方案，含平面布局、展线流程、灯光设计",
            version="2.0",
            author="方设计",
            status="final",
        ),
        DocumentItem(
            id="doc-102",
            title="智能化系统施工图纸",
            doc_type="proposal",
            project_id="proj-001",
            category="design",
            content_summary="楼宇自控、安防监控、智能照明、综合布线等子系统施工图纸全套",
            version="1.5",
            author="方设计",
            status="review",
        ),
        DocumentItem(
            id="doc-103",
            title="结构加固设计变更说明",
            doc_type="proposal",
            project_id="proj-001",
            category="change",
            content_summary="二层展厅区域因展品荷载调整，结构加固方案变更说明及费用影响评估",
            version="1.0",
            author="方设计",
            status="final",
        ),
        # 施工类
        DocumentItem(
            id="doc-104",
            title="施工组织设计(总)",
            doc_type="report",
            project_id="proj-001",
            category="construction",
            content_summary="项目总施工组织设计，含总平面布置、施工进度网络计划、主要施工方案",
            version="3.0",
            author="张工",
            status="final",
        ),
        DocumentItem(
            id="doc-105",
            title="2026年3月施工日志汇总",
            doc_type="report",
            project_id="proj-001",
            category="construction",
            content_summary="3月份每日施工记录汇总，含天气、人员、机械、材料进场及施工内容",
            version="1.0",
            author="张工",
            status="final",
        ),
        # 质量类
        DocumentItem(
            id="doc-106",
            title="混凝土试块抗压强度报告",
            doc_type="report",
            project_id="proj-001",
            category="quality",
            content_summary="各层混凝土试块28天标准养护抗压强度试验报告，全部合格",
            version="1.0",
            author="赵质检",
            status="final",
        ),
        DocumentItem(
            id="doc-107",
            title="隐蔽工程验收记录(地基基础)",
            doc_type="report",
            project_id="proj-001",
            category="quality",
            content_summary="地基基础工程隐蔽验收记录表，含桩基检测报告、地基承载力试验记录",
            version="1.0",
            author="赵质检",
            status="final",
        ),
        DocumentItem(
            id="doc-108",
            title="材料进场检验台账",
            doc_type="report",
            project_id="proj-001",
            category="quality",
            content_summary="钢筋、水泥、砂石、玻璃幕墙等主要材料进场复检报告台账",
            version="1.0",
            author="刘采购",
            status="review",
        ),
        # 安全类
        DocumentItem(
            id="doc-109",
            title="安全生产专项方案(高空作业)",
            doc_type="proposal",
            project_id="proj-001",
            category="safety",
            content_summary="幕墙安装及展厅吊顶施工高空作业安全专项方案，含应急预案",
            version="1.0",
            author="王监理",
            status="final",
        ),
        DocumentItem(
            id="doc-110",
            title="2026年Q1安全检查记录",
            doc_type="report",
            project_id="proj-001",
            category="safety",
            content_summary="每周安全巡检记录汇总，3月发现2项整改项均已闭合",
            version="1.0",
            author="王监理",
            status="final",
        ),
        # 竣工类
        DocumentItem(
            id="doc-111",
            title="竣工图纸(建筑专业)",
            doc_type="report",
            project_id="proj-001",
            category="completion",
            content_summary="建筑专业竣工图纸，反映实际施工变更后的最终状态",
            version="1.0",
            author="方设计",
            status="draft",
        ),
        # 合同类
        DocumentItem(
            id="doc-112",
            title="EPC总承包合同",
            doc_type="template",
            project_id="proj-001",
            category="contract",
            content_summary="与业主签订的EPC总承包合同，含合同价、工期、质量标准及付款条件",
            version="1.0",
            author="李法务",
            status="final",
        ),
        DocumentItem(
            id="doc-113",
            title="幕墙分包合同",
            doc_type="template",
            project_id="proj-001",
            category="contract",
            content_summary="幕墙工程专业分包合同，含工程量清单、施工要求、验收标准",
            version="1.0",
            author="李法务",
            status="final",
        ),
        # 变更类
        DocumentItem(
            id="doc-114",
            title="工程变更令 GBG-007",
            doc_type="report",
            project_id="proj-001",
            category="change",
            content_summary="展厅B区展柜由定制改为标准品，减少造价约35万，工期缩短5天",
            version="1.0",
            author="张工",
            status="final",
        ),
        # ==================================================================
        # proj-002: 信息化项目 — IT项目资料（较简单）
        # ==================================================================
        DocumentItem(
            id="doc-002",
            title="发改委信息化二期技术方案",
            doc_type="proposal",
            project_id="proj-002",
            category="design",
            content_summary="信息化平台二期系统架构设计、技术选型、模块划分及实施路线规划",
            version="2.1",
            author="赵开发",
            status="review",
        ),
        DocumentItem(
            id="doc-201",
            title="需求规格说明书",
            doc_type="proposal",
            project_id="proj-002",
            category="design",
            content_summary="信息化平台功能需求、非功能需求、接口需求详细说明",
            version="3.0",
            author="武产品",
            status="final",
        ),
        DocumentItem(
            id="doc-202",
            title="测试报告(UAT)",
            doc_type="report",
            project_id="proj-002",
            category="quality",
            content_summary="用户验收测试报告，92个测试用例通过率98.9%，2个低优先级缺陷待修复",
            version="1.0",
            author="钱前端",
            status="review",
        ),
        DocumentItem(
            id="doc-203",
            title="部署运维手册",
            doc_type="report",
            project_id="proj-002",
            category="general",
            content_summary="系统部署架构、运维监控、故障排查及灾备恢复操作手册",
            version="1.0",
            author="赵开发",
            status="draft",
        ),
        # ==================================================================
        # proj-003: 咨询项目 — 简洁资料
        # ==================================================================
        DocumentItem(
            id="doc-005",
            title="智慧园区专项债可研报告(初稿)",
            doc_type="proposal",
            project_id="proj-003",
            category="general",
            content_summary="智慧园区建设项目专项债券申报可行性研究报告初稿，含项目背景、建设内容、投资估算",
            version="0.1",
            author="陈咨询",
            status="draft",
        ),
        DocumentItem(
            id="doc-301",
            title="项目投资估算表",
            doc_type="report",
            project_id="proj-003",
            category="general",
            content_summary="分项投资估算明细及资金筹措方案",
            version="1.0",
            author="陈咨询",
            status="review",
        ),
        DocumentItem(
            id="doc-302",
            title="还款来源分析报告",
            doc_type="report",
            project_id="proj-003",
            category="general",
            content_summary="项目收入预测、还款计划及偿债能力分析",
            version="0.2",
            author="陈咨询",
            status="draft",
        ),
        # ==================================================================
        # 公共模板 / 知识库文档（不属于特定项目）
        # ==================================================================
        DocumentItem(
            id="doc-003",
            title="EPC项目投标书模板",
            doc_type="template",
            project_id=None,
            category="contract",
            content_summary="适用于各类EPC总承包项目的标准化投标文件模板，含商务标、技术标及资质证明附件清单",
            version="3.0",
            author="李法务",
            status="final",
        ),
        DocumentItem(
            id="doc-004",
            title="2026年Q1项目周报汇总",
            doc_type="report",
            project_id=None,
            category="general",
            content_summary="2026年第一季度所有在建项目进度、风险、资金情况综合周报汇编",
            version="1.0",
            author="项目管理部",
            status="final",
        ),
        DocumentItem(
            id="doc-011",
            title="标准化合同模板(信息化类)",
            doc_type="template",
            project_id=None,
            category="contract",
            content_summary="适用于政府信息化项目的标准合同模板，含商务条款、技术条款、验收标准",
            version="2.0",
            author="李法务",
            status="final",
        ),
        DocumentItem(
            id="doc-012",
            title="智慧水务需求调研纪要",
            doc_type="minutes",
            project_id="proj-010",
            category="general",
            content_summary="与水务局各科室需求调研会议纪要，记录水质监测、管网监控、洪涝预警等核心需求",
            version="1.0",
            author="武产品",
            status="final",
        ),
    ]

    for document in seed_data:
        _documents[document.id] = document

    _seeded = True


# ---------------------------------------------------------------------------
# CRUD functions
# ---------------------------------------------------------------------------


def list_documents(
    project_id: str | None = None,
    doc_type: str | None = None,
    status: str | None = None,
    category: str | None = None,
) -> list[DocumentItem]:
    """Return all documents, optionally filtered."""
    documents = list(_documents.values())
    if project_id is not None:
        documents = [d for d in documents if d.project_id == project_id]
    if doc_type is not None:
        documents = [d for d in documents if d.doc_type == doc_type]
    if status is not None:
        documents = [d for d in documents if d.status == status]
    if category is not None:
        documents = [d for d in documents if d.category == category]
    return documents


def get_document(document_id: str) -> DocumentItem | None:
    """Return a single document by ID, or None if not found."""
    return _documents.get(document_id)


def create_document(document: DocumentItem) -> DocumentItem:
    """Insert a new document into the store and return it."""
    _documents[document.id] = document
    return document


def update_document(document_id: str, updates: dict) -> DocumentItem | None:
    existing = _documents.get(document_id)
    if existing is None:
        return None
    updated = existing.model_copy(update=updates)
    _documents[document_id] = updated
    return updated


def delete_document(document_id: str) -> bool:
    """Delete a document. Returns True if found and deleted."""
    return _documents.pop(document_id, None) is not None
