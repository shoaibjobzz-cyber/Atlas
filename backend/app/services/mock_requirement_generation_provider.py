from __future__ import annotations

import re
from typing import Iterable

from app.services.requirement_generation_provider import (
    RequirementGenerationProvider,
    RequirementGenerationProviderCandidate,
    RequirementGenerationProviderRequest,
    RequirementRewriteSuggestion,
    RequirementRewriteSuggestionRequest,
    generation_metadata,
)


class MockRequirementGenerationProvider(RequirementGenerationProvider):
    provider_name = "mock"
    generation_source = "ai"

    def generate_feature_candidates(
        self, payload: RequirementGenerationProviderRequest
    ) -> list[RequirementGenerationProviderCandidate]:
        source_text = self._normalize_text(payload.feature_description)

        if self._matches_all(source_text, ("braking system", "safe braking")):
            return self._braking_feature_candidates()

        if "respond within 100 ms" in source_text:
            return self._response_time_feature_candidates()

        return self._default_feature_candidates(payload.feature_description or "")

    def decompose_requirement(
        self, payload: RequirementGenerationProviderRequest
    ) -> list[RequirementGenerationProviderCandidate]:
        source_text = self._normalize_text(
            f"{payload.source_requirement_title or ''} {payload.source_requirement_text or ''}"
        )

        if self._matches_all(source_text, ("coffee machine", "dispense coffee")):
            return self._coffee_machine_decomposition_candidates(payload.source_requirement_id or "")

        return self._default_decomposition_candidates(
            payload.source_requirement_id or "",
            payload.source_requirement_text or "",
        )

    def suggest_rewrites(
        self,
        payload: RequirementRewriteSuggestionRequest,
    ) -> list[RequirementRewriteSuggestion]:
        # TODO: Replace with an external AI-backed rewrite provider once integration is approved.
        normalized_text = self._normalize_text(payload.text)
        requested_goals = set(payload.goals)
        suggestions: list[RequirementRewriteSuggestion] = []
        if "quickly" in normalized_text or "efficient" in normalized_text or "make_measurable" in requested_goals:
            suggestions.append(
                RequirementRewriteSuggestion(
                    title=payload.title,
                    text=payload.text.replace("quickly", "within 100 ms").replace("efficient", "measurably"),
                    rationale="Replaces vague performance wording with a measurable constraint.",
                )
            )
        if "reduce_ambiguity" in requested_goals or "clarify_units_conditions_scope" in requested_goals:
            suggestions.append(
                RequirementRewriteSuggestion(
                    title=payload.title,
                    text=f"{payload.text.rstrip('.')} during normal operating mode when valid input conditions are met.",
                    rationale="Adds explicit scope and operating condition to reduce ambiguity.",
                )
            )
        if "improve_testability" in requested_goals and len(suggestions) < 3:
            suggestions.append(
                RequirementRewriteSuggestion(
                    title=payload.title,
                    text=f"{payload.text.rstrip('.')} Compliance shall be verified by objective test evidence.",
                    rationale="Adds explicit verification-oriented wording to improve testability.",
                )
            )
        if not suggestions:
            suggestions.append(
                RequirementRewriteSuggestion(
                    title=payload.title,
                    text=f"{payload.text.rstrip('.')} The requirement shall use measurable acceptance criteria.",
                    rationale="Provides a safer default rewrite when no specific deterministic pattern matches.",
                )
            )
        return suggestions[:3]

    def _braking_feature_candidates(self) -> list[RequirementGenerationProviderCandidate]:
        return [
            self._candidate(
                temp_id="generated-1",
                title="Brake Pressure in Normal Mode",
                text=(
                    "The braking system shall achieve at least 6 bar brake pressure "
                    "at all wheel ends within 120 ms during normal operating mode."
                ),
                requirement_type="System",
                priority="High",
                rationale="Defines a measurable braking-pressure target for normal operation.",
                subsystem="Hydraulics",
                verification_method="Test",
                generated_from_requirement_id=None,
            ),
            self._candidate(
                temp_id="generated-2",
                title="Brake Pressure in Degraded Mode",
                text=(
                    "The braking system shall maintain at least 4 bar brake pressure "
                    "at all wheel ends within 180 ms during degraded hydraulic mode."
                ),
                requirement_type="Subsystem",
                priority="High",
                rationale="Covers degraded-mode braking performance with an explicit bound.",
                subsystem="Hydraulics",
                verification_method="Test",
                generated_from_requirement_id=None,
            ),
            self._candidate(
                temp_id="generated-3",
                title="Fault Detection and Mode Transition",
                text=(
                    "The control system shall enter degraded braking mode within 200 ms "
                    "after detection of a single braking circuit fault."
                ),
                requirement_type="Software",
                priority="High",
                rationale="Captures failure behavior and mode handling after a detected fault.",
                subsystem="Controls",
                verification_method="Test",
                generated_from_requirement_id=None,
            ),
            self._candidate(
                temp_id="generated-4",
                title="Brake Warning Indication",
                text=(
                    "The system shall illuminate the brake warning indicator within 500 ms "
                    "when degraded braking mode is active."
                ),
                requirement_type="Hardware",
                priority="Medium",
                rationale="Provides a measurable operator warning indication requirement.",
                subsystem="HMI",
                verification_method="Inspection",
                generated_from_requirement_id=None,
            ),
            self._candidate(
                temp_id="generated-5",
                title="Mode Handling for Brake Availability",
                text=(
                    "The braking system shall support normal mode and degraded mode and "
                    "shall prevent transition back to normal mode until the braking fault "
                    "is cleared."
                ),
                requirement_type="System",
                priority="Medium",
                rationale="Defines explicit mode-handling behavior for recovery and safety.",
                subsystem="Controls",
                verification_method="Analysis",
                generated_from_requirement_id=None,
            ),
            self._candidate(
                temp_id="generated-6",
                title="Degraded Mode Verification Evidence",
                text=(
                    "The verification procedure shall demonstrate normal-mode and "
                    "degraded-mode braking performance using recorded wheel-end pressure "
                    "measurements and fault-injection evidence."
                ),
                requirement_type="System",
                priority="Medium",
                rationale="Adds verification-oriented evidence coverage for generated braking requirements.",
                subsystem="Validation",
                verification_method="Analysis",
                generated_from_requirement_id=None,
            ),
        ]

    def _response_time_feature_candidates(
        self,
    ) -> list[RequirementGenerationProviderCandidate]:
        return [
            self._candidate(
                temp_id="generated-1",
                title="System Response Time in Normal Mode",
                text=(
                    "The system shall respond within 100 ms during normal operating mode "
                    "after receipt of a valid control input."
                ),
                requirement_type="System",
                priority="High",
                rationale="Makes the original response-time statement more measurable by adding trigger and mode.",
                subsystem="Controls",
                verification_method="Test",
                generated_from_requirement_id=None,
            ),
            self._candidate(
                temp_id="generated-2",
                title="Controller Processing Budget",
                text=(
                    "The controller software shall complete input processing and command "
                    "issuance within 40 ms after receipt of a valid control input."
                ),
                requirement_type="Software",
                priority="Medium",
                rationale="Allocates part of the response-time budget to software execution.",
                subsystem="Controls",
                verification_method="Test",
                generated_from_requirement_id=None,
            ),
            self._candidate(
                temp_id="generated-3",
                title="Subsystem Response Allocation",
                text=(
                    "The controlled subsystem shall complete commanded actuation within "
                    "60 ms after receiving a valid command from the controller."
                ),
                requirement_type="Subsystem",
                priority="Medium",
                rationale="Allocates the remaining timing budget to downstream actuation behavior.",
                subsystem="Actuation",
                verification_method="Test",
                generated_from_requirement_id=None,
            ),
            self._candidate(
                temp_id="generated-4",
                title="Response Time Verification Evidence",
                text=(
                    "The verification activity shall record input timestamp, command issue "
                    "timestamp, and response completion timestamp to confirm the 100 ms response target."
                ),
                requirement_type="System",
                priority="Low",
                rationale="Provides a reviewable verification-oriented companion requirement.",
                subsystem="Validation",
                verification_method="Analysis",
                generated_from_requirement_id=None,
            ),
        ]

    def _default_feature_candidates(
        self, prompt: str
    ) -> list[RequirementGenerationProviderCandidate]:
        subject = self._derive_subject(prompt)
        return [
            self._candidate(
                temp_id="generated-1",
                title=f"{subject} Performance Requirement",
                text=(
                    f"The {subject.lower()} shall complete its primary function within "
                    "200 ms during normal operating mode."
                ),
                requirement_type="System",
                priority="High",
                rationale="Provides a measurable system-level performance candidate.",
                subsystem="System",
                verification_method="Test",
                generated_from_requirement_id=None,
            ),
            self._candidate(
                temp_id="generated-2",
                title=f"{subject} Fault Handling Requirement",
                text=(
                    f"The {subject.lower()} shall enter a defined safe state within 500 ms "
                    "after detection of an internal fault."
                ),
                requirement_type="Subsystem",
                priority="High",
                rationale="Provides a deterministic fault-handling candidate for review.",
                subsystem="Controls",
                verification_method="Test",
                generated_from_requirement_id=None,
            ),
            self._candidate(
                temp_id="generated-3",
                title=f"{subject} Operator Indication Requirement",
                text=(
                    f"The system shall display an operator warning within 1 s when the "
                    f"{subject.lower()} cannot complete its primary function."
                ),
                requirement_type="Hardware",
                priority="Medium",
                rationale="Adds a measurable operator indication candidate.",
                subsystem="HMI",
                verification_method="Inspection",
                generated_from_requirement_id=None,
            ),
            self._candidate(
                temp_id="generated-4",
                title=f"{subject} Verification Evidence Requirement",
                text=(
                    f"The verification procedure shall record objective evidence showing "
                    f"that the {subject.lower()} satisfies its primary function under nominal conditions."
                ),
                requirement_type="System",
                priority="Low",
                rationale="Adds a verification-oriented candidate for review.",
                subsystem="Validation",
                verification_method="Analysis",
                generated_from_requirement_id=None,
            ),
        ]

    def _coffee_machine_decomposition_candidates(
        self, parent_requirement_id: str
    ) -> list[RequirementGenerationProviderCandidate]:
        return [
            self._candidate(
                temp_id="generated-1",
                title="Cup Presence Detection",
                text=(
                    "The coffee machine shall verify that a cup is present before opening "
                    "the dispensing valve."
                ),
                requirement_type="Hardware",
                priority="High",
                rationale="Decomposes safe dispensing into an explicit cup-detection behavior.",
                parent_requirement_id=parent_requirement_id,
                subsystem="Dispensing",
                verification_method="Test",
                generated_from_requirement_id=parent_requirement_id,
            ),
            self._candidate(
                temp_id="generated-2",
                title="Dispense Temperature Limit",
                text=(
                    "The coffee machine shall dispense coffee between 85 degC and 96 degC "
                    "during normal beverage preparation mode."
                ),
                requirement_type="System",
                priority="High",
                rationale="Adds a measurable beverage temperature constraint to support safe dispensing.",
                parent_requirement_id=parent_requirement_id,
                subsystem="Heating",
                verification_method="Test",
                generated_from_requirement_id=parent_requirement_id,
            ),
            self._candidate(
                temp_id="generated-3",
                title="Dispensing Timing Control",
                text=(
                    "The dispensing controller shall start beverage flow within 2 s after "
                    "the user selects a valid drink and shall stop flow within 200 ms of the commanded stop."
                ),
                requirement_type="Software",
                priority="Medium",
                rationale="Adds measurable timing expectations for dispensing control.",
                parent_requirement_id=parent_requirement_id,
                subsystem="Controls",
                verification_method="Test",
                generated_from_requirement_id=parent_requirement_id,
            ),
            self._candidate(
                temp_id="generated-4",
                title="Dispensing Fault Handling",
                text=(
                    "The coffee machine shall stop dispensing within 300 ms and display a fault message "
                    "if cup absence or over-temperature is detected during beverage delivery."
                ),
                requirement_type="Subsystem",
                priority="High",
                rationale="Captures deterministic fault handling for the dispensing function.",
                parent_requirement_id=parent_requirement_id,
                subsystem="Safety",
                verification_method="Test",
                generated_from_requirement_id=parent_requirement_id,
            ),
            self._candidate(
                temp_id="generated-5",
                title="Dispensing Verification Record",
                text=(
                    "The verification activity shall record cup-detection status, beverage "
                    "temperature, dispense start time, and fault responses for each safety test sequence."
                ),
                requirement_type="System",
                priority="Low",
                rationale="Provides a verification-oriented child requirement for the parent capability.",
                parent_requirement_id=parent_requirement_id,
                subsystem="Validation",
                verification_method="Analysis",
                generated_from_requirement_id=parent_requirement_id,
            ),
        ]

    def _default_decomposition_candidates(
        self,
        parent_requirement_id: str,
        source_text: str,
    ) -> list[RequirementGenerationProviderCandidate]:
        subject = self._derive_subject(source_text)
        return [
            self._candidate(
                temp_id="generated-1",
                title=f"{subject} System Allocation",
                text=(
                    f"The system shall provide the functions required to satisfy the "
                    f"{subject.lower()} capability during normal operating mode."
                ),
                requirement_type="System",
                priority="High",
                rationale="Creates a system-level child requirement for the parent capability.",
                parent_requirement_id=parent_requirement_id,
                subsystem="System",
                verification_method="Analysis",
                generated_from_requirement_id=parent_requirement_id,
            ),
            self._candidate(
                temp_id="generated-2",
                title=f"{subject} Software Control",
                text=(
                    f"The controller software shall manage the {subject.lower()} sequence "
                    "using defined input validation and fault handling logic."
                ),
                requirement_type="Software",
                priority="Medium",
                rationale="Creates a software-oriented child requirement for decomposition review.",
                parent_requirement_id=parent_requirement_id,
                subsystem="Controls",
                verification_method="Test",
                generated_from_requirement_id=parent_requirement_id,
            ),
            self._candidate(
                temp_id="generated-3",
                title=f"{subject} Verification Evidence",
                text=(
                    f"The verification activity shall capture evidence showing that the "
                    f"{subject.lower()} function satisfies the parent requirement."
                ),
                requirement_type="System",
                priority="Low",
                rationale="Creates a verification-oriented child requirement for review.",
                parent_requirement_id=parent_requirement_id,
                subsystem="Validation",
                verification_method="Analysis",
                generated_from_requirement_id=parent_requirement_id,
            ),
        ]

    def _candidate(
        self,
        *,
        temp_id: str,
        title: str,
        text: str,
        requirement_type: str,
        priority: str,
        rationale: str,
        generated_from_requirement_id: str | None,
        parent_requirement_id: str | None = None,
        subsystem: str | None = None,
        verification_method: str | None = None,
    ) -> RequirementGenerationProviderCandidate:
        return RequirementGenerationProviderCandidate(
            temp_id=temp_id,
            suggested_id=self._suggested_id(temp_id, title),
            title=title,
            text=text,
            type=requirement_type,
            priority=priority,
            rationale=rationale,
            assumptions=None,
            parent_requirement_id=parent_requirement_id,
            subsystem=subsystem,
            verification_method=verification_method,
            generation_metadata=generation_metadata(
                generation_source=self.generation_source,
                generation_provider=self.provider_name,
                generated_from_requirement_id=generated_from_requirement_id,
                is_generated_draft=True,
            ),
        )

    def _derive_subject(self, text: str) -> str:
        cleaned = re.sub(r"\s+", " ", text).strip()
        if not cleaned:
            return "System Capability"

        subject = cleaned.split(".")[0].strip()
        subject = re.sub(r"^the\s+", "", subject, flags=re.IGNORECASE)
        words = subject.split()

        if len(words) <= 6:
            return subject.title()

        return " ".join(words[:6]).title()

    def _matches_all(self, text: str, patterns: Iterable[str]) -> bool:
        return all(pattern in text for pattern in patterns)

    def _normalize_text(self, value: str | None) -> str:
        return re.sub(r"\s+", " ", value or "").strip().lower()

    def _suggested_id(self, temp_id: str, title: str) -> str:
        tokens = re.findall(r"[A-Z0-9]+", re.sub(r"[^A-Za-z0-9]+", " ", title).upper())
        stem = "-".join(tokens[:3]) if tokens else temp_id.upper()
        return f"DRAFT-{stem[:40]}"
