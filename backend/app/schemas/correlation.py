from pydantic import BaseModel


class CorrelatedRequirementReference(BaseModel):
    id: str
    requirement_code: str
    title: str
    type: str
    status: str


class RequirementCorrelationItem(BaseModel):
    requirement: CorrelatedRequirementReference | None = None
    reason: str


class RequirementCorrelationSummary(BaseModel):
    related_requirements: list[RequirementCorrelationItem]
    potential_conflicts: list[RequirementCorrelationItem]
