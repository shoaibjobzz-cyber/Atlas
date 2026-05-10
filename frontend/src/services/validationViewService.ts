import { fetchProjectValidationSummary } from "./projectViewsApi";
import type { ProjectValidationSummaryResponse } from "../types/projectViews";
import type { StructuredRequirementFields } from "../types/requirements";
import type { ValidationRequirementResult, ValidationSummaryView } from "../types/validation";

export async function fetchProjectValidationResults(projectId: string): Promise<ValidationRequirementResult[]> {
  const response = await fetchProjectValidationSummary(projectId);
  return response.requirements.map(normalizeValidationRequirementRecord);
}

export async function fetchProjectValidationView(projectId: string): Promise<ValidationSummaryView> {
  const response = await fetchProjectValidationSummary(projectId);
  return normalizeValidationViewResponse(response);
}

export function normalizeValidationViewResponse(
  response: ProjectValidationSummaryResponse
): ValidationSummaryView {
  return {
    summary: response,
    results: response.requirements.map(normalizeValidationRequirementRecord),
  };
}

function normalizeValidationRequirementRecord(
  record: ProjectValidationSummaryResponse["requirements"][number]
): ValidationRequirementResult {
  return {
    requirement: record.requirement,
    qualitySummary: record.quality_summary,
    qualityError: record.quality_error,
    correlationSummary: record.correlation_summary,
    correlationError: record.correlation_error,
    feasibility: record.feasibility,
    feasibilityError: record.feasibility_error,
    parsedCoverageCount: record.parsed_coverage_count,
    parsedCoverageTotal: record.parsed_coverage_total,
    parsedMissingFields: record.parsed_missing_fields as Array<keyof StructuredRequirementFields>,
  };
}
