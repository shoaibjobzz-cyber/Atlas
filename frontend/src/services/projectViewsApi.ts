import { requestJson } from "./httpClient";
import type {
  ChangeImpactReviewResponse,
  ProjectReportSummaryResponse,
  TraceabilityHealthScoreResponse,
  ProjectValidationSummaryResponse,
  TraceabilityGraphAnalysisResponse,
  TraceabilityGraphResponse,
  TraceabilityMatrixResponse,
} from "../types/projectViews";

export function fetchProjectValidationSummary(projectId: string): Promise<ProjectValidationSummaryResponse> {
  return requestJson<ProjectValidationSummaryResponse>(
    `/project-views/${encodeURIComponent(projectId)}/validation-summary`
  );
}

export function fetchProjectReportSummary(projectId: string): Promise<ProjectReportSummaryResponse> {
  return requestJson<ProjectReportSummaryResponse>(
    `/project-views/${encodeURIComponent(projectId)}/report-summary`
  );
}

export function fetchProjectTraceabilityHealth(projectId: string): Promise<TraceabilityHealthScoreResponse> {
  return requestJson<TraceabilityHealthScoreResponse>(
    `/project-views/${encodeURIComponent(projectId)}/traceability-health`
  );
}

export function fetchProjectTraceabilityGraph(projectId: string): Promise<TraceabilityGraphResponse> {
  return requestJson<TraceabilityGraphResponse>(
    `/project-views/${encodeURIComponent(projectId)}/traceability-graph`
  );
}

export function fetchProjectTraceabilityImpactAnalysis(
  projectId: string,
  requirementId: string,
  direction: "both" | "upstream" | "downstream"
): Promise<TraceabilityGraphAnalysisResponse> {
  return requestJson<TraceabilityGraphAnalysisResponse>(
    `/project-views/${encodeURIComponent(projectId)}/traceability-graph/impact/${encodeURIComponent(requirementId)}?direction=${encodeURIComponent(direction)}`
  );
}

export function fetchProjectTraceabilityBrokenChains(
  projectId: string,
  mode: "all" | "orphans" | "missing-evidence"
): Promise<TraceabilityGraphAnalysisResponse> {
  return requestJson<TraceabilityGraphAnalysisResponse>(
    `/project-views/${encodeURIComponent(projectId)}/traceability-graph/broken-chains?mode=${encodeURIComponent(mode)}`
  );
}

export function fetchProjectTraceabilityCriticalPath(
  projectId: string
): Promise<TraceabilityGraphAnalysisResponse> {
  return requestJson<TraceabilityGraphAnalysisResponse>(
    `/project-views/${encodeURIComponent(projectId)}/traceability-graph/critical-path`
  );
}

export function fetchProjectTraceabilityMatrix(projectId: string): Promise<TraceabilityMatrixResponse> {
  return requestJson<TraceabilityMatrixResponse>(
    `/project-views/${encodeURIComponent(projectId)}/traceability-matrix`
  );
}

export function runProjectChangeImpactReview(
  projectId: string,
  changeRequest: string
): Promise<ChangeImpactReviewResponse> {
  return requestJson<ChangeImpactReviewResponse>(
    `/project-views/${encodeURIComponent(projectId)}/change-impact-review`,
    {
      method: "POST",
      body: {
        change_request: changeRequest,
      },
    }
  );
}
