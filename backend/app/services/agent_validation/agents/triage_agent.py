from app.core.config import settings
from app.schemas.agent_validation import TriageAgentResult
from app.services.agent_validation.agents.base import StructuredAgentRuntime
from app.services.agent_validation.models import DuplicateCandidate, RetrievedChunk
from app.services.agent_validation.prompts import build_triage_prompt, triage_instructions


class TriageAgent:
    def __init__(self, runtime: StructuredAgentRuntime) -> None:
        self._runtime = runtime

    def review(
        self,
        *,
        requirement_title: str,
        requirement_text: str,
        requirement_type: str,
        retrieved_chunks: list[RetrievedChunk],
        duplicate_candidates: list[DuplicateCandidate],
    ) -> TriageAgentResult:
        return self._runtime.run_structured(
            agent_name="triage_agent",
            instructions=triage_instructions(),
            model=settings.agent_triage_model,
            output_type=TriageAgentResult,
            prompt=build_triage_prompt(
                requirement_title=requirement_title,
                requirement_text=requirement_text,
                requirement_type=requirement_type,
                retrieved_chunks=retrieved_chunks,
                duplicate_candidates=duplicate_candidates,
            ),
        )
