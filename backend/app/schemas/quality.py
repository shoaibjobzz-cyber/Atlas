from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.requirement import RequirementType


class RequirementQualityCheckRequest(BaseModel):
    title: str = Field(default="")
    text: str = Field(default="")
    type: RequirementType


class RequirementQualityWarning(BaseModel):
    severity: str
    rule_id: str
    title: str
    explanation: str
    suggestion: str


class RequirementQualityIssue(BaseModel):
    rule_id: str
    rule_name: str
    severity: Literal["info", "warning", "error"]
    problematic_phrase: str
    explanation: str
    suggested_correction: str


class RequirementRewriteRecommendation(BaseModel):
    title: str
    text: str
    explanation: str
    rule_coverage: list[str] = Field(default_factory=list)


class RequirementQualitySummary(BaseModel):
    score: int
    warnings: list[RequirementQualityWarning]
    issues: list[RequirementQualityIssue] = Field(default_factory=list)
    suggested_rewrite: RequirementRewriteRecommendation | None = None
    explanation: str | None = None
