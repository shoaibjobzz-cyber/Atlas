import { requestJson } from "./httpClient";


export type ProjectRecord = {
  id: string;
  name: string;
  description: string | null;
  status: "Draft" | "In Review" | "Active" | "Archived";
  project_kind: "Standard" | "Platform";
  created_at: string;
  updated_at: string;
};

export type ProjectCreateInput = {
  name: string;
  description?: string | null;
  status?: "Draft" | "In Review" | "Active" | "Archived";
  project_kind?: "Standard" | "Platform";
};

export type ProjectUpdateInput = {
  name: string;
  description?: string | null;
  status: "Draft" | "In Review" | "Active" | "Archived";
  project_kind: "Standard" | "Platform";
};

export type ProjectFeatureRecord = {
  id: string;
  project_id: string;
  parent_feature_id: string | null;
  name: string;
  kind: "Feature" | "Functional Domain" | "Module";
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type ProjectFeatureCreateInput = {
  id?: string | null;
  parent_feature_id?: string | null;
  name: string;
  kind: "Feature" | "Functional Domain" | "Module";
  description?: string | null;
  order_index?: number;
};

export type ProjectFeatureUpdateInput = Omit<ProjectFeatureCreateInput, "id">;

export function fetchProjects(): Promise<ProjectRecord[]> {
  return requestJson<ProjectRecord[]>("/projects");
}

export function fetchProject(projectId: string): Promise<ProjectRecord> {
  return requestJson<ProjectRecord>(`/projects/${projectId}`);
}

export function createProject(payload: ProjectCreateInput): Promise<ProjectRecord> {
  return requestJson<ProjectRecord>("/projects", {
    method: "POST",
    body: payload,
  });
}

export function updateProject(projectId: string, payload: ProjectUpdateInput): Promise<ProjectRecord> {
  return requestJson<ProjectRecord>(`/projects/${projectId}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteProject(projectId: string): Promise<void> {
  return requestJson<void>(`/projects/${projectId}`, {
    method: "DELETE",
  });
}

export function fetchProjectFeatures(projectId: string): Promise<ProjectFeatureRecord[]> {
  return requestJson<ProjectFeatureRecord[]>(`/projects/${encodeURIComponent(projectId)}/features`);
}

export function createProjectFeature(
  projectId: string,
  payload: ProjectFeatureCreateInput
): Promise<ProjectFeatureRecord> {
  return requestJson<ProjectFeatureRecord>(`/projects/${encodeURIComponent(projectId)}/features`, {
    method: "POST",
    body: payload,
  });
}

export function updateProjectFeature(
  projectId: string,
  featureId: string,
  payload: ProjectFeatureUpdateInput
): Promise<ProjectFeatureRecord> {
  return requestJson<ProjectFeatureRecord>(
    `/projects/${encodeURIComponent(projectId)}/features/${encodeURIComponent(featureId)}`,
    {
      method: "PUT",
      body: payload,
    }
  );
}

export function deleteProjectFeature(projectId: string, featureId: string): Promise<void> {
  return requestJson<void>(
    `/projects/${encodeURIComponent(projectId)}/features/${encodeURIComponent(featureId)}`,
    {
      method: "DELETE",
    }
  );
}
