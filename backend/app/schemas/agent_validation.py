from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.requirement import RequirementType


ValidationStatus = Literal["pass", "warning", "fail"]
IssueType = Literal[
    "ambiguity",
    "contradiction",
    "missing_detail",
    "duplication",
    "format",
    "traceability",
    "weak_wording",
    "interface",
    "assumption",
]
IssueSeverity = Literal["low", "medium", "high"]
RouteTaken = Literal["triage_only", "deep_review"]


class AgentDocumentUploadItem(BaseModel):
    document_id: str | None = Field(default=None, max_length=128)
    file_name: str = Field(min_length=1, max_length=255)
    content: str = Field(min_length=1)
    content_type: str = Field(default="text/plain", max_length=128)


class AgentDocumentUploadRequest(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    documents: list[AgentDocumentUploadItem] = Field(min_length=1)


class AgentDocumentUploadSummary(BaseModel):
    document_id: str
    file_name: str
    content_type: str
    character_count: int
    uploaded: bool = True


class AgentDocumentUploadResponse(BaseModel):
    project_id: str
    uploaded_documents: list[AgentDocumentUploadSummary]


class AgentDocumentIndexRequest(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    document_ids: list[str] | None = None


class AgentDocumentIndexResponse(BaseModel):
    project_id: str
    indexed_document_ids: list[str]
    indexed_chunk_count: int


class EvidenceReference(BaseModel):
    document_id: str
    chunk_id: str
    quote: str = Field(min_length=1)


class ValidationIssue(BaseModel):
    type: IssueType
    severity: IssueSeverity
    message: str = Field(min_length=1)
    evidence: list[EvidenceReference] = Field(default_factory=list)
    suggested_fix: str | None = None


class RetrievedChunkReference(BaseModel):
    document_id: str
    chunk_id: str
    file_name: str
    score: float
    text_preview: str


class EscalationDecision(BaseModel):
    needs_escalation: bool
    reason: str = Field(min_length=1)


class TriageAgentResult(BaseModel):
    status: ValidationStatus
    confidence: float = Field(ge=0, le=1)
    needs_escalation: bool
    escalation_reason: str = Field(min_length=1)
    issues: list[ValidationIssue] = Field(default_factory=list)


class DeepReviewAgentResult(BaseModel):
    status: ValidationStatus
    confidence: float = Field(ge=0, le=1)
    issues: list[ValidationIssue] = Field(default_factory=list)
    rewritten_requirement: str | None = None
    traceability_suggestions: list[str] = Field(default_factory=list)
    acceptance_criteria: list[str] = Field(default_factory=list)
    missing_assumptions: list[str] = Field(default_factory=list)
    missing_interfaces: list[str] = Field(default_factory=list)


class RewriteSuggestion(BaseModel):
    title: str = Field(min_length=3, max_length=255)
    text: str = Field(min_length=10)
    rationale: str = Field(min_length=1)


class RewriteAgentResult(BaseModel):
    suggestions: list[RewriteSuggestion] = Field(min_length=1)


class RequirementValidationRequest(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    requirement_title: str = Field(min_length=3, max_length=255)
    requirement_text: str = Field(min_length=10)
    requirement_type: RequirementType = "System"
    current_requirement_id: str | None = Field(default=None, max_length=64)


class RequirementValidationResponse(BaseModel):
    status: ValidationStatus
    confidence: float = Field(ge=0, le=1)
    needs_escalation: bool
    route_taken: RouteTaken
    router_reason: str = Field(min_length=1)
    issues: list[ValidationIssue] = Field(default_factory=list)
    rewritten_requirement: str | None = None
    traceability_suggestions: list[str] = Field(default_factory=list)
    acceptance_criteria: list[str] = Field(default_factory=list)
    missing_assumptions: list[str] = Field(default_factory=list)
    missing_interfaces: list[str] = Field(default_factory=list)
    retrieved_chunks: list[RetrievedChunkReference] = Field(default_factory=list)


class RequirementRewriteRequest(BaseModel):
    project_id: str = Field(min_length=1, max_length=64)
    requirement_title: str = Field(min_length=3, max_length=255)
    requirement_text: str = Field(min_length=10)
    requirement_type: RequirementType = "System"
    current_requirement_id: str | None = Field(default=None, max_length=64)


class RequirementRewriteResponse(BaseModel):
    provider: str
    suggestions: list[RewriteSuggestion]
