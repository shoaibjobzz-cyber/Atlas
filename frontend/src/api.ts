import { API_BASE_URL } from "./services/httpClient";

export type HealthResponse = {
  status: string;
  service: string;
};

export type Requirement = {
  id: string;
  title: string;
  type: string;
  status: string;
  source: string;
};

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function fetchHealth(): Promise<HealthResponse> {
  return fetchJson<HealthResponse>("/health");
}

export function fetchRequirements(): Promise<Requirement[]> {
  return fetchJson<Requirement[]>("/requirements?project_id=coffee-machine");
}
