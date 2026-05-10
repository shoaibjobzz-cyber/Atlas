from app.schemas.agent_validation import RequirementValidationRequest, RequirementValidationResponse


def run_input_guardrails(payload: RequirementValidationRequest) -> None:
    """Hook for future policy checks before any model call."""
    _ = payload


def run_output_guardrails(result: RequirementValidationResponse) -> None:
    """Hook for future policy checks after agent execution."""
    _ = result
