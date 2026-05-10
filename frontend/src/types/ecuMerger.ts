import type {
  Requirement,
  RequirementCorrelationSummary,
  RequirementGenerationMetadata,
  RequirementPriority,
  RequirementQualitySummary,
  RequirementType,
  StructuredRequirementFields,
} from "./requirements";

export type EcuRequirementMergerCandidateValidation = {
  quality_summary: RequirementQualitySummary;
  parsed_requirement: StructuredRequirementFields;
  correlation_summary: RequirementCorrelationSummary;
};

export type EcuRequirementMergerTraceabilityItem = {
  requirement: Requirement;
  source_subsystem: string | null;
  source_feature_label: string | null;
  traceability_reason: string;
};

export type EcuRequirementMergerAffectedDesignParameter = {
  id: string;
  name: string;
  parameter_name: string;
  value: string;
  unit: string | null;
  subsystem: string | null;
  linked_requirement_ids: string[];
  reason: string;
};

export type EcuRequirementMergerCandidateReview = {
  temp_id: string;
  suggested_id: string;
  suggested_hierarchy: string | null;
  title: string;
  text: string;
  type: RequirementType;
  priority: RequirementPriority;
  rationale: string | null;
  parent_requirement_id: string | null;
  subsystem: string | null;
  verification_method: string | null;
  assumptions: string | null;
  generation_metadata: RequirementGenerationMetadata;
  validation: EcuRequirementMergerCandidateValidation;
  draft_label: string;
  source_requirement_ids: string[];
  source_requirement_codes: string[];
  source_subsystems: string[];
  merge_rationale: string;
  assumptions_list: string[];
  conflicts: string[];
  warnings: string[];
  recommended_fix_actions: string[];
  verification_notes: string[];
  shared_signals_or_interfaces: string[];
  timing_constraints: string[];
  safety_security_constraints: string[];
  affected_design_parameters: EcuRequirementMergerAffectedDesignParameter[];
  traceability: EcuRequirementMergerTraceabilityItem[];
};

export type EcuRequirementMergerAnalyzeRequest = {
  project_id: string;
  requirement_ids: string[];
};

export type EcuRequirementMergerAnalyzeResponse = {
  project_id: string;
  selected_requirement_ids: string[];
  selected_requirement_count: number;
  candidates: EcuRequirementMergerCandidateReview[];
  warnings: string[];
};

export type EcuRequirementMergerSaveCandidate = {
  temp_id: string;
  title: string;
  text: string;
  type: RequirementType;
  priority: RequirementPriority;
  rationale: string | null;
  parent_requirement_id: string | null;
  subsystem: string | null;
  verification_method: string | null;
  assumptions: string | null;
  generation_metadata: RequirementGenerationMetadata;
};

export type EcuRequirementMergerSaveRequest = {
  project_id: string;
  candidates: EcuRequirementMergerSaveCandidate[];
};

export type EcuRequirementMergerDraftState = EcuRequirementMergerCandidateReview & {
  draft_id: string;
  decision: "accepted" | "rejected";
};
