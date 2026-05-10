import type { DashboardContent, DashboardNavItem } from "../types/dashboard";

export function buildDashboardNavItems(projectId: string): DashboardNavItem[] {
  void projectId;
  return [
    { key: "overview", label: "Overview" },
    { key: "generate", label: "Generate Requirements" },
    { key: "graph", label: "Traceability Graph" },
    { key: "matrix", label: "Traceability Matrix" },
    { key: "stakeholder", label: "Stakeholder Requirements" },
    { key: "system", label: "System Requirements" },
    { key: "subsystem", label: "Subsystem Requirements" },
    { key: "software", label: "Software Requirements" },
    { key: "hardware", label: "Hardware Requirements" },
    { key: "design-data", label: "Design Data" },
    { key: "dfmea", label: "Risk / DFMEA" },
    { key: "validation", label: "Validation" },
    { key: "reports", label: "Reports" },
  ];
}

export const dashboardContent: DashboardContent = {
  summary: {
    projectName: "Coffee Machine Controls",
    projectId: "coffee-machine",
    owner: "Systems Engineering",
    revision: "Rev B",
    status: "In Review",
    baseline: "System Baseline 0.3",
    updatedAt: "Today, 09:40",
  },
  requirementCounts: [
    { category: "Stakeholder", count: 12, delta: "+2 this week" },
    { category: "System", count: 38, delta: "+4 this week" },
    { category: "Subsystem", count: 26, delta: "+1 this week" },
    { category: "Software", count: 54, delta: "+6 this week" },
    { category: "Hardware", count: 21, delta: "No change" },
  ],
  recentActivity: [
    {
      id: "activity-1",
      title: "System requirement review completed",
      detail: "SYS-014 through SYS-019 were updated after architecture review.",
      timestamp: "45 min ago",
    },
    {
      id: "activity-2",
      title: "Validation rule set refreshed",
      detail: "Ambiguity checks were rerun for the active requirement baseline.",
      timestamp: "2 hours ago",
    },
    {
      id: "activity-3",
      title: "Design data parameter added",
      detail: "Heating element maximum power constraint added for correlation.",
      timestamp: "Yesterday",
    },
  ],
  validationSummary: [
    { label: "Requirements passing checks", count: 123, tone: "good" },
    { label: "Needs clarification", count: 9, tone: "warning" },
    { label: "Potential conflicts", count: 3, tone: "critical" },
  ],
  contextItems: [
    { label: "Active baseline", value: "System Baseline 0.3" },
    { label: "Current review gate", value: "Preliminary design review" },
    { label: "Linked design parameters", value: "17 tracked values" },
    { label: "Open validation actions", value: "12 actions assigned" },
  ],
};

const dashboardSummariesByProject: Record<string, typeof dashboardContent.summary> = {
  "coffee-machine": dashboardContent.summary,
  "braking-system": {
    projectName: "Braking System Controls",
    projectId: "braking-system",
    owner: "Vehicle Dynamics Engineering",
    revision: "Rev A",
    status: "In Review",
    baseline: "Brake Demo Baseline 1.0",
    updatedAt: "Demo dataset",
  },
};

export function getDashboardSummary(projectId: string) {
  return dashboardSummariesByProject[projectId] ?? {
    ...dashboardContent.summary,
    projectId,
    projectName:
      projectId
        .split("-")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ") || dashboardContent.summary.projectName,
  };
}
