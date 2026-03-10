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
        DocumentItem(
            id="doc-001",
            title="智慧园区EPC项目全流程复盘记录_V1.2",
            doc_type="report",
            project_id="proj-001",
            content_summary="对博物馆EPC项目从立项到施工各阶段的经验与教训进行系统性复盘，形成可复用的项目管理知识资产",
            version="1.2",
            author="王项目",
            status="final",
        ),
        DocumentItem(
            id="doc-002",
            title="发改委信息化二期技术方案",
            doc_type="proposal",
            project_id="proj-002",
            content_summary="信息化平台二期系统架构设计、技术选型、模块划分及实施路线规划",
            version="2.1",
            author="赵开发",
            status="review",
        ),
        DocumentItem(
            id="doc-003",
            title="EPC项目投标书模板",
            doc_type="template",
            project_id=None,
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
            content_summary="2026年第一季度所有在建项目进度、风险、资金情况综合周报汇编",
            version="1.0",
            author="项目管理部",
            status="final",
        ),
        DocumentItem(
            id="doc-005",
            title="智慧园区专项债可研报告(初稿)",
            doc_type="proposal",
            project_id="proj-003",
            content_summary="智慧园区建设项目专项债券申报可行性研究报告初稿，含项目背景、建设内容、投资估算及还款来源分析",
            version="0.1",
            author="陈咨询",
            status="draft",
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
) -> list[DocumentItem]:
    """Return all documents, optionally filtered by project, type, or status."""
    documents = list(_documents.values())
    if project_id is not None:
        documents = [d for d in documents if d.project_id == project_id]
    if doc_type is not None:
        documents = [d for d in documents if d.doc_type == doc_type]
    if status is not None:
        documents = [d for d in documents if d.status == status]
    return documents


def get_document(document_id: str) -> DocumentItem | None:
    """Return a single document by ID, or None if not found."""
    return _documents.get(document_id)


def create_document(document: DocumentItem) -> DocumentItem:
    """Insert a new document into the store and return it."""
    _documents[document.id] = document
    return document


def update_document(document_id: str, updates: dict) -> DocumentItem | None:
    """Apply a dict of updates to an existing document and return it.

    Returns None if the document does not exist.
    """
    existing = _documents.get(document_id)
    if existing is None:
        return None
    updated = existing.model_copy(update=updates)
    _documents[document_id] = updated
    return updated
