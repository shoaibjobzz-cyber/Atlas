import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ProjectWorkspaceShell from "../components/layout/ProjectWorkspaceShell";
import { routePaths } from "../routes/routePaths";
import { fetchDfmeaEntries } from "../services/dfmeaApi";
import {
  fetchProject,
  fetchProjectFeatures,
  type ProjectFeatureRecord,
  type ProjectRecord,
} from "../services/projectsApi";
import {
  fetchProjectTraceabilityHealth,
  fetchProjectValidationSummary,
} from "../services/projectViewsApi";
import { fetchRequirements } from "../services/requirementsApi";
import type { DfmeaEntry } from "../types/dfmea";
import type {
  ProjectValidationSummaryResponse,
  TraceabilityHealthScoreResponse,
} from "../types/projectViews";
import type { Requirement } from "../types/requirements";

type MetricTile = {
  key: string;
  label: string;
  value: string;
  detail: string;
  href: string;
  progress?: number;
  tone?: "neutral" | "warning" | "critical" | "good";
};

function MetricBoardTile({ tile, onOpen }: { tile: MetricTile; onOpen: (href: string) => void }) {
  const borderColor =
    tile.tone === "critical"
      ? "rgba(185,28,28,0.22)"
      : tile.tone === "warning"
        ? "rgba(180,83,9,0.22)"
        : tile.tone === "good"
          ? "rgba(21,128,61,0.22)"
          : "rgba(15,23,42,0.12)";
  const accentColor =
    tile.tone === "critical"
      ? "#b91c1c"
      : tile.tone === "warning"
        ? "#b45309"
        : tile.tone === "good"
          ? "#15803d"
          : "#0f172a";

  return (
    <Box
      role="button"
      tabIndex={0}
      aria-label={`Open ${tile.label}`}
      onClick={() => onOpen(tile.href)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(tile.href);
        }
      }}
      sx={{
        cursor: "pointer",
        border: `1px solid ${borderColor}`,
        borderRadius: 1,
        bgcolor: "#ffffff",
        px: 2,
        py: 1.75,
        minHeight: 128,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        transition: "border-color 120ms ease, background-color 120ms ease",
        "&:hover": {
          borderColor: accentColor,
          backgroundColor: "rgba(248,250,252,0.94)",
        },
        "&:focus-visible": {
          outline: `2px solid ${accentColor}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box>
        <Typography
          variant="caption"
          color="#64748b"
          sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
        >
          {tile.label}
        </Typography>
        <Typography variant="h4" fontWeight={700} color={accentColor} sx={{ mt: 0.55 }}>
          {tile.value}
        </Typography>
      </Box>
      <Box>
        {typeof tile.progress === "number" ? (
          <LinearProgress
            variant="determinate"
            value={Math.max(0, Math.min(100, tile.progress))}
            sx={{
              height: 6,
              borderRadius: 999,
              bgcolor: "rgba(15,23,42,0.08)",
              "& .MuiLinearProgress-bar": {
                borderRadius: 999,
                backgroundColor: accentColor,
              },
            }}
          />
        ) : null}
        <Typography variant="body2" color="text.secondary" sx={{ mt: tile.progress !== undefined ? 1 : 0 }}>
          {tile.detail}
        </Typography>
      </Box>
    </Box>
  );
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleDateString();
}

function countWarningSignals(record: ProjectValidationSummaryResponse["requirements"][number]): number {
  return (
    (record.quality_summary?.warnings.length ?? 0) +
    (record.quality_summary?.issues.length ?? 0) +
    (record.quality_error ? 1 : 0)
  );
}

export default function ProjectDashboardPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? "";
  const navigate = useNavigate();
  const location = useLocation();
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [features, setFeatures] = useState<ProjectFeatureRecord[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [validation, setValidation] = useState<ProjectValidationSummaryResponse | null>(null);
  const [health, setHealth] = useState<TraceabilityHealthScoreResponse | null>(null);
  const [dfmeaEntries, setDfmeaEntries] = useState<DfmeaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedFeatureId = useMemo(() => new URLSearchParams(location.search).get("featureId"), [location.search]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    async function loadProjectDashboard() {
      try {
        const [projectResponse, requirementsResponse, validationResponse, healthResponse, dfmeaResponse] =
          await Promise.all([
            fetchProject(projectId),
            fetchRequirements(projectId),
            fetchProjectValidationSummary(projectId),
            fetchProjectTraceabilityHealth(projectId),
            fetchDfmeaEntries(projectId).catch(() => []),
          ]);
        if (!active) {
          return;
        }
        setProject(projectResponse);
        if (projectResponse.project_kind === "Platform") {
          const featureResponse = await fetchProjectFeatures(projectId).catch(() => []);
          if (!active) {
            return;
          }
          setFeatures(featureResponse);
        } else {
          setFeatures([]);
        }
        setRequirements(requirementsResponse);
        setValidation(validationResponse);
        setHealth(healthResponse);
        setDfmeaEntries(dfmeaResponse);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load project dashboard.");
        setProject(null);
        setFeatures([]);
        setRequirements([]);
        setValidation(null);
        setHealth(null);
        setDfmeaEntries([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProjectDashboard();
    return () => {
      active = false;
    };
  }, [projectId]);

  const selectedFeature = useMemo(
    () => features.find((feature) => feature.id === selectedFeatureId) ?? null,
    [features, selectedFeatureId]
  );

  const scopedRequirements = useMemo(
    () =>
      selectedFeatureId
        ? requirements.filter((requirement) => requirement.feature_id === selectedFeatureId)
        : requirements,
    [requirements, selectedFeatureId]
  );

  const scopedValidationRequirements = useMemo(
    () =>
      selectedFeatureId
        ? (validation?.requirements ?? []).filter(
            (record) => record.requirement.feature_id === selectedFeatureId
          )
        : (validation?.requirements ?? []),
    [selectedFeatureId, validation?.requirements]
  );

  const scopedDfmeaEntries = useMemo(
    () =>
      selectedFeatureId
        ? dfmeaEntries.filter((entry) => entry.requirement.feature_id === selectedFeatureId)
        : dfmeaEntries,
    [dfmeaEntries, selectedFeatureId]
  );

  const requirementFamilyCount = useMemo(
    () => new Set(scopedRequirements.map((requirement) => requirement.type)).size,
    [scopedRequirements]
  );

  const highRiskDfmeaCount = useMemo(
    () => scopedDfmeaEntries.filter((entry) => entry.rpn >= 120).length,
    [scopedDfmeaEntries]
  );

  const metadataItems = useMemo(
    () => [
      { label: "Project ID", value: project?.id ?? "--" },
      { label: "Status", value: project?.status ?? "--" },
      { label: "Last updated", value: project ? formatTimestamp(project.updated_at) : "--" },
      { label: "Requirement families", value: String(requirementFamilyCount) },
      {
        label: "Scope",
        value: selectedFeature
          ? `Feature: ${selectedFeature.name}`
          : project?.project_kind === "Platform"
            ? "Platform"
            : "Project",
      },
    ],
    [project, requirementFamilyCount, selectedFeature]
  );

  const metrics = useMemo<MetricTile[]>(() => {
    const totalRequirements = scopedRequirements.length;
    const qualityWarnings = scopedValidationRequirements.filter(
      (record) => countWarningSignals(record) > 0
    ).length;
    const conflicts = scopedValidationRequirements.filter(
      (record) => (record.correlation_summary?.potential_conflicts.length ?? 0) > 0
    ).length;
    const feasibilityIssues = scopedValidationRequirements.filter((record) => {
      const status = record.feasibility?.assessment_status;
      return status === "likely_infeasible" || status === "warning" || status === "insufficient_data";
    }).length;
    const traceabilityHealthyRequirements = scopedValidationRequirements.filter((record) => {
      const hasWarnings = countWarningSignals(record) > 0;
      const hasConflicts = (record.correlation_summary?.potential_conflicts.length ?? 0) > 0;
      const hasParsingGaps = record.parsed_missing_fields.length > 0;
      return !hasWarnings && !hasConflicts && !hasParsingGaps;
    }).length;
    const traceabilityScore =
      scopedValidationRequirements.length > 0
        ? Math.round((traceabilityHealthyRequirements / scopedValidationRequirements.length) * 100)
        : (health?.score ?? 0);
    const healthTone =
      traceabilityScore >= 80 ? "good" : traceabilityScore >= 60 ? "warning" : "critical";

    return [
      {
        key: "requirements",
        label: "Total Requirements",
        value: String(totalRequirements),
        detail: "Open requirements workspace",
        href: routePaths.projectRequirements(projectId),
        tone: totalRequirements > 0 ? "neutral" : "warning",
      },
      {
        key: "warnings",
        label: "Quality Warnings",
        value: String(qualityWarnings),
        detail: "Open validation and INCOSE review",
        href: routePaths.projectValidation(projectId),
        tone: qualityWarnings > 0 ? "warning" : "good",
      },
      {
        key: "conflicts",
        label: "Conflicts",
        value: String(conflicts),
        detail: "Open conflict analysis",
        href: `${routePaths.projectTraceabilityMatrix(projectId)}?issue=conflicts`,
        tone: conflicts > 0 ? "critical" : "good",
      },
      {
        key: "feasibility",
        label: "Feasibility Issues",
        value: String(feasibilityIssues),
        detail: "Open design data review",
        href: routePaths.projectDesignData(projectId),
        tone: feasibilityIssues > 0 ? "warning" : "good",
      },
      {
        key: "health",
        label: "Traceability Health",
        value: `${traceabilityScore}/100`,
        detail: selectedFeature
          ? "Feature-scoped frontend proxy from validation signals"
          : "Open traceability matrix",
        href: routePaths.projectTraceabilityMatrix(projectId),
        progress: traceabilityScore,
        tone: healthTone,
      },
      {
        key: "dfmea",
        label: "DFMEA High-Risk Items",
        value: String(highRiskDfmeaCount),
        detail: "Open DFMEA workspace",
        href: routePaths.projectDfmea(projectId),
        tone: highRiskDfmeaCount > 0 ? "critical" : "good",
      },
      {
        key: "impact",
        label: "Change Impact Items",
        value: "0",
        detail: "Open change impact review",
        href: routePaths.projectTraceabilityGraph(projectId),
        tone: "neutral",
      },
      {
        key: "merger",
        label: "ECU Merge Candidates",
        value: "0",
        detail: "Open ECU merger workspace",
        href: routePaths.projectEcuRequirementMerger(projectId),
        tone: "neutral",
      },
    ];
  }, [
    health?.score,
    highRiskDfmeaCount,
    projectId,
    scopedRequirements,
    scopedValidationRequirements,
    selectedFeature,
  ]);

  function buildMetricHref(href: string): string {
    if (!selectedFeatureId) {
      return href;
    }
    const [pathname, rawSearch = ""] = href.split("?");
    const params = new URLSearchParams(rawSearch);
    params.set("featureId", selectedFeatureId);
    const nextSearch = params.toString();
    return nextSearch ? `${pathname}?${nextSearch}` : pathname;
  }

  return (
    <ProjectWorkspaceShell projectId={projectId} activeNavKey="overview">
      <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1380 }}>
        {loading ? (
          <Box
            sx={{
              minHeight: 240,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">
                Loading project dashboard...
              </Typography>
            </Stack>
          </Box>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}

        {!loading && !error && project ? (
          <Stack spacing={3}>
            <Box
              sx={{
                pb: 2.25,
                borderBottom: "1px solid rgba(15,23,42,0.08)",
              }}
            >
              <Typography variant="h4" fontWeight={700} color="#0f172a" sx={{ letterSpacing: "-0.02em" }}>
                {project.name}
              </Typography>
              {project.description?.trim() ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.85, maxWidth: 960 }}>
                  {project.description}
                </Typography>
              ) : null}

              <Stack
                direction="row"
                spacing={1.5}
                useFlexGap
                flexWrap="wrap"
                sx={{ mt: 1.6 }}
              >
                {metadataItems.map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      px: 1.5,
                      py: 0.9,
                      border: "1px solid rgba(15,23,42,0.08)",
                      borderRadius: 1,
                      minWidth: 160,
                      bgcolor: "#ffffff",
                    }}
                  >
                    <Typography
                      variant="caption"
                      color="#64748b"
                      sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
                    >
                      {item.label}
                    </Typography>
                    <Typography variant="body2" color="#0f172a" fontWeight={700} sx={{ mt: 0.35 }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>

            {scopedRequirements.length === 0 ? (
              <Alert severity="info">Add requirements to start project analysis.</Alert>
            ) : null}

            <Box>
              <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                <Typography
                  variant="caption"
                  color="#64748b"
                  sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
                >
                  {selectedFeature
                    ? `${selectedFeature.name} Feature Health Dashboard`
                    : "Project Health Dashboard"}
                </Typography>
                <Chip
                  size="small"
                  label={
                    selectedFeature
                      ? `Scope: Feature: ${selectedFeature.name}`
                      : project.project_kind === "Platform"
                        ? "Scope: Platform"
                        : "Scope: Project"
                  }
                  variant="outlined"
                />
              </Stack>
              <Box
                sx={{
                  mt: 1.25,
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    xl: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 1.5,
                }}
              >
                {metrics.map((metric) => (
                  <MetricBoardTile
                    key={metric.key}
                    tile={metric}
                    onOpen={(href) => navigate(buildMetricHref(href))}
                  />
                ))}
              </Box>
            </Box>
          </Stack>
        ) : null}
      </Box>
    </ProjectWorkspaceShell>
  );
}
