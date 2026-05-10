import type { DfmeaEntry, DfmeaEntryFormValues, DfmeaFilters, DfmeaSuggestion } from "../types/dfmea";
import { requestJson } from "./httpClient";

export function fetchDfmeaEntries(projectId: string): Promise<DfmeaEntry[]> {
  return requestJson<DfmeaEntry[]>(`/dfmea?project_id=${encodeURIComponent(projectId)}`);
}

export function fetchDfmeaFilters(projectId: string): Promise<DfmeaFilters> {
  return requestJson<DfmeaFilters>(`/dfmea/filters?project_id=${encodeURIComponent(projectId)}`);
}

export function fetchDfmeaEntriesByRequirement(requirementId: string): Promise<DfmeaEntry[]> {
  return requestJson<DfmeaEntry[]>(`/dfmea/by-requirement/${encodeURIComponent(requirementId)}`);
}

export function fetchDfmeaSuggestion(requirementId: string): Promise<DfmeaSuggestion> {
  return requestJson<DfmeaSuggestion>(`/dfmea/suggestions/by-requirement/${encodeURIComponent(requirementId)}`);
}

export function createDfmeaEntry(payload: DfmeaEntryFormValues): Promise<DfmeaEntry> {
  return requestJson<DfmeaEntry>("/dfmea", {
    method: "POST",
    body: payload,
  });
}

export function updateDfmeaEntry(dfmeaEntryId: string, payload: Omit<DfmeaEntryFormValues, "id">): Promise<DfmeaEntry> {
  return requestJson<DfmeaEntry>(`/dfmea/${encodeURIComponent(dfmeaEntryId)}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteDfmeaEntry(dfmeaEntryId: string): Promise<void> {
  return requestJson<void>(`/dfmea/${encodeURIComponent(dfmeaEntryId)}`, {
    method: "DELETE",
  });
}
