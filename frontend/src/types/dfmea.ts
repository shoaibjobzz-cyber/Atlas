import type { Requirement, RequirementType } from "./requirements";

export const dfmeaStatusOptions = ["Open", "In Review", "Mitigating", "Closed"] as const;
export type DfmeaStatus = (typeof dfmeaStatusOptions)[number];

export type DfmeaRiskReference = {
  requirement_id: string;
  requirement_code: string;
  title: string;
  reason: string;
};

export type DfmeaSuggestion = {
  project_id: string;
  requirement: Requirement;
  function_candidate: string;
  failure_effect_candidates: string[];
  potential_cause_candidates: string[];
  current_prevention_controls_candidate: string | null;
  current_detection_controls_candidate: string | null;
  severity_suggestion: number;
  occurrence_suggestion: number;
  detection_suggestion: number;
  recommended_action_candidate: string | null;
  warnings: string[];
  related_impacted_requirements: DfmeaRiskReference[];
};

export type DfmeaEntry = {
  id: string;
  project_id: string;
  requirement_id: string;
  function: string;
  failure_mode: string;
  failure_effect: string;
  potential_cause: string;
  current_prevention_controls: string | null;
  current_detection_controls: string | null;
  severity: number;
  occurrence: number;
  detection: number;
  rpn: number;
  recommended_action: string | null;
  owner: string | null;
  status: DfmeaStatus;
  related_requirement_ids: string[];
  requirement: Requirement;
  related_requirements: Requirement[];
  created_by_user_id: string;
  updated_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DfmeaFilters = {
  project_id: string;
  statuses: DfmeaStatus[];
  subsystems: string[];
  requirement_types: RequirementType[];
};

export type DfmeaEntryFormValues = {
  id?: string | null;
  project_id: string;
  requirement_id: string;
  function: string;
  failure_mode: string;
  failure_effect: string;
  potential_cause: string;
  current_prevention_controls: string | null;
  current_detection_controls: string;
  severity: number;
  occurrence: number;
  detection: number;
  recommended_action: string | null;
  owner: string | null;
  status: DfmeaStatus;
  related_requirement_ids: string[];
};

export type DfmeaEntryFormErrors = Partial<Record<keyof DfmeaEntryFormValues, string>>;
