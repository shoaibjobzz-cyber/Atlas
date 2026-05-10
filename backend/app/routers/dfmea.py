from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.models.user import User
from app.schemas.dfmea import (
    DfmeaEntryCreate,
    DfmeaEntryResponse,
    DfmeaEntryUpdate,
    DfmeaFilterResponse,
    DfmeaSuggestionResponse,
)
from app.services.auth_service import require_current_user
from app.services.dfmea_service import (
    DfmeaEntryConflictError,
    DfmeaEntryNotFoundError,
    create_dfmea_entry,
    delete_dfmea_entry,
    get_dfmea_entry,
    get_dfmea_filters,
    get_dfmea_suggestion,
    list_dfmea_entries,
    list_dfmea_entries_for_requirement,
    update_dfmea_entry,
)
from app.services.projects_service import ProjectNotFoundError
from app.services.requirements_service import RequirementNotFoundError


router = APIRouter(prefix="/dfmea", tags=["dfmea"])


@router.get("", response_model=list[DfmeaEntryResponse])
def get_project_dfmea_entries(
    project_id: str = Query(..., min_length=1),
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> list[DfmeaEntryResponse]:
    return list_dfmea_entries(session, project_id, current_user.id)


@router.get("/filters", response_model=DfmeaFilterResponse)
def get_project_dfmea_filters(
    project_id: str = Query(..., min_length=1),
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> DfmeaFilterResponse:
    return get_dfmea_filters(session, project_id, current_user.id)


@router.get("/by-requirement/{requirement_id}", response_model=list[DfmeaEntryResponse])
def get_requirement_dfmea_entries(
    requirement_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> list[DfmeaEntryResponse]:
    try:
        return list_dfmea_entries_for_requirement(session, requirement_id, current_user.id)
    except RequirementNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/suggestions/by-requirement/{requirement_id}", response_model=DfmeaSuggestionResponse)
def get_requirement_dfmea_suggestion(
    requirement_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> DfmeaSuggestionResponse:
    try:
        return get_dfmea_suggestion(session, requirement_id, current_user.id)
    except RequirementNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/{dfmea_entry_id}", response_model=DfmeaEntryResponse)
def get_dfmea_entry_by_id(
    dfmea_entry_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> DfmeaEntryResponse:
    try:
        return get_dfmea_entry(session, dfmea_entry_id, current_user.id)
    except DfmeaEntryNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("", response_model=DfmeaEntryResponse, status_code=status.HTTP_201_CREATED)
def post_dfmea_entry(
    payload: DfmeaEntryCreate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> DfmeaEntryResponse:
    try:
        return create_dfmea_entry(session, payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except RequirementNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except DfmeaEntryConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.put("/{dfmea_entry_id}", response_model=DfmeaEntryResponse)
def put_dfmea_entry(
    dfmea_entry_id: str,
    payload: DfmeaEntryUpdate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> DfmeaEntryResponse:
    try:
        return update_dfmea_entry(session, dfmea_entry_id, payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except RequirementNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except DfmeaEntryNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except DfmeaEntryConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.delete("/{dfmea_entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_dfmea_entry(
    dfmea_entry_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> Response:
    try:
        delete_dfmea_entry(session, dfmea_entry_id, current_user.id)
    except DfmeaEntryNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)
