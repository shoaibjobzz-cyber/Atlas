import re
from dataclasses import dataclass

from app.schemas.quality import (
    RequirementQualityCheckRequest,
    RequirementQualityIssue,
    RequirementQualitySummary,
    RequirementQualityWarning,
    RequirementRewriteRecommendation,
)


VAGUE_TERM_REPLACEMENTS = {
    "fast": "within [time limit] [unit]",
    "quickly": "within [time limit] [unit]",
    "rapidly": "within [time limit] [unit]",
    "safely": "while maintaining [safety criterion]",
    "safe": "that satisfies [safety criterion]",
    "robust": "under [specified operating conditions]",
    "efficient": "with [performance metric]",
    "user-friendly": "with [usability criterion]",
}
UNVERIFIABLE_ADJECTIVES = ("safe", "robust", "efficient", "reliable", "acceptable", "adequate", "sufficient")
OPTIONAL_LANGUAGE_PATTERN = re.compile(r"\b(should|may|can|might|could|if possible|where possible)\b", re.IGNORECASE)
NUMBER_PATTERN = re.compile(r"\b\d+(\.\d+)?\b")
UNIT_PATTERN = re.compile(
    r"\b\d+(\.\d+)?\s?(ms|s|sec|seconds|min|minutes|h|hr|hours|hz|khz|mhz|ghz|v|mv|a|ma|w|kw|mw|"
    r"c|degc|°c|%|mm|cm|m|km|g|kg|mb|gb|kb|rpm|bar|psi)\b",
    re.IGNORECASE,
)
CONDITION_HINT_PATTERN = re.compile(
    r"\b(startup|shutdown|fault|failure|alarm|transition|mode|state|activate|deactivate|disable|enable|"
    r"power|reset|dispense|heat|cool|charge|discharge|braking|slip)\b",
    re.IGNORECASE,
)
CONDITION_PRESENT_PATTERN = re.compile(r"\b(if|when|while|during|under|in\s+\w+\s+mode)\b", re.IGNORECASE)
PASSIVE_PATTERN = re.compile(r"\b(is|are|was|were|be|been)\s+\w+ed\b", re.IGNORECASE)
NUMERIC_CONTEXT_PATTERN = re.compile(
    r"\b(within|less than|greater than|minimum|max(?:imum)?|at least|at most|no more than|no less than|"
    r"temperature|voltage|current|speed|pressure|time|latency|response|memory|rate|power|frequency|"
    r"capacity|accuracy|tolerance|distance|duration)\b",
    re.IGNORECASE,
)
MULTIPLE_REQUIREMENT_PATTERN = re.compile(r"\bshall\b.*\b(and|or)\b", re.IGNORECASE)


@dataclass(frozen=True)
class DetectedIssue:
    severity: str
    rule_id: str
    rule_name: str
    problematic_phrase: str
    explanation: str
    suggested_correction: str


def _warning_severity(issue_severity: str) -> str:
    return {
        "error": "high",
        "warning": "medium",
        "info": "low",
    }[issue_severity]


def _issue_to_warning(issue: DetectedIssue) -> RequirementQualityWarning:
    return RequirementQualityWarning(
        severity=_warning_severity(issue.severity),
        rule_id=issue.rule_id,
        title=issue.rule_name,
        explanation=issue.explanation,
        suggestion=issue.suggested_correction,
    )


def _issue_to_response(issue: DetectedIssue) -> RequirementQualityIssue:
    return RequirementQualityIssue(
        rule_id=issue.rule_id,
        rule_name=issue.rule_name,
        severity=issue.severity,  # type: ignore[arg-type]
        problematic_phrase=issue.problematic_phrase,
        explanation=issue.explanation,
        suggested_correction=issue.suggested_correction,
    )


def _extract_subject(text: str, requirement_type: str) -> str:
    subject_match = re.match(r"^\s*(The\s+.+?)\s+(shall|should|may|can|could|might|must)\b", text, re.IGNORECASE)
    if subject_match:
        return subject_match.group(1).strip()
    placeholder = requirement_type.lower()
    return f"The [{placeholder} subject]"


def _extract_predicate(text: str) -> str:
    modal_match = re.search(r"\b(shall|should|may|can|could|might|must)\b", text, re.IGNORECASE)
    if modal_match:
        predicate = text[modal_match.end() :].strip()
    else:
        predicate = text.strip()
    return predicate.rstrip(".; ")


def _replace_vague_terms(predicate: str) -> str:
    updated = predicate
    for term, replacement in VAGUE_TERM_REPLACEMENTS.items():
        updated = re.sub(rf"\b{re.escape(term)}\b", replacement, updated, flags=re.IGNORECASE)
    return updated


