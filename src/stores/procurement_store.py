"""In-memory procurement package CRUD store with seed data."""

from __future__ import annotations

from src.core.models import ProcurementPackage, ProcurementStatus

# ---------------------------------------------------------------------------
# Module-level store
# ---------------------------------------------------------------------------

_packages: dict[str, ProcurementPackage] = {}
_seeded: bool = False


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------


def seed_procurement() -> None:
    """Populate the store with seed procurement packages for EPC projects."""
    global _seeded
    if _seeded:
        return

    seed_data = [
        # proj-001: 省立博物馆EPC工程
        ProcurementPackage(
            id="proc-001",
            project_id="proj-001",
            name="幕墙玻璃采购",
            category="材料",
            supplier="南玻集团",
            budget_amount=580.0,
            actual_amount=545.0,
            status=ProcurementStatus.DELIVERING,
            plan_date="2026-01-15",
            arrival_date="2026-04-20",
            responsible="刘采购",
            notes="进口Low-E玻璃，分三批到货，第三批预计4月20日到场",
        ),
        ProcurementPackage(
            id="proc-002",
            project_id="proj-001",
            name="机电设备采购",
            category="设备",
            supplier="格力电器",
            budget_amount=420.0,
            actual_amount=398.0,
            status=ProcurementStatus.INSPECTING,
            plan_date="2025-11-01",
            arrival_date="2026-02-28",
            responsible="周机电",
            notes="中央空调及新风系统设备，已到货待验收",
        ),
        ProcurementPackage(
            id="proc-003",
            project_id="proj-001",
            name="展陈布展分包",
            category="分包",
            supplier=None,
            budget_amount=1200.0,
            actual_amount=None,
            status=ProcurementStatus.BIDDING,
            plan_date="2026-03-20",
            arrival_date=None,
            responsible="冯展陈",
            notes="展陈设计与布展施工一体化分包，正在招标评审",
        ),
        ProcurementPackage(
            id="proc-004",
            project_id="proj-001",
            name="消防工程分包",
            category="分包",
            supplier="中消安防",
            budget_amount=380.0,
            actual_amount=365.0,
            status=ProcurementStatus.COMPLETED,
            plan_date="2025-08-01",
            arrival_date="2026-01-20",
            responsible="郑消防",
            notes="消防工程已完工并通过消防验收",
        ),
        # proj-004: 市民服务中心智能化改造
        ProcurementPackage(
            id="proc-005",
            project_id="proj-004",
            name="智能化设备采购",
            category="设备",
            supplier=None,
            budget_amount=860.0,
            actual_amount=None,
            status=ProcurementStatus.PLANNING,
            plan_date="2026-08-15",
            arrival_date=None,
            responsible="唐智能",
            notes="含楼宇自控、安防监控、智能照明系统设备",
        ),
        ProcurementPackage(
            id="proc-006",
            project_id="proj-004",
            name="暖通设备采购",
            category="设备",
            supplier=None,
            budget_amount=520.0,
            actual_amount=None,
            status=ProcurementStatus.PLANNING,
            plan_date="2026-09-01",
            arrival_date=None,
            responsible="宋暖通",
            notes="变频多联机及新风系统，待设计方案确定后启动采购",
        ),
        # proj-006: 老旧小区改造EPC
        ProcurementPackage(
            id="proc-007",
            project_id="proj-006",
            name="市政管材采购",
            category="材料",
            supplier="金牛管业",
            budget_amount=280.0,
            actual_amount=268.0,
            status=ProcurementStatus.COMPLETED,
            plan_date="2025-06-01",
            arrival_date="2025-07-15",
            responsible="丁项目",
            notes="给排水管材及配件，已全部进场",
        ),
        ProcurementPackage(
            id="proc-008",
            project_id="proj-006",
            name="绿化苗木采购",
            category="材料",
            supplier="城市绿化公司",
            budget_amount=150.0,
            actual_amount=142.0,
            status=ProcurementStatus.COMPLETED,
            plan_date="2025-09-01",
            arrival_date="2025-10-10",
            responsible="丁项目",
            notes="小区绿化改造苗木，已种植完成",
        ),
    ]

    for pkg in seed_data:
        _packages[pkg.id] = pkg

    _seeded = True


# ---------------------------------------------------------------------------
# CRUD functions
# ---------------------------------------------------------------------------


def list_by_project(project_id: str) -> list[ProcurementPackage]:
    """Return all procurement packages for a given project."""
    return [p for p in _packages.values() if p.project_id == project_id]


def get(package_id: str) -> ProcurementPackage | None:
    """Return a single procurement package by ID."""
    return _packages.get(package_id)


def create(package: ProcurementPackage) -> ProcurementPackage:
    """Insert a new procurement package."""
    _packages[package.id] = package
    return package


def update(package_id: str, updates: dict) -> ProcurementPackage | None:
    """Apply updates to an existing procurement package."""
    existing = _packages.get(package_id)
    if existing is None:
        return None
    updated = existing.model_copy(update=updates)
    _packages[package_id] = updated
    return updated
