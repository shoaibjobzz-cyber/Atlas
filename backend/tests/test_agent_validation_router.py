from app.schemas.agent_validation import TriageAgentResult, ValidationIssue
from app.services.agent_validation.router import decide_validation_route


def test_route_stays_in_triage_when_confident() -> None:
    triage_result = TriageAgentResult(
        status="pass",
        confidence=0.91,
        needs_escalation=False,
        escalation_reason="No escalation needed.",
        issues=[],
    )

    decision = decide_validation_route(triage_result, confidence_threshold=0.78)

    assert decision.route_taken == "triage_only"
    assert decision.needs_escalation is False


def test_route_escalates_for_high_severity_issue() -> None:
    triage_result = TriageAgentResult(
        status="warning",
        confidence=0.88,
        needs_escalation=False,
        escalation_reason="No escalation requested by model.",
        issues=[
            ValidationIssue(
                type="ambiguity",
                severity="high",
                message="Response time is ambiguous.",
                evidence=[],
                suggested_fix="Specify the operating condition.",
            )
        ],
    )

    decision = decide_validation_route(triage_result, confidence_threshold=0.78)

    assert decision.route_taken == "deep_review"
    assert decision.needs_escalation is True
