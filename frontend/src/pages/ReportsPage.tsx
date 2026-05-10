import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import RuleOutlinedIcon from "@mui/icons-material/RuleOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppCompactActionButton from "../components/common/AppCompactActionButton";
import WorkspacePageHeader from "../components/common/WorkspacePageHeader";
import WorkspaceStatePanel from "../components/common/WorkspaceStatePanel";
import ProjectWorkspaceShell from "../components/layout/ProjectWorkspaceShell";
import RequirementsContextPanel from "../components/requirements/RequirementsContextPanel";
import CreateSnapshotDialog from "../components/snapshots/CreateSnapshotDialog";
import SnapshotComparisonPanel from "../components/snapshots/SnapshotComparisonPanel";
import ValidationSummaryCard from "../components/validation/ValidationSummaryCard";
import { getRequirementTraceabilityPath, routePaths } from "../routes/routePaths";
import {
  createProjectSnapshot,
  fetchProjectSnapshot,
  fetchProjectSnapshotComparison,
  fetchProjectSnapshots,
} from "../services/projectSnapshotsApi";
import { fetchProjectReportSummary } from "../services/projectViewsApi";
import { downloadReport } from "../services/reportingService";
import type { ProjectReportSectionItem, ProjectReportSummaryResponse } from "../types/projectViews";
import type {
  ProjectSnapshotComparison,
  ProjectSnapshotSummary,
  ReportSnapshotDetail,
} from "../types/projectSnapshots";
import { compareRequirementsByHierarchy } from "../utils/requirementHierarchy";

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

const REPORT_DELTA_LABELS = {
  total_requirements: "Total requirements",
  total_warnings: "Total warnings",
  conflicts: "Conflicts",
  feasible: "Feasible",
  likely_infeasible: "Likely infeasible",
  insufficient_data: "Insufficient data",
  generated: "Generated",
  manual: "Manual",
} as const;

type ReportSectionProps = {
  title: string;
  description: string;
  emptyMessage: string;
  projectId: string;
  items: ProjectReportSectionItem[];
};

