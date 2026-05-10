from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


SnapshotType = Literal["validation", "report"]


class ProjectSnapshotBase(BaseModel):
    project_id: str
    snapshot_type: SnapshotType
    name: str
    notes: str | None = None
    created_by: str | None = None


class ProjectSnapshotSummaryResponse(ProjectSnapshotBase):
    id: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CreateProjectSnapshotRequest(BaseModel):
    snapshot_type: SnapshotType
    name: str | None = Field(default=None, max_length=255)
    notes: str | None = None
    created_by: str | None = Field(default=None, max_length=128)


class ProjectSnapshotDetailResponse(ProjectSnapshotSummaryResponse):
    payload: dict[str, Any]


class SnapshotComparisonDelta(BaseModel):
    current: float
    snapshot: float
    delta: float


class ProjectSnapshotComparisonResponse(BaseModel):
    snapshot: ProjectSnapshotSummaryResponse
    snapshot_type: SnapshotType
    deltas: dict[str, SnapshotComparisonDelta]
