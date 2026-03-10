"""
Simple project lifecycle state machine.
Defines valid stage transitions and provides transition functions.
"""
from src.core.models import ProjectStage

# Valid transitions: current_stage -> list of allowed next stages
TRANSITIONS: dict[ProjectStage, list[ProjectStage]] = {
    ProjectStage.INITIATION: [ProjectStage.BIDDING, ProjectStage.CONTRACT],
    ProjectStage.BIDDING: [ProjectStage.CONTRACT, ProjectStage.INITIATION],
    ProjectStage.CONTRACT: [ProjectStage.DESIGN],
    ProjectStage.DESIGN: [ProjectStage.PROCUREMENT, ProjectStage.CONSTRUCTION],
    ProjectStage.PROCUREMENT: [ProjectStage.CONSTRUCTION],
    ProjectStage.CONSTRUCTION: [ProjectStage.ACCEPTANCE],
    ProjectStage.ACCEPTANCE: [ProjectStage.SETTLEMENT],
    ProjectStage.SETTLEMENT: [ProjectStage.ARCHIVED],
    ProjectStage.ARCHIVED: [],
}

# Chinese labels for each stage
STAGE_LABELS: dict[ProjectStage, str] = {
    ProjectStage.INITIATION: "立项",
    ProjectStage.BIDDING: "投标",
    ProjectStage.CONTRACT: "签约",
    ProjectStage.DESIGN: "设计",
    ProjectStage.PROCUREMENT: "采购",
    ProjectStage.CONSTRUCTION: "施工/实施",
    ProjectStage.ACCEPTANCE: "验收",
    ProjectStage.SETTLEMENT: "结算",
    ProjectStage.ARCHIVED: "归档",
}


def can_transition(current: ProjectStage, target: ProjectStage) -> bool:
    """Check whether transitioning from current to target is valid."""
    allowed = TRANSITIONS.get(current, [])
    return target in allowed


def get_valid_transitions(current: ProjectStage) -> list[dict[str, str]]:
    """Return the list of valid next stages with their labels."""
    allowed = TRANSITIONS.get(current, [])
    return [
        {"stage": stage.value, "label": STAGE_LABELS.get(stage, stage.value)}
        for stage in allowed
    ]


def get_stage_label(stage: ProjectStage) -> str:
    """Return the Chinese label for a stage."""
    return STAGE_LABELS.get(stage, stage.value)
