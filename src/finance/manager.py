"""Finance Enhancement - 财务管理."""
from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field


# ============================================================================
# Models
# ============================================================================

class Budget(BaseModel):
    """预算."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    project_id: str | None = None
    
    total_amount: float  # 总预算
    allocated: float = 0.0  # 已分配
    spent: float = 0.0  # 已支出
    
    # 分配明细
    allocations: dict[str, float] = Field(default_factory=dict)
    
    # 状态
    status: str = "active"  # active, closed
    
    # 日期
    fiscal_year: int | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    
    @property
    def remaining(self) -> float:
        """剩余预算."""
        return self.total_amount - self.allocated
    
    @property
    def utilization_rate(self) -> float:
        """使用率."""
        if self.total_amount == 0:
            return 0.0
        return (self.spent / self.total_amount) * 100
    
    def allocate(self, category: str, amount: float) -> None:
        """分配预算."""
        if amount > self.remaining:
            raise ValueError("分配金额超过剩余预算")
        
        self.allocations[category] = amount
        self.allocated += amount
    
    def spend(self, amount: float) -> None:
        """支出."""
        if amount > self.remaining:
            raise ValueError("支出金额超过剩余预算")
        self.spent += amount


class Expense(BaseModel):
    """费用报销."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    
    amount: float
    category: str  # 差旅费、招待费、办公用品等
    description: str
    
    project_id: str | None = None
    department: str | None = None
    
    # 状态
    status: str = "pending"  # pending, approved, rejected, paid
    
    # 申请人
    applicant: str | None = None
    
    # 日期
    expense_date: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # 附件
    attachments: list[str] = Field(default_factory=list)
    
    def approve(self) -> None:
        """审批通过."""
        self.status = "approved"
    
    def reject(self, reason: str) -> None:
        """拒绝."""
        self.status = "rejected"
    
    def mark_paid(self) -> None:
        """标记为已支付."""
        self.status = "paid"


