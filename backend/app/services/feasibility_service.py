from __future__ import annotations

import re
from typing import Any

from sqlalchemy.orm import Session

from app.models.design_parameter import DesignParameter
from app.models.requirement import Requirement
from app.schemas.feasibility import (
    FeasibilityEvidenceItem,
    RequirementFeasibilityAssessment,
)
from app.services.design_parameters_service import list_design_parameters_for_requirement
from app.services.requirements_service import get_requirement
from app.services.structured_requirement_service import parse_requirement_text
from app.services.unit_normalization import (
    ENGINEERING_UNIT_PATTERN,
    comparable_values,
    convert_value,
    normalize_engineering_unit,
    unit_family,
)


FEASIBILITY_ENGINE_EXAMPLES = (
    "At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.",
    "Operating voltage shall be at most 48 V.",
    "The system shall respond within 100 ms.",
)

PARAMETER_DIMENSION_HINTS: dict[str, tuple[str, ...]] = {
    "time": ("response time", "time", "delay", "timing", "latency", "response"),
    "pressure": ("pressure", "brake pressure", "hydraulic"),
    "voltage": ("voltage", "supply voltage", "operating voltage"),
    "current": ("current", "amp", "amperage"),
    "power": ("power", "watt"),
    "temperature": ("temperature", "thermal", "heat"),
    "length": ("length", "distance", "travel", "stroke", "diameter"),
    "mass": ("mass", "weight"),
    "speed": ("speed", "velocity"),
    "force": ("force", "load"),
    "torque": ("torque",),
    "frequency": ("frequency", "sampling rate", "clock"),
    "percent": ("percent", "percentage"),
}
TIME_PARAMETER_HINTS = ("time", "delay", "latency", "response", "timing")
UPPER_OPERATORS = {"<=", "<", "at most", "less than", "no more than", "within", "under"}
LOWER_OPERATORS = {">=", ">", "at least", "greater than", "no less than", "over"}
EXACT_OPERATORS = {"=", "equal to"}


def _parse_if_needed(requirement: Requirement) -> dict[str, str | None]:
    return requirement.parsed_requirement or parse_requirement_text(requirement.title, requirement.text).model_dump()


def _numeric(value: str | float | None) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).strip())
    except ValueError:
        return None


def _normalized_parameter(value: str | None) -> str | None:
    if not value:
        return None
    return re.sub(r"\s+", " ", value.strip().lower())


def _parameter_dimension(parameter: str | None) -> str | None:
    normalized = _normalized_parameter(parameter)
    if not normalized:
        return None
    for dimension, hints in PARAMETER_DIMENSION_HINTS.items():
        if any(hint in normalized for hint in hints):
            return dimension
    return None


def _expected_dimension(parsed: dict[str, str | None]) -> str | None:
    unit_dimension = unit_family(parsed.get("unit"))
    if unit_dimension:
        return unit_dimension
    return _parameter_dimension(parsed.get("parameter"))


def _normalized_unit(value: str | None) -> str | None:
    return normalize_engineering_unit(value)


def _design_parameter_value(parameter: DesignParameter) -> tuple[float | None, str | None]:
    return _numeric(parameter.value), _normalized_unit(parameter.unit)


def _parameter_matches_dimension(parameter: DesignParameter, dimension: str) -> bool:
    _, unit = _design_parameter_value(parameter)
    if unit_family(unit) == dimension:
        return True
    name = _normalized_parameter(parameter.parameter_name or parameter.name)
    if not name:
        return False
    return dimension == "time" and any(hint in name for hint in TIME_PARAMETER_HINTS)


def _time_constraint(parsed: dict[str, str | None], source_text: str | None = None) -> tuple[float, str] | None:
    timing_text = " ".join(filter(None, [parsed.get("timing"), parsed.get("condition"), source_text]))
    if timing_text:
        matches = re.finditer(rf"(\d+(?:\.\d+)?)\s*({ENGINEERING_UNIT_PATTERN})", timing_text, re.IGNORECASE)
        for match in matches:
            value = _numeric(match.group(1))
            unit = _normalized_unit(match.group(2))
            if value is not None and unit and unit_family(unit) == "time":
                milliseconds = convert_value(value, unit, "ms")
                return (milliseconds, unit) if milliseconds is not None else None

    value = _numeric(parsed.get("value"))
    unit = _normalized_unit(parsed.get("unit"))
    if value is None or not unit or unit_family(unit) != "time":
        return None
    milliseconds = convert_value(value, unit, "ms")
    return (milliseconds, unit) if milliseconds is not None else None


