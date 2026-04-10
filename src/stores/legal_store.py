"""In-memory store for legal/contract management."""

from __future__ import annotations

from datetime import date, timedelta
from uuid import uuid4

from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class Contract(BaseModel):
    id: str
    title: str
    contract_type: str  # service / construction / procurement / consulting
    party_a: str
    party_b: str
    project_id: str | None = None
    amount: float
    sign_date: str  # ISO date string  YYYY-MM-DD
    start_date: str
    end_date: str
    status: str  # draft / active / completed / terminated / expired
    risk_level: str  # low / medium / high
    key_terms: str
    responsible: str


# ---------------------------------------------------------------------------
# In-memory storage
# ---------------------------------------------------------------------------

_contracts: dict[str, Contract] = {}
_seeded: bool = False


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------


def seed_contracts() -> None:
    """Populate the store with realistic construction/EPC seed contracts."""
    global _seeded
    if _seeded:
        return

    records = [
        Contract(
            id="CTR-2024-001",
            title="南方电网500kV输变电工程EPC总承包合同",
            contract_type="construction",
            party_a="国债建设咨询有限公司",
            party_b="广东送变电工程有限公司",
            project_id="PRJ-2024-001",
            amount=128_500_000.00,
            sign_date="2024-01-15",
            start_date="2024-02-01",
            end_date="2025-12-31",
            status="active",
            risk_level="high",
            key_terms="工期24个月；质保期5年；逾期违约金按合同总价0.1%/天计算；不可抗力条款适用；争议由广州仲裁委员会仲裁",
            responsible="张伟",
        ),
        Contract(
            id="CTR-2024-002",
            title="城市地下综合管廊工程设计咨询服务合同",
            contract_type="consulting",
            party_a="国债建设咨询有限公司",
            party_b="中国市政工程华北设计研究总院",
            project_id="PRJ-2024-002",
            amount=3_200_000.00,
            sign_date="2024-03-01",
            start_date="2024-03-15",
            end_date="2024-11-30",
            status="active",
            risk_level="low",
            key_terms="按阶段付款：方案设计30%，初步设计40%，施工图设计30%；成果需通过政府审查；知识产权归甲方所有",
            responsible="李明",
        ),
        Contract(
            id="CTR-2024-003",
            title="高速公路改扩建工程监理服务合同",
            contract_type="service",
            party_a="国债建设咨询有限公司",
            party_b="湖南省交通工程监理咨询有限公司",
            project_id="PRJ-2024-003",
            amount=8_760_000.00,
            sign_date="2024-02-20",
            start_date="2024-03-01",
            end_date="2026-02-28",
            status="active",
            risk_level="medium",
            key_terms="监理范围包括质量、进度、投资三大控制及合同、信息、安全管理；监理人员配置不低于合同约定标准；月度报告制度",
            responsible="王芳",
        ),
        Contract(
            id="CTR-2024-004",
            title="建筑材料采购框架协议（钢材类）",
            contract_type="procurement",
            party_a="国债建设咨询有限公司",
            party_b="宝武钢铁集团有限公司",
            project_id=None,
            amount=45_000_000.00,
            sign_date="2024-01-05",
            start_date="2024-01-10",
            end_date="2024-12-31",
            status="active",
            risk_level="medium",
            key_terms="框架协议有效期1年；价格与市场指数挂钩每季度调整；最低采购量2000吨；交货期：订单确认后15个工作日内",
            responsible="陈强",
        ),
        Contract(
            id="CTR-2023-008",
            title="水利枢纽工程岩土勘察服务合同",
            contract_type="service",
            party_a="国债建设咨询有限公司",
            party_b="长江水利委员会综合勘测局",
            project_id="PRJ-2023-008",
            amount=1_850_000.00,
            sign_date="2023-06-01",
            start_date="2023-06-15",
            end_date="2024-01-31",
            status="completed",
            risk_level="low",
            key_terms="勘察成果需满足《岩土工程勘察规范》GB50021要求；报告提交后30日内完成审查；争议由双方协商解决",
            responsible="刘洋",
        ),
        Contract(
            id="CTR-2023-012",
            title="智慧工地信息化管理平台采购合同",
            contract_type="procurement",
            party_a="国债建设咨询有限公司",
            party_b="广联达科技股份有限公司",
            project_id="PRJ-2024-001",
            amount=980_000.00,
            sign_date="2023-11-20",
            start_date="2023-12-01",
            end_date="2025-11-30",
            status="active",
            risk_level="low",
            key_terms="软件许可证2年；包含系统集成、培训及运维服务；SLA保证系统可用性不低于99.5%；数据安全符合等保三级要求",
            responsible="赵静",
        ),
        Contract(
            id="CTR-2024-007",
            title="新能源光伏电站EPC工程总承包合同",
            contract_type="construction",
            party_a="国债建设咨询有限公司",
            party_b="中国电力建设股份有限公司",
            project_id="PRJ-2024-007",
            amount=215_000_000.00,
            sign_date="2024-04-10",
            start_date="2024-05-01",
            end_date="2025-04-30",
            status="active",
            risk_level="high",
            key_terms="装机容量200MW；并网调试期3个月；质保期25年（组件）/2年（土建）；政府补贴风险由乙方承担；FIDIC银皮书适用",
            responsible="孙磊",
        ),
        Contract(
            id="CTR-2024-009",
            title="项目管理咨询服务合同（已终止）",
            contract_type="consulting",
            party_a="国债建设咨询有限公司",
            party_b="北京中咨工程建设监理有限公司",
            project_id="PRJ-2024-009",
            amount=2_400_000.00,
            sign_date="2024-02-01",
            start_date="2024-02-15",
            end_date="2025-02-14",
            status="terminated",
            risk_level="medium",
            key_terms="因项目停工双方协商提前终止；已完成工作量按比例结算；终止协议于2024-08-30签署；无违约责任认定",
            responsible="周欣",
        ),
    ]

    for contract in records:
        _contracts[contract.id] = contract

    _seeded = True


