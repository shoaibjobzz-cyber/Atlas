import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CallMergeOutlinedIcon from "@mui/icons-material/CallMergeOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  Chip,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Checkbox,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppButton from "../components/common/AppButton";
import AppCompactActionButton from "../components/common/AppCompactActionButton";
import WorkspaceStatePanel from "../components/common/WorkspaceStatePanel";
import GeneratedRequirementCandidateCard from "../components/generation/GeneratedRequirementCandidateCard";
import ProjectWorkspaceShell from "../components/layout/ProjectWorkspaceShell";
import RequirementsContextPanel from "../components/requirements/RequirementsContextPanel";
import {
  getTraceabilityGraphFocusPath,
  getTraceabilityMatrixFocusPath,
  routePaths,
} from "../routes/routePaths";
import {
  analyzeEcuRequirementMerge,
  saveEcuRequirementMergeCandidates,
} from "../services/generationApi";
import { fetchRequirements } from "../services/requirementsApi";
import type {
  EcuRequirementMergerCandidateReview,
  EcuRequirementMergerDraftState,
} from "../types/ecuMerger";
import type { GeneratedRequirementDraftState } from "../types/generation";
import {
  requirementTypeOptions,
  type Requirement,
} from "../types/requirements";


function toDraftState(candidate: EcuRequirementMergerCandidateReview): EcuRequirementMergerDraftState {
  return {
    ...candidate,
    draft_id: candidate.suggested_id,
    decision: "accepted",
  };
}


function formatError(message: string) {
  try {
    const parsed = JSON.parse(message) as { detail?: string };
    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      return parsed.detail;
    }
  } catch {
    // Keep the original message when the backend did not return JSON detail.
  }

  return message;
}


function mergeCandidateCardChange<K extends keyof GeneratedRequirementDraftState>(
  updateCandidate: <T extends keyof EcuRequirementMergerDraftState>(
    tempId: string,
    field: T,
    value: EcuRequirementMergerDraftState[T]
  ) => void,
  tempId: string,
  field: K,
  value: GeneratedRequirementDraftState[K]
) {
  updateCandidate(tempId, field as keyof EcuRequirementMergerDraftState, value as never);
}


