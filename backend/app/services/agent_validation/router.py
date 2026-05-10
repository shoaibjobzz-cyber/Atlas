from app.schemas.agent_validation import TriageAgentResult
from app.services.agent_validation.models import RouteDecision


def decide_validation_route(
    triage_result: TriageAgentResult,
    *,
    confidence_threshold: float,
) -> RouteDecision:
    if triage_result.needs_escalation:
        return RouteDecision(
            route_taken="deep_review",
            needs_escalation=True,
            reason=triage_result.escalation_reason,
        )

    if triage_result.confidence < confidence_threshold:
        return RouteDecision(
            route_taken="deep_review",
            needs_escalation=True,
            reason=f"Triage confidence {triage_result.confidence:.2f} is below threshold.",
        )

    if triage_result.status == "fail":
        return RouteDecision(
            route_taken="deep_review",
            needs_escalation=True,
            reason="Triage returned fail status and requires deeper evidence review.",
        )

    if any(issue.severity == "high" for issue in triage_result.issues):
        return RouteDecision(
            route_taken="deep_review",
            needs_escalation=True,
            reason="High-severity issue detected during triage.",
        )

    return RouteDecision(
        route_taken="triage_only",
        needs_escalation=False,
        reason="Triage was high-confidence and did not justify deeper review.",
    )
