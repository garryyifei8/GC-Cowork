"""In-memory bidding opportunity CRUD store with seed data."""

from __future__ import annotations

from src.core.models import BiddingOpportunity

# ---------------------------------------------------------------------------
# Module-level store
# ---------------------------------------------------------------------------

_opportunities: dict[str, BiddingOpportunity] = {}
_seeded: bool = False


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------


def seed_bidding() -> None:
    """Populate the store with seed bidding opportunities."""
    global _seeded
    if _seeded:
        return

    seed_data = [
        BiddingOpportunity(
            id="bid-001",
            title="某市文化中心EPC总承包",
            source="中国政府采购网",
            publish_date="2026-03-01",
            deadline="2026-04-15",
            budget_amount="8000万",
            region="华东",
            category="EPC / 展馆",
            status="monitoring",
            match_score=85.0,
        ),
        BiddingOpportunity(
            id="bid-002",
            title="XX区智慧城市管理平台建设",
            source="全国公共资源交易平台",
            publish_date="2026-03-05",
            deadline="2026-04-25",
            budget_amount="1200万",
            region="华南",
            category="信息化开发",
            status="analyzing",
            match_score=72.0,
        ),
        BiddingOpportunity(
            id="bid-003",
            title="省级博物馆数字化展示升级",
            source="中国政府采购网",
            publish_date="2026-03-10",
            deadline="2026-05-10",
            budget_amount="3500万",
            region="华中",
            category="EPC / 展馆",
            status="monitoring",
            match_score=91.0,
        ),
        BiddingOpportunity(
            id="bid-004",
            title="新城区基础设施专项债咨询",
            source="地方财政局",
            publish_date="2026-03-08",
            deadline="2026-05-20",
            budget_amount="150万",
            region="西南",
            category="专项债咨询",
            status="preparing",
            match_score=88.0,
        ),
        BiddingOpportunity(
            id="bid-005",
            title="市级档案馆智能化改造工程",
            source="中国政府采购网",
            publish_date="2026-03-06",
            deadline="2026-04-30",
            budget_amount="4200万",
            region="华东",
            category="EPC / 公建",
            status="monitoring",
            match_score=78.0,
        ),
        BiddingOpportunity(
            id="bid-006",
            title="教育信息化三通两平台升级",
            source="全国公共资源交易平台",
            publish_date="2026-03-09",
            deadline="2026-05-05",
            budget_amount="680万",
            region="华北",
            category="信息化开发",
            status="analyzing",
            match_score=65.0,
        ),
        BiddingOpportunity(
            id="bid-007",
            title="产业园区污水处理PPP项目咨询",
            source="地方财政局",
            publish_date="2026-02-28",
            deadline="2026-04-10",
            budget_amount="200万",
            region="华中",
            category="专项债咨询",
            status="submitted",
            match_score=82.0,
        ),
        BiddingOpportunity(
            id="bid-008",
            title="某市体育中心EPC总承包",
            source="中国政府采购网",
            publish_date="2026-03-11",
            deadline="2026-06-01",
            budget_amount="2.5亿",
            region="华东",
            category="EPC / 公建",
            status="monitoring",
            match_score=93.0,
            project_id=None,
        ),
    ]

    for opportunity in seed_data:
        _opportunities[opportunity.id] = opportunity

    _seeded = True


# ---------------------------------------------------------------------------
# CRUD functions
# ---------------------------------------------------------------------------


def list_opportunities(
    category: str | None = None,
    status: str | None = None,
) -> list[BiddingOpportunity]:
    """Return all bidding opportunities, optionally filtered by category or status."""
    opportunities = list(_opportunities.values())
    if category is not None:
        opportunities = [o for o in opportunities if o.category == category]
    if status is not None:
        opportunities = [o for o in opportunities if o.status == status]
    return opportunities


def get_opportunity(opportunity_id: str) -> BiddingOpportunity | None:
    """Return a single opportunity by ID, or None if not found."""
    return _opportunities.get(opportunity_id)


def create_opportunity(opportunity: BiddingOpportunity) -> BiddingOpportunity:
    """Insert a new opportunity into the store and return it."""
    _opportunities[opportunity.id] = opportunity
    return opportunity


def update_opportunity(opportunity_id: str, updates: dict) -> BiddingOpportunity | None:
    """Apply a dict of updates to an existing opportunity and return it.

    Returns None if the opportunity does not exist.
    """
    existing = _opportunities.get(opportunity_id)
    if existing is None:
        return None
    updated = existing.model_copy(update=updates)
    _opportunities[opportunity_id] = updated
    return updated
