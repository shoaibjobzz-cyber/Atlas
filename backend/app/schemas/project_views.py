from pydantic import BaseModel, Field

from app.schemas.correlation import RequirementCorrelationSummary
from app.schemas.feasibility import RequirementFeasibilityAssessment
from app.schemas.quality import RequirementQualitySummary
from app.schemas.requirement import RequirementResponse, RequirementType


class ProjectValidationRequirementRecord(BaseModel):
    requirement: RequirementResponse
    quality_summary: RequirementQualitySummary | None = None
    quality_error: str | None = None
    correlation_summary: RequirementCorrelationSummary | None = None
    correlation_error: str | None = None
    feasibility: RequirementFeasibilityAssessment | None = None
    feasibility_error: str | None = None
    parsed_coverage_count: int
    parsed_coverage_total: int
    parsed_missing_fields: list[str]


class ProjectWarningCountsBySeverity(BaseModel):
    low: int = 0
    medium: int = 0
    high: int = 0


class ProjectFeasibilityCounts(BaseModel):
    feasible: int = 0
    likely_infeasible: int = 0
    insufficient_data: int = 0
    warning: int = 0


class TopFlaggedRequirement(BaseModel):
    requirement: RequirementResponse
    warning_count: int
    conflict_count: int
    feasibility_status: str | None = None
    flag_score: int


class ProjectValidationSummaryResponse(BaseModel):
    total_requirements: int
    requirements_with_quality_warnings: int
    warning_counts_by_severity: ProjectWarningCountsBySeverity
    parsing_requirements_with_gaps: int
    parsing_coverage_average: float
    requirements_with_conflicts: int
    feasibility_counts: ProjectFeasibilityCounts
    top_flagged_requirements: list[TopFlaggedRequirement]
    requirements: list[ProjectValidationRequirementRecord]


class ProjectReportSectionItem(BaseModel):
    requirement: RequirementResponse
    summary: str


class ProjectGeneratedSummary(BaseModel):
    generated: int = 0
    manual: int = 0


class ProjectReportSummaryResponse(BaseModel):
    total_requirements: int
    total_warnings: int
    conflict_count: int
    related_count: int
    feasible_count: int
    insufficient_data_count: int
    likely_infeasible_count: int
    warning_feasibility_count: int
    avg_parsing_coverage: float
    linked_evidence_count: int
    generated_summary: ProjectGeneratedSummary
    quality_items: list[ProjectReportSectionItem]
    parsing_items: list[ProjectReportSectionItem]
    conflict_items: list[ProjectReportSectionItem]
    feasibility_items: list[ProjectReportSectionItem]
    evidence_items: list[ProjectReportSectionItem]
    markdown: str


class TraceabilityHealthScoreResponse(BaseModel):
    project_id: str
    score: int
    total_requirements: int
    coverage_percent: int
    missing_link_count: int
    conflict_requirement_count: int
    evidence_gap_count: int
    broken_traceability_count: int
    status: str
    rationale: str


class TraceabilityGraphNode(BaseModel):
    id: str
    label: str
    title: str
    type: RequirementType
    subsystem: str | None = None
    provenance: str
    health: str
    warning_count: int
    conflict_count: int
    feasibility_status: str | None = None
    is_generated: bool


class TraceabilityGraphEdge(BaseModel):
    id: str
    source: str
    target: str
    kind: str
    reason: str


class TraceabilityGraphResponse(BaseModel):
    project_id: str
    nodes: list[TraceabilityGraphNode]
    edges: list[TraceabilityGraphEdge]


class TraceabilityGraphAnalysisResponse(BaseModel):
    project_id: str
    analysis_mode: str
    title: str
    description: str
    selected_requirement_id: str | None = None
    primary_node_ids: list[str]
    secondary_node_ids: list[str]
    primary_edge_ids: list[str]
    secondary_edge_ids: list[str]
    warning_node_ids: list[str] = Field(default_factory=list)
    affected_requirement_count: int
    affected_subsystems: list[str] = Field(default_factory=list)
    warning_count: int
    conflict_count: int
    rationale: str | None = None


class ChangeImpactReviewRequest(BaseModel):
    change_request: str


class ChangeImpactReviewRequirementItem(BaseModel):
    requirement: RequirementResponse
    relationship_type: str
    reason: str
    recommended_fix_action: str
    warning_count: int = 0
    conflict_count: int = 0
    linked_design_parameter_count: int = 0
    matched_tokens: list[str] = Field(default_factory=list)


class ChangeImpactReviewDesignParameterItem(BaseModel):
    id: str
    name: str
    parameter_name: str
    value: str
    unit: str | None = None
    subsystem: str | None = None
    linked_requirement_ids: list[str] = Field(default_factory=list)
    reason: str


class ChangeImpactReviewResponse(BaseModel):
    project_id: str
    change_request: str
    direct_matches: list[ChangeImpactReviewRequirementItem]
    indirect_impacts: list[ChangeImpactReviewRequirementItem]
    likely_requirements_needing_edits: list[ChangeImpactReviewRequirementItem]
    affected_design_parameters: list[ChangeImpactReviewDesignParameterItem]
    recommended_actions: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class TraceabilityMatrixRowResponse(BaseModel):
    requirement: RequirementResponse
    parent_id: str | None = None
    children_count: int
    related_count: int
    conflict_count: int
    linked_design_parameters_count: int
    feasibility_status: str
    generation_provenance: str
    low_quality: bool
    missing_evidence: bool
    warning_count: int


class TraceabilityMatrixResponse(BaseModel):
    project_id: str
    rows: list[TraceabilityMatrixRowResponse]