export default function EcuRequirementMergerPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? "";
  const navigate = useNavigate();
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [requirementsLoading, setRequirementsLoading] = useState(true);
  const [requirementsError, setRequirementsError] = useState<string | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [featureLabelQuery, setFeatureLabelQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [analysisWarnings, setAnalysisWarnings] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<EcuRequirementMergerDraftState[]>([]);

  useEffect(() => {
    let active = true;

    async function loadRequirements() {
      if (!projectId) {
        setRequirementsError("Project context is missing.");
        setRequirementsLoading(false);
        return;
      }

      setRequirementsLoading(true);
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
        setRequirementsError(
          loadError instanceof Error ? loadError.message : "Unable to load project requirements for merger review."
        );
      } finally {
        if (active) {
          setRequirementsLoading(false);
        }
      }
    }

    void loadRequirements();
    return () => {
      active = false;
    };
  }, [projectId]);

  const subsystemOptions = useMemo(
    () =>
      Array.from(new Set(requirements.map((requirement) => requirement.subsystem).filter(Boolean) as string[])).sort(),
    [requirements]
  );

  const filteredRequirements = useMemo(() => {
    const query = featureLabelQuery.trim().toLowerCase();
    return requirements.filter((requirement) => {
      if (selectedSubsystem !== "all" && (requirement.subsystem ?? "") !== selectedSubsystem) {
        return false;
      }
      if (selectedType !== "all" && requirement.type !== selectedType) {
        return false;
      }
      if (!query) {
        return true;
      }
      const blob = [
        requirement.requirement_code,
        requirement.title,
        requirement.text,
        requirement.subsystem ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(query);
    });
  }, [featureLabelQuery, requirements, selectedSubsystem, selectedType]);

  const acceptedCount = candidates.filter((candidate) => candidate.decision === "accepted").length;
  const totalSourceRequirements = useMemo(
    () => candidates.reduce((sum, candidate) => sum + candidate.source_requirement_ids.length, 0),
    [candidates]
  );

  const contextItems = [
    { label: "Project ID", value: projectId || "Unknown" },
    { label: "Selected source requirements", value: String(selectedIds.length) },
    { label: "Merge proposals", value: String(candidates.length) },
    { label: "Accepted for save", value: String(acceptedCount) },
    { label: "Source links preserved", value: String(totalSourceRequirements) },
  ];

  function toggleRequirement(requirementId: string) {
    setSelectedIds((current) =>
      current.includes(requirementId)
        ? current.filter((item) => item !== requirementId)
        : [...current, requirementId]
    );
  }

  function selectFilteredRequirements() {
    setSelectedIds((current) => Array.from(new Set([...current, ...filteredRequirements.map((requirement) => requirement.id)])));
  }

  function clearSelection() {
    setSelectedIds([]);
  }

  async function handleRunAnalysis() {
    if (selectedIds.length === 0) {
      setError("Select at least one requirement before running the centralized ECU merger.");
      return;
    }

    setAnalyzeLoading(true);
    setError(null);
    setSaveMessage(null);
    setAnalysisWarnings([]);
    try {
      const response = await analyzeEcuRequirementMerge({
        project_id: projectId,
        requirement_ids: selectedIds,
      });
      setCandidates(response.candidates.map((candidate) => toDraftState(candidate)));
      setAnalysisWarnings(response.warnings);
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? formatError(analysisError.message)
          : "Unable to analyze the selected requirements for centralized ECU merging."
      );
    } finally {
      setAnalyzeLoading(false);
    }
  }

  async function handleSaveSelected() {
    const selectedCandidates = candidates.filter((candidate) => candidate.decision === "accepted");
    if (selectedCandidates.length === 0) {
      setError("Accept at least one merge proposal before saving.");
      return;
    }

    setSaveLoading(true);
    setError(null);
    try {
      const response = await saveEcuRequirementMergeCandidates({
        project_id: projectId,
        candidates: selectedCandidates.map((candidate) => ({
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
      setSaveMessage(
        `${response.saved_requirements.length} centralized ECU requirement(s) saved: ${response.saved_requirements
          .map((requirement) => requirement.requirement_code)
          .join(", ")}.`
      );
      setCandidates([]);
      const refreshedRequirements = await fetchRequirements(projectId);
      setRequirements(refreshedRequirements);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? formatError(saveError.message)
          : "Unable to save the selected merged requirements."
      );
    } finally {
      setSaveLoading(false);
    }
  }

  function updateCandidate<K extends keyof EcuRequirementMergerDraftState>(
    tempId: string,
    field: K,
    value: EcuRequirementMergerDraftState[K]
  ) {
    setCandidates((current) =>
      current.map((candidate) => (candidate.temp_id === tempId ? { ...candidate, [field]: value } : candidate))
    );
  }

  return (
    <ProjectWorkspaceShell
      projectId={projectId}
      activeNavKey="generate"
      rightPanel={<RequirementsContextPanel title="Centralized ECU Merger" items={contextItems} />}
    >
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1480 }}>
        <Stack spacing={3}>
          <Box>
            <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between" alignItems={{ lg: "flex-start" }}>
              <Box>
                <Typography variant="h4" fontWeight={700} color="#0f172a">
                  Centralized ECU Requirement Merger
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 980 }}>
                  Select source requirements across subsystems or ECU features, detect deterministic overlaps and conflicts,
                  and review proposed centralized ECU requirements with preserved traceability back to the original sources.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
                <AppButton hierarchy="secondary" onClick={() => navigate(routePaths.projectRequirementGeneration(projectId))}>
                  Open Requirement Generation
                </AppButton>
                <AppButton hierarchy="secondary" onClick={() => navigate(routePaths.projectRequirements(projectId))}>
                  Browse Requirements
                </AppButton>
              </Stack>
            </Stack>
          </Box>

          {error ? <Alert severity="error">{error}</Alert> : null}
          {saveMessage ? <Alert severity="success">{saveMessage}</Alert> : null}
          {analysisWarnings.length > 0 ? (
            <Alert severity="warning">
              <Stack spacing={0.5}>
                {analysisWarnings.map((warning) => (
                  <Typography key={warning} variant="body2">
                    {warning}
                  </Typography>
                ))}
              </Stack>
            </Alert>
          ) : null}

          <Paper elevation={0} sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 0, p: 3 }}>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between" alignItems={{ lg: "center" }}>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    Source Requirement Selection
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    Filter by subsystem, requirement type, or feature / ECU label terms, then manually confirm the source set.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
                  <AppCompactActionButton onClick={selectFilteredRequirements}>Select Filtered</AppCompactActionButton>
                  <AppCompactActionButton onClick={clearSelection}>Clear Selection</AppCompactActionButton>
                  <AppCompactActionButton
                    variant="contained"
                    tone="accent"
                    startIcon={<CallMergeOutlinedIcon />}
                    onClick={handleRunAnalysis}
                    disabled={analyzeLoading || selectedIds.length === 0}
                  >
                    {analyzeLoading ? "Running Merger..." : "Run Merger"}
                  </AppCompactActionButton>
                </Stack>
              </Stack>

              <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                <TextField
                  select
                  label="Subsystem"
                  value={selectedSubsystem}
                  onChange={(event) => setSelectedSubsystem(event.target.value)}
                  sx={{ minWidth: { xs: "100%", md: 240 } }}
                >
                  <MenuItem value="all">All subsystems</MenuItem>
                  {subsystemOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="Requirement Type"
                  value={selectedType}
                  onChange={(event) => setSelectedType(event.target.value)}
                  sx={{ minWidth: { xs: "100%", md: 220 } }}
                >
                  <MenuItem value="all">All types</MenuItem>
                  {requirementTypeOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Feature / ECU label"
                  value={featureLabelQuery}
                  onChange={(event) => setFeatureLabelQuery(event.target.value)}
                  helperText="Search requirement code, title, text, or subsystem for feature / ECU labels that already exist in project data."
                />
              </Stack>

              <Box sx={{ border: "1px solid rgba(15,23,42,0.08)", minHeight: 220, maxHeight: 420, overflowY: "auto" }}>
                {requirementsLoading ? (
                  <WorkspaceStatePanel
                    state="loading"
                    title="Loading source requirements"
                    message="Preparing project requirements for ECU merger selection."
                  />
                ) : requirementsError ? (
                  <WorkspaceStatePanel
                    state="error"
                    title="Unable to load source requirements"
                    message={requirementsError}
                  />
                ) : filteredRequirements.length === 0 ? (
                  <WorkspaceStatePanel
                    state="empty"
                    title="No requirements match the current filters"
                    message="Adjust the subsystem, type, or feature / ECU label filters to widen the candidate set."
                  />
                ) : (
                  <Stack divider={<Divider flexItem />} sx={{ bgcolor: "#ffffff" }}>
                    {filteredRequirements.map((requirement) => {
                      const checked = selectedIds.includes(requirement.id);
                      return (
                        <Box
                          key={requirement.id}
                          sx={{
                            px: 2,
                            py: 1.35,
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", lg: "44px minmax(0, 1.6fr) minmax(0, 0.7fr) minmax(0, 0.8fr)" },
                            gap: 1.5,
                            alignItems: "center",
                            bgcolor: checked ? "rgba(14, 116, 144, 0.04)" : "#ffffff",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <FormControlLabel
                              sx={{ m: 0 }}
                              control={<Checkbox checked={checked} onChange={() => toggleRequirement(requirement.id)} />}
                              label=""
                            />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={700} color="#0f172a">
                              {requirement.requirement_code}
                            </Typography>
                            <Typography variant="body2" color="#0f172a" sx={{ mt: 0.25 }}>
                              {requirement.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {requirement.text}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600} color="#0f172a">
                              {requirement.type}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {requirement.priority} priority
                            </Typography>
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600} color="#0f172a">
                              {requirement.subsystem ?? "No subsystem"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {requirement.verification_method ?? "Verification method not set"}
                            </Typography>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Stack>
          </Paper>

          <Paper elevation={0} sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 0, p: 3 }}>
            <Stack spacing={2.5}>
              <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between" alignItems={{ lg: "center" }}>
                <Box>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    Proposed Centralized ECU Requirements
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    Each proposal remains deterministic, explainable, and traceable back to the selected source requirements.
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
                  <Chip
                    icon={<AutoAwesomeOutlinedIcon />}
                    label={`${candidates.length} proposal${candidates.length === 1 ? "" : "s"}`}
                    variant="outlined"
                  />
                  <Chip label={`${acceptedCount} accepted for save`} variant="outlined" />
                  <AppCompactActionButton
                    startIcon={<RefreshOutlinedIcon />}
                    onClick={handleRunAnalysis}
                    disabled={analyzeLoading || selectedIds.length === 0}
                  >
                    Refresh Review
                  </AppCompactActionButton>
                  <AppCompactActionButton
                    variant="contained"
                    tone="accent"
                    startIcon={<SaveOutlinedIcon />}
                    onClick={handleSaveSelected}
                    disabled={saveLoading || acceptedCount === 0}
                  >
                    {saveLoading ? "Saving..." : "Save Selected"}
                  </AppCompactActionButton>
                </Stack>
              </Stack>

              {candidates.length === 0 ? (
                <WorkspaceStatePanel
                  state="empty"
                  title="No merger proposals yet"
                  message="Select source requirements and run the merger to review centralized ECU requirement drafts."
                />
              ) : (
                <Stack spacing={2.5}>
                  {candidates.map((candidate, index) => (
                    <Paper key={candidate.temp_id} elevation={0} sx={{ border: "1px solid rgba(15,23,42,0.10)", borderRadius: 0 }}>
                      <Box sx={{ p: 3, borderBottom: "1px solid rgba(15,23,42,0.08)", bgcolor: "#f8fafc" }}>
                        <Stack spacing={2}>
                          <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ lg: "center" }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                                Source Traceability
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {candidate.merge_rationale}
                              </Typography>
                            </Box>
                            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                              <Chip label={`${candidate.source_requirement_codes.length} source requirement${candidate.source_requirement_codes.length === 1 ? "" : "s"}`} color="info" variant="outlined" />
                              {candidate.conflicts.length > 0 ? (
                                <Chip label={`${candidate.conflicts.length} conflict${candidate.conflicts.length === 1 ? "" : "s"}`} color="error" variant="outlined" />
                              ) : null}
                              {candidate.warnings.length > 0 ? (
                                <Chip label={`${candidate.warnings.length} warning${candidate.warnings.length === 1 ? "" : "s"}`} color="warning" variant="outlined" />
                              ) : null}
                            </Stack>
                          </Stack>

                          <Stack spacing={1.25}>
                            {candidate.traceability.map((item) => (
                              <Box
                                key={item.requirement.id}
                                sx={{
                                  px: 1.5,
                                  py: 1.25,
                                  border: "1px solid rgba(15,23,42,0.08)",
                                  display: "grid",
                                  gridTemplateColumns: { xs: "1fr", xl: "minmax(0, 1.6fr) minmax(0, 1.3fr) auto" },
                                  gap: 1.5,
                                  alignItems: "center",
                                }}
                              >
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography fontWeight={700} color="#0f172a">
                                    {item.requirement.requirement_code}
                                  </Typography>
                                  <Typography variant="body2" color="#0f172a" sx={{ mt: 0.25 }}>
                                    {item.requirement.title}
                                  </Typography>
                                </Box>
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="body2" color="text.secondary">
                                    {item.traceability_reason}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {item.source_subsystem ?? "No subsystem"} · {candidate.source_requirement_ids[0] === item.requirement.id ? "selected" : "direct"}
                                  </Typography>
                                </Box>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                  <AppCompactActionButton
                                    onClick={() => navigate(routePaths.projectRequirementDetail(projectId, item.requirement.id))}
                                  >
                                    View
                                  </AppCompactActionButton>
                                  <AppCompactActionButton
                                    onClick={() => navigate(getTraceabilityMatrixFocusPath(projectId, item.requirement.id, "row"))}
                                  >
                                    Matrix
                                  </AppCompactActionButton>
                                  <AppCompactActionButton
                                    onClick={() => navigate(getTraceabilityGraphFocusPath(projectId, item.requirement.id, "impact"))}
                                  >
                                    Graph
                                  </AppCompactActionButton>
                                </Stack>
                              </Box>
                            ))}
                          </Stack>

                          <Stack direction={{ xs: "column", xl: "row" }} spacing={2}>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1 }}>
                                Conflicts / Warnings
                              </Typography>
                              <Stack spacing={1}>
                                {candidate.conflicts.map((conflict) => (
                                  <Alert key={conflict} severity="error" sx={{ py: 0.5 }}>
                                    {conflict}
                                  </Alert>
                                ))}
                                {candidate.warnings.map((warning) => (
                                  <Alert key={warning} severity="warning" sx={{ py: 0.5 }}>
                                    {warning}
                                  </Alert>
                                ))}
                                {candidate.conflicts.length === 0 && candidate.warnings.length === 0 ? (
                                  <Alert severity="success" sx={{ py: 0.5 }}>
                                    No deterministic conflicts or warnings were identified inside this merge cluster.
                                  </Alert>
                                ) : null}
                              </Stack>
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="subtitle2" fontWeight={700} color="#0f172a" sx={{ mb: 1 }}>
                                Merge Notes
                              </Typography>
                              <Stack spacing={1}>
                                {candidate.recommended_fix_actions.map((action) => (
                                  <Typography key={action} variant="body2" color="#0f172a">
                                    • {action}
                                  </Typography>
                                ))}
                                {candidate.affected_design_parameters.map((parameter) => (
                                  <Typography key={parameter.id} variant="body2" color="text.secondary">
                                    Design parameter: {parameter.name} ({parameter.parameter_name} = {parameter.value}
                                    {parameter.unit ? ` ${parameter.unit}` : ""})
                                  </Typography>
                                ))}
                              </Stack>
                            </Box>
                          </Stack>
                        </Stack>
                      </Box>

                      <GeneratedRequirementCandidateCard
                        candidate={candidate}
                        index={index}
                        onChange={(field, value) =>
                          mergeCandidateCardChange(updateCandidate, candidate.temp_id, field, value)
                        }
                        onDecisionChange={(decision) => updateCandidate(candidate.temp_id, "decision", decision)}
                      />
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </ProjectWorkspaceShell>
  );
}
