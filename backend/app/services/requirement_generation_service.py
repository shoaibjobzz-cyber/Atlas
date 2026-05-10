from __future__ import annotations

from app.core.config import settings
from app.schemas.generation import (
    GeneratedRequirementCandidateInput,
    GeneratedRequirementCandidateReview,
    GeneratedRequirementCandidateValidation,
    RequirementRewriteSuggestionItem,
    RequirementRewriteSuggestionRequestPayload,
    RequirementRewriteSuggestionResponse,
    RequirementGenerationRequest,
    RequirementGenerationResponse,
    RequirementGenerationSaveCandidate,
    RequirementGenerationSaveRequest,
    RequirementGenerationSaveResponse,
)
from app.schemas.quality import RequirementQualityCheckRequest
from app.schemas.requirement import RequirementCreate
from app.services.correlation_service import CorrelationRequirementLike, get_requirement_like_correlations
from app.services.mock_requirement_generation_provider import MockRequirementGenerationProvider
from app.services.openai_requirement_generation_provider import OpenAIRequirementGenerationProvider
from app.services.projects_service import ensure_project_exists
from app.services.quality_service import evaluate_requirement_quality
from app.services.requirement_hierarchy_service import preview_child_hierarchies
from app.services.requirement_generation_provider import (
    RequirementGenerationProvider,
    RequirementGenerationProviderCandidate,
    RequirementGenerationProviderError,
    RequirementGenerationProviderUnavailableError,
    RequirementGenerationProviderRequest,
    RequirementRewriteSuggestionRequest,
    generation_metadata,
)
from app.services.requirements_service import create_requirement, get_requirement
from app.services.structured_requirement_service import parse_requirement_text
from sqlalchemy.orm import Session


GENERATION_DRAFT_LABEL = "AI-generated draft content. Review before saving."
REWRITE_DRAFT_LABEL = "AI-generated rewrite suggestion. Review before applying."


def _provider() -> RequirementGenerationProvider:
    configured_provider = settings.requirement_generation_provider.strip().lower()

    if configured_provider == "mock":
        return MockRequirementGenerationProvider()

    # Keep legacy provider names working so older env vars do not break generation.
    if configured_provider in {"openai", "future_llm", "ollama"}:
        try:
            return OpenAIRequirementGenerationProvider()
        except RequirementGenerationProviderUnavailableError:
            if settings.requirement_generation_fallback_to_mock:
                return MockRequirementGenerationProvider()
            raise

    raise RequirementGenerationProviderUnavailableError(
        f"Unsupported requirement generation provider '{settings.requirement_generation_provider}'."
    )


def _fallback_provider(
    provider: RequirementGenerationProvider,
) -> RequirementGenerationProvider | None:
    if provider.provider_name == "mock" or not settings.requirement_generation_fallback_to_mock:
        return None
    return MockRequirementGenerationProvider()


def _generate_with_provider(
    provider: RequirementGenerationProvider,
    payload: RequirementGenerationProviderRequest,
) -> list[RequirementGenerationProviderCandidate]:
    try:
        if payload.mode == "decompose":
            return provider.decompose_requirement(payload)
        return provider.generate_feature_candidates(payload)
    except RequirementGenerationProviderError:
        fallback = _fallback_provider(provider)
        if fallback is None:
            raise
        if payload.mode == "decompose":
            return fallback.decompose_requirement(payload)
        return fallback.generate_feature_candidates(payload)


def _suggest_rewrites_with_provider(
    provider: RequirementGenerationProvider,
    payload: RequirementRewriteSuggestionRequest,
):
    try:
        return provider, provider.suggest_rewrites(payload)
    except RequirementGenerationProviderError:
        fallback = _fallback_provider(provider)
        if fallback is None:
            raise
        return fallback, fallback.suggest_rewrites(payload)


