from typing import Any

from pydantic import BaseModel, Field


class FeasibilityEvidenceItem(BaseModel):
    source: str
    detail: str


class RequirementFeasibilityConstraint(BaseModel):
    constraint_type: str | None = None
    parameter: str | None = None
    operator: str | None = None
    value: float | None = None
    unit: str | None = None
    condition: str | None = None
    scope: str | None = None


class DesignParameterEvaluationInput(BaseModel):
    parameter_name: str
    value: float | None = None
    unit: str | None = None
    category: str | None = None
    contributes_to: str | None = None


class RequirementFeasibilityAssessment(BaseModel):
    assessment_status: str
    explanation: str
    evidence_used: list[FeasibilityEvidenceItem]
    assumptions: list[str]
    confidence: float
    computed_values: dict[str, Any] = Field(default_factory=dict)
