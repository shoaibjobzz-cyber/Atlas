from typing import Protocol, TypeVar

from app.core.config import settings


TStructuredOutput = TypeVar("TStructuredOutput")


class AgentValidationProviderError(Exception):
    pass


class StructuredAgentRuntime(Protocol):
    def run_structured(
        self,
        *,
        agent_name: str,
        instructions: str,
        model: str,
        output_type: type[TStructuredOutput],
        prompt: str,
    ) -> TStructuredOutput:
        ...


class OpenAIAgentsRuntime:
    """Minimal runtime wrapper around the OpenAI Agents SDK."""

    def run_structured(
        self,
        *,
        agent_name: str,
        instructions: str,
        model: str,
        output_type: type[TStructuredOutput],
        prompt: str,
    ) -> TStructuredOutput:
        if not settings.openai_api_key:
            raise AgentValidationProviderError("OPENAI_API_KEY is required for agent-validation.")

        try:
            from agents import Agent, Runner
        except ImportError as error:  # pragma: no cover - dependency install path
            raise AgentValidationProviderError(
                "The OpenAI Agents SDK is not installed. Install 'openai-agents' to use agent-validation."
            ) from error

        try:
            agent = Agent(
                name=agent_name,
                instructions=instructions,
                model=model,
                output_type=output_type,
            )
            result = Runner.run_sync(agent, prompt)
        except Exception as error:  # pragma: no cover - provider/network failure
            raise AgentValidationProviderError(
                f"Agent '{agent_name}' failed while calling model '{model}': {error}"
            ) from error

        final_output = result.final_output
        if isinstance(final_output, output_type):
            return final_output
        return output_type.model_validate(final_output)
