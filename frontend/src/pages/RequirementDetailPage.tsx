import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import AppButton from "../components/common/AppButton";
import AppCompactActionButton from "../components/common/AppCompactActionButton";
import WorkspaceCommandBar from "../components/common/WorkspaceCommandBar";
import WorkspacePageHeader from "../components/common/WorkspacePageHeader";
import WorkspaceStatePanel from "../components/common/WorkspaceStatePanel";
import ProjectWorkspaceShell from "../components/layout/ProjectWorkspaceShell";
import LinkedDesignParametersSection from "../components/requirements/LinkedDesignParametersSection";
import RequirementCorrelationSection from "../components/requirements/RequirementCorrelationSection";
import RequirementFeasibilityCard from "../components/requirements/RequirementFeasibilityCard";
import RequirementHealthChip from "../components/requirements/RequirementHealthChip";
import RequirementRewriteDialog from "../components/requirements/RequirementRewriteDialog";
import RequirementTraceabilityView from "../components/requirements/RequirementTraceabilityView";
import RequirementsContextPanel from "../components/requirements/RequirementsContextPanel";
import StructuredRequirementView from "../components/requirements/StructuredRequirementView";
import { routePaths } from "../routes/routePaths";
import { fetchLinkedDesignParameters } from "../services/designParametersApi";
import { fetchDfmeaEntriesByRequirement } from "../services/dfmeaApi";
import { checkRequirementQuality } from "../services/qualityApi";
import {
  deleteRequirement,
  fetchRequirement,
  fetchRequirementCorrelations,
  fetchRequirementFeasibility,
  fetchRequirements,
} from "../services/requirementsApi";
import type { DashboardNavKey } from "../types/dashboard";
import type { DfmeaEntry } from "../types/dfmea";
import type {
  Requirement,
  RequirementCorrelationSummary,
  RequirementFeasibilityAssessment,
  RequirementQualitySummary,
} from "../types/requirements";
import type { LinkedDesignParameterReference } from "../types/designParameters";
import {
  compareRequirementsByHierarchy,
  getHierarchyDepth,
  getRequirementDisplayId,
  getRequirementHierarchy,
} from "../utils/requirementHierarchy";

