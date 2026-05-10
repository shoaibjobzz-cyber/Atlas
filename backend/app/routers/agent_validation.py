from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.models.user import User
from app.schemas.agent_validation import (
    AgentDocumentIndexRequest,
    AgentDocumentIndexResponse,
    AgentDocumentUploadRequest,
    AgentDocumentUploadResponse,
    RequirementRewriteRequest,
    RequirementRewriteResponse,
    RequirementValidationRequest,
    RequirementValidationResponse,
)
from app.services.auth_service import require_current_user
from app.services.agent_validation.agents.base import AgentValidationProviderError
from app.services.agent_validation.embeddings import EmbeddingError
from app.services.agent_validation.service import build_agent_validation_service
from app.services.projects_service import ProjectNotFoundError


router = APIRouter(prefix="/agent-validation", tags=["agent-validation"])


@router.post("/documents/upload", response_model=AgentDocumentUploadResponse)
def post_agent_documents_upload(
    payload: AgentDocumentUploadRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> AgentDocumentUploadResponse:
    try:
        return build_agent_validation_service(session).upload_documents(payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except (EmbeddingError, AgentValidationProviderError) as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error


@router.post("/documents/index", response_model=AgentDocumentIndexResponse)
def post_agent_documents_index(
    payload: AgentDocumentIndexRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> AgentDocumentIndexResponse:
    try:
        return build_agent_validation_service(session).index_documents(payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except (EmbeddingError, AgentValidationProviderError) as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error


@router.post("/validate", response_model=RequirementValidationResponse)
def post_agent_validate_requirement(
    payload: RequirementValidationRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> RequirementValidationResponse:
    try:
        return build_agent_validation_service(session).validate_requirement(payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except (EmbeddingError, AgentValidationProviderError) as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error


@router.post("/rewrite", response_model=RequirementRewriteResponse)
def post_agent_rewrite_requirement(
    payload: RequirementRewriteRequest,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> RequirementRewriteResponse:
    try:
        return build_agent_validation_service(session).rewrite_requirement(payload, current_user.id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from error
    except (EmbeddingError, AgentValidationProviderError) as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error
