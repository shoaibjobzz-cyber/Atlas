from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.models.user import User
from app.schemas.design_parameter import (
    DesignParameterCreate,
    DesignParameterResponse,
    DesignParameterUpdate,
    LinkedDesignParameterReference,
)
from app.services.auth_service import require_current_user
from app.services.design_parameters_service import (
    DesignParameterConflictError,
    DesignParameterLinkError,
    DesignParameterNotFoundError,
    create_design_parameter,
    delete_design_parameter,
    get_design_parameter,
    list_design_parameters,
    list_design_parameters_for_requirement,
    update_design_parameter,
)
from app.services.projects_service import ProjectNotFoundError


router = APIRouter(prefix="/design-parameters", tags=["design-parameters"])


@router.get("", response_model=list[DesignParameterResponse])
def get_design_parameters(
    project_id: str = Query(..., min_length=1),
    subsystem: str | None = Query(default=None),
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> list[DesignParameterResponse]:
    return list_design_parameters(session, project_id, subsystem, current_user.id)


@router.post("", response_model=DesignParameterResponse, status_code=status.HTTP_201_CREATED)
def post_design_parameter(
    payload: DesignParameterCreate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> DesignParameterResponse:
    try:
        return create_design_parameter(session, payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except DesignParameterConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
    except DesignParameterLinkError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.get("/{design_parameter_id}", response_model=DesignParameterResponse)
def get_design_parameter_by_id(
    design_parameter_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> DesignParameterResponse:
    try:
        return get_design_parameter(session, design_parameter_id, current_user.id)
    except DesignParameterNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.put("/{design_parameter_id}", response_model=DesignParameterResponse)
def put_design_parameter(
    design_parameter_id: str,
    payload: DesignParameterUpdate,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> DesignParameterResponse:
    try:
        return update_design_parameter(session, design_parameter_id, payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except DesignParameterNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except DesignParameterLinkError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.delete("/{design_parameter_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_design_parameter(
    design_parameter_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> Response:
    try:
        delete_design_parameter(session, design_parameter_id, current_user.id)
    except DesignParameterNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/by-requirement/{requirement_id}", response_model=list[LinkedDesignParameterReference])
def get_design_parameters_for_requirement(
    requirement_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> list[LinkedDesignParameterReference]:
    try:
        return list_design_parameters_for_requirement(session, requirement_id, current_user.id)
    except DesignParameterLinkError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
