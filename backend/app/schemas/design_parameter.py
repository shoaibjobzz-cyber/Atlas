from pydantic import BaseModel, Field


class LinkedRequirementReference(BaseModel):
    id: str
    title: str
    type: str
    status: str

    model_config = {"from_attributes": True}


class DesignParameterBase(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=2, max_length=255)
    subsystem: str | None = Field(default=None, max_length=128)
    parameter_name: str = Field(min_length=2, max_length=255)
    value: str = Field(min_length=1, max_length=128)
    unit: str | None = Field(default=None, max_length=64)
    source_document: str | None = Field(default=None, max_length=255)
    revision: str | None = Field(default=None, max_length=64)
    notes: str | None = None


class DesignParameterCreate(DesignParameterBase):
    id: str = Field(min_length=1, max_length=64)
    requirement_ids: list[str] = Field(default_factory=list)


class DesignParameterUpdate(DesignParameterBase):
    requirement_ids: list[str] = Field(default_factory=list)


class DesignParameterResponse(DesignParameterBase):
    id: str
    linked_requirements: list[LinkedRequirementReference] = []

    model_config = {"from_attributes": True}


class LinkedDesignParameterReference(BaseModel):
    id: str
    name: str
    subsystem: str | None = None
    parameter_name: str
    value: str
    unit: str | None = None
    source_document: str | None = None
    revision: str | None = None

    model_config = {"from_attributes": True}
