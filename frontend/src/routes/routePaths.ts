import type { DashboardNavKey } from "../types/dashboard";
import type { RequirementType } from "../types/requirements";

export const routePaths = {
  login: "/login",
  landing: "/",
  projectDashboard: (projectId = ":id") => `/projects/${projectId}/dashboard`,
  projectSettings: (projectId = ":id") => `/projects/${projectId}/settings`,
  projectRequirementGeneration: (projectId = ":id") => `/projects/${projectId}/generate-requirements`,
  projectEcuRequirementMerger: (projectId = ":id") => `/projects/${projectId}/ecu-requirement-merger`,
  projectTraceabilityGraph: (projectId = ":id") => `/projects/${projectId}/traceability-graph`,
  projectTraceabilityMatrix: (projectId = ":id") => `/projects/${projectId}/traceability-matrix`,
  projectRequirements: (projectId = ":id") => `/projects/${projectId}/requirements`,
  projectDesignData: (projectId = ":id") => `/projects/${projectId}/design-data`,
  projectDfmea: (projectId = ":id") => `/projects/${projectId}/dfmea`,
  projectValidation: (projectId = ":id") => `/projects/${projectId}/validation`,
  projectReports: (projectId = ":id") => `/projects/${projectId}/reports`,
  projectRequirementNew: (projectId = ":id", requirementType?: RequirementType | null) =>
    requirementType
      ? `/projects/${projectId}/requirements/new?type=${encodeURIComponent(requirementType)}`
      : `/projects/${projectId}/requirements/new`,
  projectRequirementDetail: (projectId = ":id", requirementId = ":requirementId") =>
    `/projects/${projectId}/requirements/${requirementId}`,
  projectRequirementEdit: (projectId = ":id", requirementId = ":requirementId") =>
    `/projects/${projectId}/requirements/${requirementId}/edit`,
} as const;

export function getProjectNavPath(projectId: string, key: DashboardNavKey): string {
  switch (key) {
    case "overview":
      return routePaths.projectDashboard(projectId);
    case "generate":
      return routePaths.projectRequirementGeneration(projectId);
    case "graph":
      return routePaths.projectTraceabilityGraph(projectId);
    case "matrix":
      return routePaths.projectTraceabilityMatrix(projectId);
    case "stakeholder":
      return `${routePaths.projectRequirements(projectId)}?type=Stakeholder`;
    case "system":
      return `${routePaths.projectRequirements(projectId)}?type=System`;
    case "subsystem":
      return `${routePaths.projectRequirements(projectId)}?type=Subsystem`;
    case "software":
      return `${routePaths.projectRequirements(projectId)}?type=Software`;
    case "hardware":
      return `${routePaths.projectRequirements(projectId)}?type=Hardware`;
    case "design-data":
      return routePaths.projectDesignData(projectId);
    case "dfmea":
      return routePaths.projectDfmea(projectId);
    case "validation":
      return routePaths.projectValidation(projectId);
    case "reports":
      return routePaths.projectReports(projectId);
  }
}

export function getRequirementTraceabilityPath(projectId: string, requirementId: string): string {
  return `${routePaths.projectRequirementDetail(projectId, requirementId)}?tab=traceability`;
}

export function getTraceabilityGraphFocusPath(
  projectId: string,
  requirementId: string,
  mode: "focus" | "impact" | "parents" | "children" | "subtree" = "impact"
): string {
  return `${routePaths.projectTraceabilityGraph(projectId)}?focus=${encodeURIComponent(requirementId)}&mode=${encodeURIComponent(mode)}`;
}

export function getTraceabilityMatrixFocusPath(
  projectId: string,
  requirementId: string,
  mode?: "row" | "parents" | "children" | "subtree"
): string {
  const params = new URLSearchParams({ focus: requirementId });
  if (mode && mode !== "row") {
    params.set("mode", mode);
  }
  return `${routePaths.projectTraceabilityMatrix(projectId)}?${params.toString()}`;
}
