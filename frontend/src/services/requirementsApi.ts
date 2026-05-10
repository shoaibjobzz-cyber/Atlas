import type {
  Requirement,
  RequirementCorrelationSummary,
  RequirementCreateInput,
  RequirementFeasibilityAssessment,
  RequirementIdPreview,
  RequirementSection,
  RequirementSectionCreateInput,
  RequirementSectionUpdateInput,
  RequirementUpdateInput,
} from "../types/requirements";
import { requestJson } from "./httpClient";

export function fetchRequirements(projectId: string, includeDeleted = false): Promise<Requirement[]> {
  const params = new URLSearchParams({ project_id: projectId });
  if (includeDeleted) {
    params.set("include_deleted", "true");
  }
  return requestJson<Requirement[]>(`/requirements?${params.toString()}`);
}

export function fetchRequirementSections(projectId: string): Promise<RequirementSection[]> {
  return requestJson<RequirementSection[]>(
    `/requirement-sections?project_id=${encodeURIComponent(projectId)}`
  );
}

export function fetchRequirement(requirementId: string): Promise<Requirement> {
  return requestJson<Requirement>(`/requirements/${encodeURIComponent(requirementId)}`);
}

export function fetchRequirementIdPreview(projectId: string, requirementType: string): Promise<RequirementIdPreview> {
  return requestJson<RequirementIdPreview>(
    `/requirements/id-preview?project_id=${encodeURIComponent(projectId)}&type=${encodeURIComponent(requirementType)}`
  );
}

export function fetchRequirementCorrelations(requirementId: string): Promise<RequirementCorrelationSummary> {
  return requestJson<RequirementCorrelationSummary>(
    `/requirements/${encodeURIComponent(requirementId)}/correlations`
  );
}

export function fetchRequirementFeasibility(requirementId: string): Promise<RequirementFeasibilityAssessment> {
  return requestJson<RequirementFeasibilityAssessment>(
    `/feasibility/requirements/${encodeURIComponent(requirementId)}`
  );
}

export function createRequirement(payload: RequirementCreateInput): Promise<Requirement> {
  return requestJson<Requirement>("/requirements", {
    method: "POST",
    body: payload,
  });
}

export function updateRequirement(requirementId: string, payload: RequirementUpdateInput): Promise<Requirement> {
  return requestJson<Requirement>(`/requirements/${encodeURIComponent(requirementId)}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteRequirement(requirementId: string): Promise<void> {
  return requestJson<void>(`/requirements/${encodeURIComponent(requirementId)}`, {
    method: "DELETE",
  });
}

export function createRequirementSection(
  payload: RequirementSectionCreateInput
): Promise<RequirementSection> {
  return requestJson<RequirementSection>("/requirement-sections", {
    method: "POST",
    body: payload,
  });
}

export function updateRequirementSection(
  sectionId: string,
  payload: RequirementSectionUpdateInput
): Promise<RequirementSection> {
  return requestJson<RequirementSection>(`/requirement-sections/${encodeURIComponent(sectionId)}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteRequirementSection(sectionId: string): Promise<void> {
  return requestJson<void>(`/requirement-sections/${encodeURIComponent(sectionId)}`, {
    method: "DELETE",
  });
}
