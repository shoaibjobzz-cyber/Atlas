from app.schemas.quality import RequirementQualityCheckRequest
from app.services.quality_service import evaluate_requirement_quality


def test_quality_service_flags_vague_wording_and_optional_language() -> None:
    payload = RequirementQualityCheckRequest(
        title="Weak Brake Message",
        text="The software should quickly provide user-friendly brake status messages as needed.",
        type="Software",
    )

    result = evaluate_requirement_quality(payload)

    rule_ids = {issue.rule_id for issue in result.issues}
    assert "ambiguous_terms" in rule_ids
    assert "weak_optional_language" in rule_ids
    assert "missing_measurable_criteria" in rule_ids
    assert result.suggested_rewrite is not None
    assert "shall" in result.suggested_rewrite.text.lower()
    assert "[time limit]" in result.suggested_rewrite.text


def test_quality_service_flags_missing_unit_when_numeric_value_exists() -> None:
    payload = RequirementQualityCheckRequest(
        title="Brake response time",
        text="The braking controller shall respond within 5 during wheel slip.",
        type="Subsystem",
    )

    result = evaluate_requirement_quality(payload)

    missing_unit_issue = next(issue for issue in result.issues if issue.rule_id == "missing_unit")
    assert missing_unit_issue.problematic_phrase == "5"
    assert result.suggested_rewrite is not None
    assert "5 [unit]" in result.suggested_rewrite.text


def test_quality_service_flags_multiple_requirements_and_and_or_usage() -> None:
    payload = RequirementQualityCheckRequest(
        title="Combined behavior",
        text="The braking controller shall detect wheel slip and/or illuminate a warning and log a fault.",
        type="Subsystem",
    )

    result = evaluate_requirement_quality(payload)

    rule_ids = {issue.rule_id for issue in result.issues}
    assert "and_or_usage" in rule_ids
    assert "compound_requirement" in rule_ids


def test_quality_service_flags_optional_language() -> None:
    payload = RequirementQualityCheckRequest(
        title="Optional action",
        text="The system may reset the braking output if possible.",
        type="System",
    )

    result = evaluate_requirement_quality(payload)

    weak_issue = next(issue for issue in result.issues if issue.rule_id == "weak_optional_language")
    assert weak_issue.problematic_phrase.lower() in {"may", "if possible"}


def test_quality_service_suggests_placeholders_when_required_data_is_missing() -> None:
    payload = RequirementQualityCheckRequest(
        title="Wheel lock prevention",
        text="The system shall quickly stop wheel lock safely.",
        type="System",
    )

    result = evaluate_requirement_quality(payload)

    assert result.suggested_rewrite is not None
    rewrite = result.suggested_rewrite.text
    assert "shall" in rewrite.lower()
    assert "[time limit]" in rewrite
    assert "[safety criterion]" in rewrite