def _candidate_validation(
    session: Session,
    project_id: str,
    candidate: RequirementGenerationProviderCandidate | GeneratedRequirementCandidateInput,
    *,
    exclude_requirement_id: str | None = None,
) -> GeneratedRequirementCandidateValidation:
    quality_summary = evaluate_requirement_quality(
        RequirementQualityCheckRequest(
            title=candidate.title,
            text=candidate.text,
            type=candidate.type,
        )
    )
    parsed_requirement = parse_requirement_text(candidate.title, candidate.text)
    correlation_summary = get_requirement_like_correlations(
        session,
        CorrelationRequirementLike(
            id=candidate.temp_id,
            project_id=project_id,
            title=candidate.title,
            text=candidate.text,
            type=candidate.type,
            status="Draft",
            subsystem=candidate.subsystem,
            parsed_requirement=parsed_requirement.model_dump(),
        ),
        exclude_requirement_id=exclude_requirement_id,
    )
    return GeneratedRequirementCandidateValidation(
        quality_summary=quality_summary,
        parsed_requirement=parsed_requirement,
        correlation_summary=correlation_summary,
    )


def _review_candidate(
    session: Session,
    project_id: str,
    candidate: RequirementGenerationProviderCandidate | GeneratedRequirementCandidateInput,
    *,
    suggested_hierarchy: str | None = None,
) -> GeneratedRequirementCandidateReview:
    return GeneratedRequirementCandidateReview(
        temp_id=candidate.temp_id,
        suggested_id=candidate.suggested_id,
        suggested_hierarchy=suggested_hierarchy
        if suggested_hierarchy is not None
        else getattr(candidate, "suggested_hierarchy", None),
        title=candidate.title,
        text=candidate.text,
        type=candidate.type,
        priority=candidate.priority,
        rationale=candidate.rationale,
        parent_requirement_id=candidate.parent_requirement_id,
        subsystem=candidate.subsystem,
        verification_method=candidate.verification_method,
        assumptions=candidate.assumptions,
        generation_metadata=candidate.generation_metadata,
        validation=_candidate_validation(session, project_id, candidate),
        draft_label=GENERATION_DRAFT_LABEL,
    )


def generate_requirement_candidates(
    session: Session,
    payload: RequirementGenerationRequest,
    owner_user_id: str | None = None,
) -> RequirementGenerationResponse:
    ensure_project_exists(session, payload.project_id, owner_user_id)

    source_requirement = None
    if payload.mode == "decompose":
        source_requirement = get_requirement(session, payload.source_requirement_id or "", owner_user_id)

    provider_request = RequirementGenerationProviderRequest(
        project_id=payload.project_id,
        mode=payload.mode,
        feature_description=payload.feature_description,
        source_requirement_id=source_requirement.id if source_requirement else None,
        source_requirement_title=source_requirement.title if source_requirement else None,
        source_requirement_text=source_requirement.text if source_requirement else None,
    )
    provider = _provider()
    candidates = _generate_with_provider(provider, provider_request)
    decomposition_hierarchy_previews: list[str | None] = [None] * len(candidates)
    if payload.mode == "decompose" and source_requirement is not None:
        previews = preview_child_hierarchies(
            session,
            project_id=payload.project_id,
            parent_requirement_id=source_requirement.id,
            count=len(candidates),
        )
        decomposition_hierarchy_previews = list(previews)

    return RequirementGenerationResponse(
        project_id=payload.project_id,
        mode=payload.mode,
        source_requirement_id=source_requirement.id if source_requirement else None,
        candidates=[
            _review_candidate(
                session,
                payload.project_id,
                candidate,
                suggested_hierarchy=decomposition_hierarchy_previews[index],
            )
            for index, candidate in enumerate(candidates)
        ],
    )


