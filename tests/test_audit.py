"""Tests for Audit Module."""
import pytest
from uuid import uuid4
from datetime import datetime

pytestmark = pytest.mark.skip(reason="Legacy manager tests — not part of API testing")

from src.audit.manager import (
    AuditFinding,
    AuditStatus,
    AuditReport,
    ComplianceCheck,
)


class TestAuditFinding:
    """Test Audit Finding."""

    def test_create_finding(self):
        """Test creating audit finding."""
        finding = AuditFinding(
            id="finding-1",
            title="合同管理不规范",
            description="部分合同缺少签字盖章",
            severity="medium",
        )
        
        assert finding.title == "合同管理不规范"
        assert finding.status == "open"

    def test_finding_status(self):
        """Test finding status changes."""
        finding = AuditFinding(
            id="finding-1",
            title="测试",
            description="测试",
            severity="low",
        )
        
        finding.resolve("已整改完成")
        assert finding.status == "resolved"


class TestComplianceCheck:
    """Test Compliance Check."""

    def test_create_check(self):
        """Test creating compliance check."""
        check = ComplianceCheck(
            id="check-1",
            name="政府采购合规检查",
            regulation="政府采购法",
            status="passed",
        )
        
        assert check.status == "passed"

    def test_check_details(self):
        """Test compliance check details."""
        check = ComplianceCheck(
            id="check-1",
            name="投标合规检查",
            regulation="招投标法",
        )
        
        check.add_result("招标文件审查", True, "符合规定")
        check.add_result("保证金缴纳", True, "已缴纳")
        check.add_result("投标文件密封", False, "密封不规范")
        
        assert len(check.results) == 3
        assert check.passed_count == 2