def _add_unit_placeholder_if_missing(predicate: str) -> str:
    return NUMBER_PATTERN.sub(lambda match: f"{match.group(0)} [unit]", predicate, count=1)


def _normalize_rewrite_text(payload: RequirementQualityCheckRequest, issues: list[DetectedIssue]) -> str:
    source_text = payload.text.strip() or payload.title.strip()
    if not source_text:
        return ""

    subject = _extract_subject(source_text, payload.type)
    predicate = _extract_predicate(source_text)
    predicate = OPTIONAL_LANGUAGE_PATTERN.sub("", predicate).strip()
    predicate = _replace_vague_terms(predicate)
    predicate = re.sub(r"\band/or\b", "and [select one alternative if only one applies]", predicate, flags=re.IGNORECASE)
    predicate = re.sub(r"\s{2,}", " ", predicate).strip(",; ")

    lowered = source_text.lower()
    has_number = bool(NUMBER_PATTERN.search(source_text))
    has_unit = bool(UNIT_PATTERN.search(source_text))

    if NUMERIC_CONTEXT_PATTERN.search(lowered) and not has_number:
        predicate = f"{predicate} within [value] [unit]".strip()
    elif NUMERIC_CONTEXT_PATTERN.search(lowered) and has_number and not has_unit:
        predicate = _add_unit_placeholder_if_missing(predicate)

    if CONDITION_HINT_PATTERN.search(lowered) and not CONDITION_PRESENT_PATTERN.search(lowered):
        predicate = f"{predicate} during [operating mode/condition]".strip()

    rewrite = f"{subject} shall {predicate}".strip()
    rewrite = re.sub(r"\s{2,}", " ", rewrite).strip()
    if not rewrite.endswith("."):
        rewrite = f"{rewrite}."

    if any(issue.rule_id == "compound_requirement" for issue in issues):
        rewrite = f"{rewrite} [Split this into separate requirements if the obligations are independently verifiable.]"

    return rewrite


def _find_problematic_phrase(text: str, candidates: tuple[str, ...]) -> str:
    lowered = text.lower()
    for candidate in candidates:
        if re.search(rf"\b{re.escape(candidate)}\b", lowered):
            return candidate
    return candidates[0]


