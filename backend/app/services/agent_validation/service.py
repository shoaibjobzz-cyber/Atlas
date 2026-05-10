import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.requirement import Requirement
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
from app.services.agent_validation.agents.base import OpenAIAgentsRuntime
from app.services.agent_validation.agents.deep_review_agent import DeepReviewAgent
from app.services.agent_validation.agents.ingest_agent import IngestAgent
from app.services.agent_validation.agents.rewrite_agent import RewriteAgent
from app.services.agent_validation.agents.triage_agent import TriageAgent
from app.services.agent_validation.embeddings import OpenAIEmbeddingService
from app.services.agent_validation.evaluators import run_post_validation_evaluators
from app.services.agent_validation.guardrails import run_input_guardrails, run_output_guardrails
from app.services.agent_validation.retrieval import (
    RetrievalAgent,
    build_duplicate_candidates,
    to_retrieved_chunk_references,
)
from app.services.agent_validation.router import decide_validation_route
from app.services.agent_validation.vector_store import vector_store
from app.services.projects_service import ensure_project_exists


logger = logging.getLogger(__name__)


class AgentValidationService:
    def __init__(
        self,
        session: Session,
        *,
        store=vector_store,
        embedding_service: OpenAIEmbeddingService | None = None,
        runtime: OpenAIAgentsRuntime | None = None,
    ) -> None:
        self._session = session
        self._store = store
        self._embedding_service: OpenAIEmbeddingService | None = embedding_service
        self._runtime: OpenAIAgentsRuntime | None = runtime

    def _get_embedding_service(self) -> OpenAIEmbeddingService:
        if self._embedding_service is None:
            self._embedding_service = OpenAIEmbeddingService()
        return self._embedding_service

    def _get_runtime(self) -> OpenAIAgentsRuntime:
        if self._runtime is None:
            self._runtime = OpenAIAgentsRuntime()
        return self._runtime

    def _build_ingest_agent(self) -> IngestAgent:
        return IngestAgent(self._store, self._get_embedding_service())

    def _build_retrieval_agent(self) -> RetrievalAgent:
        return RetrievalAgent(self._store, self._get_embedding_service())

    def upload_documents(
        self,
        payload: AgentDocumentUploadRequest,
        owner_user_id: str | None = None,
    ) -> AgentDocumentUploadResponse:
        ensure_project_exists(self._session, payload.project_id, owner_user_id)
        return IngestAgent(self._store, None).upload_documents(payload)

    def index_documents(
        self,
        payload: AgentDocumentIndexRequest,
        owner_user_id: str | None = None,
    ) -> AgentDocumentIndexResponse:
        ensure_project_exists(self._session, payload.project_id, owner_user_id)
        return self._build_ingest_agent().index_documents(
            project_id=payload.project_id,
            document_ids=payload.document_ids,
            chunk_size=settings.agent_chunk_size,
            chunk_overlap=settings.agent_chunk_overlap,
        )

    def validate_requirement(
        self,
        payload: RequirementValidationRequest,
        owner_user_id: str | None = None,
    ) -> RequirementValidationResponse:
        ensure_project_exists(self._session, payload.project_id, owner_user_id)
        run_input_guardrails(payload)

        retrieved_chunks = self._build_retrieval_agent().retrieve(
            project_id=payload.project_id,
            requirement_text=payload.requirement_text,
            top_k=settings.agent_top_k_chunks,
        )
        duplicate_candidates = build_duplicate_candidates(
            requirement_text=payload.requirement_text,
            existing_requirements=self._load_existing_requirements(
                payload.project_id,
                current_requirement_id=payload.current_requirement_id,
            ),
            max_candidates=settings.agent_max_duplicate_candidates,
        )

        logger.info(
            "Running triage agent for project=%s requirement_title=%s with %s chunks",
            payload.project_id,
            payload.requirement_title,
            len(retrieved_chunks),
        )
        triage_result = TriageAgent(self._get_runtime()).review(
            requirement_title=payload.requirement_title,
            requirement_text=payload.requirement_text,
            requirement_type=payload.requirement_type,
            retrieved_chunks=retrieved_chunks,
            duplicate_candidates=duplicate_candidates,
        )
        route_decision = decide_validation_route(
            triage_result,
            confidence_threshold=settings.agent_triage_confidence_threshold,
        )

        if route_decision.route_taken == "deep_review":
            logger.info(
                "Escalating requirement review for project=%s title=%s because: %s",
                payload.project_id,
                payload.requirement_title,
                route_decision.reason,
            )
            deep_review_result = DeepReviewAgent(self._get_runtime()).review(
                requirement_title=payload.requirement_title,
                requirement_text=payload.requirement_text,
                requirement_type=payload.requirement_type,
                triage_summary=triage_result,
                retrieved_chunks=retrieved_chunks,
            )
            response = RequirementValidationResponse(
                status=deep_review_result.status,
                confidence=deep_review_result.confidence,
                needs_escalation=True,
                route_taken="deep_review",
                router_reason=route_decision.reason,
                issues=deep_review_result.issues,
                rewritten_requirement=deep_review_result.rewritten_requirement,
                traceability_suggestions=deep_review_result.traceability_suggestions,
                acceptance_criteria=deep_review_result.acceptance_criteria,
                missing_assumptions=deep_review_result.missing_assumptions,
                missing_interfaces=deep_review_result.missing_interfaces,
                retrieved_chunks=to_retrieved_chunk_references(
                    retrieved_chunks,
                    max_chars=settings.agent_max_retrieved_chars,
                ),
            )
        else:
            response = RequirementValidationResponse(
                status=triage_result.status,
                confidence=triage_result.confidence,
                needs_escalation=False,
                route_taken="triage_only",
                router_reason=route_decision.reason,
                issues=triage_result.issues,
                rewritten_requirement=None,
                traceability_suggestions=[],
                acceptance_criteria=[],
                missing_assumptions=[],
                missing_interfaces=[],
                retrieved_chunks=to_retrieved_chunk_references(
                    retrieved_chunks,
                    max_chars=settings.agent_max_retrieved_chars,
                ),
            )

        run_output_guardrails(response)
        return run_post_validation_evaluators(response)

    def rewrite_requirement(
        self,
        payload: RequirementRewriteRequest,
        owner_user_id: str | None = None,
    ) -> RequirementRewriteResponse:
        ensure_project_exists(self._session, payload.project_id, owner_user_id)
        retrieved_chunks = self._build_retrieval_agent().retrieve(
            project_id=payload.project_id,
            requirement_text=payload.requirement_text,
            top_k=settings.agent_top_k_chunks,
        )
        rewrite_result = RewriteAgent(self._get_runtime()).suggest(
            requirement_title=payload.requirement_title,
            requirement_text=payload.requirement_text,
            requirement_type=payload.requirement_type,
            retrieved_chunks=retrieved_chunks,
        )
        return RequirementRewriteResponse(provider="openai-agents", suggestions=rewrite_result.suggestions)

    def _load_existing_requirements(
        self,
        project_id: str,
        *,
        current_requirement_id: str | None,
    ) -> list[tuple[str, str, str]]:
        statement = select(Requirement).where(Requirement.project_id == project_id).order_by(Requirement.id.asc())
        requirements = list(self._session.scalars(statement).all())
        rows: list[tuple[str, str, str]] = []
        for requirement in requirements:
            if current_requirement_id and requirement.id == current_requirement_id:
                continue
            rows.append((requirement.id, requirement.title, requirement.text))
        return rows


def build_agent_validation_service(session: Session) -> AgentValidationService:
    return AgentValidationService(session)
