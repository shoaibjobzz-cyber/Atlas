import type {
  DesignParameter,
  DesignParameterFormValues,
  LinkedDesignParameterReference,
} from "../types/designParameters";
import { requestJson } from "./httpClient";

export function fetchDesignParameters(projectId: string, subsystem?: string): Promise<DesignParameter[]> {
  const params = new URLSearchParams({ project_id: projectId });
  if (subsystem) {
    params.set("subsystem", subsystem);
  }
  return requestJson<DesignParameter[]>(`/design-parameters?${params.toString()}`);
}

export function createDesignParameter(payload: DesignParameterFormValues): Promise<DesignParameter> {
  return requestJson<DesignParameter>("/design-parameters", {
    method: "POST",
    body: payload,
  });
}

export function updateDesignParameter(
  designParameterId: string,
  payload: Omit<DesignParameterFormValues, "id">
): Promise<DesignParameter> {
  return requestJson<DesignParameter>(`/design-parameters/${encodeURIComponent(designParameterId)}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteDesignParameter(designParameterId: string): Promise<void> {
  return requestJson<void>(`/design-parameters/${encodeURIComponent(designParameterId)}`, {
    method: "DELETE",
  });
}

export function fetchLinkedDesignParameters(requirementId: string): Promise<LinkedDesignParameterReference[]> {
  return requestJson<LinkedDesignParameterReference[]>(
    `/design-parameters/by-requirement/${encodeURIComponent(requirementId)}`
  );
}
