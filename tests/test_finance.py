"""Tests for Finance Enhancement."""
import pytest
from uuid import uuid4
from datetime import datetime

pytestmark = pytest.mark.skip(reason="Legacy manager tests — not part of API testing")

from src.finance.manager import (
    Budget,
    Expense,
    Invoice,
    FinancialReport,
    CostAnalysis,
)


class TestBudget:
    """Test Budget."""

    def test_create_budget(self):
        """Test creating budget."""
        budget = Budget(
            id="budget-1",
            name="2026年度项目预算",
            total_amount=1000000,
            project_id="p1",
        )
        
        assert budget.total_amount == 1000000
        assert budget.remaining == 1000000

    def test_budget_allocation(self):
        """Test budget allocation."""
        budget = Budget(
            id="budget-1",
            name="项目预算",
            total_amount=1000000,
            project_id="p1",
        )
        
        budget.allocate("材料采购", 300000)
        budget.allocate("人工费用", 400000)
        
        assert len(budget.allocations) == 2
        assert budget.allocated == 700000


class TestExpense:
    """Test Expense."""

    def test_create_expense(self):
        """Test creating expense."""
        expense = Expense(
            id="exp-1",
            amount=5000,
            category="差旅费",
            description="北京出差",
            project_id="p1",
        )
        
        assert expense.amount == 5000
        assert expense.status == "pending"


class TestInvoice:
    """Test Invoice."""

    def test_create_invoice(self):
        """Test creating invoice."""
        invoice = Invoice(
            id="inv-1",
            invoice_number="INV-2026-001",
            amount=10000,
            tax_amount=1300,
        )
        
        assert invoice.amount == 10000
        assert invoice.tax_amount == 1300
        assert invoice.total_amount == 11300


class TestCostAnalysis:
    """Test Cost Analysis."""

    def test_cost_variance(self):
        """Test cost variance analysis."""
        analysis = CostAnalysis(
            project_id="p1",
            budget_amount=100000,
            actual_cost=110000,
            earned_value=90000,
        )
        
        # CV = EV - AC = 90000 - 110000 = -20000
        assert analysis.variance == -20000

    def test_earned_value_analysis(self):
        """Test earned value analysis."""
        analysis = CostAnalysis(
            project_id="p1",
            budget_at_completion=100000,
            actual_cost=60000,
            earned_value=50000,
            planned_value=60000,
        )
        
        # SPI = EV / PV = 50000 / 60000 = 0.83
        assert 0.8 <= analysis.spi <= 0.85
        # CPI = EV / AC = 50000 / 60000 = 0.83
        assert 0.8 <= analysis.cpi <= 0.85
