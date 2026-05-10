from __future__ import annotations

from app.services.requirement_generation_provider import (
    RequirementGenerationProviderRequest,
    RequirementRewriteSuggestionRequest,
)


REQUIREMENT_TYPE_VALUES = ["Stakeholder", "System", "Subsystem", "Software", "Hardware"]
REQUIREMENT_PRIORITY_VALUES = ["Low", "Medium", "High", "Critical"]


GENERATED_CANDIDATES_RESPONSE_SCHEMA = {
    "name": "generated_requirement_candidates",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "candidates": {
                "type": "array",
                "minItems": 1,
                "maxItems": 8,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "title": {"type": "string"},
                        "text": {"type": "string"},
                        "type": {"type": "string", "enum": REQUIREMENT_TYPE_VALUES},
                        "priority": {"type": "string", "enum": REQUIREMENT_PRIORITY_VALUES},
                        "rationale": {"type": ["string", "null"]},
                        "subsystem": {"type": ["string", "null"]},
                        "verification_method": {"type": ["string", "null"]},
                        "assumptions": {"type": ["string", "null"]},
                    },
                    "required": [
                        "title",
                        "text",
                        "type",
                        "priority",
                        "rationale",
                        "subsystem",
                        "verification_method",
                        "assumptions",
                    ],
                },
            }
        },
        "required": ["candidates"],
    },
}


REWRITE_SUGGESTIONS_RESPONSE_SCHEMA = {
    "name": "requirement_rewrite_suggestions",
    "strict": True,
    "schema": {
        "type": "object",
        "additionalProperties": False,
        "properties": {
            "suggestions": {
                "type": "array",
                "minItems": 1,
                "maxItems": 3,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "properties": {
                        "title": {"type": "string"},
                        "text": {"type": "string"},
                        "rationale": {"type": "string"},
                    },
                    "required": ["title", "text", "rationale"],
                },
            }
        },
        "required": ["suggestions"],
    },
}


def build_feature_generation_messages(
    payload: RequirementGenerationProviderRequest,
) -> list[dict[str, str]]:
    feature_description = (payload.feature_description or "").strip()
    return [
        {
            "role": "system",
            "content": (
                "You generate engineering requirement draft candidates for a requirements management tool. "
                "Produce 4 to 8 review-first requirement drafts. Keep them measurable when practical, use clear "
                "requirement language, avoid vague wording unless uncertainty is unavoidable, and prefer categories "
                "from this set only: Stakeholder, System, Subsystem, Software, Hardware. "
                "Return only JSON matching the provided schema."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Project ID: {payload.project_id}\n"
                "Mode: Generate candidate requirements from a high-level feature description.\n"
                f"Feature description:\n{feature_description}\n\n"
                "Expectations:\n"
                "- Generate 4 to 8 candidate requirements.\n"
                "- Cover different engineering concerns where reasonable, such as performance, behavior, mode handling, "
                "fault handling, operator indication, and verification evidence.\n"
                "- Use measurable constraints where possible.\n"
                "- Do not mention being an AI in the requirement text.\n"
                "- Keep each candidate independent and reviewable.\n"
                "- If the input is underspecified, still provide useful candidates and note assumptions in the assumptions field."
            ),
        },
    ]


def build_decomposition_messages(
    payload: RequirementGenerationProviderRequest,
) -> list[dict[str, str]]:
    source_title = (payload.source_requirement_title or "").strip()
    source_text = (payload.source_requirement_text or "").strip()
    return [
        {
            "role": "system",
            "content": (
                "You decompose a parent engineering requirement into draft child requirements for review. "
                "Produce 4 to 8 child requirements across sensible categories such as System, Subsystem, Software, "
                "Hardware, and verification-oriented coverage when appropriate. Keep them measurable when practical. "
                "Return only JSON matching the provided schema."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Project ID: {payload.project_id}\n"
                f"Parent requirement ID: {payload.source_requirement_id}\n"
                f"Parent title:\n{source_title}\n\n"
                f"Parent text:\n{source_text}\n\n"
                "Expectations:\n"
                "- Decompose the parent into child requirements that could reasonably be reviewed before save.\n"
                "- Use multiple requirement categories where that adds traceable engineering coverage.\n"
                "- Preserve the parent intent.\n"
                "- Use measurable wording where possible.\n"
                "- Add assumptions only when necessary."
            ),
        },
    ]


def build_rewrite_suggestion_messages(
    payload: RequirementRewriteSuggestionRequest,
) -> list[dict[str, str]]:
    goals = payload.goals or [
        "make_measurable",
        "improve_testability",
        "reduce_ambiguity",
        "clarify_units_conditions_scope",
    ]
    return [
        {
            "role": "system",
            "content": (
                "You improve engineering requirement wording while preserving intent. "
                "Return 1 to 3 rewrite suggestions that make the requirement clearer and more measurable. "
                "Return only JSON matching the provided schema."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Project ID: {payload.project_id}\n"
                f"Requirement ID: {payload.requirement_id or 'draft'}\n"
                f"Type: {payload.type}\n"
                f"Title:\n{payload.title}\n\n"
                f"Text:\n{payload.text}\n\n"
                f"Rewrite goals:\n- " + "\n- ".join(goals) + "\n\n"
                "Expectations:\n"
                "- Preserve the core intent.\n"
                "- Prefer measurable wording and explicit conditions.\n"
                "- Explain briefly why each rewrite is an improvement."
            ),
        },
    ]
