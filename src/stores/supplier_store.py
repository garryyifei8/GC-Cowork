"""In-memory Supplier CRUD store with seed data.

Manages supplier master data for procurement and project management.
"""

from __future__ import annotations

from uuid import uuid4

from src.core.models import Supplier, SupplierCategory, SupplierStatus

# ---------------------------------------------------------------------------
# Module-level store
# ---------------------------------------------------------------------------

_suppliers: dict[str, Supplier] = {}
_seeded: bool = False


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------


def seed_suppliers() -> None:
    """Populate supplier store with realistic demo data."""
    global _seeded
    if _seeded:
        return

    suppliers_raw = [
        dict(
            id="sup-001",
            name="南玻集团",
            category=SupplierCategory.MATERIAL,
            contact_person="陈经理",
            phone="0755-26088888",
            email="sales@csg.cn",
            address="深圳市南山区科技园",
            qualification="一级",
            rating=5,
            status=SupplierStatus.ACTIVE,
            projects=["proj-001"],
            notes="幕墙玻璃长期合作供应商，ISO 9001认证",
        ),
        dict(
            id="sup-002",
            name="格力电器",
            category=SupplierCategory.EQUIPMENT,
            contact_person="王工",
            phone="0756-8668888",
            email="project@gree.com",
            address="珠海市香洲区前山金鸡西路",
            qualification="特级",
            rating=5,
            status=SupplierStatus.ACTIVE,
            projects=["proj-001", "proj-003"],
            notes="中央空调设备供应商，全国联保",
        ),
        dict(
            id="sup-003",
            name="中消安防",
            category=SupplierCategory.EQUIPMENT,
            contact_person="赵总",
            phone="010-65881234",
            email="bid@zhongxiao.com",
            address="北京市朝阳区东三环",
            qualification="一级",
            rating=4,
            status=SupplierStatus.ACTIVE,
            projects=["proj-001"],
            notes="消防设备供应与安装，甲级消防资质",
        ),
        dict(
            id="sup-004",
            name="金牛管业",
            category=SupplierCategory.MATERIAL,
            contact_person="李主管",
            phone="028-82788888",
            email="jinniu@pipe.com",
            address="成都市郫都区",
            qualification="一级",
            rating=4,
            status=SupplierStatus.ACTIVE,
            projects=["proj-003"],
            notes="PPR管道、PVC管材供应",
        ),
        dict(
            id="sup-005",
            name="城市绿化工程公司",
            category=SupplierCategory.SUBCONTRACT,
            contact_person="林总",
            phone="021-55667788",
            email="green@cityscape.com",
            address="上海市浦东新区",
            qualification="二级",
            rating=3,
            status=SupplierStatus.ACTIVE,
            projects=["proj-001"],
            notes="景观绿化分包商",
        ),
        dict(
            id="sup-006",
            name="中建五局",
            category=SupplierCategory.SUBCONTRACT,
            contact_person="杨经理",
            phone="0731-84166666",
            email="project@cscec5b.com",
            address="长沙市岳麓区银盆南路",
            qualification="特级",
            rating=5,
            status=SupplierStatus.ACTIVE,
            projects=["proj-002"],
            notes="钢结构施工分包商，特级资质",
        ),
        dict(
            id="sup-007",
            name="华为技术",
            category=SupplierCategory.EQUIPMENT,
            contact_person="孙工",
            phone="0755-28780808",
            email="enterprise@huawei.com",
            address="深圳市龙岗区坂田华为基地",
            qualification="特级",
            rating=5,
            status=SupplierStatus.ACTIVE,
            projects=["proj-002"],
            notes="智能化设备供应，含网络与安防",
        ),
        dict(
            id="sup-008",
            name="远大空调",
            category=SupplierCategory.EQUIPMENT,
            contact_person="张经理",
            phone="0731-84086888",
            email="sales@broad.com",
            address="长沙市岳麓区",
            qualification="一级",
            rating=3,
            status=SupplierStatus.INACTIVE,
            projects=[],
            notes="非电空调设备，当前合作暂停",
        ),
    ]
    for raw in suppliers_raw:
        sup = Supplier(**raw)
        _suppliers[sup.id] = sup

    _seeded = True


# ---------------------------------------------------------------------------
# CRUD
# ---------------------------------------------------------------------------


def list_suppliers(
    category: str | None = None,
    status: str | None = None,
    project_id: str | None = None,
) -> list[Supplier]:
    """Return suppliers with optional filters."""
    result = list(_suppliers.values())
    if category is not None:
        result = [s for s in result if s.category.value == category]
    if status is not None:
        result = [s for s in result if s.status.value == status]
    if project_id is not None:
        result = [s for s in result if project_id in s.projects]
    return result


def get_supplier(supplier_id: str) -> Supplier | None:
    """Return a single supplier by ID, or None if not found."""
    return _suppliers.get(supplier_id)


def create_supplier(data: dict) -> Supplier:
    """Create a new supplier from a dict payload."""
    if "id" not in data:
        data = {**data, "id": str(uuid4())}
    sup = Supplier(**data)
    _suppliers[sup.id] = sup
    return sup


def update_supplier(supplier_id: str, data: dict) -> Supplier | None:
    """Apply partial updates to an existing supplier."""
    existing = _suppliers.get(supplier_id)
    if existing is None:
        return None
    updated = existing.model_copy(update=data)
    _suppliers[supplier_id] = updated
    return updated


def delete_supplier(supplier_id: str) -> bool:
    """Delete a supplier by ID. Returns True if deleted, False if not found."""
    if supplier_id in _suppliers:
        del _suppliers[supplier_id]
        return True
    return False


def get_supplier_summary() -> dict:
    """Return aggregated supplier statistics."""
    all_sups = list(_suppliers.values())
    total = len(all_sups)
    active = sum(1 for s in all_sups if s.status == SupplierStatus.ACTIVE)
    by_category: dict[str, int] = {}
    for s in all_sups:
        cat = s.category.value
        by_category[cat] = by_category.get(cat, 0) + 1
    avg_rating = round(sum(s.rating for s in all_sups) / max(total, 1), 1)
    return {
        "total": total,
        "active": active,
        "inactive": total - active,
        "by_category": by_category,
        "avg_rating": avg_rating,
    }


# ---------------------------------------------------------------------------
# Supabase delegation — when USE_SUPABASE=true, override all exports
# ---------------------------------------------------------------------------
from src.db.client import use_supabase as _use_sb  # noqa: E402

if _use_sb():
    from src.stores.supabase.supplier_store import *  # noqa: E402,F401,F403
