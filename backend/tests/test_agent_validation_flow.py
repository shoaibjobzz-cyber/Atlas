from app.schemas.agent_validation import (
    AgentDocumentIndexRequest,
    AgentDocumentUploadItem,
    AgentDocumentUploadRequest,
    DeepReviewAgentResult,
    RequirementValidationRequest,
    TriageAgentResult,
    ValidationIssue,
)
from app.services.agent_validation.service import AgentValidationService
from app.services.agent_validation.vector_store import InMemoryVectorStore
from tests.conftest import create_project, create_requirement


class FakeEmbeddingService:
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        vectors: list[list[float]] = []
        for text in texts:
            lowered = text.lower()
            vectors.append(
                [
                    float(len(lowered)),
                    float(lowered.count("brake")),
                    float(lowered.count("pressure")),
                    float(lowered.count("response")),
                ]
            )
        return vectors


class FakeRuntime:
    def __init__(self, *, triage_result: TriageAgentResult, deep_review_result: DeepReviewAgentResult | None = None):
        self._triage_result = triage_result
        self._deep_review_result = deep_review_result

    def run_structured(self, *, agent_name: str, instructions: str, model: str, output_type, prompt: str):
        _ = instructions, model, output_type, prompt
        if agent_name == "triage_agent":
            return self._triage_result
        if agent_name == "deep_review_agent":
            assert self._deep_review_result is not None
            return self._deep_review_result
        raise AssertionError(f"Unexpected agent call: {agent_name}")


def test_validation_flow_returns_triage_result_without_escalation(session) -> None:
    create_project(session, project_id="agent-demo", name="Agent Demo")
    create_requirement(
        session,
        requirement_id="REQ-001",
        project_id="agent-demo",
        title="Brake timing",
        text="The braking system shall respond within 100 ms in service braking mode.",
    )

    service = AgentValidationService(
        session,
        store=InMemoryVectorStore(),
        embedding_service=FakeEmbeddingService(),
        runtime=FakeRuntime(
            triage_result=TriageAgentResult(
                status="warning",
                confidence=0.89,
                needs_escalation=False,
                escalation_reason="No escalation needed.",
                issues=[
                    ValidationIssue(
                        type="missing_detail",
                        severity="medium",
                        message="Operating temperature is not specified.",
                        evidence=[],
                        suggested_fix="Add an operating temperature range.",
                    )
                ],
            )
        ),
    )
    service.upload_documents(
        AgentDocumentUploadRequest(
            project_id="agent-demo",
            documents=[
                AgentDocumentUploadItem(
                    file_name="brake-spec.txt",
                    content=(
                        "The braking system shall reach commanded pressure within 80 ms during service braking."
                    ),
                )
            ],
        )
    )
    service.index_documents(AgentDocumentIndexRequest(project_id="agent-demo"))

    result = service.validate_requirement(
        RequirementValidationRequest(
            project_id="agent-demo",
            requirement_title="Brake timing",
            requirement_text="The braking system shall respond within 100 ms in service braking mode.",
        )
    )

    assert result.route_taken == "triage_only"
    assert result.needs_escalation is False
    assert result.issues[0].type == "missing_detail"
    assert result.retrieved_chunks


def test_validation_flow_escalates_to_deep_review(session) -> None:
    create_project(session, project_id="agent-demo", name="Agent Demo")

    service = AgentValidationService(
        session,
        store=InMemoryVectorStore(),
        embedding_service=FakeEmbeddingService(),
        runtime=FakeRuntime(
            triage_result=TriageAgentResult(
                status="fail",
                confidence=0.42,
                needs_escalation=True,
                escalation_reason="Potential contradiction against retrieved evidence.",
                issues=[
                    ValidationIssue(
                        type="contradiction",
                        severity="high",
                        message="Retrieved evidence suggests a stricter timing budget.",
                        evidence=[],
                        suggested_fix="Review the claimed response time.",
                    )
                ],
            ),
            deep_review_result=DeepReviewAgentResult(
                status="fail",
                confidence=0.84,
                issues=[
                    ValidationIssue(
                        type="contradiction",
                        severity="high",
                        message="Source document requires 80 ms, not 100 ms.",
                        evidence=[],
                        suggested_fix="Revise the requirement to 80 ms or justify the variance.",
                    )
                ],
                rewritten_requirement=(
                    "The braking system shall respond within 80 ms during service braking."
                ),
                traceability_suggestions=["Link this requirement to the braking performance specification."],
                acceptance_criteria=["Verify measured response time is less than or equal to 80 ms."],
                missing_assumptions=["Assume service braking mode only."],
                missing_interfaces=["Brake controller latency budget."],
            ),
        ),
    )
    service.upload_documents(
        AgentDocumentUploadRequest(
            project_id="agent-demo",
            documents=[
                AgentDocumentUploadItem(
                    file_name="brake-spec.txt",
                    content="The braking system shall respond within 80 ms during service braking.",
                )
            ],
        )
    )
    service.index_documents(AgentDocumentIndexRequest(project_id="agent-demo"))

    result = service.validate_requirement(
        RequirementValidationRequest(
            project_id="agent-demo",
            requirement_title="Brake timing",
            requirement_text="The braking system shall respond within 100 ms during service braking.",
        )
    )

    assert result.route_taken == "deep_review"
    assert result.needs_escalation is True
    assert result.rewritten_requirement == "The braking system shall respond within 80 ms during service braking."
    assert result.traceability_suggestions
