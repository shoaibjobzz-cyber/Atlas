from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, computed_field

from app.schemas.requirement import RequirementResponse, RequirementType


DfmeaStatus = Literal["Open", "In Review", "Mitigating", "Closed"]


class DfmeaRiskReference(BaseModel):
    requirement_id: str
    requirement_code: str
    title: str
    reason: str


class DfmeaSuggestionResponse(BaseModel):
    project_id: str
    requirement: RequirementResponse
    function_candidate: str
    failure_effect_candidates: list[str] = Field(default_factory=list)
    potential_cause_candidates: list[str] = Field(default_factory=list)
    current_prevention_controls_candidate: str | None = None
    current_detection_controls_candidate: str | None = None
    severity_suggestion: int
    occurrence_suggestion: int
    detection_suggestion: int
    recommended_action_candidate: str | None = None
    warnings: list[str] = Field(default_factory=list)
    related_impacted_requirements: list[DfmeaRiskReference] = Field(default_factory=list)


class DfmeaEntryBase(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    requirement_id: str = Field(min_length=1, max_length=64)
    function: str = Field(min_length=3)
    failure_mode: str = ""
    failure_effect: str = ""
    potential_cause: str = ""
    current_prevention_controls: str | None = None
    current_detection_controls: str | None = ""
    severity: int = Field(ge=1, le=10)
    occurrence: int = Field(ge=1, le=10)
    detection: int = Field(ge=1, le=10)
    recommended_action: str | None = None
    owner: str | None = Field(default=None, max_length=128)
    status: DfmeaStatus = "Open"
    related_requirement_ids: list[str] = Field(default_factory=list)

    @computed_field
    @property
    def rpn(self) -> int:
        return self.severity * self.occurrence * self.detection


class DfmeaEntryCreate(DfmeaEntryBase):
    id: str | None = Field(default=None, max_length=64)


class DfmeaEntryUpdate(DfmeaEntryBase):
    pass


class DfmeaEntryResponse(DfmeaEntryBase):
    id: str
    requirement: RequirementResponse
    related_requirements: list[RequirementResponse] = Field(default_factory=list)
    created_by_user_id: str
    updated_by_user_id: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DfmeaFilterResponse(BaseModel):
    project_id: str
    statuses: list[DfmeaStatus] = Field(default_factory=list)
    subsystems: list[str] = Field(default_factory=list)
    requirement_types: list[RequirementType] = Field(default_factory=list)