function ReportSection({ title, description, emptyMessage, projectId, items }: ReportSectionProps) {
  const navigate = useNavigate();
  const sortedItems = [...items].sort((left, right) =>
    compareRequirementsByHierarchy(left.requirement, right.requirement)
  );

  return (
    <Accordion
      defaultExpanded
      disableGutters
      sx={{
        border: "1px solid rgba(15,23,42,0.12)",
        borderRadius: 2,
        overflow: "hidden",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
        <Stack spacing={0.4}>
          <Typography variant="h6" fontWeight={700} color="#0f172a">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          {sortedItems.length === 0 ? (
            <Paper elevation={0} sx={{ p: 2, border: "1px dashed rgba(15,23,42,0.18)", bgcolor: "#f8fafc" }}>
              <Typography variant="body2" color="text.secondary">
                {emptyMessage}
              </Typography>
            </Paper>
          ) : null}

          {sortedItems.map((item) => (
            <Paper key={item.requirement.id} elevation={0} sx={{ p: 2, border: "1px solid rgba(15,23,42,0.12)" }}>
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                  <Typography fontWeight={700}>{item.requirement.requirement_code}</Typography>
                  <Chip size="small" label={item.requirement.type} variant="outlined" />
                  <Chip size="small" label={item.requirement.status} variant="outlined" />
                </Stack>
                <Typography fontWeight={600}>{item.requirement.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.requirement.text}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.summary}
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <AppCompactActionButton
                    startIcon={<RuleOutlinedIcon />}
                    onClick={() => navigate(routePaths.projectRequirementDetail(projectId, item.requirement.id))}
                  >
                    Open Detail
                  </AppCompactActionButton>
                  <AppCompactActionButton
                    endIcon={<LaunchOutlinedIcon />}
                    onClick={() => navigate(getRequirementTraceabilityPath(projectId, item.requirement.id))}
                  >
                    Open Traceability
                  </AppCompactActionButton>
                </Stack>
              </Stack>
            </Paper>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export default function ReportsPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? "";
  const [liveReport, setLiveReport] = useState<ProjectReportSummaryResponse | null>(null);
  const [snapshots, setSnapshots] = useState<ProjectSnapshotSummary[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [selectedSnapshot, setSelectedSnapshot] = useState<ReportSnapshotDetail | null>(null);
  const [comparison, setComparison] = useState<ProjectSnapshotComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creatingSnapshot, setCreatingSnapshot] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadReportsView() {
      if (!projectId) {
        setError("Project context is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [reportResponse, snapshotResponse] = await Promise.all([
          fetchProjectReportSummary(projectId),
          fetchProjectSnapshots(projectId, "report"),
        ]);
        if (!active) {
          return;
        }
        setLiveReport(reportResponse);
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
        setError(loadError instanceof Error ? loadError.message : "Unable to load report data.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReportsView();
    return () => {
      active = false;
    };
  }, [projectId]);

  const report = selectedSnapshot?.payload ?? liveReport;

  const contextItems = [
    { label: "Project ID", value: projectId || "Unknown" },
    {
      label: "Mode",
      value: comparison ? "Current vs snapshot" : selectedSnapshot ? "Historical snapshot" : "Current live state",
    },
    { label: "Requirements assessed", value: String(report?.total_requirements ?? 0) },
    { label: "Warnings", value: String(report?.total_warnings ?? 0) },
    { label: "Conflicts", value: String(report?.conflict_count ?? 0) },
    { label: "Snapshots", value: String(snapshots.length) },
  ];

  async function handleCopyReport() {
    if (!report) {
      return;
    }

    await navigator.clipboard.writeText(report.markdown);
    setCopyMessage("Report copied to clipboard.");
    window.setTimeout(() => setCopyMessage(null), 2500);
  }

  async function handleSnapshotSelect(snapshotId: string) {
    setSelectedSnapshotId(snapshotId);
    setComparison(null);
    setSnapshotError(null);

    if (!snapshotId) {
      setSelectedSnapshot(null);
      return;
    }

    try {
      const snapshot = await fetchProjectSnapshot<ProjectReportSummaryResponse>(projectId, snapshotId);
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
        snapshot_type: "report",
        ...payload,
      });
      setSnapshots((current) => [created, ...current]);
      setSelectedSnapshotId(created.id);
      setSelectedSnapshot(created as ReportSnapshotDetail);
      setComparison(null);
      setCreateDialogOpen(false);
      setCopyMessage(`Saved snapshot "${created.name}".`);
      window.setTimeout(() => setCopyMessage(null), 2500);
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
      activeNavKey="reports"
      rightPanel={<RequirementsContextPanel title="Report Overview" items={contextItems} />}
    >
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          <WorkspacePageHeader
            title="Reports"
            titleVariant="h4"
            subtitle="Generate a current project report from live validation, traceability, conflict, and feasibility outputs."
            actions={
              <>
              <FormControl size="small" sx={{ minWidth: 260 }}>
                <InputLabel id="report-snapshot-select-label">Historical snapshot</InputLabel>
                <Select
                  labelId="report-snapshot-select-label"
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
              <AppCompactActionButton onClick={() => setCreateDialogOpen(true)}>
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
              <AppCompactActionButton startIcon={<ContentCopyOutlinedIcon />} onClick={handleCopyReport} disabled={!report}>
                Copy Report
              </AppCompactActionButton>
              <AppCompactActionButton
                startIcon={<DownloadOutlinedIcon />}
                onClick={() => report && downloadReport(report.markdown, projectId)}
                disabled={!report}
              >
                Export Markdown
              </AppCompactActionButton>
              </>
            }
          />

          {copyMessage ? <Alert severity="success">{copyMessage}</Alert> : null}
          {snapshotError ? <Alert severity="error">{snapshotError}</Alert> : null}

          {comparison ? (
            <Alert severity="info">
              Comparing the current live report state against snapshot <strong>{comparison.snapshot.name}</strong>.
            </Alert>
          ) : selectedSnapshot ? (
            <Alert severity="info">
              Viewing historical report snapshot <strong>{selectedSnapshot.name}</strong> from{" "}
              {new Date(selectedSnapshot.created_at).toLocaleString()}.
            </Alert>
          ) : (
            <Alert severity="info">Viewing the current live report state for this project.</Alert>
          )}

          {comparison ? <SnapshotComparisonPanel comparison={comparison} labels={REPORT_DELTA_LABELS} /> : null}

          {loading ? (
            <WorkspaceStatePanel
              state="loading"
              title="Loading report data"
              message="Collecting current validation and traceability outputs for the project report."
            />
          ) : null}

          {error ? <WorkspaceStatePanel state="error" title="Unable to load reports view" message={error} /> : null}

          {!loading && !error && report?.total_requirements === 0 ? (
            <WorkspaceStatePanel
              state="empty"
              title="No reportable requirements"
              message="Create or load project requirements to generate a report."
            />
          ) : null}

          {!loading && !error && report ? (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6} xl={4}>
                  <ValidationSummaryCard
                    label="Requirements overview"
                    value={String(report.total_requirements)}
                    supportingText="Requirements currently included in this project-level report."
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={4}>
                  <ValidationSummaryCard
                    label="Quality warning summary"
                    value={String(report.total_warnings)}
                    supportingText="Total deterministic quality findings across the project."
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={4}>
                  <ValidationSummaryCard
                    label="Parsing summary"
                    value={percent(report.avg_parsing_coverage)}
                    supportingText="Average structured-data extraction coverage."
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={4}>
                  <ValidationSummaryCard
                    label="Conflict summary"
                    value={String(report.conflict_count)}
                    supportingText={`${report.related_count} related requirement links were also identified.`}
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={4}>
                  <ValidationSummaryCard
                    label="Feasibility summary"
                    value={String(
                      report.likely_infeasible_count + report.warning_feasibility_count + report.insufficient_data_count
                    )}
                    supportingText={`${report.feasible_count} requirements currently assess as feasible.`}
                  />
                </Grid>
                <Grid item xs={12} md={6} xl={4}>
                  <ValidationSummaryCard
                    label="Generated vs manual"
                    value={`${report.generated_summary.generated} / ${report.generated_summary.manual}`}
                    supportingText="Generated draft requirements versus manual requirements currently in the project."
                  />
                </Grid>
              </Grid>

              <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(15,23,42,0.12)", bgcolor: "#ffffff" }}>
                <Stack spacing={1}>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    Report Preview
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Stored markdown output used for copy and export in the active view.
                  </Typography>
                  <Box
                    component="pre"
                    data-testid="project-report-preview"
                    sx={{
                      m: 0,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "#f8fafc",
                      border: "1px solid rgba(15,23,42,0.08)",
                      overflow: "auto",
                      whiteSpace: "pre-wrap",
                      fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
                      fontSize: 13,
                    }}
                  >
                    {report.markdown}
                  </Box>
                </Stack>
              </Paper>

              <ReportSection
                title="Quality Warning Summary"
                description="Requirements currently contributing quality findings to the active report."
                emptyMessage="No requirements currently contribute quality warnings to the report."
                projectId={projectId}
                items={report.quality_items}
              />

              <ReportSection
                title="Parsing / Structured-Data Summary"
                description="Requirements with incomplete structured extraction coverage."
                emptyMessage="All current requirements have full structured extraction coverage."
                projectId={projectId}
                items={report.parsing_items}
              />

              <ReportSection
                title="Conflict / Correlation Summary"
                description="Requirements contributing correlation and conflict evidence to the active report."
                emptyMessage="No current requirements contribute correlation or conflict findings."
                projectId={projectId}
                items={report.conflict_items}
              />

              <ReportSection
                title="Feasibility Summary"
                description="Requirements with non-feasible, warning-level, or incomplete feasibility results."
                emptyMessage="No current requirements contribute non-feasible findings to the report."
                projectId={projectId}
                items={report.feasibility_items}
              />

              <ReportSection
                title="Traceability / Evidence Summary"
                description="Requirements with current evidence chains that contribute directly to the active report."
                emptyMessage="No current feasibility evidence items are available for the report."
                projectId={projectId}
                items={report.evidence_items}
              />
            </Stack>
          ) : null}
        </Stack>
      </Box>

      <CreateSnapshotDialog
        open={createDialogOpen}
        snapshotType="report"
        loading={creatingSnapshot}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateSnapshot}
      />
    </ProjectWorkspaceShell>
  );
}
