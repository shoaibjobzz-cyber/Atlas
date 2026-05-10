from app.core.config import settings
from app.schemas.agent_validation import DeepReviewAgentResult, TriageAgentResult
from app.services.agent_validation.agents.base import StructuredAgentRuntime
from app.services.agent_validation.models import RetrievedChunk
from app.services.agent_validation.prompts import build_deep_review_prompt, deep_review_instructions


class DeepReviewAgent:
    def __init__(self, runtime: StructuredAgentRuntime) -> None:
        self._runtime = runtime

    def review(
        self,
        *,
        requirement_title: str,
        requirement_text: str,
        requirement_type: str,
        triage_summary: TriageAgentResult,
        retrieved_chunks: list[RetrievedChunk],
    ) -> DeepReviewAgentResult:
        return self._runtime.run_structured(
            agent_name="deep_review_agent",
            instructions=deep_review_instructions(),
            model=settings.agent_deep_review_model,
            output_type=DeepReviewAgentResult,
            prompt=build_deep_review_prompt(
                requirement_title=requirement_title,
                requirement_text=requirement_text,
                requirement_type=requirement_type,
                triage_summary=triage_summary,
                retrieved_chunks=retrieved_chunks,
            ),
        )