# ---------------------------------------------------------------------------
# CRUD functions
# ---------------------------------------------------------------------------


def list_contracts(
    status: str | None = None,
    contract_type: str | None = None,
    project_id: str | None = None,
) -> list[Contract]:
    """Return contracts, optionally filtered by status, type, or project."""
    seed_contracts()

    results = list(_contracts.values())

    if status is not None:
        results = [c for c in results if c.status == status]

    if contract_type is not None:
        results = [c for c in results if c.contract_type == contract_type]

    if project_id is not None:
        results = [c for c in results if c.project_id == project_id]

    return results


def get_contract(contract_id: str) -> Contract | None:
    """Return a single contract by ID, or None if not found."""
    seed_contracts()
    return _contracts.get(contract_id)


def create_contract(data: dict) -> Contract:
    """Create a new contract and persist it in the store."""
    seed_contracts()

    contract_id = data.get("id") or f"CTR-{uuid4().hex[:8].upper()}"
    contract = Contract(id=contract_id, **{k: v for k, v in data.items() if k != "id"})
    _contracts[contract.id] = contract
    return contract


def update_contract(contract_id: str, data: dict) -> Contract | None:
    """Partially update an existing contract.  Returns None if not found."""
    seed_contracts()

    existing = _contracts.get(contract_id)
    if existing is None:
        return None

    updated = existing.model_copy(update={k: v for k, v in data.items() if v is not None})
    _contracts[contract_id] = updated
    return updated


# ---------------------------------------------------------------------------
# Summary / analytics
# ---------------------------------------------------------------------------


def get_legal_summary() -> dict:
    """Return aggregate statistics for the legal dashboard."""
    seed_contracts()

    all_contracts = list(_contracts.values())

    today = date.today()
    threshold = today + timedelta(days=30)

    active = [c for c in all_contracts if c.status == "active"]

    expiring_soon = [c for c in active if date.fromisoformat(c.end_date) <= threshold]

    total_amount = sum(c.amount for c in all_contracts)

    by_type: dict[str, int] = {}
    for c in all_contracts:
        by_type[c.contract_type] = by_type.get(c.contract_type, 0) + 1

    by_status: dict[str, int] = {}
    for c in all_contracts:
        by_status[c.status] = by_status.get(c.status, 0) + 1

    high_risk = [c for c in all_contracts if c.risk_level == "high"]

    return {
        "total": len(all_contracts),
        "active": len(active),
        "expiring_soon": len(expiring_soon),
        "total_amount": total_amount,
        "by_type": by_type,
        "by_status": by_status,
        "high_risk_count": len(high_risk),
        "expiring_soon_contracts": [c.id for c in expiring_soon],
    }


# ---------------------------------------------------------------------------
# Supabase delegation — when USE_SUPABASE=true, override all exports
# ---------------------------------------------------------------------------
from src.db.client import use_supabase as _use_sb  # noqa: E402

if _use_sb():
    from src.stores.supabase.legal_store import *  # noqa: E402,F401,F403
