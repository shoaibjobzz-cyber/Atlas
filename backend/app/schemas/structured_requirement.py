from pydantic import BaseModel


class StructuredRequirementFields(BaseModel):
    actor: str | None = None
    action: str | None = None
    object: str | None = None
    parameter: str | None = None
    operator: str | None = None
    value: str | None = None
    unit: str | None = None
    timing: str | None = None
    condition: str | None = None
    scope: str | None = None
