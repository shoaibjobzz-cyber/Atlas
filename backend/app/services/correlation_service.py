from __future__ import annotations

from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.requirement import Requirement
from app.schemas.correlation import (
    CorrelatedRequirementReference,
    RequirementCorrelationItem,
    RequirementCorrelationSummary,
)
from app.services.requirements_service import get_requirement, list_requirements
from app.services.structured_requirement_service import parse_requirement_text
from app.services.unit_normalization import comparable_values, normalize_engineering_unit


@dataclass
class Bound:
    kind: str
    value: float
    unit: str | None


@dataclass
class CorrelationRequirementLike:
    id: str
    project_id: str
    title: str
    text: str
    type: str
    status: str
    subsystem: str | None
    parsed_requirement: dict[str, str | None]


PARAMETER_UNIT_RULES = {
    "pressure": {"bar", "mbar", "Pa", "kPa"},
    "response time": {"ms", "s", "min"},
    "time": {"ms", "s", "min"},
    "voltage": {"V", "mV"},
    "current": {"A", "mA"},
    "temperature": {"°C", "K"},
    "power": {"W", "kW", "mW"},
    "frequency": {"Hz", "kHz", "MHz", "GHz"},
}


def _normalized(value: str | None) -> str | None:
    return value.strip().lower() if value else None


def _normalized_unit(value: str | None) -> str | None:
    return normalize_engineering_unit(value)


def _parameter_key(value: str | None) -> str | None:
    if not value:
        return None
    normalized = _normalized(value)
    if not normalized:
        return None
    for key in PARAMETER_UNIT_RULES:
        if key in normalized:
            return key
    return normalized


def _scope_overlap(left: str | None, right: str | None) -> bool:
    left_norm = _normalized(left)
    right_norm = _normalized(right)
    if not left_norm or not right_norm:
        return True
    return left_norm == right_norm or left_norm in right_norm or right_norm in left_norm


def _condition_overlap(left: str | None, right: str | None) -> bool:
    left_norm = _normalized(left)
    right_norm = _normalized(right)
    if not left_norm or not right_norm:
        return True
    if left_norm == right_norm:
        return True
    broad_markers = ("all modes", "all mode", "normal mode", "operating mode")
    if any(marker in left_norm for marker in broad_markers) or any(marker in right_norm for marker in broad_markers):
        return True
    return left_norm in right_norm or right_norm in left_norm


def _to_reference(requirement: CorrelationRequirementLike | Requirement) -> CorrelatedRequirementReference:
    return CorrelatedRequirementReference(
        id=requirement.id,
        requirement_code=requirement.requirement_code if isinstance(requirement, Requirement) else requirement.id,
        title=requirement.title,
        type=requirement.type,
        status=requirement.status,
    )


def _parse_if_needed(requirement: Requirement) -> dict[str, str | None]:
    parsed = requirement.parsed_requirement
    if parsed:
        normalized = dict(parsed)
        normalized["unit"] = _normalized_unit(parsed.get("unit"))
        return normalized
    return parse_requirement_text(requirement.title, requirement.text).model_dump()


def _parse_like_if_needed(requirement: CorrelationRequirementLike | Requirement) -> dict[str, str | None]:
    if isinstance(requirement, CorrelationRequirementLike):
        parsed = dict(requirement.parsed_requirement)
        parsed["unit"] = _normalized_unit(parsed.get("unit"))
        return parsed
    return _parse_if_needed(requirement)


def _to_bound(operator: str | None, value: str | None) -> Bound | None:
    if operator is None or value is None:
        return None
    try:
        numeric = float(value)
    except ValueError:
        return None

    normalized = operator.lower()
    if normalized in {"<=", "<", "at most", "less than", "no more than", "within"}:
        return Bound(kind="upper", value=numeric, unit=None)
    if normalized in {">=", ">", "at least", "greater than", "no less than"}:
        return Bound(kind="lower", value=numeric, unit=None)
    if normalized in {"=", "equal to"}:
        return Bound(kind="exact", value=numeric, unit=None)
    return None


def _invalid_parameter_unit_reason(parsed: dict[str, str | None]) -> str | None:
    parameter = _parameter_key(parsed.get("parameter"))
    unit = _normalized_unit(parsed.get("unit"))
    if not parameter or not unit:
        return None
    allowed_units = PARAMETER_UNIT_RULES.get(parameter)
    if allowed_units and unit not in allowed_units:
        return f"The parsed parameter '{parameter}' is paired with unit '{unit}', which does not look valid for that parameter."
    return None


def _related_reasons(
    target: CorrelationRequirementLike | Requirement,
    target_parsed: dict[str, str | None],
    other: CorrelationRequirementLike | Requirement,
    other_parsed: dict[str, str | None],
) -> list[str]:
    reasons: list[str] = []

    if target.subsystem and other.subsystem and _normalized(target.subsystem) == _normalized(other.subsystem):
        reasons.append(f"Same subsystem: {target.subsystem}.")

    target_parameter = _parameter_key(target_parsed.get("parameter"))
    other_parameter = _parameter_key(other_parsed.get("parameter"))
    if target_parameter and other_parameter and target_parameter == other_parameter:
        reasons.append(f"Both requirements reference the same parameter: {target_parameter}.")

    target_unit = _normalized_unit(target_parsed.get("unit"))
    other_unit = _normalized_unit(other_parsed.get("unit"))
    if target_unit and other_unit:
        comparable = comparable_values(1.0, target_unit, 1.0, other_unit)
        if comparable is not None:
            if target_unit == other_unit:
                reasons.append(f"Both requirements use the same unit: {target_unit}.")
            else:
                reasons.append(
                    f"Both requirements use comparable {comparable[2]}-dimension units: {target_unit} and {other_unit}."
                )

    if _scope_overlap(target_parsed.get("scope"), other_parsed.get("scope")):
        if target_parsed.get("scope") or other_parsed.get("scope"):
            reasons.append("The requirements operate in overlapping scope.")

    return reasons


