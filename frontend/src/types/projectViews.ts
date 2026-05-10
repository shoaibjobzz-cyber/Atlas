import type {
  Requirement,
  RequirementCorrelationSummary,
  RequirementFeasibilityAssessment,
  RequirementQualitySummary,
} from "./requirements";

export type ProjectValidationRequirementRecord = {
  requirement: Requirement;
  quality_summary: RequirementQualitySummary | null;
  quality_error: string | null;
  correlation_summary: RequirementCorrelationSummary | null;
  correlation_error: string | null;
  feasibility: RequirementFeasibilityAssessment | null;
  feasibility_error: string | null;
  parsed_coverage_count: number;
  parsed_coverage_total: number;
  parsed_missing_fields: string[];
};

export type ProjectValidationSummaryResponse = {
  total_requirements: number;
  requirements_with_quality_warnings: number;
  warning_counts_by_severity: {
    low: number;
    medium: number;
    high: number;
  };
  parsing_requirements_with_gaps: number;
  parsing_coverage_average: number;
  requirements_with_conflicts: number;
  feasibility_counts: {
    feasible: number;
    likely_infeasible: number;
    insufficient_data: number;
    warning: number;
  };
  top_flagged_requirements: Array<{
    requirement: Requirement;
    warning_count: number;
    conflict_count: number;
    feasibility_status: string | null;
    flag_score: number;
  }>;
  requirements: ProjectValidationRequirementRecord[];
};

export type ProjectReportSectionItem = {
  requirement: Requirement;
  summary: string;
};

export type ProjectReportSummaryResponse = {
  total_requirements: number;
  total_warnings: number;
  conflict_count: number;
  related_count: number;
  feasible_count: number;
  insufficient_data_count: number;
  likely_infeasible_count: number;
  warning_feasibility_count: number;
  avg_parsing_coverage: number;
  linked_evidence_count: number;
  generated_summary: {
    generated: number;
    manual: number;
  };
  quality_items: ProjectReportSectionItem[];
  parsing_items: ProjectReportSectionItem[];
  conflict_items: ProjectReportSectionItem[];
  feasibility_items: ProjectReportSectionItem[];
  evidence_items: ProjectReportSectionItem[];
  markdown: string;
};

export type TraceabilityHealthScoreResponse = {
  project_id: string;
  score: number;
  total_requirements: number;
  coverage_percent: number;
  missing_link_count: number;
  conflict_requirement_count: number;
  evidence_gap_count: number;
  broken_traceability_count: number;
  status: string;
  rationale: string;
};

export type TraceabilityGraphNodeResponse = {
  id: string;
  label: string;
  title: string;
  type: Requirement["type"];
  subsystem: string | null;
  provenance: string;
  health: string;
  warning_count: number;
  conflict_count: number;
  feasibility_status: string | null;
  is_generated: boolean;
};

export type TraceabilityGraphEdgeResponse = {
  id: string;
  source: string;
  target: string;
  kind: string;
  reason: string;
};

export type TraceabilityGraphResponse = {
  project_id: string;
  nodes: TraceabilityGraphNodeResponse[];
  edges: TraceabilityGraphEdgeResponse[];
};

export type TraceabilityGraphAnalysisResponse = {
  project_id: string;
  analysis_mode: string;
  title: string;
  description: string;
  selected_requirement_id: string | null;
  primary_node_ids: string[];
  secondary_node_ids: string[];
  primary_edge_ids: string[];
  secondary_edge_ids: string[];
  warning_node_ids: string[];
  affected_requirement_count: number;
  affected_subsystems: string[];
  warning_count: number;
  conflict_count: number;
  rationale: string | null;
};

export type ChangeImpactReviewRequirementItem = {
  requirement: Requirement;
  relationship_type: string;
  reason: string;
  recommended_fix_action: string;
  warning_count: number;
  conflict_count: number;
  linked_design_parameter_count: number;
  matched_tokens: string[];
};

export type ChangeImpactReviewDesignParameterItem = {
  id: string;
  name: string;
  parameter_name: string;
  value: string;
  unit: string | null;
  subsystem: string | null;
  linked_requirement_ids: string[];
  reason: string;
};

export type ChangeImpactReviewResponse = {
  project_id: string;
  change_request: string;
  direct_matches: ChangeImpactReviewRequirementItem[];
  indirect_impacts: ChangeImpactReviewRequirementItem[];
  likely_requirements_needing_edits: ChangeImpactReviewRequirementItem[];
  affected_design_parameters: ChangeImpactReviewDesignParameterItem[];
  recommended_actions: string[];
  warnings: string[];
};

export type TraceabilityMatrixRowResponse = {
  requirement: Requirement;
  parent_id: string | null;
  children_count: number;
  related_count: number;
  conflict_count: number;
  linked_design_parameters_count: number;
  feasibility_status: string;
  generation_provenance: string;
  low_quality: boolean;
  missing_evidence: boolean;
  warning_count: number;
};

export type TraceabilityMatrixResponse = {
  project_id: string;
  rows: TraceabilityMatrixRowResponse[];
};