def _incompatible_units(parsed: dict[str, str | None], parameters: list[DesignParameter]) -> bool:
    expected_dimension = _expected_dimension(parsed)
    if not expected_dimension:
        return False
    comparable_parameters = [
        parameter
        for parameter in parameters
        if _numeric(parameter.value) is not None and _normalized_unit(parameter.unit) is not None
    ]
    if not comparable_parameters:
        return False
    return all(unit_family(_normalized_unit(parameter.unit)) != expected_dimension for parameter in comparable_parameters)


def _assessment(
    *,
    status: str,
    explanation: str,
    evidence: list[FeasibilityEvidenceItem],
    assumptions: list[str] | None = None,
    confidence: float = 0.7,
    computed_values: dict[str, Any] | None = None,
) -> RequirementFeasibilityAssessment:
    return RequirementFeasibilityAssessment(
        assessment_status=status,
        explanation=explanation,
        evidence_used=evidence,
        assumptions=assumptions or [],
        confidence=confidence,
        computed_values=computed_values or {},
    )


def _time_assessment(
    parsed: dict[str, str | None],
    parameters: list[DesignParameter],
    source_text: str | None = None,
) -> RequirementFeasibilityAssessment | None:
    constraint = _time_constraint(parsed, source_text)
    if constraint is None:
        return None

    time_parameters = [parameter for parameter in parameters if _parameter_matches_dimension(parameter, "time")]
    if not time_parameters:
        return _assessment(
            status="insufficient_data",
            explanation="The requirement includes a time constraint, but no linked time-related design evidence was found.",
            evidence=[],
            assumptions=["Linked design parameters are required to assess timing feasibility."],
            confidence=0.45,
            computed_values={"required_time": round(constraint[0], 6), "unit": "ms"},
        )

    total_time = 0.0
    evidence: list[FeasibilityEvidenceItem] = []
    for parameter in time_parameters:
        value, unit = _design_parameter_value(parameter)
        converted = convert_value(value, unit, "ms") if value is not None and unit is not None else None
        if converted is None:
            continue
        total_time += converted
        evidence.append(
            FeasibilityEvidenceItem(
                source=parameter.id,
                detail=f"{parameter.name}: {value:g} {unit}",
            )
        )

    if not evidence:
        return _assessment(
            status="insufficient_data",
            explanation="The linked parameters do not contain comparable time values.",
            evidence=[],
            assumptions=["Timing evidence must use compatible time units."],
            confidence=0.4,
            computed_values={"required_time": round(constraint[0], 6), "unit": "ms"},
        )

    required_time = constraint[0]
    status = "feasible" if total_time <= required_time else "likely_infeasible"
    explanation = (
        "The linked timing budget fits within the requirement limit."
        if status == "feasible"
        else "The linked timing budget exceeds the requirement limit."
    )
    return _assessment(
        status=status,
        explanation=explanation,
        evidence=evidence,
        confidence=0.84 if status == "feasible" else 0.9,
        computed_values={
            "total_time": round(total_time, 6),
            "required_time": round(required_time, 6),
            "unit": "ms",
        },
    )


def _best_candidate_value(
    operator: str | None,
    requirement_value: float,
    requirement_unit: str | None,
    parameters: list[DesignParameter],
) -> tuple[float | None, str | None, list[FeasibilityEvidenceItem]]:
    comparable: list[tuple[float, str, FeasibilityEvidenceItem]] = []
    for parameter in parameters:
        value, unit = _design_parameter_value(parameter)
        if value is None or unit is None:
            continue
        converted = comparable_values(requirement_value, requirement_unit, value, unit)
        if converted is None:
            continue
        comparable.append(
            (
                converted[1],
                converted[2],
                FeasibilityEvidenceItem(source=parameter.id, detail=f"{parameter.name}: {value:g} {unit}"),
            )
        )

    if not comparable:
        return None, None, []

    if operator in LOWER_OPERATORS:
        selected = max(comparable, key=lambda item: item[0])
    elif operator in UPPER_OPERATORS:
        selected = min(comparable, key=lambda item: item[0])
    else:
        selected = min(comparable, key=lambda item: abs(item[0] - requirement_value))

    return selected[0], selected[1], [item[2] for item in comparable]


