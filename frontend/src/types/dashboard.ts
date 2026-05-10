export type DashboardNavKey =
  | "overview"
  | "generate"
  | "graph"
  | "matrix"
  | "stakeholder"
  | "system"
  | "subsystem"
  | "software"
  | "hardware"
  | "design-data"
  | "dfmea"
  | "validation"
  | "reports";

export type DashboardNavItem = {
  key: DashboardNavKey;
  label: string;
  disabled?: boolean;
};

export type DashboardSummary = {
  projectName: string;
  projectId: string;
  owner: string;
  revision: string;
  status: string;
  baseline: string;
  updatedAt: string;
};

export type RequirementCount = {
  category: string;
  count: number;
  delta: string;
};

export type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  timestamp: string;
};

export type ValidationItem = {
  label: string;
  count: number;
  tone: "good" | "warning" | "critical";
};

export type ContextPanelItem = {
  label: string;
  value: string;
};

export type DashboardContent = {
  summary: DashboardSummary;
  requirementCounts: RequirementCount[];
  recentActivity: ActivityItem[];
  validationSummary: ValidationItem[];
  contextItems: ContextPanelItem[];
};
