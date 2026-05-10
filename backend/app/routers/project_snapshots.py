from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.models.user import User
from app.schemas.project_snapshots import (
    CreateProjectSnapshotRequest,
    ProjectSnapshotComparisonResponse,
    ProjectSnapshotDetailResponse,
    ProjectSnapshotSummaryResponse,
)
from app.services.auth_service import require_current_user
from app.services.project_snapshots_service import (
    ProjectSnapshotNotFoundError,
    compare_project_snapshot,
    create_project_snapshot,
    get_project_snapshot,
    list_project_snapshots,
)
from app.services.projects_service import ProjectNotFoundError


router = APIRouter(prefix="/projects/{project_id}/snapshots", tags=["project-snapshots"])


@router.post("", response_model=ProjectSnapshotDetailResponse, status_code=status.HTTP_201_CREATED)
def post_project_snapshot(
    project_id: str,
    payload: CreateProjectSnapshotRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> ProjectSnapshotDetailResponse:
    try:
        return create_project_snapshot(
            session,
            project_id,
            payload,
            owner_user_id=current_user.id,
            created_by=current_user.username,
        )
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("", response_model=list[ProjectSnapshotSummaryResponse])
def get_project_snapshots(
    project_id: str,
    snapshot_type: str | None = None,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> list[ProjectSnapshotSummaryResponse]:
    try:
        return list_project_snapshots(session, project_id, snapshot_type, owner_user_id=current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/{snapshot_id}", response_model=ProjectSnapshotDetailResponse)
def get_snapshot(
    project_id: str,
    snapshot_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> ProjectSnapshotDetailResponse:
    try:
        return get_project_snapshot(session, project_id, snapshot_id, owner_user_id=current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ProjectSnapshotNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/{snapshot_id}/compare", response_model=ProjectSnapshotComparisonResponse)
def get_snapshot_comparison(
    project_id: str,
    snapshot_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> ProjectSnapshotComparisonResponse:
    try:
        return compare_project_snapshot(session, project_id, snapshot_id, owner_user_id=current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ProjectSnapshotNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