class Invoice(BaseModel):
    """发票."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    
    invoice_number: str  # 发票号
    amount: float  # 金额（不含税）
    tax_rate: float = 0.13  # 税率
    tax_amount: float | None = None
    
    # 开票方
    seller_name: str | None = None
    seller_tax_id: str | None = None
    
    # 购货方
    buyer_name: str | None = None
    buyer_tax_id: str | None = None
    
    # 日期
    invoice_date: datetime | None = None
    
    # 状态
    status: str = "pending"  # pending, verified, rejected
    
    # 类型
    invoice_type: str = "增值税专用发票"  # 专票、普票
    
    @property
    def total_amount(self) -> float:
        """含税金额."""
        if self.tax_amount is not None:
            return self.amount + self.tax_amount
        return self.amount * (1 + self.tax_rate)
    
    def verify(self) -> None:
        """核验."""
        self.status = "verified"
    
    def reject(self) -> None:
        """拒绝."""
        self.status = "rejected"


class CostAnalysis(BaseModel):
    """成本分析."""
    project_id: str
    
    # 预算相关
    budget_amount: float = 0.0
    actual_cost: float = 0.0
    
    # 挣值相关
    earned_value: float = 0.0  # EV
    budget_at_completion: float = 0.0  # BAC
    
    # 计划值
    planned_value: float = 0.0  # PV
    
    @property
    def variance(self) -> float:
        """偏差 (CV = EV - AC)."""
        return self.earned_value - self.actual_cost
    
    @property
    def variance_percentage(self) -> float:
        """偏差百分比."""
        if self.budget_at_completion == 0:
            return 0.0
        return (self.variance / self.budget_at_completion) * 100
    
    @property
    def spi(self) -> float:
        """进度绩效指数 (SPI = EV / PV)."""
        if self.planned_value == 0:
            return 1.0
        return self.earned_value / self.planned_value
    
    @property
    def cpi(self) -> float:
        """成本绩效指数 (CPI = EV / AC)."""
        if self.actual_cost == 0:
            return 1.0
        return self.earned_value / self.actual_cost
    
    @property
    def estimate_at_completion(self) -> float:
        """完工估算 (EAC = BAC / CPI)."""
        if self.cpi == 0:
            return self.budget_at_completion
        return self.budget_at_completion / self.cpi
    
    @property
    def estimate_to_complete(self) -> float:
        """完工尚需估算 (ETC = EAC - AC)."""
        return self.estimate_at_completion - self.actual_cost
    
    def get_status(self) -> str:
        """获取状态."""
        if self.spi < 0.8 or self.cpi < 0.8:
            return "critical"
        elif self.spi < 1.0 or self.cpi < 1.0:
            return "warning"
        return "normal"


class FinancialReport(BaseModel):
    """财务报表."""
    id: str = Field(default_factory=lambda: str(uuid4()))
    project_id: str | None = None
    
    report_type: str  # 月报、季报、年报
    
    # 收入
    revenue: float = 0.0
    
    # 成本
    direct_cost: float = 0.0  # 直接成本
    indirect_cost: float = 0.0  # 间接成本
    
    # 利润
    gross_profit: float = 0.0
    net_profit: float = 0.0
    
    # 预算对比
    budget_variance: float = 0.0
    budget_variance_percentage: float = 0.0
    
    # 日期
    period_start: datetime | None = None
    period_end: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    def calculate_gross_profit(self) -> float:
        """计算毛利."""
        self.gross_profit = self.revenue - self.direct_cost
        return self.gross_profit
    
    def calculate_net_profit(self) -> float:
        """计算净利润."""
        self.net_profit = self.gross_profit - self.indirect_cost
        return self.net_profit


# ============================================================================
# Finance Manager
# ============================================================================

class FinanceManager:
    """财务管理器."""
    
    def __init__(self):
        self._budgets: dict[str, Budget] = {}
        self._expenses: dict[str, Expense] = {}
        self._invoices: dict[str, Invoice] = {}
    
    # ----- Budget -----
    
    def create_budget(self, budget: Budget) -> None:
        """创建预算."""
        self._budgets[budget.id] = budget
    
    def get_budget(self, budget_id: str) -> Budget | None:
        """获取预算."""
        return self._budgets.get(budget_id)
    
    def get_project_budget(self, project_id: str) -> Budget | None:
        """获取项目预算."""
        for budget in self._budgets.values():
            if budget.project_id == project_id:
                return budget
        return None
    
    # ----- Expense -----
    
    def create_expense(self, expense: Expense) -> None:
        """创建费用."""
        self._expenses[expense.id] = expense
    
    def approve_expense(self, expense_id: str) -> bool:
        """审批费用."""
        expense = self._expenses.get(expense_id)
        if expense:
            expense.approve()
            return True
        return False
    
    def get_pending_expenses(self, project_id: str | None = None) -> list[Expense]:
        """获取待审批费用."""
        expenses = [e for e in self._expenses.values() if e.status == "pending"]
        
        if project_id:
            expenses = [e for e in expenses if e.project_id == project_id]
        
        return expenses
    
    # ----- Invoice -----
    
    def create_invoice(self, invoice: Invoice) -> None:
        """创建发票."""
        self._invoices[invoice.id] = invoice
    
    def verify_invoice(self, invoice_id: str) -> bool:
        """核验发票."""
        invoice = self._invoices.get(invoice_id)
        if invoice:
            invoice.verify()
            return True
        return False
    
    def get_pending_invoices(self) -> list[Invoice]:
        """获取待核验发票."""
        return [i for i in self._invoices.values() if i.status == "pending"]
    
    # ----- Analysis -----
    
    def analyze_project_cost(self, project_id: str) -> CostAnalysis | None:
        """分析项目成本."""
        budget = self.get_project_budget(project_id)
        if not budget:
            return None
        
        # 汇总实际成本
        project_expenses = [e for e in self._expenses.values() 
                          if e.project_id == project_id and e.status == "paid"]
        
        actual_cost = sum(e.amount for e in project_expenses)
        
        return CostAnalysis(
            project_id=project_id,
            budget_amount=budget.total_amount,
            actual_cost=actual_cost,
            budget_at_completion=budget.total_amount,
        )
