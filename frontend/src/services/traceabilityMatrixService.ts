import { fetchProjectTraceabilityMatrix as fetchProjectTraceabilityMatrixPayload } from "./projectViewsApi";
import type { RequirementType } from "../types/requirements";
import type { TraceabilityMatrixRowResponse } from "../types/projectViews";
import type {
  TraceabilityMatrixFilters,
  TraceabilityMatrixRow,
} from "../types/traceabilityMatrix";

function provenanceLabel(provenance: string) {
  return provenance === "ai" || provenance === "Generated" ? "Generated" : "Manual";
}

function normalizeMatrixRow(row: TraceabilityMatrixRowResponse): TraceabilityMatrixRow {
  return {
    requirement: row.requirement,
    hierarchy: row.requirement.hierarchy,
    parentId: row.parent_id,
    childrenCount: row.children_count,
    relatedCount: row.related_count,
    conflictCount: row.conflict_count,
    linkedDesignParametersCount: row.linked_design_parameters_count,
    feasibilityStatus: row.feasibility_status,
    provenanceLabel: provenanceLabel(row.generation_provenance),
    lowQuality: row.low_quality,
    missingEvidence: row.missing_evidence,
    warningCount: row.warning_count,
  };
}

export async function fetchProjectTraceabilityMatrix(projectId: string): Promise<TraceabilityMatrixRow[]> {
  const response = await fetchProjectTraceabilityMatrixPayload(projectId);
  return response.rows.map(normalizeMatrixRow);
}

export function filterTraceabilityMatrixRows(
  rows: TraceabilityMatrixRow[],
  filters: TraceabilityMatrixFilters
) {
  return rows.filter((row) => {
    const subsystemMatches =
      filters.subsystem === "all" ||
      (row.requirement.subsystem ?? "Unassigned") === filters.subsystem;
    const typeMatches = filters.type === "all" || row.requirement.type === filters.type;
    const provenanceMatches =
      filters.provenance === "all" ||
      (filters.provenance === "generated"
        ? row.requirement.generation_metadata?.generation_source === "ai"
        : row.requirement.generation_metadata?.generation_source !== "ai");
    const issueMatches =
      filters.issue === "all" ||
      (filters.issue === "conflicts" && row.conflictCount > 0) ||
      (filters.issue === "missing-evidence" && row.missingEvidence) ||
      (filters.issue === "low-quality" && row.lowQuality) ||
      (filters.issue === "broken" &&
        (row.missingEvidence || row.lowQuality || row.conflictCount > 0 || row.childrenCount === 0));

    return subsystemMatches && typeMatches && provenanceMatches && issueMatches;
  });
}

export function collectTraceabilityMatrixFilters(rows: TraceabilityMatrixRow[]) {
  const subsystemOptions = Array.from(
    new Set(rows.map((row) => row.requirement.subsystem ?? "Unassigned"))
  ).sort((left, right) => left.localeCompare(right));

  const typeOptions: Array<RequirementType | "all"> = [
    "all",
    "Stakeholder",
    "System",
    "Subsystem",
    "Software",
    "Hardware",
  ];

  return {
    subsystemOptions: ["all", ...subsystemOptions],
    typeOptions,
  };
}
