import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppButton from "../components/common/AppButton";
import AppCompactActionButton from "../components/common/AppCompactActionButton";
import GeneratedRequirementCandidateCard from "../components/generation/GeneratedRequirementCandidateCard";
import WorkspaceStatePanel from "../components/common/WorkspaceStatePanel";
import ProjectWorkspaceShell from "../components/layout/ProjectWorkspaceShell";
import RequirementsContextPanel from "../components/requirements/RequirementsContextPanel";
import { routePaths } from "../routes/routePaths";
import {
  generateRequirements,
  reviewGeneratedRequirements,
  saveGeneratedRequirements,
} from "../services/generationApi";
import { fetchRequirement, fetchRequirements } from "../services/requirementsApi";
import type {
  GeneratedRequirementDraftState,
  GeneratedRequirementCandidateReview,
  GenerationMode,
} from "../types/generation";
import type { Requirement } from "../types/requirements";

function formatGenerationError(message: string) {
  try {
    const parsed = JSON.parse(message) as { detail?: string };
    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      return parsed.detail;
    }
  } catch {
    // Fall through to the original message when the backend did not return JSON detail.
  }

  return message;
}

function toDraftState(
  candidate: GeneratedRequirementDraftState | GeneratedRequirementCandidateReview
): GeneratedRequirementDraftState {
  const existingDraftId = "draft_id" in candidate ? candidate.draft_id : undefined;
  const existingDecision = "decision" in candidate ? candidate.decision : undefined;
  return {
    ...candidate,
    draft_id: existingDraftId ?? candidate.suggested_id,
    decision: existingDecision ?? "accepted",
  };
}

