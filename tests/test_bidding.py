"""Tests for Bidding Enhancement."""
import pytest
from uuid import uuid4
from datetime import datetime, timedelta

from src.bidding.manager import (
    BiddingOpportunity,
    BiddingStatus,
    BidDocument,
    BidAnalysis,
    QualificationMatch,
)


class TestBiddingOpportunity:
    """Test Bidding Opportunity."""

    def test_create_opportunity(self):
        """Test creating bidding opportunity."""
        opp = BiddingOpportunity(
            id="bid-1",
            title="某政府办公楼装修工程",
            source="政府采购网",
            url="https://example.com/bid",
            deadline=datetime(2026, 4, 15),
            budget=5000000,
        )
        
        assert opp.title == "某政府办公楼装修工程"
        assert opp.budget == 5000000

    def test_opportunity_status(self):
        """Test opportunity status tracking."""
        opp = BiddingOpportunity(
            id="bid-1",
            title="测试项目",
            source="招标网",
            deadline=datetime(2026, 4, 15),
            budget=1000000,
        )
        
        assert opp.status == BiddingStatus.NEW
        
        opp.mark_in_progress()
        assert opp.status == BiddingStatus.IN_PROGRESS
        
        opp.submit()
        assert opp.status == BiddingStatus.SUBMITTED


class TestBidDocument:
    """Test Bid Document."""

    def test_create_bid_document(self):
        """Test creating bid document."""
        doc = BidDocument(
            id="doc-1",
            bidding_id="bid-1",
            document_type="技术标",
            status="draft",
        )
        
        assert doc.document_type == "技术标"
        assert doc.status == "draft"


class TestQualificationMatch:
    """Test Qualification Matching."""

    def test_qualification_match(self):
        """Test qualification matching."""
        match = QualificationMatch(
            requirement="具有建筑工程施工总承包一级资质",
            company_qualification="建筑工程施工总承包一级资质",
            matched=True,
            score=95,
        )
        
        assert match.matched is True
        assert match.score == 95

    def test_qualification_mismatch(self):
        """Test qualification mismatch."""
        match = QualificationMatch(
            requirement="具有市政公用工程施工总承包一级资质",
            company_qualification="建筑工程施工总承包二级资质",
            matched=False,
            score=40,
        )
        
        assert match.matched is False


class TestBidAnalysis:
    """Test Bid Analysis."""

    def test_create_analysis(self):
        """Test creating bid analysis."""
        analysis = BidAnalysis(
            bidding_id="bid-1",
            win_probability=0.65,
            recommended_price=4800000,
            competitors=["A公司", "B公司", "C公司"],
        )
        
        assert analysis.win_probability == 0.65
        assert len(analysis.competitors) == 3

    def test_price_recommendation(self):
        """Test price recommendation."""
        analysis = BidAnalysis(
            bidding_id="bid-1",
            budget=5000000,
            competitors=["A公司", "B公司"],
        )
        
        # Calculate recommended price
        recommended = analysis.calculate_recommended_price()
        
        # Recommended price should be between 85-95% of budget
        assert 0.85 <= recommended / analysis.budget <= 0.95
