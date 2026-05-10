from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


RequirementSectionKind = Literal["Header", "Subheader"]


class RequirementSectionBase(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    parent_section_id: str | None = Field(default=None, max_length=64)
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    kind: RequirementSectionKind
    order_index: int = Field(default=0, ge=0)


class RequirementSectionCreate(RequirementSectionBase):
    id: str | None = Field(default=None, max_length=64)


class RequirementSectionUpdate(RequirementSectionBase):
    pass


class RequirementSectionResponse(RequirementSectionBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
