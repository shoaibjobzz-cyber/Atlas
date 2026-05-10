import type {
  Requirement,
  RequirementCorrelationSummary,
  RequirementGenerationMetadata,
  RequirementPriority,
  RequirementQualitySummary,
  RequirementType,
  StructuredRequirementFields,
} from "./requirements";

export type GenerationMode = "feature" | "decompose";

export type GeneratedRequirementCandidateValidation = {
  quality_summary: RequirementQualitySummary;
  parsed_requirement: StructuredRequirementFields;
  correlation_summary: RequirementCorrelationSummary;
};

export type GeneratedRequirementCandidateReview = {
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
  validation: GeneratedRequirementCandidateValidation;
  draft_label: string;
};

export type RequirementGenerationResponse = {
  project_id: string;
  mode: GenerationMode;
  source_requirement_id: string | null;
  candidates: GeneratedRequirementCandidateReview[];
};

export type RequirementGenerationRequest = {
  project_id: string;
  mode: GenerationMode;
  feature_description?: string | null;
  source_requirement_id?: string | null;
};

export type GeneratedRequirementCandidateInput = {
  temp_id: string;
  suggested_id: string;
  suggested_hierarchy?: string | null;
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

export type RequirementGenerationReviewRequest = {
  project_id: string;
  candidates: GeneratedRequirementCandidateInput[];
};

export type RequirementGenerationSaveCandidate = Omit<GeneratedRequirementCandidateInput, "suggested_id">;

export type RequirementGenerationSaveRequest = {
  project_id: string;
  candidates: RequirementGenerationSaveCandidate[];
};

export type RequirementGenerationSaveResponse = {
  saved_requirements: Requirement[];
};

export type GeneratedRequirementDraftState = GeneratedRequirementCandidateReview & {
  draft_id: string;
  decision: "accepted" | "rejected";
};

export type RequirementRewriteSuggestionRequest = {
  project_id: string;
  requirement_id?: string | null;
  title: string;
  text: string;
  type: RequirementType;
  goals?: RewriteGoal[];
};

export type RewriteGoal =
  | "make_measurable"
  | "improve_testability"
  | "reduce_ambiguity"
  | "clarify_units_conditions_scope"
  | "decompose_wording";

export type RequirementRewriteSuggestion = {
  title: string;
  text: string;
  rationale: string;
  generation_metadata: RequirementGenerationMetadata;
  validation: GeneratedRequirementCandidateValidation;
  draft_label: string;
};

export type RequirementRewriteSuggestionResponse = {
  provider: RequirementGenerationMetadata["generation_provider"] | null;
  suggestions: RequirementRewriteSuggestion[];
};