function getActiveNavKey(type: Requirement["type"]): DashboardNavKey {
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

function FieldBlock({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={600} sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
        {value}
      </Typography>
    </Box>
  );
}

function formatDateTime(value: string | null | undefined): string {
  return value ? new Date(value).toLocaleString() : "Not recorded";
}

export default function RequirementDetailPage() {
  const { id, requirementId } = useParams<{ id: string; requirementId: string }>();
  const projectId = id ?? "";
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [requirement, setRequirement] = useState<Requirement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "structured" | "traceability">(
    searchParams.get("tab") === "traceability"
      ? "traceability"
      : searchParams.get("tab") === "structured"
        ? "structured"
        : "overview"
  );
  const [correlations, setCorrelations] = useState<RequirementCorrelationSummary>({
    related_requirements: [],
    potential_conflicts: [],
  });
  const [correlationError, setCorrelationError] = useState<string | null>(null);
  const [projectRequirements, setProjectRequirements] = useState<Requirement[]>([]);
  const [childrenError, setChildrenError] = useState<string | null>(null);
  const [linkedDesignParameters, setLinkedDesignParameters] = useState<LinkedDesignParameterReference[]>([]);
  const [linkedDesignParametersError, setLinkedDesignParametersError] = useState<string | null>(null);
  const [feasibility, setFeasibility] = useState<RequirementFeasibilityAssessment | null>(null);
  const [feasibilityError, setFeasibilityError] = useState<string | null>(null);
  const [dfmeaEntries, setDfmeaEntries] = useState<DfmeaEntry[]>([]);
  const [dfmeaError, setDfmeaError] = useState<string | null>(null);
  const [qualitySummary, setQualitySummary] = useState<RequirementQualitySummary | null>(null);
  const [qualityError, setQualityError] = useState<string | null>(null);

  useEffect(() => {
    const selectedTab = searchParams.get("tab");
    if (selectedTab === "traceability" || selectedTab === "structured" || selectedTab === "overview") {
      setActiveTab(selectedTab);
      return;
    }
    setActiveTab("overview");
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function loadRequirement() {
      if (!requirementId) {
        setError("Requirement context is missing.");
        setLoading(false);
        return;
      }

      try {
        const [data, allRequirements] = await Promise.all([
          fetchRequirement(requirementId),
          fetchRequirements(projectId, true),
        ]);
        if (!active) {
          return;
        }
        setRequirement(data);
        setProjectRequirements(allRequirements);
        setError(null);
        setChildrenError(null);

        try {
          const qualityAssessment = await checkRequirementQuality({
            title: data.title,
            text: data.text,
            type: data.type,
          });
          if (!active) {
            return;
          }
          setQualitySummary(qualityAssessment);
          setQualityError(null);
        } catch (qualityLoadError) {
          if (!active) {
            return;
          }
          setQualityError(
            qualityLoadError instanceof Error ? qualityLoadError.message : "Unable to load quality warnings."
          );
        }
      } catch (loadError) {
        if (!active) {
          return;
        }
        const message = loadError instanceof Error ? loadError.message : "Unable to load requirement.";
        setError(message);
        setChildrenError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }

      try {
        const correlationData = await fetchRequirementCorrelations(requirementId);
        if (!active) {
          return;
        }
        setCorrelations(correlationData);
        setCorrelationError(null);
      } catch (correlationLoadError) {
        if (!active) {
          return;
        }
        setCorrelationError(
          correlationLoadError instanceof Error
            ? correlationLoadError.message
            : "Unable to load requirement correlations."
        );
      }

      try {
        const linkedParameters = await fetchLinkedDesignParameters(requirementId);
        if (!active) {
          return;
        }
        setLinkedDesignParameters(linkedParameters);
        setLinkedDesignParametersError(null);
      } catch (linkedParametersErrorValue) {
        if (!active) {
          return;
        }
        setLinkedDesignParametersError(
          linkedParametersErrorValue instanceof Error
            ? linkedParametersErrorValue.message
            : "Unable to load linked design parameters."
        );
      }

      try {
        const linkedDfmeaEntries = await fetchDfmeaEntriesByRequirement(requirementId);
        if (!active) {
          return;
        }
        setDfmeaEntries(linkedDfmeaEntries);
        setDfmeaError(null);
      } catch (dfmeaLoadError) {
        if (!active) {
          return;
        }
        setDfmeaError(
          dfmeaLoadError instanceof Error ? dfmeaLoadError.message : "Unable to load linked DFMEA entries."
        );
      }

      try {
        const feasibilityAssessment = await fetchRequirementFeasibility(requirementId);
        if (!active) {
          return;
        }
        setFeasibility(feasibilityAssessment);
        setFeasibilityError(null);
      } catch (feasibilityLoadError) {
        if (!active) {
          return;
        }
        setFeasibilityError(
          feasibilityLoadError instanceof Error
            ? feasibilityLoadError.message
            : "Unable to load feasibility assessment."
        );
      }
    }

    loadRequirement();

    return () => {
      active = false;
    };
  }, [projectId, requirementId]);

  const immediateChildren = useMemo(() => {
    if (!requirement) {
      return [];
    }
    return projectRequirements
      .filter((item) => item.parent_requirement_id === requirement.id)
      .sort(compareRequirementsByHierarchy);
  }, [projectRequirements, requirement]);

  const parentRequirement = useMemo(() => {
    if (!requirement?.parent_requirement_id) {
      return null;
    }
    return projectRequirements.find((item) => item.id === requirement.parent_requirement_id) ?? null;
  }, [projectRequirements, requirement]);

  const generatedFromRequirement = useMemo(() => {
    const sourceRequirementId = requirement?.generation_metadata?.generated_from_requirement_id;
    if (!sourceRequirementId) {
      return null;
    }
    return projectRequirements.find((item) => item.id === sourceRequirementId) ?? null;
  }, [projectRequirements, requirement]);

  async function handleDelete() {
    if (!requirementId) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteRequirement(requirementId);
      navigate(routePaths.projectRequirements(projectId));
    } catch (deleteRequestError) {
      setDeleteError(deleteRequestError instanceof Error ? deleteRequestError.message : "Unable to delete requirement.");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  const contextItems = requirement
    ? [
        { label: "Requirement ID", value: getRequirementDisplayId(requirement) },
        { label: "Hierarchy", value: requirement.hierarchy || getRequirementDisplayId(requirement) },
        { label: "Type", value: requirement.type },
        { label: "Priority", value: requirement.priority },
        { label: "Updated", value: formatDateTime(requirement.updated_at) },
      ]
    : [
        { label: "Requirement ID", value: "Loading" },
        { label: "Hierarchy", value: "Loading" },
        { label: "Type", value: "Loading" },
        { label: "Priority", value: "Loading" },
        { label: "Updated", value: "Loading" },
      ];


  const readOnly = Boolean(requirement?.is_deleted);

  return (
    <ProjectWorkspaceShell
      projectId={projectId}
      activeNavKey={requirement ? getActiveNavKey(requirement.type) : "system"}
      rightPanel={<RequirementsContextPanel title="Requirement Details" items={contextItems} />}
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
          <WorkspacePageHeader
            title="Requirement Detail"
            subtitle="Review requirement content and engineering metadata before editing or deletion."
            actions={
              <>
                {requirement ? <RequirementHealthChip requirement={requirement} appearance="compact" /> : null}
              </>
            }
          />

          {!loading && !error && requirement ? (
            <WorkspaceCommandBar
              primaryAction={
                <AppCompactActionButton
                  tone="accent"
                  variant="contained"
                  startIcon={<EditOutlinedIcon />}
                  disabled={readOnly}
                  onClick={() => navigate(routePaths.projectRequirementEdit(projectId, requirementId ?? ""))}
                >
                  Edit
                </AppCompactActionButton>
              }
              menus={[
                {
                  key: "file",
                  label: "File",
                  items: [
                    {
                      label: "Back to Requirements",
                      onClick: () => navigate(routePaths.projectRequirements(projectId)),
                    },
                  ],
                },
                {
                  key: "edit",
                  label: "Edit",
                  items: [
                    {
                      label: "Improve wording",
                      onClick: () => setRewriteOpen(true),
                      disabled: readOnly,
                    },
                    {
                      label: "Open edit form",
                      onClick: () => navigate(routePaths.projectRequirementEdit(projectId, requirementId ?? "")),
                      disabled: readOnly,
                    },
                  ],
                },
                {
                  key: "tools",
                  label: "Tools",
                  items: [
                    {
                      label: "Open DFMEA",
                      onClick: () => navigate(routePaths.projectDfmea(projectId)),
                    },
                    {
                      label: "Open Traceability tab",
                      onClick: () => {
                        setActiveTab("traceability");
                        setSearchParams({ tab: "traceability" }, { replace: true });
                      },
                    },
                  ],
                },
                {
                  key: "more",
                  label: "More",
                  items: [
                    {
                      label: "Delete requirement",
                      onClick: () => setDeleteOpen(true),
                      disabled: readOnly,
                      danger: true,
                    },
                  ],
                },
              ]}
              statusContent={`${getRequirementDisplayId(requirement)} · ${requirement.type} · ${requirement.status}`}
            />
          ) : null}

          {loading ? (
            <Box sx={{ mt: 3 }}>
              <WorkspaceStatePanel
                state="loading"
                title="Loading requirement"
                message="Fetching requirement content, linked engineering data, and validation outputs."
              />
            </Box>
          ) : null}

          {error ? (
            <Box sx={{ mt: 3 }}>
              <WorkspaceStatePanel state="error" title="Unable to load requirement" message={error} />
            </Box>
          ) : null}
          {deleteError ? <Alert severity="error" sx={{ mt: 3 }}>{deleteError}</Alert> : null}

          {!loading && !error && requirement ? (
            <Stack spacing={3} sx={{ mt: 3 }}>
              {requirement.is_deleted ? (
                <Alert severity="warning">
                  This requirement was deleted by {requirement.deleted_by_username || "an unknown user"} on {formatDateTime(requirement.deleted_at)}. The record remains available for historical review and is read-only.
                </Alert>
              ) : null}

              <Stack direction="row" spacing={1.5} alignItems="center" useFlexGap flexWrap="wrap">
                <Typography
                  variant="h6"
                  fontWeight={700}
                  className="atlas-code"
                  sx={{ textDecoration: requirement.is_deleted ? "line-through" : "none", opacity: requirement.is_deleted ? 0.72 : 1 }}
                >
                  {getRequirementDisplayId(requirement)}
                </Typography>
                <Chip size="small" label={`Hierarchy ${requirement.hierarchy || getRequirementDisplayId(requirement)}`} variant="outlined" />
                <Chip
                  size="small"
                  label={getHierarchyDepth(requirement) === 0 ? "Top level" : `Level ${getHierarchyDepth(requirement) + 1}`}
                  variant="outlined"
                />
                <RequirementHealthChip requirement={requirement} />
                {requirement.generation_metadata?.is_generated_draft ? (
                  <Chip size="small" label="AI-generated draft" color="warning" variant="outlined" />
                ) : null}
                {requirement.is_deleted ? <Chip size="small" label="Deleted" color="error" variant="outlined" /> : null}
                <Chip size="small" label={requirement.type} variant="outlined" />
                <Chip size="small" label={requirement.status} color="primary" variant="outlined" />
                <Chip size="small" label={requirement.priority} variant="outlined" />
              </Stack>

              <Box sx={{ borderBottom: "1px solid rgba(15,23,42,0.12)" }}>
                <Tabs
                  value={activeTab}
                  onChange={(_, value) => {
                    setActiveTab(value);
                    setSearchParams(value === "overview" ? {} : { tab: value }, { replace: true });
                  }}
                >
                  <Tab value="overview" label="Overview" />
                  <Tab value="structured" label="Structured View" />
                  <Tab value="traceability" label="Traceability" />
                </Tabs>
              </Box>

              {activeTab === "overview" ? (
                <Stack spacing={3}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FieldBlock label="Title" value={requirement.title} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FieldBlock label="Project ID" value={requirement.project_id} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FieldBlock label="Hierarchy" value={requirement.hierarchy || getRequirementDisplayId(requirement)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FieldBlock label="Requirement ID" value={getRequirementDisplayId(requirement)} />
                    </Grid>
                    <Grid item xs={12}>
                      <FieldBlock label="Requirement Text" value={requirement.text} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FieldBlock label="Priority" value={requirement.priority} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FieldBlock label="Parent Requirement" value={parentRequirement ? getRequirementDisplayId(parentRequirement) : "None"} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <FieldBlock label="Subsystem" value={requirement.subsystem || "Unassigned"} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FieldBlock label="Verification Method" value={requirement.verification_method || "Not defined"} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FieldBlock label="Created" value={formatDateTime(requirement.created_at)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FieldBlock label="Created By" value={requirement.created_by_username || requirement.created_by_user_id} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FieldBlock label="Last Edited By" value={requirement.updated_by_username || requirement.updated_by_user_id || "Not recorded"} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FieldBlock label="Last Updated" value={formatDateTime(requirement.updated_at)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FieldBlock label="Deleted By" value={requirement.deleted_by_username || requirement.deleted_by_user_id || "Not deleted"} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FieldBlock label="Deleted At" value={formatDateTime(requirement.deleted_at)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FieldBlock
                        label="Generation Source"
                        value={
                          requirement.generation_metadata
                            ? `${requirement.generation_metadata.generation_source}${
                                requirement.generation_metadata.generation_provider
                                  ? ` via ${requirement.generation_metadata.generation_provider}`
                                  : ""
                              }`
                            : "manual"
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FieldBlock
                        label="Generated From Requirement"
                        value={generatedFromRequirement ? getRequirementDisplayId(generatedFromRequirement) : "None"}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FieldBlock label="Rationale" value={requirement.rationale || "None provided"} />
                    </Grid>
                    <Grid item xs={12}>
                      <FieldBlock label="Assumptions" value={requirement.assumptions || "None provided"} />
                    </Grid>
                  </Grid>
                  <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(15,23,42,0.10)", bgcolor: "#f8fafc" }}>
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                        Immediate Children
                      </Typography>
                      {childrenError ? <Alert severity="error">{childrenError}</Alert> : null}
                      {immediateChildren.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No immediate child requirements are linked to this requirement yet.
                        </Typography>
                      ) : (
                        immediateChildren.map((child) => (
                          <Paper
                            key={child.id}
                            elevation={0}
                            sx={{
                              p: 1.5,
                              border: "1px solid rgba(15,23,42,0.08)",
                              bgcolor: child.is_deleted ? "rgba(248,113,113,0.05)" : "#ffffff",
                              cursor: "pointer",
                              opacity: child.is_deleted ? 0.66 : 1,
                            }}
                            onClick={() => navigate(routePaths.projectRequirementDetail(projectId, child.id))}
                          >
                            <Stack direction="row" spacing={1.25} justifyContent="space-between" alignItems="center">
                              <Box sx={{ minWidth: 0 }}>
                                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                                  <Typography fontWeight={700}>{getRequirementHierarchy(child)}</Typography>
                                  <Chip size="small" label={getRequirementDisplayId(child)} variant="outlined" />
                                  <Chip size="small" label={child.type} variant="outlined" />
                                  {child.is_deleted ? <Chip size="small" label="Deleted" color="error" variant="outlined" /> : null}
                                </Stack>
                                <Typography fontWeight={600} sx={{ mt: 0.75, textDecoration: child.is_deleted ? "line-through" : "none" }}>
                                  {child.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap sx={{ textDecoration: child.is_deleted ? "line-through" : "none" }}>
                                  {child.text}
                                </Typography>
                              </Box>
                              <AppCompactActionButton endIcon={<ArrowBackOutlinedIcon sx={{ transform: "rotate(180deg)" }} />}>
                                Open
                              </AppCompactActionButton>
                            </Stack>
                          </Paper>
                        ))
                      )}
                    </Stack>
                  </Paper>
                  <Stack spacing={3}>
                    <RequirementFeasibilityCard assessment={feasibility} error={feasibilityError} />
                    <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(15,23,42,0.10)", bgcolor: "#f8fafc" }}>
                      <Stack spacing={1.5}>
                        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.5} alignItems={{ md: "center" }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
                              Linked DFMEA Entries
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Risk records linked directly to this requirement.
                            </Typography>
                          </Box>
                          <AppCompactActionButton onClick={() => navigate(routePaths.projectDfmea(projectId))}>
                            Open DFMEA
                          </AppCompactActionButton>
                        </Stack>
                        {dfmeaError ? <Alert severity="error">{dfmeaError}</Alert> : null}
                        {dfmeaEntries.length === 0 ? (
                          <Typography variant="body2" color="text.secondary">
                            No DFMEA entries are linked to this requirement yet.
                          </Typography>
                        ) : (
                          dfmeaEntries.map((entry) => (
                            <Paper key={entry.id} elevation={0} sx={{ p: 1.5, border: "1px solid rgba(15,23,42,0.08)", bgcolor: "#ffffff" }}>
                              <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} justifyContent="space-between" alignItems={{ lg: "center" }}>
                                <Box sx={{ minWidth: 0 }}>
                                  <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                                    <Typography fontWeight={700}>{entry.failure_mode}</Typography>
                                    <Chip size="small" label={`RPN ${entry.rpn}`} color={entry.rpn >= 120 ? "error" : "default"} />
                                    <Chip size="small" label={entry.status} variant="outlined" />
                                  </Stack>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Effect: {entry.failure_effect}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    Cause: {entry.potential_cause}
                                  </Typography>
                                </Box>
                                <AppCompactActionButton onClick={() => navigate(routePaths.projectDfmea(projectId))}>
                                  Review in DFMEA
                                </AppCompactActionButton>
                              </Stack>
                            </Paper>
                          ))
                        )}
                      </Stack>
                    </Paper>
                    {linkedDesignParametersError ? <Alert severity="error">{linkedDesignParametersError}</Alert> : null}
                    <LinkedDesignParametersSection parameters={linkedDesignParameters} />
                    {correlationError ? <Alert severity="error">{correlationError}</Alert> : null}
                    <RequirementCorrelationSection
                      title="Related Requirements"
                      emptyMessage="No related requirements were identified from the current deterministic signals."
                      tone="related"
                      items={correlations.related_requirements}
                    />
                    <RequirementCorrelationSection
                      title="Potential Conflicts"
                      emptyMessage="No obvious contradictions or incompatible constraints were detected."
                      tone="conflict"
                      items={correlations.potential_conflicts}
                    />
                  </Stack>
                </Stack>
              ) : activeTab === "structured" ? (
                <StructuredRequirementView parsedRequirement={requirement.parsed_requirement} />
              ) : (
                <RequirementTraceabilityView
                  requirement={requirement}
                  qualitySummary={qualitySummary}
                  qualityError={qualityError}
                  correlations={correlations}
                  correlationError={correlationError}
                  linkedDesignParameters={linkedDesignParameters}
                  linkedDesignParametersError={linkedDesignParametersError}
                  feasibility={feasibility}
                  feasibilityError={feasibilityError}
                />
              )}
            </Stack>
          ) : null}
        </Paper>
      </Box>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete requirement</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will mark the selected requirement as deleted and keep it available for historical review. Continue?
          </DialogContentText>
        </DialogContent>
      <DialogActions>
        <AppButton hierarchy="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>
          Cancel
        </AppButton>
        <AppButton hierarchy="danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete"}
        </AppButton>
      </DialogActions>
      </Dialog>

      {requirement ? (
        <RequirementRewriteDialog
          open={rewriteOpen}
          projectId={projectId}
          requirementId={requirement.id}
          requirementCode={requirement.requirement_code}
          title={requirement.title}
          text={requirement.text}
          type={requirement.type}
          onClose={() => setRewriteOpen(false)}
          onApply={(suggestion) => {
            setRewriteOpen(false);
            navigate(routePaths.projectRequirementEdit(projectId, requirement.id), {
              state: {
                rewriteSuggestion: {
                  title: suggestion.title,
                  text: suggestion.text,
                  rationale: suggestion.rationale,
                },
              },
            });
          }}
        />
      ) : null}
    </ProjectWorkspaceShell>
  );
}
