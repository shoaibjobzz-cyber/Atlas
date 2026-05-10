from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ProjectFeatureKind = Literal["Feature", "Functional Domain", "Module"]


class ProjectFeatureBase(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    parent_feature_id: str | None = Field(default=None, max_length=64)
    name: str = Field(min_length=1, max_length=255)
    kind: ProjectFeatureKind = "Feature"
    description: str | None = None
    order_index: int = Field(default=0, ge=0)


class ProjectFeatureCreate(ProjectFeatureBase):
    id: str | None = Field(default=None, max_length=64)


class ProjectFeatureUpdate(ProjectFeatureBase):
    pass


class ProjectFeatureResponse(ProjectFeatureBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