def _numeric_assessment(parsed: dict[str, str | None], parameters: list[DesignParameter]) -> RequirementFeasibilityAssessment:
    operator = (parsed.get("operator") or "").strip().lower()
    requirement_value = _numeric(parsed.get("value"))
    requirement_unit = _normalized_unit(parsed.get("unit"))
    requirement_dimension = _expected_dimension(parsed)

    if requirement_value is None or not requirement_unit or not requirement_dimension:
        return _assessment(
            status="insufficient_data",
            explanation="The requirement does not contain enough measurable information for deterministic feasibility analysis.",
            evidence=[],
            assumptions=["A measurable value and compatible unit are required."],
            confidence=0.35,
        )

    available_value, base_unit, evidence = _best_candidate_value(
        operator,
        requirement_value,
        requirement_unit,
        parameters,
    )
    if available_value is None or base_unit is None:
        status = "warning" if _incompatible_units(parsed, parameters) else "insufficient_data"
        explanation = (
            "Linked design parameters use incompatible unit dimensions for this requirement."
            if status == "warning"
            else "No linked design parameters provide comparable evidence for this requirement."
        )
        return _assessment(
            status=status,
            explanation=explanation,
            evidence=[],
            assumptions=["Linked design parameters must use compatible engineering dimensions."],
            confidence=0.4,
            computed_values={"required_value": requirement_value, "unit": requirement_unit},
        )

    required_value_base = comparable_values(requirement_value, requirement_unit, requirement_value, requirement_unit)
    if required_value_base is None:
        return _assessment(
            status="warning",
            explanation="The requirement unit could not be converted for deterministic comparison.",
            evidence=evidence,
            assumptions=["Only comparable engineering dimensions are evaluated."],
            confidence=0.3,
            computed_values={"required_value": requirement_value, "unit": requirement_unit},
        )
    normalized_required = required_value_base[0]

    if operator in LOWER_OPERATORS:
        feasible = available_value >= normalized_required
    elif operator in UPPER_OPERATORS:
        feasible = available_value <= normalized_required
    elif operator in EXACT_OPERATORS:
        feasible = abs(available_value - normalized_required) < 1e-9
    else:
        return _assessment(
            status="warning",
            explanation="The requirement operator is not yet supported for deterministic feasibility comparison.",
            evidence=evidence,
            assumptions=["Only simple upper, lower, and exact bounds are evaluated."],
            confidence=0.3,
            computed_values={"required_value": requirement_value, "unit": requirement_unit},
        )

    available_in_requirement_unit = convert_value(available_value, base_unit, requirement_unit)
    computed_values = {
        "required_value": requirement_value,
        "available_value": round(available_in_requirement_unit, 6) if available_in_requirement_unit is not None else None,
        "unit": requirement_unit,
        "comparison_base_unit": base_unit,
    }
    status = "feasible" if feasible else "likely_infeasible"
    explanation = (
        "Linked design evidence satisfies the requirement bound."
        if feasible
        else "Linked design evidence does not satisfy the requirement bound."
    )
    return _assessment(
        status=status,
        explanation=explanation,
        evidence=evidence,
        confidence=0.82 if feasible else 0.9,
        computed_values=computed_values,
    )


def assess_requirement_with_design_parameters(
    requirement: Requirement,
    linked_parameters: list[DesignParameter],
) -> RequirementFeasibilityAssessment:
    parsed = _parse_if_needed(requirement)
    time_result = _time_assessment(parsed, linked_parameters, requirement.text)
    if time_result is not None:
        return time_result
    return _numeric_assessment(parsed, linked_parameters)


def assess_requirement_feasibility(
    session: Session,
    requirement_id: str,
    owner_user_id: str | None = None,
) -> RequirementFeasibilityAssessment:
    requirement = get_requirement(session, requirement_id, owner_user_id)
    linked_parameters = list_design_parameters_for_requirement(session, requirement_id, owner_user_id)
    return assess_requirement_with_design_parameters(requirement, linked_parameters)
