export const requirementTypeOptions = ["Stakeholder", "System", "Subsystem", "Software", "Hardware"] as const;
export const requirementPriorityOptions = ["Low", "Medium", "High", "Critical"] as const;
export const requirementStatusOptions = ["Draft", "In Review", "Approved", "Rejected"] as const;

export type RequirementType = (typeof requirementTypeOptions)[number];
export type RequirementPriority = (typeof requirementPriorityOptions)[number];
export type RequirementStatus = (typeof requirementStatusOptions)[number];
export type RequirementGenerationSource = "ai" | "manual";
export type RequirementGenerationProvider = "mock" | "ollama" | "openai" | "future_llm";

export type RequirementGenerationMetadata = {
  generation_source: RequirementGenerationSource;
  generation_provider: RequirementGenerationProvider | null;
  generated_from_requirement_id: string | null;
  is_generated_draft: boolean;
  merged_from_requirement_ids?: string[];
  merged_from_requirement_codes?: string[];
  merged_from_subsystems?: string[];
  merge_strategy?: string | null;
};

export type Requirement = {
  id: string;
  requirement_code: string;
  hierarchy: string | null;
  feature_id?: string | null;
  section_id?: string | null;
  project_id: string;
  title: string;
  text: string;
  type: RequirementType;
  priority: RequirementPriority;
  status: RequirementStatus;
  parent_requirement_id: string | null;
  subsystem: string | null;
  verification_method: string | null;
  rationale: string | null;
  assumptions: string | null;
  generation_metadata: RequirementGenerationMetadata | null;
  parsed_requirement: StructuredRequirementFields | null;
  created_by_user_id: string;
  updated_by_user_id: string | null;
  deleted_by_user_id: string | null;
  created_by_username: string | null;
  updated_by_username: string | null;
  deleted_by_username: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  is_deleted: boolean;
};

export type RequirementIdPreview = {
  requirement_type: RequirementType;
  preview_id: string;
};

export type RequirementCreateInput = {
  id?: string | null;
  project_id: string;
  title: string;
  text: string;
  type: RequirementType;
  priority: RequirementPriority;
  status: RequirementStatus;
  parent_requirement_id: string | null;
  feature_id?: string | null;
  section_id?: string | null;
  subsystem: string | null;
  verification_method: string | null;
  rationale: string | null;
  assumptions: string | null;
  generation_metadata?: RequirementGenerationMetadata | null;
};

export type RequirementUpdateInput = Omit<RequirementCreateInput, "id">;

export type RequirementFormValues = Omit<RequirementCreateInput, "id"> & {
  id: string;
};

export type RequirementFormErrors = Partial<Record<keyof RequirementFormValues, string>>;

export const requirementSectionKindOptions = ["Header", "Subheader"] as const;
export type RequirementSectionKind = (typeof requirementSectionKindOptions)[number];

export type RequirementSection = {
  id: string;
  project_id: string;
  parent_section_id: string | null;
  title: string;
  description: string | null;
  kind: RequirementSectionKind;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type RequirementSectionCreateInput = {
  id?: string | null;
  project_id: string;
  parent_section_id: string | null;
  title: string;
  description: string | null;
  kind: RequirementSectionKind;
  order_index: number;
};

export type RequirementSectionUpdateInput = Omit<RequirementSectionCreateInput, "id">;

export type RequirementQualitySeverity = "low" | "medium" | "high";

export type RequirementQualityWarning = {
  severity: RequirementQualitySeverity;
  rule_id: string;
  title: string;
  explanation: string;
  suggestion: string;
};

export type RequirementQualityIssueSeverity = "info" | "warning" | "error";

export type RequirementQualityIssue = {
  rule_id: string;
  rule_name: string;
  severity: RequirementQualityIssueSeverity;
  problematic_phrase: string;
  explanation: string;
  suggested_correction: string;
};

export type RequirementRewriteRecommendation = {
  title: string;
  text: string;
  explanation: string;
  rule_coverage: string[];
};

export type RequirementQualitySummary = {
  score: number;
  warnings: RequirementQualityWarning[];
  issues: RequirementQualityIssue[];
  suggested_rewrite: RequirementRewriteRecommendation | null;
  explanation: string | null;
};

export type StructuredRequirementFields = {
  actor: string | null;
  action: string | null;
  object: string | null;
  parameter: string | null;
  operator: string | null;
  value: string | null;
  unit: string | null;
  timing: string | null;
  condition: string | null;
  scope: string | null;
};

export type CorrelatedRequirementReference = {
  id: string;
  requirement_code: string;
  title: string;
  type: string;
  status: string;
};

export type RequirementCorrelationItem = {
  requirement: CorrelatedRequirementReference | null;
  reason: string;
};

export type RequirementCorrelationSummary = {
  related_requirements: RequirementCorrelationItem[];
  potential_conflicts: RequirementCorrelationItem[];
};

export type FeasibilityEvidenceItem = {
  source: string;
  detail: string;
};

export type RequirementFeasibilityAssessment = {
  assessment_status: "feasible" | "likely_infeasible" | "insufficient_data" | "warning";
  explanation: string;
  evidence_used: FeasibilityEvidenceItem[];
  assumptions: string[];
  confidence: number;
  computed_values: Record<string, string | number | boolean | null | string[] | number[]>;
};