def _conflict_reason(target_parsed: dict[str, str | None], other_parsed: dict[str, str | None]) -> str | None:
    target_parameter = _parameter_key(target_parsed.get("parameter"))
    other_parameter = _parameter_key(other_parsed.get("parameter"))
    if not target_parameter or target_parameter != other_parameter:
        return None

    if not _condition_overlap(target_parsed.get("condition"), other_parsed.get("condition")):
        return None

    target_unit = _normalized_unit(target_parsed.get("unit"))
    other_unit = _normalized_unit(other_parsed.get("unit"))
    left = _to_bound(target_parsed.get("operator"), target_parsed.get("value"))
    right = _to_bound(other_parsed.get("operator"), other_parsed.get("value"))
    if left is None or right is None:
        return None

    comparable = None
    if target_unit and other_unit:
        comparable = comparable_values(left.value, target_unit, right.value, other_unit)
        if comparable is None:
            return None
        left = Bound(kind=left.kind, value=comparable[0], unit=comparable[2])
        right = Bound(kind=right.kind, value=comparable[1], unit=comparable[2])

    if left.kind == "upper" and right.kind == "lower" and right.value > left.value:
        return "The requirements set incompatible lower and upper bounds for the same parameter under overlapping conditions."
    if left.kind == "lower" and right.kind == "upper" and left.value > right.value:
        return "The requirements set incompatible lower and upper bounds for the same parameter under overlapping conditions."
    if left.kind == right.kind and left.value != right.value:
        boundary = "upper" if left.kind == "upper" else "lower" if left.kind == "lower" else "exact"
        return f"The requirements define different {boundary} bounds for the same parameter under overlapping conditions."
    if left.kind == "exact" and right.kind == "exact" and left.value != right.value:
        return "The requirements define different exact values for the same parameter under overlapping conditions."
    if left.kind == "exact" and right.kind == "upper" and left.value > right.value:
        return "The exact value in one requirement exceeds the allowed upper bound in the related requirement."
    if left.kind == "exact" and right.kind == "lower" and left.value < right.value:
        return "The exact value in one requirement falls below the required lower bound in the related requirement."
    if right.kind == "exact" and left.kind == "upper" and right.value > left.value:
        return "The exact value in one requirement exceeds the allowed upper bound in the related requirement."
    if right.kind == "exact" and left.kind == "lower" and right.value < left.value:
        return "The exact value in one requirement falls below the required lower bound in the related requirement."
    return None


def get_requirement_correlations(session: Session, requirement_id: str) -> RequirementCorrelationSummary:
    target = get_requirement(session, requirement_id)
    return get_requirement_like_correlations(
        session,
        CorrelationRequirementLike(
            id=target.id,
            project_id=target.project_id,
            title=target.title,
            text=target.text,
            type=target.type,
            status=target.status,
            subsystem=target.subsystem,
            parsed_requirement=_parse_if_needed(target),
        ),
        exclude_requirement_id=target.id,
    )


def get_requirement_like_correlations(
    session: Session,
    target: CorrelationRequirementLike,
    exclude_requirement_id: str | None = None,
    project_requirements: list[Requirement] | None = None,
) -> RequirementCorrelationSummary:
    target_parsed = _parse_like_if_needed(target)
    source_requirements = project_requirements if project_requirements is not None else list_requirements(session, target.project_id)
    requirements = [
        item
        for item in source_requirements
        if exclude_requirement_id is None or item.id != exclude_requirement_id
    ]

    related_requirements: list[RequirementCorrelationItem] = []
    potential_conflicts: list[RequirementCorrelationItem] = []

    invalid_self_reason = _invalid_parameter_unit_reason(target_parsed)
    if invalid_self_reason:
        potential_conflicts.append(
            RequirementCorrelationItem(
                requirement=None,
                reason=invalid_self_reason,
            )
        )

    for other in requirements:
        other_parsed = _parse_if_needed(other)

        reasons = _related_reasons(target, target_parsed, other, other_parsed)
        if reasons:
            related_requirements.append(
                RequirementCorrelationItem(
                    requirement=_to_reference(other),
                    reason=" ".join(dict.fromkeys(reasons)),
                )
            )

        conflict_reason = _conflict_reason(target_parsed, other_parsed)
        if conflict_reason:
            potential_conflicts.append(
                RequirementCorrelationItem(
                    requirement=_to_reference(other),
                    reason=conflict_reason,
                )
            )

    return RequirementCorrelationSummary(
        related_requirements=related_requirements,
        potential_conflicts=potential_conflicts,
    )
