from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ProjectStatus = Literal["Draft", "In Review", "Active", "Archived"]
ProjectKind = Literal["Standard", "Platform"]


class ProjectBase(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    description: str | None = None
    status: ProjectStatus = "Draft"
    project_kind: ProjectKind = "Standard"


class ProjectCreate(ProjectBase):
    id: str | None = Field(default=None, min_length=1, max_length=64)


class ProjectUpdate(ProjectBase):
    pass


class ProjectResponse(ProjectBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
