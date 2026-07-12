import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import { Alert, Box, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AppCompactActionButton from "../components/common/AppCompactActionButton";
import WorkspaceCommandBar from "../components/common/WorkspaceCommandBar";
import WorkspacePageHeader from "../components/common/WorkspacePageHeader";
import WorkspaceStatePanel from "../components/common/WorkspaceStatePanel";
import ProjectWorkspaceShell from "../components/layout/ProjectWorkspaceShell";
import RequirementEditorForm from "../components/requirements/RequirementEditorForm";
import RequirementHealthChip from "../components/requirements/RequirementHealthChip";
import RequirementIncoseReviewPanel from "../components/requirements/RequirementIncoseReviewPanel";
import RequirementQualityPanel from "../components/requirements/RequirementQualityPanel";
import RequirementRewriteDialog from "../components/requirements/RequirementRewriteDialog";
import RequirementsContextPanel from "../components/requirements/RequirementsContextPanel";
import { routePaths } from "../routes/routePaths";
import {
  fetchProject,
  fetchProjectFeatures,
  type ProjectFeatureRecord,
} from "../services/projectsApi";
import { checkRequirementQuality } from "../services/qualityApi";
import {
  createRequirement,
  fetchRequirementIdPreview,
  fetchRequirement,
  fetchRequirements,
  updateRequirement,
} from "../services/requirementsApi";
import type {
  Requirement,
  RequirementFormErrors,
  RequirementFormValues,
  RequirementQualitySummary,
  RequirementType,
} from "../types/requirements";
import { requirementTypeOptions } from "../types/requirements";
import type { DashboardNavKey } from "../types/dashboard";

function resolveContextualRequirementType(search: string): RequirementType | null {
  const requestedType = new URLSearchParams(search).get("type");
  if (!requestedType) {
    return null;
  }

  return requirementTypeOptions.includes(requestedType as RequirementType)
    ? (requestedType as RequirementType)
    : null;
}

const defaultFormValues = (projectId: string, defaultType: RequirementType = "System"): RequirementFormValues => ({
  id: "",
  project_id: projectId,
  title: "",
  text: "",
  type: defaultType,
  priority: "Medium",
  status: "Draft",
  parent_requirement_id: null,
  feature_id: null,
  subsystem: null,
  verification_method: null,
  rationale: null,
  assumptions: null,
});

function validateRequirement(values: RequirementFormValues): RequirementFormErrors {
  const errors: RequirementFormErrors = {};

  if (values.title.trim().length < 3) {
    errors.title = "Title must be at least 3 characters.";
  }

  if (values.text.trim().length < 10) {
    errors.text = "Requirement text must be at least 10 characters.";
  }

  return errors;
}

function getActiveNavKey(type: RequirementFormValues["type"]): DashboardNavKey {
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

export default function RequirementFormPage() {
  const { id, requirementId } = useParams<{ id: string; requirementId: string }>();
  const projectId = id ?? "";
  const mode = requirementId ? "edit" : "create";
  const navigate = useNavigate();
  const location = useLocation();
  const contextualType = resolveContextualRequirementType(location.search);
  const selectedFeatureId = useMemo(() => new URLSearchParams(location.search).get("featureId"), [location.search]);

  const [values, setValues] = useState<RequirementFormValues>(() =>
    defaultFormValues(projectId, contextualType ?? "System")
  );
  const [errors, setErrors] = useState<RequirementFormErrors>({});
  const [parentOptions, setParentOptions] = useState<Requirement[]>([]);
  const [loadedRequirement, setLoadedRequirement] = useState<Requirement | null>(null);
  const [featureOptions, setFeatureOptions] = useState<ProjectFeatureRecord[]>([]);
  const [isPlatformProject, setIsPlatformProject] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [qualitySummary, setQualitySummary] = useState<RequirementQualitySummary>({
    score: 100,
    warnings: [],
    issues: [],
    suggested_rewrite: null,
    explanation: null,
  });
  const [qualityLoading, setQualityLoading] = useState(false);
  const [qualityError, setQualityError] = useState<string | null>(null);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [rewriteMessage, setRewriteMessage] = useState<string | null>(null);
  const [incoseSuggestionIgnored, setIncoseSuggestionIgnored] = useState(false);
  const [idPreviewLoading, setIdPreviewLoading] = useState(mode === "create");
  const [idPreviewHelperText, setIdPreviewHelperText] = useState("Auto-generated based on requirement type");

  useEffect(() => {
    setValues((current) => ({
      ...current,
      project_id: projectId,
      feature_id: mode === "create" ? selectedFeatureId : current.feature_id,
    }));
  }, [mode, projectId, selectedFeatureId]);

  useEffect(() => {
    if (mode !== "create") {
      return;
    }

    setValues((current) => ({
      ...current,
      project_id: projectId,
      type: contextualType ?? "System",
      feature_id: selectedFeatureId,
    }));
  }, [contextualType, mode, projectId, selectedFeatureId]);

  useEffect(() => {
    const rewriteSuggestion = (location.state as { rewriteSuggestion?: { title: string; text: string; rationale: string } } | null)
      ?.rewriteSuggestion;
    if (!rewriteSuggestion) {
      return;
    }

    setValues((current) => ({
      ...current,
      title: rewriteSuggestion.title,
      text: rewriteSuggestion.text,
    }));
    setRewriteMessage("Rewrite suggestion loaded into the editor. Review and save changes to apply it.");
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      if (!projectId) {
        setError("Project context is missing.");
        setLoading(false);
        return;
      }

      try {
        const [projectResponse, requirementsResponse, requirementResponse] = await Promise.all([
          fetchProject(projectId),
          fetchRequirements(projectId),
          mode === "edit" && requirementId ? fetchRequirement(requirementId) : Promise.resolve(null),
        ]);

        if (!active) {
          return;
        }

        setIsPlatformProject(projectResponse.project_kind === "Platform");
        if (projectResponse.project_kind === "Platform") {
          const featuresResponse = await fetchProjectFeatures(projectId);
          if (!active) {
            return;
          }
          setFeatureOptions(featuresResponse);
        } else {
          setFeatureOptions([]);
        }
        setParentOptions(requirementsResponse);
        setLoadedRequirement(requirementResponse);

        if (requirementResponse) {
          setValues({
            id: requirementResponse.requirement_code,
            project_id: requirementResponse.project_id,
            title: requirementResponse.title,
            text: requirementResponse.text,
            type: requirementResponse.type,
            priority: requirementResponse.priority,
            status: requirementResponse.status,
            parent_requirement_id: requirementResponse.parent_requirement_id,
            feature_id: requirementResponse.feature_id ?? null,
            subsystem: requirementResponse.subsystem,
            verification_method: requirementResponse.verification_method,
            rationale: requirementResponse.rationale,
            assumptions: requirementResponse.assumptions,
          });
        }

        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load requirement form data.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [mode, projectId, requirementId]);

  useEffect(() => {
    if (mode !== "create" || !projectId) {
      setIdPreviewLoading(false);
      setIdPreviewHelperText("Auto-generated based on requirement type");
      return;
    }

    let active = true;
    setIdPreviewLoading(true);
    setIdPreviewHelperText("Auto-generated based on requirement type");

    void fetchRequirementIdPreview(projectId, values.type)
      .then((preview) => {
        if (!active) {
          return;
        }
        setValues((current) => ({
          ...current,
          id: preview.preview_id,
        }));
        setIdPreviewHelperText("Auto-generated based on requirement type");
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setValues((current) => ({
          ...current,
          id: "",
        }));
        setIdPreviewHelperText("ID will update on save");
      })
      .finally(() => {
        if (active) {
          setIdPreviewLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [mode, projectId, values.type]);

  useEffect(() => {
    if (!values.title.trim() && !values.text.trim()) {
      setQualitySummary({ score: 100, warnings: [], issues: [], suggested_rewrite: null, explanation: null });
      setQualityError(null);
      setQualityLoading(false);
      setIncoseSuggestionIgnored(false);
      return;
    }

    let active = true;
    setQualityLoading(true);
    setIncoseSuggestionIgnored(false);

    const timeoutId = window.setTimeout(async () => {
      try {
        const summary = await checkRequirementQuality({
          title: values.title,
          text: values.text,
          type: values.type,
        });
        if (!active) {
          return;
        }
        setQualitySummary(summary);
        setQualityError(null);
      } catch (qualityRequestError) {
        if (!active) {
          return;
        }
        setQualityError(
          qualityRequestError instanceof Error
            ? qualityRequestError.message
            : "Unable to run the quality checker."
        );
      } finally {
        if (active) {
          setQualityLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [values.text, values.title, values.type]);

  function focusRequirementTextEditor() {
    window.requestAnimationFrame(() => {
      const element = document.getElementById("requirement-text-input");
      if (element instanceof HTMLElement) {
        element.focus();
      }
    });
  }

  function handleChange<K extends keyof RequirementFormValues>(field: K, value: RequirementFormValues[K]) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  async function handleSubmit() {
    if (mode === "edit" && loadedRequirement?.is_deleted) {
      setSubmitError("Deleted requirements are read-only and cannot be modified.");
      return;
    }

    const validationErrors = validateRequirement(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      if (mode === "create") {
        const { id: omittedId, ...payload } = values;
        void omittedId;
        const createdRequirement = await createRequirement(payload);
        navigate({
          pathname: routePaths.projectRequirementDetail(projectId, createdRequirement.id),
          search: location.search,
        });
      } else if (requirementId) {
        const { id: omittedId, ...payload } = values;
        void omittedId;
        await updateRequirement(requirementId, payload);
        navigate({
          pathname: routePaths.projectRequirementDetail(projectId, requirementId),
          search: location.search,
        });
      }
    } catch (submitRequestError) {
      setSubmitError(
        submitRequestError instanceof Error ? submitRequestError.message : "Unable to save the requirement."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const contextItems = useMemo(
    () => [
      { label: "Mode", value: mode === "create" ? "Create" : loadedRequirement?.is_deleted ? "Read-only" : "Edit" },
      { label: "Project ID", value: projectId || "Unknown" },
      { label: "Parent options", value: String(parentOptions.length) },
      { label: "Current type", value: values.type },
      { label: "Feature context", value: values.feature_id ?? "All platform features" },
    ],
    [loadedRequirement?.is_deleted, mode, parentOptions.length, projectId, values.feature_id, values.type]
  );

  const isReadOnly = mode === "edit" && Boolean(loadedRequirement?.is_deleted);
  const reviewSidebarContent = (
    <Stack spacing={2}>
      <RequirementsContextPanel title="Requirement Editor" items={contextItems} embedded />
      <RequirementIncoseReviewPanel
        summary={qualitySummary}
        loading={qualityLoading}
        error={qualityError}
        suggestionIgnored={incoseSuggestionIgnored}
        onAcceptSuggestion={() => {
          const suggestion = qualitySummary.suggested_rewrite;
          if (!suggestion) {
            return;
          }
          setValues((current) => ({
            ...current,
            title: suggestion.title || current.title,
            text: suggestion.text,
          }));
          setRewriteMessage("INCOSE rewrite suggestion applied to the editor. Save changes to persist it.");
          setIncoseSuggestionIgnored(false);
        }}
        onEditManually={() => {
          setIncoseSuggestionIgnored(false);
          focusRequirementTextEditor();
        }}
        onIgnoreSuggestion={() => setIncoseSuggestionIgnored(true)}
      />
      <RequirementQualityPanel summary={qualitySummary} loading={qualityLoading} error={qualityError} />
    </Stack>
  );

  return (
    <ProjectWorkspaceShell
      projectId={projectId}
      activeNavKey={getActiveNavKey(values.type)}
      rightPanel={
        <Box
          sx={{
            width: 320,
            minWidth: 320,
            flexShrink: 0,
            minHeight: 0,
            borderLeft: "1px solid rgba(15,23,42,0.10)",
            bgcolor: "#f8fafc",
            p: 3,
            display: { xs: "none", xl: "block" },
            overflowX: "hidden",
            overflowY: "auto",
          }}
        >
          {reviewSidebarContent}
        </Box>
      }
    >
      <Box sx={{ height: "100%", p: { xs: 0, md: 0 } }}>
        <Stack spacing={0} sx={{ minHeight: "100%" }}>
          <WorkspacePageHeader
            title={mode === "create" ? "Requirement Authoring" : isReadOnly ? "Requirement History" : "Requirement Update"}
            subtitle="Use the structured editor to maintain requirement content, ownership, and verification context."
            actions={
              <>
                <RequirementHealthChip requirement={{ status: values.status, priority: values.priority }} appearance="compact" />
              </>
            }
          />

          {!loading && !error ? (
            <WorkspaceCommandBar
              primaryAction={
                <AppCompactActionButton
                  tone="accent"
                  variant="contained"
                  startIcon={<AutoAwesomeOutlinedIcon />}
                  onClick={() => setRewriteOpen(true)}
                  disabled={Boolean(error) || isReadOnly}
                >
                  Improve
                </AppCompactActionButton>
              }
              menus={[
                {
                  key: "file",
                  label: "File",
                  items: [
                    {
                      label: mode === "edit" && requirementId ? "Back to Requirement" : "Back to Requirements",
                      onClick: () =>
                        navigate({
                          pathname:
                            mode === "edit" && requirementId
                              ? routePaths.projectRequirementDetail(projectId, requirementId)
                              : routePaths.projectRequirements(projectId),
                          search: location.search,
                        }),
                    },
                    {
                      label: mode === "create" ? "Create Requirement" : "Save Changes",
                      onClick: () => void handleSubmit(),
                      disabled: submitting || isReadOnly,
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
                      disabled: isReadOnly,
                    },
                    {
                      label: "Focus requirement text",
                      onClick: focusRequirementTextEditor,
                    },
                  ],
                },
                {
                  key: "view",
                  label: "View",
                  items: [
                    { label: "Show INCOSE review", onClick: () => focusRequirementTextEditor() },
                    { label: "Show quality check", onClick: () => focusRequirementTextEditor() },
                  ],
                },
              ]}
              statusContent={`${mode === "create" ? "Drafting" : isReadOnly ? "History" : "Editing"} · ${values.type} · ${values.status}`}
            />
          ) : null}

          {rewriteMessage ? (
            <Box sx={{ px: { xs: 2, md: 3 }, py: 1 }}>
              <Alert severity="success" onClose={() => setRewriteMessage(null)}>
                {rewriteMessage}
              </Alert>
            </Box>
          ) : null}

          {isReadOnly ? (
            <Box sx={{ px: { xs: 2, md: 3 }, py: 1 }}>
              <Alert severity="warning">
                This requirement has been soft-deleted. You can review its historical content here, but saving changes is disabled.
              </Alert>
            </Box>
          ) : null}

          {loading ? (
            <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
              <WorkspaceStatePanel
                state="loading"
                title="Loading editor"
                message="Preparing the requirement form, parent options, and validation context."
              />
            </Box>
          ) : null}

          {error ? (
            <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
              <WorkspaceStatePanel state="error" title="Unable to load editor" message={error} />
            </Box>
          ) : null}

          {!loading && !error ? (
            <Box sx={{ px: { xs: 2, md: 3 }, py: 2, display: { xs: "block", xl: "none" } }}>
              {reviewSidebarContent}
            </Box>
          ) : null}

          {!loading && !error ? (
            <RequirementEditorForm
              mode={mode}
              values={values}
              errors={errors}
              parentOptions={parentOptions}
              featureOptions={featureOptions}
              showFeatureField={isPlatformProject}
              currentRequirementId={loadedRequirement?.id ?? null}
              idPreviewLoading={idPreviewLoading}
              idPreviewHelperText={idPreviewHelperText}
              readOnly={isReadOnly}
              submitting={submitting}
              submitError={submitError}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onCancel={() =>
                navigate({
                  pathname:
                    mode === "edit" && requirementId
                      ? routePaths.projectRequirementDetail(projectId, requirementId)
                      : routePaths.projectRequirements(projectId),
                  search: location.search,
                })
              }
            />
          ) : null}
        </Stack>
      </Box>

      <RequirementRewriteDialog
        open={rewriteOpen}
        projectId={projectId}
        requirementId={requirementId ?? null}
        requirementCode={mode === "edit" ? loadedRequirement?.requirement_code ?? null : values.id || null}
        title={values.title}
        text={values.text}
        type={values.type}
        onClose={() => setRewriteOpen(false)}
        onApply={(suggestion) => {
          setValues((current) => ({
            ...current,
            title: suggestion.title,
            text: suggestion.text,
          }));
          setRewriteMessage("Rewrite suggestion applied to the editor. Save changes to persist it.");
          setRewriteOpen(false);
        }}
      />
    </ProjectWorkspaceShell>
  );
}