def review_generated_candidates(
    session: Session,
    project_id: str,
    candidates: list[GeneratedRequirementCandidateInput],
) -> list[GeneratedRequirementCandidateReview]:
    ensure_project_exists(session, project_id)
    grouped_child_candidates: dict[str, list[int]] = {}
    for index, candidate in enumerate(candidates):
        if candidate.parent_requirement_id:
            grouped_child_candidates.setdefault(candidate.parent_requirement_id, []).append(index)

    hierarchy_previews: list[str | None] = [None] * len(candidates)
    for parent_requirement_id, indexes in grouped_child_candidates.items():
        previews = preview_child_hierarchies(
            session,
            project_id=project_id,
            parent_requirement_id=parent_requirement_id,
            count=len(indexes),
        )
        for offset, candidate_index in enumerate(indexes):
            hierarchy_previews[candidate_index] = previews[offset]

    return [
        _review_candidate(
            session,
            project_id,
            candidate,
            suggested_hierarchy=hierarchy_previews[index],
        )
        for index, candidate in enumerate(candidates)
    ]


def suggest_requirement_rewrites(
    session: Session,
    payload: RequirementRewriteSuggestionRequestPayload,
    owner_user_id: str | None = None,
) -> RequirementRewriteSuggestionResponse:
    ensure_project_exists(session, payload.project_id, owner_user_id)
    if payload.requirement_id:
        get_requirement(session, payload.requirement_id, owner_user_id)
    provider = _provider()
    actual_provider, suggestions = _suggest_rewrites_with_provider(
        provider,
        RequirementRewriteSuggestionRequest(
            project_id=payload.project_id,
            requirement_id=payload.requirement_id,
            title=payload.title,
            text=payload.text,
            type=payload.type,
            goals=payload.goals,
        ),
    )
    suggestion_metadata = generation_metadata(
        generation_source=actual_provider.generation_source,
        generation_provider=actual_provider.provider_name,
        generated_from_requirement_id=payload.requirement_id,
        is_generated_draft=True,
    )
    return RequirementRewriteSuggestionResponse(
        provider=actual_provider.provider_name,
        suggestions=[
            RequirementRewriteSuggestionItem(
                title=suggestion.title,
                text=suggestion.text,
                rationale=suggestion.rationale,
                generation_metadata=suggestion_metadata,
                validation=_candidate_validation(
                    session,
                    payload.project_id,
                    GeneratedRequirementCandidateInput(
                        temp_id=f"rewrite-{index + 1}",
                        suggested_id=f"rewrite-{index + 1}",
                        title=suggestion.title,
                        text=suggestion.text,
                        type=payload.type,
                        priority="Medium",
                        rationale=suggestion.rationale,
                        parent_requirement_id=payload.requirement_id,
                        subsystem=None,
                        verification_method=None,
                        assumptions=None,
                        generation_metadata=suggestion_metadata,
                    ),
                    exclude_requirement_id=payload.requirement_id,
                ),
                draft_label=REWRITE_DRAFT_LABEL,
            )
            for index, suggestion in enumerate(suggestions)
        ]
    )


def _build_saved_rationale(candidate: RequirementGenerationSaveCandidate) -> str | None:
    if candidate.rationale and candidate.rationale.strip():
        return candidate.rationale.strip()
    return None


def save_generated_candidates(
    session: Session,
    payload: RequirementGenerationSaveRequest,
    owner_user_id: str | None = None,
) -> RequirementGenerationSaveResponse:
    ensure_project_exists(session, payload.project_id, owner_user_id)
    saved_requirements = []
    for candidate in payload.candidates:
        requirement = create_requirement(
            session,
            RequirementCreate(
                project_id=payload.project_id,
                title=candidate.title,
                text=candidate.text,
                type=candidate.type,
                priority=candidate.priority,
                status="Draft",
                parent_requirement_id=candidate.parent_requirement_id,
                subsystem=candidate.subsystem,
                verification_method=candidate.verification_method,
                rationale=_build_saved_rationale(candidate),
                assumptions=candidate.assumptions,
                generation_metadata=candidate.generation_metadata,
            ),
            owner_user_id,
        )
        saved_requirements.append(requirement)
    return RequirementGenerationSaveResponse(saved_requirements=saved_requirements)
