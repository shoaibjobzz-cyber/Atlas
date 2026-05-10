from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.correlation import RequirementCorrelationSummary
from app.schemas.quality import RequirementQualitySummary
from app.schemas.requirement import (
    RequirementGenerationMetadata,
    RequirementPriority,
    RequirementResponse,
    RequirementType,
)
from app.schemas.structured_requirement import StructuredRequirementFields


GenerationMode = Literal["feature", "decompose"]
RewriteGoal = Literal[
    "make_measurable",
    "improve_testability",
    "reduce_ambiguity",
    "clarify_units_conditions_scope",
    "decompose_wording",
]


class GeneratedRequirementCandidateBase(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    text: str = Field(min_length=10)
    type: RequirementType
    priority: RequirementPriority
    rationale: str | None = None
    parent_requirement_id: str | None = Field(default=None, max_length=64)
    subsystem: str | None = Field(default=None, max_length=128)
    verification_method: str | None = Field(default=None, max_length=64)
    assumptions: str | None = None
    generation_metadata: RequirementGenerationMetadata


class GeneratedRequirementCandidateValidation(BaseModel):
    quality_summary: RequirementQualitySummary
    parsed_requirement: StructuredRequirementFields
    correlation_summary: RequirementCorrelationSummary


class GeneratedRequirementCandidateReview(GeneratedRequirementCandidateBase):
    temp_id: str = Field(min_length=1, max_length=64)
    suggested_id: str = Field(min_length=1, max_length=64)
    suggested_hierarchy: str | None = Field(default=None, max_length=128)
    validation: GeneratedRequirementCandidateValidation
    draft_label: str


class RequirementGenerationRequest(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    mode: GenerationMode
    feature_description: str | None = Field(default=None, min_length=3)
    source_requirement_id: str | None = Field(default=None, max_length=64)


class GeneratedRequirementCandidateInput(GeneratedRequirementCandidateBase):
    temp_id: str = Field(min_length=1, max_length=64)
    suggested_id: str = Field(min_length=1, max_length=64)
    suggested_hierarchy: str | None = Field(default=None, max_length=128)


class RequirementGenerationReviewPayload(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    candidates: list[GeneratedRequirementCandidateInput]


class RequirementGenerationSaveCandidate(GeneratedRequirementCandidateBase):
    temp_id: str = Field(min_length=1, max_length=64)


class RequirementGenerationSaveRequest(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    candidates: list[RequirementGenerationSaveCandidate]


class RequirementGenerationResponse(BaseModel):
    project_id: str
    mode: GenerationMode
    source_requirement_id: str | None = None
    candidates: list[GeneratedRequirementCandidateReview]


class RequirementGenerationSaveResponse(BaseModel):
    saved_requirements: list[RequirementResponse]


class RequirementRewriteSuggestionItem(BaseModel):
    title: str
    text: str
    rationale: str
    generation_metadata: RequirementGenerationMetadata
    validation: GeneratedRequirementCandidateValidation
    draft_label: str


class RequirementRewriteSuggestionRequestPayload(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    requirement_id: str | None = Field(default=None, max_length=64)
    title: str = Field(min_length=3, max_length=255)
    text: str = Field(min_length=10)
    type: RequirementType
    goals: list[RewriteGoal] = Field(default_factory=list)


class RequirementRewriteSuggestionResponse(BaseModel):
    provider: str | None = None
    suggestions: list[RequirementRewriteSuggestionItem]
