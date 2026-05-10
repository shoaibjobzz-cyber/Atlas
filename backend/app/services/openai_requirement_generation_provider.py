from __future__ import annotations

import json
import re
from typing import Any

import httpx

from app.core.config import settings
from app.services.requirement_generation_prompts import (
    GENERATED_CANDIDATES_RESPONSE_SCHEMA,
    REWRITE_SUGGESTIONS_RESPONSE_SCHEMA,
    build_decomposition_messages,
    build_feature_generation_messages,
    build_rewrite_suggestion_messages,
)
from app.services.requirement_generation_provider import (
    RequirementGenerationProvider,
    RequirementGenerationProviderCandidate,
    RequirementGenerationProviderRequest,
    RequirementGenerationProviderResponseError,
    RequirementGenerationProviderUnavailableError,
    RequirementRewriteSuggestion,
    RequirementRewriteSuggestionRequest,
    generation_metadata,
)


class OpenAIRequirementGenerationProvider(RequirementGenerationProvider):
    provider_name = "openai"
    generation_source = "ai"

    def __init__(self) -> None:
        if not settings.openai_api_key:
            raise RequirementGenerationProviderUnavailableError(
                "The OpenAI generation provider is selected but OPENAI_API_KEY is not configured."
            )

        try:
            from openai import OpenAI
        except ImportError as error:
            raise RequirementGenerationProviderUnavailableError(
                "The OpenAI Python package is not installed. Install backend dependencies to use the OpenAI generation provider."
            ) from error

        self._client = OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.resolved_openai_base_url,
            timeout=settings.openai_timeout_seconds,
            max_retries=settings.openai_max_retries,
            http_client=httpx.Client(trust_env=False),
        )
        self._model = settings.openai_model

    def generate_feature_candidates(
        self,
        payload: RequirementGenerationProviderRequest,
    ) -> list[RequirementGenerationProviderCandidate]:
        data = self._request_json(
            messages=build_feature_generation_messages(payload),
            json_schema=GENERATED_CANDIDATES_RESPONSE_SCHEMA,
        )
        return self._candidates_from_response(data, payload)

    def decompose_requirement(
        self,
        payload: RequirementGenerationProviderRequest,
    ) -> list[RequirementGenerationProviderCandidate]:
        data = self._request_json(
            messages=build_decomposition_messages(payload),
            json_schema=GENERATED_CANDIDATES_RESPONSE_SCHEMA,
        )
        return self._candidates_from_response(data, payload)

    def suggest_rewrites(
        self,
        payload: RequirementRewriteSuggestionRequest,
    ) -> list[RequirementRewriteSuggestion]:
        data = self._request_json(
            messages=build_rewrite_suggestion_messages(payload),
            json_schema=REWRITE_SUGGESTIONS_RESPONSE_SCHEMA,
        )
        suggestions = data.get("suggestions")
        if not isinstance(suggestions, list) or len(suggestions) == 0:
            raise RequirementGenerationProviderResponseError(
                "The OpenAI provider did not return any rewrite suggestions."
            )

        return [
            RequirementRewriteSuggestion(
                title=self._clean_string(item.get("title")) or payload.title,
                text=self._clean_string(item.get("text")) or payload.text,
                rationale=self._clean_string(item.get("rationale")) or "Improves clarity and measurability.",
            )
            for item in suggestions
            if isinstance(item, dict)
        ]

    def _request_json(
        self,
        *,
        messages: list[dict[str, str]],
        json_schema: dict[str, Any],
    ) -> dict[str, Any]:
        try:
            response = self._client.chat.completions.create(
                model=self._model,
                temperature=0.2,
                messages=messages,
                response_format={
                    "type": "json_schema",
                    "json_schema": json_schema,
                },
            )
        except Exception as error:  # pragma: no cover - network/provider failure handling
            raise RequirementGenerationProviderUnavailableError(
                f"OpenAI generation request failed: {error}"
            ) from error

        try:
            message = response.choices[0].message
        except (AttributeError, IndexError) as error:
            raise RequirementGenerationProviderResponseError(
                "The OpenAI provider returned an unexpected empty response."
            ) from error

        if getattr(message, "refusal", None):
            raise RequirementGenerationProviderResponseError(
                f"OpenAI generation request was refused: {message.refusal}"
            )

        content = self._message_text(message.content)
        if not content:
            raise RequirementGenerationProviderResponseError(
                "The OpenAI provider returned an empty response body."
            )

        try:
            data = json.loads(content)
        except json.JSONDecodeError as error:
            raise RequirementGenerationProviderResponseError(
                "The OpenAI provider returned invalid structured output."
            ) from error

        if not isinstance(data, dict):
            raise RequirementGenerationProviderResponseError(
                "The OpenAI provider returned a non-object structured payload."
            )

        return data

    def _candidates_from_response(
        self,
        data: dict[str, Any],
        payload: RequirementGenerationProviderRequest,
    ) -> list[RequirementGenerationProviderCandidate]:
        candidates = data.get("candidates")
        if not isinstance(candidates, list) or len(candidates) == 0:
            raise RequirementGenerationProviderResponseError(
                "The OpenAI provider did not return any requirement candidates."
            )

        generated_from_requirement_id = (
            payload.source_requirement_id if payload.mode == "decompose" else None
        )

        normalized_candidates: list[RequirementGenerationProviderCandidate] = []
        for index, item in enumerate(candidates, start=1):
            if not isinstance(item, dict):
                continue

            title = self._clean_string(item.get("title"), max_length=255) or f"Generated Candidate {index}"
            text = self._clean_string(item.get("text")) or "The system shall satisfy the reviewed capability."
            requirement_type = self._normalize_requirement_type(item.get("type"))
            priority = self._normalize_priority(item.get("priority"))
            rationale = self._clean_string(item.get("rationale"))
            subsystem = self._clean_string(item.get("subsystem"), max_length=128)
            verification_method = self._clean_string(item.get("verification_method"), max_length=64)
            assumptions = self._clean_string(item.get("assumptions"))

            normalized_candidates.append(
                RequirementGenerationProviderCandidate(
                    temp_id=f"generated-{index}",
                    suggested_id=self._suggested_id(index, title),
                    title=title,
                    text=text,
                    type=requirement_type,
                    priority=priority,
                    rationale=rationale,
                    parent_requirement_id=generated_from_requirement_id,
                    subsystem=subsystem,
                    verification_method=verification_method,
                    assumptions=assumptions,
                    generation_metadata=generation_metadata(
                        generation_source=self.generation_source,
                        generation_provider=self.provider_name,
                        generated_from_requirement_id=generated_from_requirement_id,
                        is_generated_draft=True,
                    ),
                )
            )

        if len(normalized_candidates) == 0:
            raise RequirementGenerationProviderResponseError(
                "The OpenAI provider returned candidates in an unusable format."
            )

        return normalized_candidates

    def _normalize_requirement_type(self, value: Any) -> str:
        normalized = self._clean_string(value)
        mapping = {
            "stakeholder": "Stakeholder",
            "system": "System",
            "subsystem": "Subsystem",
            "software": "Software",
            "hardware": "Hardware",
        }
        return mapping.get((normalized or "").lower(), "System")

    def _normalize_priority(self, value: Any) -> str:
        normalized = self._clean_string(value)
        mapping = {
            "low": "Low",
            "medium": "Medium",
            "high": "High",
            "critical": "Critical",
        }
        return mapping.get((normalized or "").lower(), "Medium")

    def _message_text(self, content: Any) -> str:
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, list):
            parts: list[str] = []
            for item in content:
                if isinstance(item, dict):
                    text = item.get("text")
                    if isinstance(text, str):
                        parts.append(text)
                    continue
                text_value = getattr(item, "text", None)
                if isinstance(text_value, str):
                    parts.append(text_value)
            return "".join(parts).strip()
        return ""

    def _clean_string(self, value: Any, *, max_length: int | None = None) -> str | None:
        if not isinstance(value, str):
            return None
        cleaned = re.sub(r"\s+", " ", value).strip()
        if max_length is not None:
            cleaned = cleaned[:max_length].rstrip()
        return cleaned or None

    def _suggested_id(self, index: int, title: str) -> str:
        tokens = re.findall(r"[A-Z0-9]+", re.sub(r"[^A-Za-z0-9]+", " ", title).upper())
        stem = "-".join(tokens[:3]) if tokens else f"GENERATED-{index}"
        return f"DRAFT-{stem[:40]}"
