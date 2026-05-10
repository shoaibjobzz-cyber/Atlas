from pydantic import BaseModel, Field

from app.schemas.generation import (
    GeneratedRequirementCandidateBase,
    GeneratedRequirementCandidateValidation,
)
from app.schemas.requirement import RequirementResponse


class EcuRequirementMergerAnalyzeRequest(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    requirement_ids: list[str] = Field(min_length=1)


class EcuRequirementMergerTraceabilityItem(BaseModel):
    requirement: RequirementResponse
    source_subsystem: str | None = None
    source_feature_label: str | None = None
    traceability_reason: str


class EcuRequirementMergerAffectedDesignParameter(BaseModel):
    id: str
    name: str
    parameter_name: str
    value: str
    unit: str | None = None
    subsystem: str | None = None
    linked_requirement_ids: list[str] = Field(default_factory=list)
    reason: str


class EcuRequirementMergerCandidateReview(GeneratedRequirementCandidateBase):
    temp_id: str = Field(min_length=1, max_length=64)
    suggested_id: str = Field(min_length=1, max_length=64)
    suggested_hierarchy: str | None = Field(default=None, max_length=128)
    validation: GeneratedRequirementCandidateValidation
    draft_label: str
    source_requirement_ids: list[str] = Field(default_factory=list)
    source_requirement_codes: list[str] = Field(default_factory=list)
    source_subsystems: list[str] = Field(default_factory=list)
    merge_rationale: str
    assumptions_list: list[str] = Field(default_factory=list)
    conflicts: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    recommended_fix_actions: list[str] = Field(default_factory=list)
    verification_notes: list[str] = Field(default_factory=list)
    shared_signals_or_interfaces: list[str] = Field(default_factory=list)
    timing_constraints: list[str] = Field(default_factory=list)
    safety_security_constraints: list[str] = Field(default_factory=list)
    affected_design_parameters: list[EcuRequirementMergerAffectedDesignParameter] = Field(default_factory=list)
    traceability: list[EcuRequirementMergerTraceabilityItem] = Field(default_factory=list)


class EcuRequirementMergerAnalyzeResponse(BaseModel):
    project_id: str
    selected_requirement_ids: list[str] = Field(default_factory=list)
    selected_requirement_count: int
    candidates: list[EcuRequirementMergerCandidateReview] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class EcuRequirementMergerSaveCandidate(GeneratedRequirementCandidateBase):
    temp_id: str = Field(min_length=1, max_length=64)


class EcuRequirementMergerSaveRequest(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    candidates: list[EcuRequirementMergerSaveCandidate] = Field(min_length=1)
