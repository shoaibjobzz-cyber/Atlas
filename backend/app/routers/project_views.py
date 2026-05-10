from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.models.user import User
from app.schemas.project_views import (
    ChangeImpactReviewRequest,
    ChangeImpactReviewResponse,
    ProjectReportSummaryResponse,
    ProjectValidationSummaryResponse,
    TraceabilityHealthScoreResponse,
    TraceabilityGraphAnalysisResponse,
    TraceabilityGraphResponse,
    TraceabilityMatrixResponse,
)
from app.services.project_views_service import (
    get_project_report_summary,
    get_traceability_health_score,
    get_traceability_broken_chain_analysis,
    get_traceability_critical_path_analysis,
    get_project_validation_summary,
    get_traceability_impact_analysis,
    get_traceability_graph,
    get_traceability_matrix,
    get_change_impact_review,
)
from app.services.auth_service import require_current_user
from app.services.projects_service import ProjectNotFoundError, ensure_project_exists


router = APIRouter(prefix="/project-views", tags=["project-views"])


@router.get("/{project_id}/validation-summary", response_model=ProjectValidationSummaryResponse)
def get_validation_summary(
    project_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> ProjectValidationSummaryResponse:
    try:
        ensure_project_exists(session, project_id, current_user.id)
        return get_project_validation_summary(session, project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/{project_id}/report-summary", response_model=ProjectReportSummaryResponse)
def get_report_summary(
    project_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> ProjectReportSummaryResponse:
    try:
        ensure_project_exists(session, project_id, current_user.id)
        return get_project_report_summary(session, project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/{project_id}/traceability-health", response_model=TraceabilityHealthScoreResponse)
def get_project_traceability_health(
    project_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> TraceabilityHealthScoreResponse:
    try:
        ensure_project_exists(session, project_id, current_user.id)
        return get_traceability_health_score(session, project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/{project_id}/traceability-graph", response_model=TraceabilityGraphResponse)
def get_project_graph(
    project_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> TraceabilityGraphResponse:
    try:
        ensure_project_exists(session, project_id, current_user.id)
        return get_traceability_graph(session, project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get(
    "/{project_id}/traceability-graph/impact/{requirement_id}",
    response_model=TraceabilityGraphAnalysisResponse,
)
def get_project_graph_impact(
    project_id: str,
    requirement_id: str,
    direction: str = "both",
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> TraceabilityGraphAnalysisResponse:
    try:
        ensure_project_exists(session, project_id, current_user.id)
        if direction not in {"both", "upstream", "downstream"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid impact direction.")
        return get_traceability_impact_analysis(session, project_id, requirement_id, direction=direction)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get(
    "/{project_id}/traceability-graph/broken-chains",
    response_model=TraceabilityGraphAnalysisResponse,
)
def get_project_graph_broken_chains(
    project_id: str,
    mode: str = "all",
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> TraceabilityGraphAnalysisResponse:
    try:
        ensure_project_exists(session, project_id, current_user.id)
        if mode not in {"all", "orphans", "missing-evidence"}:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid broken-chain mode.")
        return get_traceability_broken_chain_analysis(session, project_id, mode=mode)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get(
    "/{project_id}/traceability-graph/critical-path",
    response_model=TraceabilityGraphAnalysisResponse,
)
def get_project_graph_critical_path(
    project_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> TraceabilityGraphAnalysisResponse:
    try:
        ensure_project_exists(session, project_id, current_user.id)
        return get_traceability_critical_path_analysis(session, project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.get("/{project_id}/traceability-matrix", response_model=TraceabilityMatrixResponse)
def get_project_matrix(
    project_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> TraceabilityMatrixResponse:
    try:
        ensure_project_exists(session, project_id, current_user.id)
        return get_traceability_matrix(session, project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error


@router.post(
    "/{project_id}/change-impact-review",
    response_model=ChangeImpactReviewResponse,
)
def post_change_impact_review(
    project_id: str,
    payload: ChangeImpactReviewRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> ChangeImpactReviewResponse:
    try:
        ensure_project_exists(session, project_id, current_user.id)
        return get_change_impact_review(session, project_id, payload.change_request)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
