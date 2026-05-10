from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.structured_requirement import StructuredRequirementFields


RequirementType = Literal["Stakeholder", "System", "Subsystem", "Software", "Hardware"]
RequirementPriority = Literal["Low", "Medium", "High", "Critical"]
RequirementStatus = Literal["Draft", "In Review", "Approved", "Rejected"]
GenerationSource = Literal["ai", "manual"]
GenerationProvider = Literal["mock", "ollama", "openai", "future_llm"]


class RequirementGenerationMetadata(BaseModel):
    generation_source: GenerationSource
    generation_provider: GenerationProvider | None = None
    generated_from_requirement_id: str | None = Field(default=None, max_length=64)
    is_generated_draft: bool = False
    merged_from_requirement_ids: list[str] = Field(default_factory=list)
    merged_from_requirement_codes: list[str] = Field(default_factory=list)
    merged_from_subsystems: list[str] = Field(default_factory=list)
    merge_strategy: str | None = None


class RequirementBase(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    title: str = Field(min_length=3, max_length=255)
    text: str = Field(min_length=10)
    type: RequirementType
    priority: RequirementPriority
    status: RequirementStatus
    parent_requirement_id: str | None = Field(default=None, max_length=64)
    feature_id: str | None = Field(default=None, max_length=64)
    section_id: str | None = Field(default=None, max_length=64)
    subsystem: str | None = Field(default=None, max_length=128)
    verification_method: str | None = Field(default=None, max_length=64)
    rationale: str | None = None
    assumptions: str | None = None
    generation_metadata: RequirementGenerationMetadata | None = None


class RequirementCreate(RequirementBase):
    id: str | None = Field(default=None, max_length=64)


class RequirementUpdate(RequirementBase):
    pass


class RequirementResponse(RequirementBase):
    id: str
    requirement_code: str
    hierarchy: str | None = None
    parsed_requirement: StructuredRequirementFields | None = None
    created_by_user_id: str
    updated_by_user_id: str | None = None
    deleted_by_user_id: str | None = None
    created_by_username: str | None = None
    updated_by_username: str | None = None
    deleted_by_username: str | None = None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None
    is_deleted: bool = False

    model_config = {"from_attributes": True}


class RequirementIdPreviewResponse(BaseModel):
    requirement_type: RequirementType
    preview_id: str
