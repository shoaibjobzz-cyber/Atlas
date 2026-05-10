from app.core.config import settings
from app.schemas.agent_validation import RewriteAgentResult
from app.services.agent_validation.agents.base import StructuredAgentRuntime
from app.services.agent_validation.models import RetrievedChunk
from app.services.agent_validation.prompts import build_rewrite_prompt, rewrite_instructions


class RewriteAgent:
    def __init__(self, runtime: StructuredAgentRuntime) -> None:
        self._runtime = runtime

    def suggest(
        self,
        *,
        requirement_title: str,
        requirement_text: str,
        requirement_type: str,
        retrieved_chunks: list[RetrievedChunk],
    ) -> RewriteAgentResult:
        return self._runtime.run_structured(
            agent_name="rewrite_agent",
            instructions=rewrite_instructions(),
            model=settings.agent_deep_review_model,
            output_type=RewriteAgentResult,
            prompt=build_rewrite_prompt(
                requirement_title=requirement_title,
                requirement_text=requirement_text,
                requirement_type=requirement_type,
                retrieved_chunks=retrieved_chunks,
            ),
        )
