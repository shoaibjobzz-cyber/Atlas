import type {
  ProjectReportSummaryResponse,
  ProjectValidationSummaryResponse,
} from "./projectViews";

export type SnapshotType = "validation" | "report";

export type ProjectSnapshotSummary = {
  id: string;
  project_id: string;
  snapshot_type: SnapshotType;
  name: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export type ProjectSnapshotDetail<TPayload = unknown> = ProjectSnapshotSummary & {
  payload: TPayload;
};

export type SnapshotComparisonDelta = {
  current: number;
  snapshot: number;
  delta: number;
};

export type ProjectSnapshotComparison = {
  snapshot: ProjectSnapshotSummary;
  snapshot_type: SnapshotType;
  deltas: Record<string, SnapshotComparisonDelta>;
};

export type CreateProjectSnapshotRequest = {
  snapshot_type: SnapshotType;
  name?: string;
  notes?: string;
  created_by?: string;
};

export type ValidationSnapshotDetail = ProjectSnapshotDetail<ProjectValidationSummaryResponse>;
export type ReportSnapshotDetail = ProjectSnapshotDetail<ProjectReportSummaryResponse>;
