import type { RequirementFormValues, RequirementQualitySummary } from "../types/requirements";
import { requestJson } from "./httpClient";

export function checkRequirementQuality(
  payload: Pick<RequirementFormValues, "title" | "text" | "type">
): Promise<RequirementQualitySummary> {
  return requestJson<RequirementQualitySummary>("/quality/requirement-check", {
    method: "POST",
    body: payload,
  });
}
