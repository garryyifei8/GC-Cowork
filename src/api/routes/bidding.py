"""Bidding opportunity API endpoints."""
from fastapi import APIRouter
from pydantic import BaseModel

from src.core.exceptions import PlatformError
from src.stores.bidding_store import (
    list_opportunities, get_opportunity, seed_bidding,
)

router = APIRouter(prefix="/bidding", tags=["bidding"])


class BiddingListItem(BaseModel):
    id: str
    title: str
    source: str
    publish_date: str
    deadline: str
    budget_amount: str | None
    region: str
    category: str
    status: str
    match_score: float


@router.get("/opportunities", response_model=list[BiddingListItem])
async def list_opportunities_endpoint(
    category: str | None = None,
    status: str | None = None,
):
    opps = list_opportunities(category=category, status=status)
    return [BiddingListItem(
        id=o.id, title=o.title, source=o.source,
        publish_date=o.publish_date, deadline=o.deadline,
        budget_amount=o.budget_amount, region=o.region,
        category=o.category, status=o.status,
        match_score=o.match_score,
    ) for o in opps]


@router.get("/opportunities/{opp_id}", response_model=BiddingListItem)
async def get_opportunity_endpoint(opp_id: str):
    opp = get_opportunity(opp_id)
    if not opp:
        raise PlatformError("Bidding opportunity not found", detail={"id": opp_id})
    return BiddingListItem(
        id=opp.id, title=opp.title, source=opp.source,
        publish_date=opp.publish_date, deadline=opp.deadline,
        budget_amount=opp.budget_amount, region=opp.region,
        category=opp.category, status=opp.status,
        match_score=opp.match_score,
    )