export default function RequirementGenerationPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? "";
  const navigate = useNavigate();
  const [mode, setMode] = useState<GenerationMode>("feature");
  const [featureDescription, setFeatureDescription] = useState("");
  const [sourceRequirementId, setSourceRequirementId] = useState("");
  const [sourceRequirement, setSourceRequirement] = useState<Requirement | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [requirementsLoading, setRequirementsLoading] = useState(true);
  const [requirementsError, setRequirementsError] = useState<string | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<GeneratedRequirementDraftState[]>([]);

  useEffect(() => {
    let active = true;

    async function loadRequirements() {
      if (!projectId) {
        setRequirementsError("Project context is missing.");
        setRequirementsLoading(false);
        return;
      }

      try {
        const response = await fetchRequirements(projectId);
        if (!active) {
          return;
        }
        setRequirements(response);
        setRequirementsError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setRequirementsError(loadError instanceof Error ? loadError.message : "Unable to load project requirements.");
      } finally {
        if (active) {
          setRequirementsLoading(false);
        }
      }
    }

    loadRequirements();
    return () => {
      active = false;
    };
  }, [projectId]);

  useEffect(() => {
    let active = true;

    async function loadSourceRequirement() {
      if (mode !== "decompose" || !sourceRequirementId) {
        setSourceRequirement(null);
        return;
      }
      try {
        const response = await fetchRequirement(sourceRequirementId);
        if (!active) {
          return;
        }
        setSourceRequirement(response);
      } catch {
        if (active) {
          setSourceRequirement(null);
        }
      }
    }

    loadSourceRequirement();
    return () => {
      active = false;
    };
  }, [mode, sourceRequirementId]);

  const acceptedCount = candidates.filter((candidate) => candidate.decision === "accepted").length;

  const contextItems = [
    { label: "Project ID", value: projectId || "Unknown" },
    { label: "Mode", value: mode === "feature" ? "Feature Description" : "Decompose Requirement" },
    { label: "Candidates in review", value: String(candidates.length) },
    { label: "Accepted for save", value: String(acceptedCount) },
  ];

  async function handleGenerate() {
    setGenerateLoading(true);
    setError(null);
    setSaveMessage(null);
    try {
      const response = await generateRequirements({
        project_id: projectId,
        mode,
        feature_description: mode === "feature" ? featureDescription : null,
        source_requirement_id: mode === "decompose" ? sourceRequirementId : null,
      });
      setCandidates(response.candidates.map((candidate) => toDraftState(candidate)));
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? formatGenerationError(generationError.message)
          : "Unable to generate requirement drafts."
      );
    } finally {
      setGenerateLoading(false);
    }
  }

  async function handleRefreshReview() {
    setReviewLoading(true);
    setError(null);
    try {
      const response = await reviewGeneratedRequirements({
        project_id: projectId,
        candidates: candidates.map((candidate) => ({
          temp_id: candidate.temp_id,
          suggested_id: candidate.draft_id,
          suggested_hierarchy: candidate.suggested_hierarchy,
          title: candidate.title,
          text: candidate.text,
          type: candidate.type,
          priority: candidate.priority,
          rationale: candidate.rationale,
          parent_requirement_id: candidate.parent_requirement_id,
          subsystem: candidate.subsystem,
          verification_method: candidate.verification_method,
          assumptions: candidate.assumptions,
          generation_metadata: candidate.generation_metadata,
        })),
      });
      setCandidates((current) =>
        response.map((candidate, index) => ({
          ...toDraftState(candidate),
          decision: current[index]?.decision ?? "accepted",
        }))
      );
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? formatGenerationError(reviewError.message)
          : "Unable to refresh validation review."
      );
    } finally {
      setReviewLoading(false);
    }
  }

  async function handleSaveSelected() {
    const selected = candidates.filter((candidate) => candidate.decision === "accepted");
    if (selected.length === 0) {
      setError("Select at least one generated draft before saving.");
      return;
    }

    setSaveLoading(true);
    setError(null);
    try {
      const response = await saveGeneratedRequirements({
        project_id: projectId,
        candidates: selected.map((candidate) => ({
          temp_id: candidate.temp_id,
          title: candidate.title,
          text: candidate.text,
          type: candidate.type,
          priority: candidate.priority,
          rationale: candidate.rationale,
          parent_requirement_id: candidate.parent_requirement_id,
          subsystem: candidate.subsystem,
          verification_method: candidate.verification_method,
          assumptions: candidate.assumptions,
          generation_metadata: candidate.generation_metadata,
        })),
      });
      const savedIds = response.saved_requirements.map((requirement) => requirement.requirement_code).join(", ");
      setSaveMessage(
        `${response.saved_requirements.length} generated draft requirement(s) saved to the project: ${savedIds}.`
      );
      setCandidates([]);
      setFeatureDescription("");
      setSourceRequirementId("");
      setSourceRequirement(null);
      const refreshedRequirements = await fetchRequirements(projectId);
      setRequirements(refreshedRequirements);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? formatGenerationError(saveError.message)
          : "Unable to save selected generated drafts."
      );
    } finally {
      setSaveLoading(false);
    }
  }

  function updateCandidate<K extends keyof GeneratedRequirementDraftState>(
    tempId: string,
    field: K,
    value: GeneratedRequirementDraftState[K]
  ) {
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.temp_id === tempId
          ? {
              ...candidate,
              [field]: value,
            }
          : candidate
      )
    );
  }

  const canGenerate =
    mode === "feature" ? featureDescription.trim().length >= 3 : sourceRequirementId.trim().length > 0;

  return (
    <ProjectWorkspaceShell
      projectId={projectId}
      activeNavKey="generate"
      rightPanel={<RequirementsContextPanel title="Generation Review" items={contextItems} />}
    >
      <Box sx={{ height: "100%" }}>
        <Paper
          elevation={0}
          sx={{
            minHeight: "100%",
            p: { xs: 2, md: 3 },
            border: "1px solid rgba(15,23,42,0.10)",
            borderTop: "none",
            bgcolor: "#ffffff",
            borderRadius: 0,
          }}
        >
          <Stack spacing={3}>
            <Stack direction={{ xs: "column", xl: "row" }} spacing={2} justifyContent="space-between" alignItems={{ xl: "center" }}>
              <Box>
                <Typography variant="h5" fontWeight={700} color="#0f172a">
                  Generate Requirements
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 960 }}>
                  Generate AI-labeled draft requirements from a feature description or decompose an existing parent requirement, then review validation outputs before selectively saving.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
                <AppCompactActionButton
                  startIcon={<RefreshOutlinedIcon />}
                  disabled={candidates.length === 0 || reviewLoading}
                  onClick={handleRefreshReview}
                >
                  {reviewLoading ? "Refreshing..." : "Refresh Review"}
                </AppCompactActionButton>
                <AppButton
                  hierarchy="primary"
                  startIcon={<SaveOutlinedIcon />}
                  disabled={acceptedCount === 0 || saveLoading}
                  onClick={handleSaveSelected}
                >
                  {saveLoading ? "Saving..." : "Save Selected"}
                </AppButton>
                <AppCompactActionButton onClick={() => navigate(routePaths.projectRequirements(projectId))}>
                  Open Requirements
                </AppCompactActionButton>
              </Stack>
            </Stack>

            {error ? <Alert severity="error">{error}</Alert> : null}
            {saveMessage ? <Alert severity="success">{saveMessage}</Alert> : null}

            <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(15,23,42,0.10)", borderRadius: 0, bgcolor: "#f8fafc" }}>
              <Stack spacing={2.5}>
                <TextField
                  select
                  label="Generation Mode"
                  value={mode}
                  onChange={(event) => {
                    setMode(event.target.value as GenerationMode);
                    setCandidates([]);
                    setError(null);
                    setSaveMessage(null);
                  }}
                  sx={{ maxWidth: 320 }}
                >
                  <MenuItem value="feature">Free-text feature description</MenuItem>
                  <MenuItem value="decompose">Decompose existing requirement</MenuItem>
                </TextField>

                {mode === "feature" ? (
                  <TextField
                    fullWidth
                    label="Feature Description"
                    multiline
                    minRows={4}
                    placeholder="Describe the feature or high-level capability to turn into candidate requirements."
                    value={featureDescription}
                    onChange={(event) => setFeatureDescription(event.target.value)}
                  />
                ) : (
                  <Stack spacing={1.5}>
                    <TextField
                      select
                      fullWidth
                      label="Parent Requirement"
                      value={sourceRequirementId}
                      onChange={(event) => setSourceRequirementId(event.target.value)}
                      disabled={requirementsLoading}
                    >
                      <MenuItem value="">Select a requirement</MenuItem>
                      {requirements.map((requirement) => (
                        <MenuItem key={requirement.id} value={requirement.id}>
                          {requirement.requirement_code} - {requirement.title}
                        </MenuItem>
                      ))}
                    </TextField>

                    {requirementsError ? <Alert severity="error">{requirementsError}</Alert> : null}

                    {sourceRequirement ? (
                      <Alert severity="info">
                        <strong>{sourceRequirement.requirement_code}:</strong> {sourceRequirement.text}
                      </Alert>
                    ) : null}
                  </Stack>
                )}

                <Alert severity="warning">
                  Generated output is always saved as AI-generated draft content and must be reviewed before save. The backend may use the configured external provider or fall back to the deterministic mock provider, depending on environment setup.
                </Alert>

                <Box>
                  <AppButton
                    hierarchy="primary"
                    startIcon={<AutoAwesomeOutlinedIcon />}
                    onClick={handleGenerate}
                    disabled={!canGenerate || generateLoading}
                  >
                    {generateLoading ? "Generating..." : "Generate Candidates"}
                  </AppButton>
                </Box>
              </Stack>
            </Paper>

            {generateLoading ? (
              <WorkspaceStatePanel
                state="loading"
                title="Generating requirement drafts"
                message="Building deterministic candidate requirements and running pre-save validation review."
              />
            ) : null}

            {!generateLoading && candidates.length === 0 ? (
              <WorkspaceStatePanel
                state="empty"
                title="No generated drafts yet"
                message="Generate candidates from a feature description or by decomposing an existing requirement."
              />
            ) : null}

            {candidates.length > 0 ? (
              <Stack spacing={3}>
                {candidates.map((candidate, index) => (
                  <GeneratedRequirementCandidateCard
                    key={candidate.temp_id}
                    candidate={candidate}
                    index={index}
                    onChange={(field, value) => updateCandidate(candidate.temp_id, field, value)}
                    onDecisionChange={(decision) => updateCandidate(candidate.temp_id, "decision", decision)}
                  />
                ))}
              </Stack>
            ) : null}
          </Stack>
        </Paper>
      </Box>
    </ProjectWorkspaceShell>
  );
}
