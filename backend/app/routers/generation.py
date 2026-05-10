from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.models.user import User
from app.schemas.ecu_merger import (
    EcuRequirementMergerAnalyzeRequest,
    EcuRequirementMergerAnalyzeResponse,
    EcuRequirementMergerSaveRequest,
)
from app.schemas.generation import (
    GeneratedRequirementCandidateReview,
    RequirementRewriteSuggestionRequestPayload,
    RequirementRewriteSuggestionResponse,
    RequirementGenerationRequest,
    RequirementGenerationResponse,
    RequirementGenerationReviewPayload,
    RequirementGenerationSaveRequest,
    RequirementGenerationSaveResponse,
)
from app.services.auth_service import require_current_user
from app.services.ecu_requirement_merger_service import (
    analyze_ecu_requirement_merge,
    save_merged_requirement_candidates,
)
from app.services.requirement_generation_service import (
    generate_requirement_candidates,
    review_generated_candidates,
    save_generated_candidates,
    suggest_requirement_rewrites,
)
from app.services.requirement_generation_provider import RequirementGenerationProviderError
from app.services.requirements_service import RequirementConflictError, RequirementNotFoundError
from app.services.projects_service import ProjectNotFoundError, ensure_project_exists


router = APIRouter(prefix="/requirement-generation", tags=["requirement-generation"])


@router.post("/generate", response_model=RequirementGenerationResponse)
def post_generate_requirements(
    payload: RequirementGenerationRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> RequirementGenerationResponse:
    try:
        ensure_project_exists(session, payload.project_id, current_user.id)
        return generate_requirement_candidates(session, payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except RequirementNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except RequirementGenerationProviderError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error


@router.post("/review", response_model=list[GeneratedRequirementCandidateReview])
def post_review_generated_requirements(
    payload: RequirementGenerationReviewPayload,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> list[GeneratedRequirementCandidateReview]:
    try:
        ensure_project_exists(session, payload.project_id, current_user.id)
        return review_generated_candidates(session, payload.project_id, payload.candidates)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("/save", response_model=RequirementGenerationSaveResponse, status_code=status.HTTP_201_CREATED)
def post_save_generated_requirements(
    payload: RequirementGenerationSaveRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> RequirementGenerationSaveResponse:
    try:
        ensure_project_exists(session, payload.project_id, current_user.id)
        return save_generated_candidates(session, payload, owner_user_id=current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except RequirementConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error


@router.post("/rewrite-suggestions", response_model=RequirementRewriteSuggestionResponse)
def post_requirement_rewrite_suggestions(
    payload: RequirementRewriteSuggestionRequestPayload,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> RequirementRewriteSuggestionResponse:
    try:
        ensure_project_exists(session, payload.project_id, current_user.id)
        return suggest_requirement_rewrites(session, payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except RequirementGenerationProviderError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error


@router.post("/ecu-merger/analyze", response_model=EcuRequirementMergerAnalyzeResponse)
def post_analyze_ecu_requirement_merge(
    payload: EcuRequirementMergerAnalyzeRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> EcuRequirementMergerAnalyzeResponse:
    try:
        ensure_project_exists(session, payload.project_id, current_user.id)
        return analyze_ecu_requirement_merge(session, payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post("/ecu-merger/save", response_model=RequirementGenerationSaveResponse, status_code=status.HTTP_201_CREATED)
def post_save_ecu_requirement_merge(
    payload: EcuRequirementMergerSaveRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> RequirementGenerationSaveResponse:
    try:
        ensure_project_exists(session, payload.project_id, current_user.id)
        return save_merged_requirement_candidates(session, payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except RequirementConflictError as error:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(error)) from error
