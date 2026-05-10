from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.models.user import User
from app.schemas.correlation import RequirementCorrelationSummary
from app.schemas.requirement import (
    RequirementCreate,
    RequirementIdPreviewResponse,
    RequirementResponse,
    RequirementType,
    RequirementUpdate,
)
from app.services.auth_service import require_current_user
from app.services.correlation_service import get_requirement_correlations
from app.services.requirement_id_service import preview_next_requirement_id
from app.services.requirements_service import (
    RequirementConflictError,
    RequirementDeletedError,
    RequirementNotFoundError,
    create_requirement,
    delete_requirement,
    get_requirement,
    list_requirements,
    update_requirement,
)
from app.services.projects_service import ProjectNotFoundError


router = APIRouter(prefix="/requirements", tags=["requirements"])


@router.get("", response_model=list[RequirementResponse])
def get_requirements(
    project_id: str = Query(..., min_length=1),
    include_deleted: bool = Query(False),
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> list[RequirementResponse]:
    return list_requirements(session, project_id, current_user.id, include_deleted=include_deleted)


@router.post("", response_model=RequirementResponse, status_code=status.HTTP_201_CREATED)
def post_requirement(
    payload: RequirementCreate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> RequirementResponse:
    try:
        return create_requirement(session, payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except RequirementConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.get("/id-preview", response_model=RequirementIdPreviewResponse)
def get_requirement_id_preview(
    project_id: str = Query(..., min_length=1),
    requirement_type: RequirementType = Query(..., alias="type"),
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> RequirementIdPreviewResponse:
    try:
        from app.services.projects_service import ensure_project_exists

        ensure_project_exists(session, project_id, current_user.id)
        return RequirementIdPreviewResponse(
            requirement_type=requirement_type,
            preview_id=preview_next_requirement_id(session, project_id, requirement_type),
        )
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/{requirement_id}", response_model=RequirementResponse)
def get_requirement_by_id(
    requirement_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> RequirementResponse:
    try:
        return get_requirement(session, requirement_id, current_user.id)
    except RequirementNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/{requirement_id}/correlations", response_model=RequirementCorrelationSummary)
def get_requirement_correlations_by_id(
    requirement_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> RequirementCorrelationSummary:
    try:
        requirement = get_requirement(session, requirement_id, current_user.id)
        return get_requirement_correlations(session, requirement.id)
    except RequirementNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.put("/{requirement_id}", response_model=RequirementResponse)
def put_requirement(
    requirement_id: str,
    payload: RequirementUpdate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> RequirementResponse:
    try:
        return update_requirement(session, requirement_id, payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except RequirementDeletedError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except RequirementConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except RequirementNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.delete("/{requirement_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_requirement(
    requirement_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> Response:
    try:
        delete_requirement(session, requirement_id, current_user.id)
    except RequirementDeletedError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except RequirementNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)
