from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.models.user import User
from app.schemas.requirement_section import (
    RequirementSectionCreate,
    RequirementSectionResponse,
    RequirementSectionUpdate,
)
from app.services.auth_service import require_current_user
from app.services.projects_service import ProjectNotFoundError
from app.services.requirement_sections_service import (
    RequirementSectionConflictError,
    RequirementSectionNotFoundError,
    create_requirement_section,
    delete_requirement_section,
    list_requirement_sections,
    update_requirement_section,
)


router = APIRouter(prefix="/requirement-sections", tags=["requirement-sections"])


@router.get("", response_model=list[RequirementSectionResponse])
def get_requirement_sections(
    project_id: str = Query(..., min_length=1),
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> list[RequirementSectionResponse]:
    return list_requirement_sections(session, project_id, current_user.id)


@router.post("", response_model=RequirementSectionResponse, status_code=status.HTTP_201_CREATED)
def post_requirement_section(
    payload: RequirementSectionCreate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> RequirementSectionResponse:
    try:
        return create_requirement_section(session, payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except RequirementSectionConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.put("/{section_id}", response_model=RequirementSectionResponse)
def put_requirement_section(
    section_id: str,
    payload: RequirementSectionUpdate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> RequirementSectionResponse:
    try:
        return update_requirement_section(session, section_id, payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except RequirementSectionConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except RequirementSectionNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.delete("/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_requirement_section(
    section_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> Response:
    try:
        delete_requirement_section(session, section_id, current_user.id)
    except RequirementSectionNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)
