import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import {
  Alert,
  Box,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import AppCompactActionButton from "../components/common/AppCompactActionButton";
import WorkspacePageHeader from "../components/common/WorkspacePageHeader";
import WorkspaceStatePanel from "../components/common/WorkspaceStatePanel";
import ProjectWorkspaceShell from "../components/layout/ProjectWorkspaceShell";
import RequirementsContextPanel from "../components/requirements/RequirementsContextPanel";
import CreateSnapshotDialog from "../components/snapshots/CreateSnapshotDialog";
import SnapshotComparisonPanel from "../components/snapshots/SnapshotComparisonPanel";
import ValidationRequirementList from "../components/validation/ValidationRequirementList";
import ValidationSummaryCard from "../components/validation/ValidationSummaryCard";
import {
  createProjectSnapshot,
  fetchProjectSnapshot,
  fetchProjectSnapshotComparison,
  fetchProjectSnapshots,
} from "../services/projectSnapshotsApi";
import { normalizeValidationViewResponse } from "../services/validationViewService";
import { fetchProjectValidationSummary } from "../services/projectViewsApi";
import type { ProjectValidationSummaryResponse } from "../types/projectViews";
import type {
  ProjectSnapshotComparison,
  ProjectSnapshotSummary,
  ValidationSnapshotDetail,
} from "../types/projectSnapshots";
import type { ValidationRequirementResult, ValidationSummaryView } from "../types/validation";
import { compareRequirementsByHierarchy } from "../utils/requirementHierarchy";

function percent(value: number) {
  return `${Math.round(value)}%`;
}

const VALIDATION_DELTA_LABELS = {
  total_requirements: "Total requirements",
  quality_warnings: "Requirements with warnings",
  conflicts: "Requirements with conflicts",
  feasible: "Feasible",
  likely_infeasible: "Likely infeasible",
  insufficient_data: "Insufficient data",
  warning_feasibility: "Warning feasibility",
} as const;

export default function ValidationPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? "";
  const [liveSummary, setLiveSummary] = useState<ProjectValidationSummaryResponse | null>(null);
  const [snapshots, setSnapshots] = useState<ProjectSnapshotSummary[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [selectedSnapshot, setSelectedSnapshot] = useState<ValidationSnapshotDetail | null>(null);
  const [comparison, setComparison] = useState<ProjectSnapshotComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadValidationView() {
      if (!projectId) {
        setError("Project context is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [summaryResponse, snapshotResponse] = await Promise.all([
          fetchProjectValidationSummary(projectId),
          fetchProjectSnapshots(projectId, "validation"),
        ]);
        if (!active) {
          return;
        }
        setLiveSummary(summaryResponse);
        setSnapshots(snapshotResponse);
        setSelectedSnapshotId("");
        setSelectedSnapshot(null);
        setComparison(null);
        setError(null);
        setSnapshotError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load validation summaries.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadValidationView();
    return () => {
      active = false;
    };
  }, [projectId]);

  const validationView = useMemo<ValidationSummaryView | null>(() => {
    const source = selectedSnapshot?.payload ?? liveSummary;
    return source ? normalizeValidationViewResponse(source) : null;
  }, [liveSummary, selectedSnapshot]);

  const results: ValidationRequirementResult[] = validationView?.results ?? [];
  const summary = validationView?.summary ?? null;

  const qualityFindings = useMemo(
    () =>
      results
        .filter((item) => (item.qualitySummary?.warnings.length ?? 0) > 0 || item.qualityError)
        .sort((left, right) => compareRequirementsByHierarchy(left.requirement, right.requirement)),
    [results]
  );
  const parsingCoverageItems = useMemo(
    () =>
      results
        .filter((item) => item.parsedCoverageCount < item.parsedCoverageTotal)
        .sort((left, right) => compareRequirementsByHierarchy(left.requirement, right.requirement)),
    [results]
  );
  const conflictItems = useMemo(
    () =>
      results
        .filter(
          (item) =>
            (item.correlationSummary?.potential_conflicts.length ?? 0) > 0 ||
            (item.correlationSummary?.related_requirements.length ?? 0) > 0 ||
            item.correlationError
        )
        .sort((left, right) => compareRequirementsByHierarchy(left.requirement, right.requirement)),
    [results]
  );
  const feasibilityItems = useMemo(
    () =>
      results
        .filter(
          (item) =>
            !!item.feasibilityError ||
            item.feasibility?.assessment_status === "likely_infeasible" ||
            item.feasibility?.assessment_status === "warning" ||
            item.feasibility?.assessment_status === "insufficient_data"
        )
        .sort((left, right) => compareRequirementsByHierarchy(left.requirement, right.requirement)),
    [results]
  );

  const totalWarnings =
    (summary?.warning_counts_by_severity.low ?? 0) +
    (summary?.warning_counts_by_severity.medium ?? 0) +
    (summary?.warning_counts_by_severity.high ?? 0);
  const avgParsingCoverage = summary?.parsing_coverage_average ?? 0;
  const feasibleCount = summary?.feasibility_counts.feasible ?? 0;

  const contextItems = [
    { label: "Project ID", value: projectId || "Unknown" },
    {
      label: "Mode",
      value: comparison ? "Current vs snapshot" : selectedSnapshot ? "Historical snapshot" : "Current live state",
    },
    { label: "Requirements assessed", value: String(summary?.total_requirements ?? results.length) },
    { label: "Quality warnings", value: String(totalWarnings) },
    { label: "Snapshots", value: String(snapshots.length) },
  ];

  async function handleSnapshotSelect(snapshotId: string) {
    setSelectedSnapshotId(snapshotId);
    setComparison(null);
    setSnapshotError(null);

    if (!snapshotId) {
      setSelectedSnapshot(null);
      return;
    }

    try {
      const snapshot = await fetchProjectSnapshot<ProjectValidationSummaryResponse>(projectId, snapshotId);
      setSelectedSnapshot(snapshot);
    } catch (loadError) {
      setSnapshotError(loadError instanceof Error ? loadError.message : "Unable to load snapshot.");
    }
  }

  async function handleCreateSnapshot(payload: { name?: string; notes?: string }) {
    setCreatingSnapshot(true);
    setSnapshotError(null);
    try {
      const created = await createProjectSnapshot(projectId, {
        snapshot_type: "validation",
        ...payload,
      });
      setSnapshots((current) => [created, ...current]);
      setSelectedSnapshotId(created.id);
      setSelectedSnapshot(created as ValidationSnapshotDetail);
      setComparison(null);
      setCreateDialogOpen(false);
      setMessage(`Saved snapshot "${created.name}".`);
      window.setTimeout(() => setMessage(null), 2500);
    } catch (createError) {
      setSnapshotError(createError instanceof Error ? createError.message : "Unable to create snapshot.");
    } finally {
      setCreatingSnapshot(false);
    }
  }

  async function handleCompareSnapshot() {
    if (!selectedSnapshotId) {
      return;
    }
    try {
      const response = await fetchProjectSnapshotComparison(projectId, selectedSnapshotId);
      setComparison(response);
      setSnapshotError(null);
    } catch (compareError) {
      setSnapshotError(compareError instanceof Error ? compareError.message : "Unable to compare snapshot.");
    }
  }

  function handleViewLive() {
    setSelectedSnapshotId("");
    setSelectedSnapshot(null);
    setComparison(null);
    setSnapshotError(null);
  }

  return (
    <ProjectWorkspaceShell
      projectId={projectId}
      activeNavKey="validation"
      rightPanel={<RequirementsContextPanel title="Validation Overview" items={contextItems} />}
    >
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          <WorkspacePageHeader
            title="Validation"
            titleVariant="h4"
            subtitle="Review quality warnings, parsing coverage, correlation findings, and feasibility assessments for the full project."
            actions={
              <>
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel id="validation-snapshot-select-label">Historical snapshot</InputLabel>
                <Select
                  labelId="validation-snapshot-select-label"
                  value={selectedSnapshotId}
                  label="Historical snapshot"
                  onChange={(event) => handleSnapshotSelect(event.target.value)}
                >
                  <MenuItem value="">
                    <em>Current live state</em>
                  </MenuItem>
                  {snapshots.map((snapshot) => (
                    <MenuItem key={snapshot.id} value={snapshot.id}>
                      {snapshot.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <AppCompactActionButton startIcon={<AddCircleOutlineOutlinedIcon />} onClick={() => setCreateDialogOpen(true)}>
                Create Snapshot
              </AppCompactActionButton>
              <AppCompactActionButton onClick={handleViewLive} disabled={!selectedSnapshot}>
                View Live
              </AppCompactActionButton>
                <AppCompactActionButton
                  startIcon={<HistoryOutlinedIcon />}
                  onClick={handleCompareSnapshot}
                  disabled={!selectedSnapshotId}
                >
                  Compare to Current
                </AppCompactActionButton>
              </>
            }
          />

          {message ? <Alert severity="success">{message}</Alert> : null}
          {snapshotError ? <Alert severity="error">{snapshotError}</Alert> : null}

          {comparison ? (
            <Alert severity="info">
              Comparing the current live validation state against snapshot <strong>{comparison.snapshot.name}</strong>.
            </Alert>
          ) : selectedSnapshot ? (
            <Alert severity="info">
              Viewing historical validation snapshot <strong>{selectedSnapshot.name}</strong> from{" "}
              {new Date(selectedSnapshot.created_at).toLocaleString()}.
            </Alert>
          ) : (
            <Alert severity="info">Viewing the current live validation state for this project.</Alert>
          )}

          {comparison ? <SnapshotComparisonPanel comparison={comparison} labels={VALIDATION_DELTA_LABELS} /> : null}

          {loading ? (
            <WorkspaceStatePanel
              state="loading"
              title="Loading validation outputs"
              message="Aggregating quality checks, parsing coverage, correlation findings, and feasibility results."
            />
          ) : null}

          {error ? <WorkspaceStatePanel state="error" title="Unable to load validation view" message={error} /> : null}

          {!loading && !error && results.length === 0 ? (
            <WorkspaceStatePanel
              state="empty"
              title="No requirements available"
              message="Create or load project requirements to see validation summaries here."
            />
          ) : null}

          {!loading && !error && results.length > 0 ? (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6} xl={3}>
                  <ValidationSummaryCard
                    label="Requirements assessed"
                    value={String(summary?.total_requirements ?? results.length)}
                    supportingText="Current requirements included in the project-level validation rollup."
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={3}>
                  <ValidationSummaryCard
                    label="Quality warnings"
                    value={String(totalWarnings)}
                    supportingText="Deterministic wording and testability findings across the current project."
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={3}>
                  <ValidationSummaryCard
                    label="Parsing coverage"
                    value={percent(avgParsingCoverage * 100)}
                    supportingText="Average structured-field extraction coverage across project requirements."
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={3}>
                  <ValidationSummaryCard
                    label="Feasible assessments"
                    value={String(feasibleCount)}
                    supportingText="Requirements whose current linked design evidence is assessed as feasible."
                  />
                </Grid>
              </Grid>

              <ValidationRequirementList
                title="Requirement Quality Warnings"
                description="Requirements with current deterministic quality findings, grouped from the active validation summary."
                emptyMessage="No project requirements currently show quality warnings."
                items={qualityFindings}
                renderBody={(item) => (
                  <Stack spacing={1}>
                    {item.qualityError ? <Alert severity="error">{item.qualityError}</Alert> : null}
                    {(item.qualitySummary?.warnings ?? []).map((warning) => (
                      <Box key={warning.rule_id}>
                        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                          <Chip
                            size="small"
                            color={
                              warning.severity === "high"
                                ? "error"
                                : warning.severity === "medium"
                                  ? "warning"
                                  : "default"
                            }
                            icon={
                              warning.severity === "high" ? <ReportProblemOutlinedIcon /> : <WarningAmberOutlinedIcon />
                            }
                            label={`${warning.severity} · ${warning.title}`}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                          {warning.explanation}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Suggestion: {warning.suggestion}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              />

              <ValidationRequirementList
                title="Structured Parsing Coverage"
                description="Requirements where the active parser leaves some fields unfilled."
                emptyMessage="All current requirements have full structured-field coverage."
                items={parsingCoverageItems}
                renderBody={(item) => (
                  <Stack spacing={0.75}>
                    <Typography variant="body2" color="text.secondary">
                      Extracted {item.parsedCoverageCount} of {item.parsedCoverageTotal} structured fields.
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Missing: {item.parsedMissingFields.join(", ")}
                    </Typography>
                  </Stack>
                )}
              />

              <ValidationRequirementList
                title="Correlation and Conflict Findings"
                description="Requirements with related requirements or conflict findings from the active correlation engine."
                emptyMessage="No project requirements currently show correlation or conflict findings."
                items={conflictItems}
                renderBody={(item) => (
                  <Stack spacing={1}>
                    {item.correlationError ? <Alert severity="error">{item.correlationError}</Alert> : null}
                    {(item.correlationSummary?.potential_conflicts ?? []).map((conflict, index) => (
                      <Typography key={`conflict-${index}`} variant="body2" color="text.secondary">
                        Conflict: {conflict.requirement?.requirement_code ? `${conflict.requirement.requirement_code} · ` : ""}
                        {conflict.reason}
                      </Typography>
                    ))}
                    {(item.correlationSummary?.related_requirements ?? []).slice(0, 3).map((related, index) => (
                      <Typography key={`related-${index}`} variant="body2" color="text.secondary">
                        Related: {related.requirement?.requirement_code ? `${related.requirement.requirement_code} · ` : ""}
                        {related.reason}
                      </Typography>
                    ))}
                  </Stack>
                )}
              />

              <ValidationRequirementList
                title="Feasibility Findings"
                description="Requirements whose active linked evidence is infeasible, warning-level, or insufficient."
                emptyMessage="No non-feasible or incomplete feasibility findings are currently present."
                items={feasibilityItems}
                renderBody={(item) => (
                  <Stack spacing={1}>
                    {item.feasibilityError ? <Alert severity="error">{item.feasibilityError}</Alert> : null}
                    {item.feasibility ? (
                      <>
                        <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                          <Chip
                            size="small"
                            color={
                              item.feasibility.assessment_status === "likely_infeasible"
                                ? "error"
                                : item.feasibility.assessment_status === "warning"
                                  ? "warning"
                                  : item.feasibility.assessment_status === "feasible"
                                    ? "success"
                                    : "default"
                            }
                            icon={<CheckCircleOutlineOutlinedIcon />}
                            label={item.feasibility.assessment_status.replace("_", " ")}
                          />
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Confidence ${Math.round(item.feasibility.confidence * 100)}%`}
                          />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {item.feasibility.explanation}
                        </Typography>
                        {item.feasibility.evidence_used.slice(0, 3).map((evidence, index) => (
                          <Typography key={index} variant="body2" color="text.secondary">
                            {evidence.source}: {evidence.detail}
                          </Typography>
                        ))}
                      </>
                    ) : null}
                  </Stack>
                )}
              />
            </Stack>
          ) : null}
        </Stack>
      </Box>

      <CreateSnapshotDialog
        open={createDialogOpen}
        snapshotType="validation"
        loading={creatingSnapshot}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateSnapshot}
      />
    </ProjectWorkspaceShell>
  );
}
