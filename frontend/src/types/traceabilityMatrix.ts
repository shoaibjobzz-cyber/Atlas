import type { Requirement, RequirementType } from "./requirements";

export type TraceabilityMatrixProvenanceFilter = "all" | "generated" | "manual";
export type TraceabilityMatrixIssueFilter =
  | "all"
  | "conflicts"
  | "missing-evidence"
  | "low-quality"
  | "broken";

export type TraceabilityMatrixFilters = {
  subsystem: string;
  type: RequirementType | "all";
  provenance: TraceabilityMatrixProvenanceFilter;
  issue: TraceabilityMatrixIssueFilter;
};

export type TraceabilityMatrixRow = {
  requirement: Requirement;
  hierarchy: string | null;
  parentId: string | null;
  childrenCount: number;
  relatedCount: number;
  conflictCount: number;
  linkedDesignParametersCount: number;
  feasibilityStatus: string;
  provenanceLabel: string;
  lowQuality: boolean;
  missingEvidence: boolean;
  warningCount: number;
};
