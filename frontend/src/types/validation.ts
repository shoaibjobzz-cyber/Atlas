import type {
  Requirement,
  RequirementCorrelationSummary,
  RequirementFeasibilityAssessment,
  RequirementQualitySummary,
  StructuredRequirementFields,
} from "./requirements";
import type { ProjectValidationSummaryResponse } from "./projectViews";

export type ValidationRequirementResult = {
  requirement: Requirement;
  qualitySummary: RequirementQualitySummary | null;
  qualityError: string | null;
  correlationSummary: RequirementCorrelationSummary | null;
  correlationError: string | null;
  feasibility: RequirementFeasibilityAssessment | null;
  feasibilityError: string | null;
  parsedCoverageCount: number;
  parsedCoverageTotal: number;
  parsedMissingFields: Array<keyof StructuredRequirementFields>;
};

export type ValidationSummaryView = {
  summary: ProjectValidationSummaryResponse;
  results: ValidationRequirementResult[];
};
