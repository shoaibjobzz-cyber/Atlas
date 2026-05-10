from __future__ import annotations

from dataclasses import dataclass, field
from typing import Protocol

from app.schemas.requirement import (
    GenerationProvider,
    GenerationSource,
    RequirementGenerationMetadata,
    RequirementPriority,
    RequirementType,
)


class RequirementGenerationProviderError(RuntimeError):
    """Base class for provider-facing generation failures."""


class RequirementGenerationProviderUnavailableError(RequirementGenerationProviderError):
    """Raised when the configured provider cannot be used safely."""


class RequirementGenerationProviderResponseError(RequirementGenerationProviderError):
    """Raised when the provider returns an invalid or unusable response."""


@dataclass
class RequirementGenerationProviderRequest:
    project_id: str
    mode: str
    feature_description: str | None
    source_requirement_id: str | None
    source_requirement_title: str | None
    source_requirement_text: str | None


@dataclass
class RequirementGenerationProviderCandidate:
    temp_id: str
    suggested_id: str
    title: str
    text: str
    type: RequirementType
    priority: RequirementPriority
    rationale: str | None
    parent_requirement_id: str | None
    subsystem: str | None
    verification_method: str | None
    assumptions: str | None
    generation_metadata: RequirementGenerationMetadata


@dataclass
class RequirementRewriteSuggestionRequest:
    project_id: str
    requirement_id: str | None
    title: str
    text: str
    type: RequirementType
    goals: list[str] = field(default_factory=list)


@dataclass
class RequirementRewriteSuggestion:
    title: str
    text: str
    rationale: str


class CandidateRequirementGenerator(Protocol):
    def generate_feature_candidates(
        self,
        payload: RequirementGenerationProviderRequest,
    ) -> list[RequirementGenerationProviderCandidate]:
        ...


class RequirementDecompositionProvider(Protocol):
    def decompose_requirement(
        self,
        payload: RequirementGenerationProviderRequest,
    ) -> list[RequirementGenerationProviderCandidate]:
        ...


class RequirementRewriteSuggestionProvider(Protocol):
    def suggest_rewrites(
        self,
        payload: RequirementRewriteSuggestionRequest,
    ) -> list[RequirementRewriteSuggestion]:
        ...


class RequirementGenerationProvider(
    CandidateRequirementGenerator,
    RequirementDecompositionProvider,
    RequirementRewriteSuggestionProvider,
    Protocol,
):
    provider_name: GenerationProvider
    generation_source: GenerationSource


def generation_metadata(
    *,
    generation_source: GenerationSource,
    generation_provider: GenerationProvider | None,
    generated_from_requirement_id: str | None,
    is_generated_draft: bool,
) -> RequirementGenerationMetadata:
    return RequirementGenerationMetadata(
        generation_source=generation_source,
        generation_provider=generation_provider,
        generated_from_requirement_id=generated_from_requirement_id,
        is_generated_draft=is_generated_draft,
    )
