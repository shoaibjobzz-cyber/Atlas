import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import LaunchOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import {
  Alert,
  Box,
  Chip,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import AppCompactActionButton from "../components/common/AppCompactActionButton";
import WorkspaceStatePanel from "../components/common/WorkspaceStatePanel";
import ProjectWorkspaceShell from "../components/layout/ProjectWorkspaceShell";
import RequirementHealthChip from "../components/requirements/RequirementHealthChip";
import RequirementsContextPanel from "../components/requirements/RequirementsContextPanel";
import {
  getRequirementTraceabilityPath,
  getTraceabilityGraphFocusPath,
  routePaths,
} from "../routes/routePaths";
import { fetchProjectTraceabilityHealth } from "../services/projectViewsApi";
import {
  collectTraceabilityMatrixFilters,
  fetchProjectTraceabilityMatrix,
  filterTraceabilityMatrixRows,
} from "../services/traceabilityMatrixService";
import type { TraceabilityHealthScoreResponse } from "../types/projectViews";
import type { RequirementType } from "../types/requirements";
import type { TraceabilityMatrixFilters, TraceabilityMatrixRow } from "../types/traceabilityMatrix";
import {
  compareRequirementsByHierarchy,
  getHierarchyDepth,
  getRequirementDisplayId,
  getRequirementHierarchy,
} from "../utils/requirementHierarchy";

const stickyIdColumnSx = {
  position: "sticky",
  left: 0,
  zIndex: 2,
  bgcolor: "#ffffff",
};

const stickyIdHeaderSx = {
  ...stickyIdColumnSx,
  zIndex: 3,
  bgcolor: "#f8fafc",
};

const defaultFilters: TraceabilityMatrixFilters = {
  subsystem: "all",
  type: "all",
  provenance: "all",
  issue: "all",
};

function feasibilityChipColor(status: string) {
  switch (status) {
    case "feasible":
      return "success";
    case "likely_infeasible":
      return "error";
    case "warning":
      return "warning";
    case "insufficient_data":
      return "default";
    default:
      return "default";
  }
}

function cellSx(row: TraceabilityMatrixRow, kind: "conflict" | "warning" | "missing" | "normal") {
  if (kind === "conflict" && row.conflictCount > 0) {
    return { bgcolor: "rgba(254,226,226,0.9)", color: "#991b1b", fontWeight: 700 };
  }
  if (kind === "warning" && row.lowQuality) {
    return { bgcolor: "rgba(254,240,138,0.65)", color: "#854d0e", fontWeight: 700 };
  }
  if (kind === "missing" && row.missingEvidence) {
    return { bgcolor: "rgba(255,237,213,0.75)", color: "#9a3412", fontWeight: 700 };
  }
  return {};
}

function issueBadges(row: TraceabilityMatrixRow) {
  const badges: Array<{ label: string; tone: "error" | "warning" | "default" }> = [];
  if (row.conflictCount > 0) {
    badges.push({ label: "Conflict", tone: "error" });
  }
  if (row.missingEvidence) {
    badges.push({ label: "Missing evidence", tone: "warning" });
  }
  if (row.lowQuality) {
    badges.push({ label: "Quality", tone: "warning" });
  }
  if (row.childrenCount === 0 && row.parentId == null && row.relatedCount === 0) {
    badges.push({ label: "Orphan", tone: "default" });
  }
  return badges;
}

function issueFilterFromQuery(
  value: string | null
): TraceabilityMatrixFilters["issue"] {
  return value === "conflicts" ||
    value === "missing-evidence" ||
    value === "low-quality" ||
    value === "broken"
    ? value
    : "all";
}

export default function TraceabilityMatrixPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? "";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState<TraceabilityMatrixRow[]>([]);
  const [health, setHealth] = useState<TraceabilityHealthScoreResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TraceabilityMatrixFilters>(() => ({
    ...defaultFilters,
    issue: issueFilterFromQuery(searchParams.get("issue")),
  }));
  const [showMatrixNote, setShowMatrixNote] = useState(true);
  const standalone = searchParams.get("standalone") === "1";
  const focusRequirementId = searchParams.get("focus");
  const focusMode = searchParams.get("mode");

  useEffect(() => {
    const issue = issueFilterFromQuery(searchParams.get("issue"));
    setFilters((current) => (current.issue === issue ? current : { ...current, issue }));
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function loadMatrix() {
      if (!projectId) {
        setError("Project context is missing.");
        setLoading(false);
        return;
      }

      try {
        const [response, healthResponse] = await Promise.all([
          fetchProjectTraceabilityMatrix(projectId),
          fetchProjectTraceabilityHealth(projectId),
        ]);
        if (!active) {
          return;
        }
        setRows(response);
        setHealth(healthResponse);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load traceability matrix.");
        setHealth(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadMatrix();
    return () => {
      active = false;
    };
  }, [projectId]);

  const { subsystemOptions, typeOptions } = useMemo(() => collectTraceabilityMatrixFilters(rows), [rows]);
  const focusRow = useMemo(
    () => rows.find((row) => row.requirement.id === focusRequirementId) ?? null,
    [focusRequirementId, rows]
  );
  const filteredRows = useMemo(() => {
    const baseRows = [...filterTraceabilityMatrixRows(rows, filters)].sort((left, right) =>
      compareRequirementsByHierarchy(left.requirement, right.requirement)
    );

    if (!focusRow || !focusMode) {
      return baseRows;
    }

    const focusHierarchy = focusRow.hierarchy || getRequirementHierarchy(focusRow.requirement);
    const focusCode = getRequirementDisplayId(focusRow.requirement);

    if (focusMode === "subtree") {
      return baseRows.filter((row) => {
        const hierarchy = row.hierarchy || getRequirementHierarchy(row.requirement);
        return hierarchy === focusHierarchy || hierarchy.startsWith(`${focusHierarchy}.`);
      });
    }
    if (focusMode === "children") {
      return baseRows.filter(
        (row) => row.requirement.id === focusRow.requirement.id || row.parentId === focusCode
      );
    }
    if (focusMode === "parents") {
      return baseRows.filter((row) => {
        const hierarchy = row.hierarchy || getRequirementHierarchy(row.requirement);
        return focusHierarchy === hierarchy || focusHierarchy.startsWith(`${hierarchy}.`);
      });
    }

    return baseRows;
  }, [rows, filters, focusMode, focusRow]);

  useEffect(() => {
    if (!focusRequirementId || loading) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      document.getElementById(`matrix-row-${focusRequirementId}`)?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }, 80);
    return () => window.clearTimeout(timeoutId);
  }, [focusRequirementId, filteredRows, loading]);

  useEffect(() => {
    setShowMatrixNote(true);
    const timeoutId = window.setTimeout(() => {
      setShowMatrixNote(false);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [projectId, filters]);

  const contextItems = [
    { label: "Project ID", value: projectId || "Unknown" },
    { label: "Health score", value: health ? `${health.score}/100` : "—" },
    { label: "Rows in view", value: String(filteredRows.length) },
    { label: "Conflict rows", value: String(filteredRows.filter((row) => row.conflictCount > 0).length) },
    { label: "Low-quality rows", value: String(filteredRows.filter((row) => row.lowQuality).length) },
    { label: "Missing evidence", value: String(filteredRows.filter((row) => row.missingEvidence).length) },
  ];

  const matrixBody = (
    <Box sx={{ height: "100%" }}>
        <Paper
          elevation={0}
          sx={{
            height: "100%",
            minHeight: "100%",
            display: "flex",
            flexDirection: "column",
            p: { xs: 2, md: 3 },
            border: standalone ? "none" : "1px solid rgba(15,23,42,0.10)",
            borderTop: "none",
            borderRadius: 0,
            bgcolor: "#ffffff",
          }}
        >
          <Stack spacing={3} sx={{ minHeight: 0, height: "100%" }}>
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ lg: "flex-start" }}
            >
              <Box>
                <Typography variant="h5" fontWeight={700} color="#0f172a">
                  Traceability Matrix
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 960 }}>
                  Review requirement relationships, evidence coverage, conflicts, and generation provenance in a structured matrix view.
                </Typography>
              </Box>
              <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
                {!standalone ? (
                  <AppCompactActionButton
                    startIcon={<OpenInNewOutlinedIcon />}
                    onClick={() =>
                      window.open(
                        `${window.location.origin}/?openMatrixProject=${encodeURIComponent(projectId)}&standalone=1`,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                  >
                    Open in Popup
                  </AppCompactActionButton>
                ) : (
                  <AppCompactActionButton startIcon={<CloseOutlinedIcon />} onClick={() => window.close()}>
                    Close Window
                  </AppCompactActionButton>
                )}
              </Stack>
            </Stack>

            {loading ? (
              <WorkspaceStatePanel
                state="loading"
                title="Loading traceability matrix"
                message="Aggregating requirement relationships, design links, feasibility, and validation signals."
              />
            ) : null}

            {error ? <WorkspaceStatePanel state="error" title="Unable to load traceability matrix" message={error} /> : null}

            {!loading && !error ? (
              <>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: "1px solid rgba(15,23,42,0.10)",
                    bgcolor: "#f8fafc",
                    borderRadius: 0,
                  }}
                >
                  <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} alignItems={{ lg: "center" }} useFlexGap flexWrap="wrap">
                    <TextField
                      select
                      size="small"
                      label="Subsystem"
                      value={filters.subsystem}
                      onChange={(event) => setFilters((current) => ({ ...current, subsystem: event.target.value }))}
                      sx={{ minWidth: 180 }}
                    >
                      {subsystemOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option === "all" ? "All subsystems" : option}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      size="small"
                      label="Requirement Type"
                      value={filters.type}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          type: event.target.value as RequirementType | "all",
                        }))
                      }
                      sx={{ minWidth: 180 }}
                    >
                      {typeOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option === "all" ? "All types" : option}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      select
                      size="small"
                      label="Provenance"
                      value={filters.provenance}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          provenance: event.target.value as TraceabilityMatrixFilters["provenance"],
                        }))
                      }
                      sx={{ minWidth: 170 }}
                    >
                      <MenuItem value="all">All requirements</MenuItem>
                      <MenuItem value="generated">Generated drafts</MenuItem>
                      <MenuItem value="manual">Manual requirements</MenuItem>
                    </TextField>

                    <TextField
                      select
                      size="small"
                      label="Review focus"
                      value={filters.issue}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          issue: event.target.value as TraceabilityMatrixFilters["issue"],
                        }))
                      }
                      sx={{ minWidth: 180 }}
                    >
                      <MenuItem value="all">All rows</MenuItem>
                      <MenuItem value="conflicts">Conflict-heavy</MenuItem>
                      <MenuItem value="missing-evidence">Missing evidence</MenuItem>
                      <MenuItem value="low-quality">Low quality</MenuItem>
                      <MenuItem value="broken">Broken traceability</MenuItem>
                    </TextField>

                    <Stack direction="row" spacing={0.9} useFlexGap flexWrap="wrap" sx={{ color: "#64748b" }}>
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#dc2626" }} />
                        <Typography variant="caption">Conflicts</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#d97706" }} />
                        <Typography variant="caption">Missing evidence</Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: "#ca8a04" }} />
                        <Typography variant="caption">Low quality</Typography>
                      </Stack>
                    </Stack>
                  </Stack>
                </Paper>

                {health ? (
                  <Paper
                    elevation={0}
                    sx={{
                      px: 2,
                      py: 1.2,
                      border: "1px solid rgba(15,23,42,0.08)",
                      bgcolor: "#ffffff",
                      borderRadius: 0,
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", lg: "row" }}
                      spacing={1.5}
                      justifyContent="space-between"
                      alignItems={{ lg: "center" }}
                    >
                      <Box>
                        <Typography variant="caption" sx={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "#64748b" }}>
                          Traceability Health Score
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mt: 0.3 }}>
                          <Typography variant="h5" fontWeight={700} color="#0f172a">
                            {health.score}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            / 100 · {health.status}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                          {health.rationale}
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1.2} useFlexGap flexWrap="wrap">
                        <Typography variant="caption" color="text.secondary">
                          <Box component="span" sx={{ fontWeight: 700, color: "#0f172a", mr: 0.5 }}>{health.coverage_percent}%</Box>
                          coverage
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ cursor: "pointer" }}
                          onClick={() => setFilters((current) => ({ ...current, issue: "broken" }))}
                        >
                          <Box component="span" sx={{ fontWeight: 700, color: "#0f172a", mr: 0.5 }}>{health.missing_link_count}</Box>
                          missing links
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ cursor: "pointer" }}
                          onClick={() => setFilters((current) => ({ ...current, issue: "conflicts" }))}
                        >
                          <Box component="span" sx={{ fontWeight: 700, color: "#0f172a", mr: 0.5 }}>{health.conflict_requirement_count}</Box>
                          conflicts
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ cursor: "pointer" }}
                          onClick={() => setFilters((current) => ({ ...current, issue: "missing-evidence" }))}
                        >
                          <Box component="span" sx={{ fontWeight: 700, color: "#0f172a", mr: 0.5 }}>{health.evidence_gap_count}</Box>
                          evidence gaps
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                ) : null}

                {filteredRows.length === 0 ? (
                  <WorkspaceStatePanel
                    state="empty"
                    title="No matrix rows match the current filters"
                    message="Adjust subsystem, type, or provenance filters to bring requirements back into view."
                  />
                ) : (
                  <TableContainer sx={{ flex: 1, border: "1px solid rgba(15,23,42,0.08)", borderRadius: 0 }}>
                    <Table stickyHeader size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: "#f8fafc" }}>
                          <TableCell sx={stickyIdHeaderSx}>Requirement ID</TableCell>
                          <TableCell>Hierarchy</TableCell>
                          <TableCell>Title</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Parent</TableCell>
                          <TableCell>Children</TableCell>
                          <TableCell>Related</TableCell>
                          <TableCell>Conflicts</TableCell>
                          <TableCell>Evidence</TableCell>
                          <TableCell>Feasibility</TableCell>
                          <TableCell>Quality</TableCell>
                          <TableCell>Provenance</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredRows.map((row) => {
                          const hierarchy = row.hierarchy || getRequirementHierarchy(row.requirement);
                          const hierarchyDepth = getHierarchyDepth(row.requirement);
                          return (
                          <TableRow
                            id={`matrix-row-${row.requirement.id}`}
                            hover
                            key={row.requirement.id}
                            onClick={() => navigate(routePaths.projectRequirementDetail(projectId, row.requirement.id))}
                            sx={{
                              cursor: "pointer",
                              bgcolor:
                                focusRequirementId === row.requirement.id
                                  ? "rgba(219,234,254,0.6)"
                                  : hierarchyDepth === 0
                                    ? "#ffffff"
                                    : "rgba(248,250,252,0.72)",
                              "& > td": {
                                py: 1.1,
                                borderBottom: "1px solid rgba(226,232,240,0.8)",
                              },
                            }}
                          >
                            <TableCell sx={{ ...stickyIdColumnSx, fontWeight: 700, whiteSpace: "nowrap" }}>
                              {getRequirementDisplayId(row.requirement)}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary", fontSize: "0.78rem" }}>{hierarchy}</TableCell>
                            <TableCell sx={{ minWidth: 260 }}>
                              <Stack spacing={0.45} sx={{ pl: `${hierarchyDepth * 1.15}rem`, position: "relative" }}>
                                {hierarchyDepth > 0 ? (
                                  <Box
                                    sx={{
                                      position: "absolute",
                                      left: `${Math.max(0, hierarchyDepth * 1.15 - 0.55)}rem`,
                                      top: 2,
                                      bottom: 2,
                                      width: 2,
                                      bgcolor: hierarchyDepth === 1 ? "rgba(59,130,246,0.16)" : "rgba(148,163,184,0.24)",
                                    }}
                                  />
                                ) : null}
                                <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                                  <Typography fontWeight={hierarchyDepth === 0 ? 700 : 600} sx={{ color: "#0f172a" }}>
                                    {row.requirement.title}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
                                    {hierarchyDepth === 0 ? "Top level" : `Child level ${hierarchyDepth}`}
                                  </Typography>
                                </Stack>
                                <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 360, fontSize: "0.78rem" }}>
                                  {row.requirement.text}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Chip size="small" label={row.requirement.type} variant="outlined" sx={{ fontSize: "0.72rem" }} />
                            </TableCell>
                            <TableCell sx={{ color: row.parentId ? "#334155" : "#94a3b8" }}>{row.parentId || "None"}</TableCell>
                            <TableCell>{row.childrenCount || "0"}</TableCell>
                            <TableCell>{row.relatedCount || "0"}</TableCell>
                            <TableCell sx={cellSx(row, "conflict")}>{row.conflictCount}</TableCell>
                            <TableCell sx={cellSx(row, "missing")}>
                              <Typography
                                component="span"
                                sx={{ color: row.linkedDesignParametersCount === 0 ? "#9a3412" : "inherit", fontWeight: row.linkedDesignParametersCount === 0 ? 700 : 600 }}
                              >
                                {row.linkedDesignParametersCount}
                              </Typography>
                            </TableCell>
                            <TableCell sx={cellSx(row, row.missingEvidence ? "missing" : row.conflictCount > 0 ? "conflict" : "normal")}>
                              <Chip
                                size="small"
                                label={row.feasibilityStatus.replace("_", " ")}
                                color={feasibilityChipColor(row.feasibilityStatus)}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell sx={cellSx(row, row.lowQuality ? "warning" : row.conflictCount > 0 ? "conflict" : row.missingEvidence ? "missing" : "normal")}>
                              <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap">
                                <RequirementHealthChip requirement={row.requirement} />
                                {issueBadges(row).slice(0, 2).map((badge) => (
                                  <Chip
                                    key={badge.label}
                                    size="small"
                                    label={badge.label}
                                    color={badge.tone}
                                    variant="outlined"
                                    sx={{ fontSize: "0.68rem", height: 22 }}
                                  />
                                ))}
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={row.provenanceLabel}
                                variant="outlined"
                                color={row.provenanceLabel === "Generated" ? "warning" : "default"}
                              />
                            </TableCell>
                            <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                              <Stack direction="row" spacing={0.75} justifyContent="flex-end">
                                <AppCompactActionButton
                                  endIcon={<ArrowForwardOutlinedIcon />}
                                  onClick={() =>
                                    navigate(routePaths.projectRequirementDetail(projectId, row.requirement.id))
                                  }
                                >
                                  Open
                                </AppCompactActionButton>
                                <AppCompactActionButton
                                  endIcon={<LaunchOutlinedIcon />}
                                  onClick={() =>
                                    navigate(getRequirementTraceabilityPath(projectId, row.requirement.id))
                                  }
                                >
                                  Trace
                                </AppCompactActionButton>
                                <AppCompactActionButton
                                  startIcon={<HubOutlinedIcon />}
                                  onClick={() =>
                                    navigate(getTraceabilityGraphFocusPath(projectId, row.requirement.id, "impact"))
                                  }
                                >
                                  Highlight
                                </AppCompactActionButton>
                                <AppCompactActionButton
                                  startIcon={<HubOutlinedIcon />}
                                  onClick={() =>
                                    navigate(
                                      getTraceabilityGraphFocusPath(
                                        projectId,
                                        row.requirement.id,
                                        row.childrenCount > 0 ? "subtree" : "impact"
                                      )
                                    )
                                  }
                                >
                                  In Graph
                                </AppCompactActionButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {showMatrixNote ? (
                  <Alert severity="info" icon={<WarningAmberOutlinedIcon />}>
                    Red cells indicate conflict-heavy relationships, yellow highlights low-quality requirements, and orange cells point to missing evidence or trace links where the current MVP data suggests a gap.
                  </Alert>
                ) : null}
              </>
            ) : null}
          </Stack>
        </Paper>
      </Box>
  );

  if (standalone) {
    return <Box sx={{ height: "100vh", bgcolor: "#edf2f8" }}>{matrixBody}</Box>;
  }

  return (
    <ProjectWorkspaceShell
      projectId={projectId}
      activeNavKey="matrix"
      rightPanel={<RequirementsContextPanel title="Matrix Summary" items={contextItems} />}
    >
      {matrixBody}
    </ProjectWorkspaceShell>
  );
}
