import { requestJson } from "./httpClient";
import type {
  EcuRequirementMergerAnalyzeRequest,
  EcuRequirementMergerAnalyzeResponse,
  EcuRequirementMergerSaveRequest,
} from "../types/ecuMerger";
import type {
  GeneratedRequirementCandidateReview,
  RequirementGenerationRequest,
  RequirementGenerationResponse,
  RequirementGenerationReviewRequest,
  RequirementGenerationSaveRequest,
  RequirementGenerationSaveResponse,
  RequirementRewriteSuggestionRequest,
  RequirementRewriteSuggestionResponse,
} from "../types/generation";

export function generateRequirements(payload: RequirementGenerationRequest): Promise<RequirementGenerationResponse> {
  return requestJson<RequirementGenerationResponse>("/requirement-generation/generate", {
    method: "POST",
    body: payload,
  });
}

export function reviewGeneratedRequirements(
  payload: RequirementGenerationReviewRequest
): Promise<GeneratedRequirementCandidateReview[]> {
  return requestJson<GeneratedRequirementCandidateReview[]>("/requirement-generation/review", {
    method: "POST",
    body: payload,
  });
}

export function saveGeneratedRequirements(
  payload: RequirementGenerationSaveRequest
): Promise<RequirementGenerationSaveResponse> {
  return requestJson<RequirementGenerationSaveResponse>("/requirement-generation/save", {
    method: "POST",
    body: payload,
  });
}

export function fetchRequirementRewriteSuggestions(
  payload: RequirementRewriteSuggestionRequest
): Promise<RequirementRewriteSuggestionResponse> {
  return requestJson<RequirementRewriteSuggestionResponse>("/requirement-generation/rewrite-suggestions", {
    method: "POST",
    body: payload,
  });
}

export function analyzeEcuRequirementMerge(
  payload: EcuRequirementMergerAnalyzeRequest
): Promise<EcuRequirementMergerAnalyzeResponse> {
  return requestJson<EcuRequirementMergerAnalyzeResponse>("/requirement-generation/ecu-merger/analyze", {
    method: "POST",
    body: payload,
  });
}

export function saveEcuRequirementMergeCandidates(
  payload: EcuRequirementMergerSaveRequest
): Promise<RequirementGenerationSaveResponse> {
  return requestJson<RequirementGenerationSaveResponse>("/requirement-generation/ecu-merger/save", {
    method: "POST",
    body: payload,
  });
}
