from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.schemas.project_feature import (
    ProjectFeatureCreate,
    ProjectFeatureResponse,
    ProjectFeatureUpdate,
)
from app.services.auth_service import require_current_user
from app.services.project_features_service import (
    ProjectFeatureConflictError,
    ProjectFeatureNotFoundError,
    create_project_feature,
    delete_project_feature,
    list_project_features,
    update_project_feature,
)
from app.services.projects_service import (
    ProjectConflictError,
    ProjectNotFoundError,
    create_project,
    delete_project,
    get_project,
    list_projects,
    update_project,
)


router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
def get_projects(
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> list[ProjectResponse]:
    return list_projects(session, current_user.id)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def post_project(
    payload: ProjectCreate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> ProjectResponse:
    try:
        return create_project(session, payload, current_user.id)
    except ProjectConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project_by_id(
    project_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> ProjectResponse:
    try:
        return get_project(session, project_id, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.put("/{project_id}", response_model=ProjectResponse)
def put_project(
    project_id: str,
    payload: ProjectUpdate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> ProjectResponse:
    try:
        return update_project(session, project_id, payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project(
    project_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> Response:
    try:
        delete_project(session, project_id, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{project_id}/features", response_model=list[ProjectFeatureResponse])
def get_project_features(
    project_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> list[ProjectFeatureResponse]:
    try:
        return list_project_features(session, project_id, current_user.id)
    except (ProjectNotFoundError, ProjectFeatureConflictError) as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("/{project_id}/features", response_model=ProjectFeatureResponse, status_code=status.HTTP_201_CREATED)
def post_project_feature(
    project_id: str,
    payload: ProjectFeatureCreate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> ProjectFeatureResponse:
    try:
        feature_payload = payload.model_copy(update={"project_id": project_id})
        return create_project_feature(session, feature_payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ProjectFeatureConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.put("/{project_id}/features/{feature_id}", response_model=ProjectFeatureResponse)
def put_project_feature(
    project_id: str,
    feature_id: str,
    payload: ProjectFeatureUpdate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> ProjectFeatureResponse:
    try:
        feature_payload = payload.model_copy(update={"project_id": project_id})
        return update_project_feature(session, feature_id, feature_payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ProjectFeatureConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except ProjectFeatureNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.delete("/{project_id}/features/{feature_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_feature(
    project_id: str,
    feature_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> Response:
    try:
        ensure_project = get_project(session, project_id, current_user.id)
        _ = ensure_project
        delete_project_feature(session, feature_id, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ProjectFeatureNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)
