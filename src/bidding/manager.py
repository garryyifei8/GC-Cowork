"""Bidding Enhancement - 招投标管理."""

from __future__ import annotations

from datetime import datetime, timedelta
from enum import Enum
from typing import Any
from uuid import uuid4

from pydantic import BaseModel, Field

# ============================================================================
# Enums
# ============================================================================


class BiddingStatus(str, Enum):
    """招投标状态."""

    NEW = "new"  # 新发现
    IN_PROGRESS = "in_progress"  # 跟进中
    PREPARING = "preparing"  # 准备中
    SUBMITTED = "submitted"  # 已提交
    WON = "won"  # 中标
    LOST = "lost"  # 未中标
    CANCELLED = "cancelled"  # 已取消


# ============================================================================
# Models
# ============================================================================


class BiddingOpportunity(BaseModel):
    """招投标机会."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    title: str  # 项目名称
    source: str  # 信息来源
    url: str | None = None  # 原文链接

    # 基本信息
    budget: float | None = None  # 预算金额
    deadline: datetime | None = None  # 投标截止日期
    announcement_date: datetime | None = None  # 发布日期

    # 项目信息
    region: str | None = None  # 地区
    industry: str | None = None  # 行业
    project_type: str | None = None  # 项目类型

    # 状态
    status: BiddingStatus = BiddingStatus.NEW

    # 联系方式
    contact: str | None = None
    contact_phone: str | None = None

    # 附件
    attachments: list[dict[str, Any]] = Field(default_factory=list)

    # 备注
    notes: str | None = None

    # 时间戳
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    def mark_in_progress(self) -> None:
        """标记为跟进中."""
        self.status = BiddingStatus.IN_PROGRESS
        self.updated_at = datetime.utcnow()

    def mark_preparing(self) -> None:
        """标记为准备中."""
        self.status = BiddingStatus.PREPARING
        self.updated_at = datetime.utcnow()

    def submit(self) -> None:
        """标记为已提交."""
        self.status = BiddingStatus.SUBMITTED
        self.updated_at = datetime.utcnow()

    def mark_won(self) -> None:
        """标记为中标."""
        self.status = BiddingStatus.WON
        self.updated_at = datetime.utcnow()

    def mark_lost(self) -> None:
        """标记为未中标."""
        self.status = BiddingStatus.LOST
        self.updated_at = datetime.utcnow()

    @property
    def days_until_deadline(self) -> int | None:
        """距离截止日期的天数."""
        if not self.deadline:
            return None
        delta = self.deadline - datetime.utcnow()
        return delta.days


class BidDocument(BaseModel):
    """投标文档."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    bidding_id: str

    # 文档类型
    document_type: str  # 技术标、商务标、资格预审文件

    # 状态
    status: str = "draft"  # draft, reviewing, completed, submitted

    # 内容
    content: str | None = None

    # 文件
    file_path: str | None = None

    # 版本
    version: int = 1

    # 检查项
    checklist: dict[str, bool] = Field(default_factory=dict)

    # 备注
    notes: str | None = None

    def complete(self) -> None:
        """标记为完成."""
        self.status = "completed"

    def submit(self) -> None:
        """提交文档."""
        self.status = "submitted"


class QualificationMatch(BaseModel):
    """资质匹配."""

    requirement: str  # 招标要求
    company_qualification: str  # 公司资质

    matched: bool = False
    score: int = 0  # 匹配度 0-100

    notes: str | None = None


class BidAnalysis(BaseModel):
    """投标分析."""

    id: str = Field(default_factory=lambda: str(uuid4()))
    bidding_id: str

    # 分析数据
    budget: float | None = None  # 预算
    estimated_cost: float | None = None  # 估算成本

    # 竞争对手分析
    competitors: list[str] = Field(default_factory=list)
    competitor_prices: dict[str, float] = Field(default_factory=dict)

    # 建议
    win_probability: float | None = None  # 中标概率
    recommended_price: float | None = None  # 推荐报价

    # 风险评估
    risk_factors: list[str] = Field(default_factory=list)
    strengths: list[str] = Field(default_factory=list)
    weaknesses: list[str] = Field(default_factory=list)

    # 最终报价
    final_price: float | None = None

    def calculate_recommended_price(self) -> float:
        """计算推荐报价."""
        if not self.budget:
            return 0.0

        # 基于竞争对手数量和预算确定报价策略
        competitor_count = len(self.competitors)

        if competitor_count >= 5:
            # 充分竞争，报价在预算的85-88%
            ratio = 0.86
        elif competitor_count >= 3:
            # 中等竞争，报价在预算的88-92%
            ratio = 0.90
        else:
            # 竞争较少，报价在预算的92-95%
            ratio = 0.93

        self.recommended_price = self.budget * ratio
        return self.recommended_price

    def calculate_win_probability(self) -> float:
        """计算中标概率."""
        # 简化算法：基于多个因素
        score = 50.0  # 基础分

        # 资质匹配加分
        if len(self.strengths) > len(self.weaknesses):
            score += 20

        # 竞争对手数量减分
        score -= len(self.competitors) * 3

        # 价格竞争力
        if self.recommended_price and self.budget:
            price_ratio = self.recommended_price / self.budget
            if price_ratio < 0.9:
                score += 15
            elif price_ratio < 0.95:
                score += 10

        # 确保在0-100范围内
        self.win_probability = max(0, min(100, score)) / 100
        return self.win_probability


