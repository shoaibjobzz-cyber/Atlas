import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import {
  Box,
  Chip,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import AppButton from "../components/common/AppButton";
import AppCompactActionButton from "../components/common/AppCompactActionButton";
import WorkspaceStatePanel from "../components/common/WorkspaceStatePanel";
import ProjectWorkspaceShell from "../components/layout/ProjectWorkspaceShell";
import RequirementHealthChip from "../components/requirements/RequirementHealthChip";
import RequirementsContextPanel from "../components/requirements/RequirementsContextPanel";
import { routePaths } from "../routes/routePaths";
import {
  fetchRequirements,
  fetchRequirementSections,
} from "../services/requirementsApi";
import type { DashboardNavKey } from "../types/dashboard";
import type {
  Requirement,
  RequirementSection,
  RequirementType,
} from "../types/requirements";
import { requirementTypeOptions } from "../types/requirements";
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

function getActiveNavKey(type: string | null): DashboardNavKey {
  switch (type) {
    case "Stakeholder":
      return "stakeholder";
    case "System":
      return "system";
    case "Subsystem":
      return "subsystem";
    case "Software":
      return "software";
    case "Hardware":
      return "hardware";
    default:
      return "system";
  }
}

function compareSections(left: RequirementSection, right: RequirementSection): number {
  if (left.order_index !== right.order_index) {
    return left.order_index - right.order_index;
  }
  return left.title.localeCompare(right.title);
}

function formatDeletedAt(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "Unknown time";
}

export default function RequirementsListPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? "";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterType = searchParams.get("type") as RequirementType | null;
  const selectedFeatureId = searchParams.get("featureId");

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [sections, setSections] = useState<RequirementSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const currentSearch = searchParams.toString();
  const newRequirementSearch = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (filterType) {
      params.set("type", filterType);
    } else {
      params.delete("type");
    }
    const nextSearch = params.toString();
    return nextSearch ? `?${nextSearch}` : "";
  }, [filterType, searchParams]);

  useEffect(() => {
    let active = true;

    async function loadRequirementsData() {
      if (!projectId) {
        setError("Project context is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [requirementsData, sectionsData] = await Promise.all([
          fetchRequirements(projectId, showDeleted),
          fetchRequirementSections(projectId),
        ]);
        if (!active) {
          return;
        }
        setRequirements(requirementsData);
        setSections(sectionsData.sort(compareSections));
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load requirements.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRequirementsData();

    return () => {
      active = false;
    };
  }, [projectId, showDeleted]);

  const filteredRequirements = useMemo(() => {
    const featureScopedRequirements = selectedFeatureId
      ? requirements.filter((requirement) => requirement.feature_id === selectedFeatureId)
      : requirements;

    if (!filterType) {
      return featureScopedRequirements;
    }

    return featureScopedRequirements.filter((requirement) => requirement.type === filterType);
  }, [filterType, requirements, selectedFeatureId]);

  const orderedRequirements = useMemo(() => {
    return [...filteredRequirements].sort(compareRequirementsByHierarchy);
  }, [filteredRequirements]);

  const orderedSections = useMemo(() => {
    return [...sections].sort(compareSections);
  }, [sections]);

  const deletedCount = orderedRequirements.filter((requirement) => requirement.is_deleted).length;

  const contextItems = [
    { label: "Project ID", value: projectId || "Unknown" },
    { label: "Visible requirements", value: String(orderedRequirements.length) },
    { label: "Sections", value: String(orderedSections.length) },
    { label: "Deleted in view", value: String(deletedCount) },
    { label: "Filter", value: filterType ?? "All requirements" },
    { label: "Feature scope", value: selectedFeatureId ?? "All platform features" },
  ];

  return (
    <ProjectWorkspaceShell
      projectId={projectId}
      activeNavKey={getActiveNavKey(filterType)}
      rightPanel={<RequirementsContextPanel title="Requirement List" items={contextItems} />}
    >
      <Box sx={{ height: "100%" }}>
        <Paper
          elevation={0}
          sx={{
            height: "100%",
            minHeight: "100%",
            display: "flex",
            flexDirection: "column",
            p: { xs: 2, md: 3 },
            border: "1px solid rgba(15,23,42,0.10)",
            borderTop: "none",
            borderRadius: 0,
            bgcolor: "#ffffff",
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ md: "center" }}
          >
            <Box>
              <Typography variant="h5" fontWeight={700} color="#0f172a">
                Requirements
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Review requirements in a compact engineering table with feature-scoped context preserved from the workspace.
              </Typography>
            </Box>
            <AppButton
              hierarchy="primary"
              startIcon={<AddOutlinedIcon />}
              onClick={() =>
                navigate({
                  pathname: routePaths.projectRequirementNew(projectId),
                  search: newRequirementSearch,
                })
              }
            >
              New Requirement
            </AppButton>
          </Stack>

          <Box
            sx={{
              mt: 2,
              px: 0.5,
              py: 1.25,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
              borderTop: "1px solid rgba(15,23,42,0.08)",
              borderBottom: "1px solid rgba(15,23,42,0.08)",
            }}
          >
            <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" alignItems="center">
              <FormControlLabel
                control={<Switch checked={showDeleted} onChange={(event) => setShowDeleted(event.target.checked)} />}
                label="Show deleted"
                sx={{ ml: 0.25, "& .MuiFormControlLabel-label": { fontSize: "0.82rem", color: "#334155" } }}
              />
              <Typography variant="body2" color="text.secondary">
                {orderedRequirements.length} requirements shown
              </Typography>
              {selectedFeatureId ? (
                <Typography variant="body2" color="text.secondary">
                  Feature scope:{" "}
                  <Box component="span" className="atlas-code">
                    {selectedFeatureId}
                  </Box>
                </Typography>
              ) : null}
            </Stack>
          </Box>

          {loading ? (
            <Box sx={{ mt: 3 }}>
              <WorkspaceStatePanel
                state="loading"
                title="Loading requirements"
                message="Fetching the active project baseline and requirement metadata."
              />
            </Box>
          ) : null}

          {error ? (
            <Box sx={{ mt: 3 }}>
              <WorkspaceStatePanel state="error" title="Unable to load requirements" message={error} />
            </Box>
          ) : null}

          {!loading && !error && orderedRequirements.length === 0 ? (
            <Box sx={{ mt: 3 }}>
              <WorkspaceStatePanel
                state="empty"
                title="No requirements in view"
                message={
                  showDeleted
                    ? "No requirements match the current filter, including deleted history."
                    : "Try another category or create the first requirement for this project baseline."
                }
              />
            </Box>
          ) : null}

          {!loading && !error && orderedRequirements.length > 0 ? (
            <TableContainer sx={{ mt: 2, flex: 1, border: "1px solid rgba(15,23,42,0.08)", borderRadius: 0 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    <TableCell sx={stickyIdHeaderSx}>Requirement ID</TableCell>
                    <TableCell>Hierarchy</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Health</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Subsystem</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orderedRequirements.map((requirement) => {
                    const hierarchy = getRequirementHierarchy(requirement);
                    const hierarchyDepth = getHierarchyDepth(requirement);
                    const deletedRowSx = requirement.is_deleted
                      ? {
                          opacity: 0.62,
                          bgcolor: "rgba(248,113,113,0.06)",
                        }
                      : {
                          bgcolor: hierarchyDepth === 0 ? "#ffffff" : "rgba(248,250,252,0.8)",
                        };
                    return (
                      <TableRow hover key={requirement.id} sx={deletedRowSx}>
                        <TableCell
                          className="atlas-code"
                          sx={{
                            ...stickyIdColumnSx,
                            fontWeight: 700,
                            whiteSpace: "nowrap",
                            ...(requirement.is_deleted ? { opacity: 0.62 } : null),
                          }}
                        >
                          {getRequirementDisplayId(requirement)}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>{hierarchy}</TableCell>
                        <TableCell sx={{ minWidth: 260 }}>
                          <Stack spacing={0.5} sx={{ pl: `${hierarchyDepth * 2}rem`, position: "relative" }}>
                            {hierarchyDepth > 0 ? (
                              <Box
                                sx={{
                                  position: "absolute",
                                  left: `${Math.max(0, hierarchyDepth * 2 - 1)}rem`,
                                  top: 6,
                                  bottom: 6,
                                  width: 2,
                                  bgcolor: "rgba(59,130,246,0.16)",
                                }}
                              />
                            ) : null}
                            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                              <Typography
                                fontWeight={600}
                                sx={{ textDecoration: requirement.is_deleted ? "line-through" : "none" }}
                              >
                                {requirement.title}
                              </Typography>
                              <Chip
                                size="small"
                                label={hierarchyDepth === 0 ? "Top level" : `Level ${hierarchyDepth + 1}`}
                                variant="outlined"
                              />
                              {requirement.section_id ? (
                                <Chip
                                  size="small"
                                  label={
                                    orderedSections.find((section) => section.id === requirement.section_id)?.title ??
                                    "Assigned"
                                  }
                                  variant="outlined"
                                />
                              ) : null}
                              {requirement.is_deleted ? (
                                <Chip size="small" label="Deleted" color="error" variant="outlined" />
                              ) : null}
                            </Stack>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                              sx={{ maxWidth: 420, textDecoration: requirement.is_deleted ? "line-through" : "none" }}
                            >
                              {requirement.text}
                            </Typography>
                            {requirement.is_deleted ? (
                              <Typography variant="caption" color="text.secondary">
                                Deleted by {requirement.deleted_by_username || "Unknown user"} on {formatDeletedAt(requirement.deleted_at)}
                              </Typography>
                            ) : null}
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <RequirementHealthChip requirement={requirement} />
                        </TableCell>
                        <TableCell>{requirement.type}</TableCell>
                        <TableCell>{requirement.priority}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={requirement.is_deleted ? "Deleted" : requirement.status}
                            color={requirement.is_deleted ? "error" : "primary"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{requirement.subsystem || "Unassigned"}</TableCell>
                        <TableCell align="right">
                          <AppCompactActionButton
                            variant="text"
                            endIcon={<ArrowForwardOutlinedIcon />}
                            onClick={() =>
                              navigate({
                                pathname: routePaths.projectRequirementDetail(projectId, requirement.id),
                                search: currentSearch ? `?${currentSearch}` : "",
                              })
                            }
                          >
                            View
                          </AppCompactActionButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : null}

        </Paper>
      </Box>
    </ProjectWorkspaceShell>
  );
}