def _collect_issues(payload: RequirementQualityCheckRequest) -> list[DetectedIssue]:
    text = f"{payload.title.strip()} {payload.text.strip()}".strip()
    lowered = text.lower()
    issues: list[DetectedIssue] = []

    matched_vague_terms = tuple(
        term for term in VAGUE_TERM_REPLACEMENTS if re.search(rf"\b{re.escape(term)}\b", lowered)
    )
    if matched_vague_terms:
        issues.append(
            DetectedIssue(
                severity="warning",
                rule_id="ambiguous_terms",
                rule_name="Vague wording detected",
                problematic_phrase=", ".join(matched_vague_terms),
                explanation="The requirement uses vague wording that does not define measurable or testable behavior.",
                suggested_correction="Replace vague wording with measurable limits, explicit criteria, or named operating conditions.",
            )
        )

    if any(term in lowered for term in UNVERIFIABLE_ADJECTIVES):
        problematic = _find_problematic_phrase(text, UNVERIFIABLE_ADJECTIVES)
        issues.append(
            DetectedIssue(
                severity="warning",
                rule_id="unverifiable_adjective",
                rule_name="Unverifiable adjective detected",
                problematic_phrase=problematic,
                explanation="The requirement uses an adjective that does not define how compliance will be verified.",
                suggested_correction="State the measurable criterion or acceptance condition that makes the adjective objective.",
            )
        )

    optional_match = OPTIONAL_LANGUAGE_PATTERN.search(text)
    if optional_match:
        issues.append(
            DetectedIssue(
                severity="error",
                rule_id="weak_optional_language",
                rule_name="Weak or optional language detected",
                problematic_phrase=optional_match.group(0),
                explanation="Optional modal verbs reduce obligation strength and can make the requirement non-binding.",
                suggested_correction="Use 'shall' with a clear subject and action unless the statement is intentionally non-mandatory.",
            )
        )

    numeric_context = bool(NUMERIC_CONTEXT_PATTERN.search(lowered))
    has_number = bool(NUMBER_PATTERN.search(text))
    has_unit = bool(UNIT_PATTERN.search(text))
    if matched_vague_terms and not has_number:
        issues.append(
            DetectedIssue(
                severity="error",
                rule_id="missing_measurable_criteria",
                rule_name="Missing measurable criteria",
                problematic_phrase=", ".join(matched_vague_terms),
                explanation="The requirement describes performance or quality without a measurable threshold.",
                suggested_correction="Add a numeric limit, acceptance criterion, or placeholder such as [time limit] [unit].",
            )
        )

    if numeric_context and not has_number:
        issues.append(
            DetectedIssue(
                severity="error",
                rule_id="missing_numeric_value",
                rule_name="Missing numeric value",
                problematic_phrase="measurable constraint without value",
                explanation="The requirement references a measurable constraint but does not provide the numeric value.",
                suggested_correction="Add the required value or a placeholder such as [value] [unit].",
            )
        )

    if numeric_context and has_number and not has_unit:
        missing_unit_phrase = NUMBER_PATTERN.search(text).group(0) if NUMBER_PATTERN.search(text) else "numeric value"
        issues.append(
            DetectedIssue(
                severity="error",
                rule_id="missing_unit",
                rule_name="Missing engineering unit",
                problematic_phrase=missing_unit_phrase,
                explanation="A numeric value is present but the engineering unit is not stated.",
                suggested_correction="Add the missing unit or a placeholder such as [unit].",
            )
        )

    if "and/or" in lowered:
        issues.append(
            DetectedIssue(
                severity="error",
                rule_id="and_or_usage",
                rule_name="Use of and/or detected",
                problematic_phrase="and/or",
                explanation="The phrase 'and/or' is ambiguous because it allows multiple interpretations.",
                suggested_correction="Choose either 'and' or 'or', or split the statement into separate requirements.",
            )
        )

    if re.search(r"\b(and|or)\b", lowered) and (
        text.count(",") >= 2 or MULTIPLE_REQUIREMENT_PATTERN.search(lowered) or ";" in text
    ):
        issues.append(
            DetectedIssue(
                severity="warning",
                rule_id="compound_requirement",
                rule_name="Possible compound requirement",
                problematic_phrase="multiple obligations joined by conjunctions",
                explanation="The requirement appears to bundle multiple obligations into one statement.",
                suggested_correction="Split the statement so each requirement expresses a single verifiable obligation.",
            )
        )

    subject_match = re.match(r"^\s*(The\s+.+?)\s+(shall|should|may|can|could|might|must)\b", payload.text.strip(), re.IGNORECASE)
    if not subject_match:
        issues.append(
            DetectedIssue(
                severity="warning",
                rule_id="unclear_subject",
                rule_name="Unclear subject",
                problematic_phrase=payload.text.strip().split(" ", 3)[0] if payload.text.strip() else "missing subject",
                explanation="The requirement does not clearly identify the subject responsible for the action.",
                suggested_correction="Start the statement with an explicit subject, such as 'The braking controller shall ...'.",
            )
        )

    if CONDITION_HINT_PATTERN.search(lowered) and not CONDITION_PRESENT_PATTERN.search(lowered):
        issues.append(
            DetectedIssue(
                severity="info",
                rule_id="missing_condition_or_mode",
                rule_name="Likely missing condition or mode",
                problematic_phrase="context-dependent behavior",
                explanation="The requirement suggests behavior that usually depends on a trigger, mode, or operating condition.",
                suggested_correction="Specify when the behavior applies, such as during startup, in fault mode, or under braking conditions.",
            )
        )

    passive_match = PASSIVE_PATTERN.search(text)
    if passive_match:
        issues.append(
            DetectedIssue(
                severity="warning",
                rule_id="passive_or_ambiguous_phrasing",
                rule_name="Passive or ambiguous phrasing detected",
                problematic_phrase=passive_match.group(0),
                explanation="Passive voice can obscure who is responsible for the required behavior.",
                suggested_correction="Rewrite the statement in active voice with an explicit subject and action.",
            )
        )

    return issues


def evaluate_requirement_quality(payload: RequirementQualityCheckRequest) -> RequirementQualitySummary:
    issues = _collect_issues(payload)
    warnings = [_issue_to_warning(issue) for issue in issues]
    severity_penalties = {"info": 5, "warning": 10, "error": 18}
    score = max(0, 100 - sum(severity_penalties.get(issue.severity, 0) for issue in issues))

    suggested_rewrite = None
    if payload.text.strip():
        suggested_rewrite = RequirementRewriteRecommendation(
            title=payload.title.strip(),
            text=_normalize_rewrite_text(payload, issues),
            explanation=(
                "This rewrite keeps the original engineering intent while replacing weak wording with "
                "clearer INCOSE-style language and placeholders where measurable data is missing."
            ),
            rule_coverage=[issue.rule_id for issue in issues],
        )

    explanation = (
        "Deterministic INCOSE-style review based on wording clarity, measurability, single-obligation structure, "
        "and verification readiness."
    )

    return RequirementQualitySummary(
        score=score,
        warnings=warnings,
        issues=[_issue_to_response(issue) for issue in issues],
        suggested_rewrite=suggested_rewrite,
        explanation=explanation,
    )
