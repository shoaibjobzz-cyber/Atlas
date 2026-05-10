import { requestJson } from "./httpClient";
import type {
  CreateProjectSnapshotRequest,
  ProjectSnapshotComparison,
  ProjectSnapshotDetail,
  ProjectSnapshotSummary,
  SnapshotType,
} from "../types/projectSnapshots";

export function fetchProjectSnapshots(
  projectId: string,
  snapshotType?: SnapshotType
): Promise<ProjectSnapshotSummary[]> {
  const suffix = snapshotType ? `?snapshot_type=${encodeURIComponent(snapshotType)}` : "";
  return requestJson<ProjectSnapshotSummary[]>(
    `/projects/${encodeURIComponent(projectId)}/snapshots${suffix}`
  );
}

export function fetchProjectSnapshot<TPayload>(
  projectId: string,
  snapshotId: string
): Promise<ProjectSnapshotDetail<TPayload>> {
  return requestJson<ProjectSnapshotDetail<TPayload>>(
    `/projects/${encodeURIComponent(projectId)}/snapshots/${encodeURIComponent(snapshotId)}`
  );
}

export function createProjectSnapshot(
  projectId: string,
  payload: CreateProjectSnapshotRequest
): Promise<ProjectSnapshotDetail> {
  return requestJson<ProjectSnapshotDetail>(
    `/projects/${encodeURIComponent(projectId)}/snapshots`,
    {
      method: "POST",
      body: payload,
    }
  );
}

export function fetchProjectSnapshotComparison(
  projectId: string,
  snapshotId: string
): Promise<ProjectSnapshotComparison> {
  return requestJson<ProjectSnapshotComparison>(
    `/projects/${encodeURIComponent(projectId)}/snapshots/${encodeURIComponent(snapshotId)}/compare`
  );
}