# ============================================================================
# Bidding Manager
# ============================================================================


class BiddingManager:
    """招投标管理器."""

    def __init__(self):
        self._opportunities: dict[str, BiddingOpportunity] = {}
        self._documents: dict[str, BidDocument] = {}
        self._analyses: dict[str, BidAnalysis] = {}

    # ----- Opportunities -----

    def add_opportunity(self, opportunity: BiddingOpportunity) -> None:
        """添加招投标机会."""
        self._opportunities[opportunity.id] = opportunity

    def get_opportunity(self, opportunity_id: str) -> BiddingOpportunity | None:
        """获取招投标机会."""
        return self._opportunities.get(opportunity_id)

    def list_opportunities(
        self,
        status: BiddingStatus | None = None,
    ) -> list[BiddingOpportunity]:
        """列出招投标机会."""
        opportunities = list(self._opportunities.values())

        if status:
            opportunities = [o for o in opportunities if o.status == status]

        return opportunities

    def get_upcoming_deadlines(self, days: int = 7) -> list[BiddingOpportunity]:
        """获取即将到期的投标截止日期."""
        now = datetime.utcnow()
        deadline = now + timedelta(days=days)

        return [
            o
            for o in self._opportunities.values()
            if o.deadline
            and o.deadline <= deadline
            and o.status in [BiddingStatus.NEW, BiddingStatus.IN_PROGRESS, BiddingStatus.PREPARING]
        ]

    # ----- Documents -----

    def add_document(self, document: BidDocument) -> None:
        """添加投标文档."""
        self._documents[document.id] = document

    def get_document(self, document_id: str) -> BidDocument | None:
        """获取投标文档."""
        return self._documents.get(document_id)

    def list_documents(self, bidding_id: str) -> list[BidDocument]:
        """列出某个项目的所有文档."""
        return [d for d in self._documents.values() if d.bidding_id == bidding_id]

    # ----- Analysis -----

    def create_analysis(self, bidding_id: str) -> BidAnalysis:
        """创建投标分析."""
        opportunity = self.get_opportunity(bidding_id)

        analysis = BidAnalysis(
            bidding_id=bidding_id,
            budget=opportunity.budget if opportunity else None,
        )

        self._analyses[analysis.id] = analysis
        return analysis

    def get_analysis(self, analysis_id: str) -> BidAnalysis | None:
        """获取投标分析."""
        return self._analyses.get(analysis_id)

    # ----- Matching -----

    def match_qualifications(
        self,
        requirements: list[str],
        company_qualifications: list[str],
    ) -> list[QualificationMatch]:
        """匹配资质."""
        matches = []

        for req in requirements:
            best_match = None
            best_score = 0

            for qual in company_qualifications:
                score = self._calculate_qualification_score(req, qual)
                if score > best_score:
                    best_score = score
                    best_match = qual

            matches.append(
                QualificationMatch(
                    requirement=req,
                    company_qualification=best_match or "",
                    matched=best_score >= 70,
                    score=best_score,
                )
            )

        return matches

    def _calculate_qualification_score(self, requirement: str, qualification: str) -> int:
        """计算资质匹配分数."""
        req_lower = requirement.lower()
        qual_lower = qualification.lower()

        # 完全匹配
        if req_lower == qual_lower:
            return 100

        # 包含匹配
        if req_lower in qual_lower or qual_lower in req_lower:
            return 80

        # 部分匹配（关键词）
        req_words = set(req_lower.split())
        qual_words = set(qual_lower.split())
        common = req_words & qual_words

        if common:
            return int(len(common) / len(req_words) * 70)

        return 0


# ============================================================================
# Preset Templates
# ============================================================================


def get_standard_bid_checklist() -> dict[str, bool]:
    """获取标准投标检查清单."""
    return {
        "招标文件购买": False,
        "保证金缴纳": False,
        "资质文件准备": False,
        "技术标编制": False,
        "商务标编制": False,
        "密封检查": False,
        "法定代表人授权": False,
        "投标函填写": False,
        "电子文件上传": False,
        "现场递交/邮寄": False,
    }
