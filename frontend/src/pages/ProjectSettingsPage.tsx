import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppButton from "../components/common/AppButton";
import WorkspaceStatePanel from "../components/common/WorkspaceStatePanel";
import ProjectWorkspaceShell from "../components/layout/ProjectWorkspaceShell";
import RequirementsContextPanel from "../components/requirements/RequirementsContextPanel";
import { useAuth } from "../context/AuthContext";
import { routePaths } from "../routes/routePaths";
import {
  deleteProject,
  fetchProject,
  type ProjectRecord,
  updateProject,
  type ProjectUpdateInput,
} from "../services/projectsApi";

type ProjectSettingsFormState = {
  name: string;
  description: string;
  status: ProjectRecord["status"];
};

type ReadOnlyMetadataFieldProps = {
  label: string;
  value: string;
  helperText?: string;
};

function toFormState(project: ProjectRecord): ProjectSettingsFormState {
  return {
    name: project.name,
    description: project.description ?? "",
    status: project.status,
  };
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

function ReadOnlyMetadataField({ label, value, helperText }: ReadOnlyMetadataFieldProps) {
  return <TextField fullWidth label={label} value={value} InputProps={{ readOnly: true }} helperText={helperText} />;
}

export default function ProjectSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? "";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [formValues, setFormValues] = useState<ProjectSettingsFormState>({
    name: "",
    description: "",
    status: "Draft",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProject() {
      if (!projectId) {
        setError("Project context is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetchProject(projectId);
        if (!active) {
          return;
        }
        setProject(response);
        setFormValues(toFormState(response));
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load project settings.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadProject();
    return () => {
      active = false;
    };
  }, [projectId]);

  const isDirty = useMemo(() => {
    if (!project) {
      return false;
    }
    return (
      formValues.name !== project.name ||
      formValues.description !== (project.description ?? "") ||
      formValues.status !== project.status
    );
  }, [formValues, project]);

  const contextItems = project
    ? [
        { label: "Project ID", value: project.id },
        { label: "Status", value: project.status },
        { label: "Created", value: formatTimestamp(project.created_at) },
        { label: "Updated", value: formatTimestamp(project.updated_at) },
        { label: "Owner", value: user?.display_name ?? user?.username ?? "Signed-in user" },
      ]
    : [
        { label: "Project ID", value: projectId || "Unknown" },
        { label: "Status", value: "Loading" },
        { label: "Created", value: "Loading" },
        { label: "Updated", value: "Loading" },
        { label: "Owner", value: user?.display_name ?? user?.username ?? "Signed-in user" },
      ];

  function handleChange<K extends keyof ProjectSettingsFormState>(field: K, value: ProjectSettingsFormState[K]) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleReset() {
    if (!project) {
      return;
    }
    setFormValues(toFormState(project));
    setSaveError(null);
    setSaveMessage(null);
  }

  async function handleSave() {
    if (!project) {
      return;
    }

    if (formValues.name.trim().length < 2) {
      setSaveError("Project name must be at least 2 characters.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSaveMessage(null);

    try {
      const payload: ProjectUpdateInput = {
        name: formValues.name.trim(),
        description: formValues.description.trim() || null,
        status: formValues.status,
        project_kind: project.project_kind,
      };
      const updated = await updateProject(project.id, payload);
      setProject(updated);
      setFormValues(toFormState(updated));
      setSaveMessage("Project settings saved.");
    } catch (updateError) {
      setSaveError(updateError instanceof Error ? updateError.message : "Unable to save project settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!project) {
      return;
    }

    setDeleting(true);
    setSaveError(null);
    try {
      await deleteProject(project.id);
      navigate(routePaths.landing);
    } catch (deleteError) {
      setSaveError(deleteError instanceof Error ? deleteError.message : "Unable to delete project.");
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <ProjectWorkspaceShell
      projectId={projectId}
      activeNavKey="overview"
      rightPanel={<RequirementsContextPanel title="Project Settings" items={contextItems} />}
      projectOverride={project}
    >
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" fontWeight={700} color="#0f172a">
              Project Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75, maxWidth: 920 }}>
              Project metadata, timestamps, identifier details, and destructive actions live here so the main workspace
              header can stay focused and uncluttered.
            </Typography>
          </Box>

          {saveMessage ? <Alert severity="success">{saveMessage}</Alert> : null}
          {saveError ? <Alert severity="error">{saveError}</Alert> : null}

          {loading ? (
            <WorkspaceStatePanel
              state="loading"
              title="Loading project settings"
              message="Fetching current project metadata and ownership context."
            />
          ) : null}

          {error ? <WorkspaceStatePanel state="error" title="Unable to load project settings" message={error} /> : null}

          {!loading && !error && project ? (
            <Stack spacing={3}>
              <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(15,23,42,0.10)", borderRadius: 0 }}>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                      General
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Update the safe project metadata used throughout the workspace.
                    </Typography>
                  </Box>

                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Project Name"
                      value={formValues.name}
                      onChange={(event) => handleChange("name", event.target.value)}
                    />
                    <TextField
                      fullWidth
                      label="Description"
                      multiline
                      minRows={4}
                      value={formValues.description}
                      onChange={(event) => handleChange("description", event.target.value)}
                    />
                    <TextField
                      select
                      fullWidth
                      label="Status"
                      value={formValues.status}
                      onChange={(event) =>
                        handleChange("status", event.target.value as ProjectSettingsFormState["status"])
                      }
                    >
                      <option value="Draft">Draft</option>
                      <option value="In Review">In Review</option>
                      <option value="Active">Active</option>
                      <option value="Archived">Archived</option>
                    </TextField>
                  </Stack>

                  <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                    <AppButton hierarchy="secondary" onClick={handleReset} disabled={!isDirty || saving}>
                      Reset
                    </AppButton>
                    <AppButton
                      hierarchy="primary"
                      startIcon={<SaveOutlinedIcon />}
                      onClick={handleSave}
                      disabled={!isDirty || saving}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </AppButton>
                  </Stack>
                </Stack>
              </Paper>

              <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(15,23,42,0.10)", borderRadius: 0 }}>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="#0f172a">
                      Project Metadata
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Secondary identifiers and workspace information live here instead of the main project header.
                    </Typography>
                  </Box>

                  <Stack spacing={2}>
                    <ReadOnlyMetadataField
                      label="Project Slug / Identifier"
                      value={project.id}
                      helperText="Read-only for now. Changing project identifiers safely would require coordinated route and data migration."
                    />
                    <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                      <ReadOnlyMetadataField label="Created At" value={formatTimestamp(project.created_at)} />
                      <ReadOnlyMetadataField label="Last Updated At" value={formatTimestamp(project.updated_at)} />
                    </Stack>
                    <ReadOnlyMetadataField
                      label="Owner"
                      value={user?.display_name ?? user?.username ?? "Signed-in user"}
                    />
                    <ReadOnlyMetadataField
                      label="Workspace Configuration"
                      value="View-specific filters and workspace controls are managed within each project page."
                    />
                  </Stack>
                </Stack>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  border: "1px solid rgba(239,68,68,0.28)",
                  borderRadius: 0,
                  bgcolor: "rgba(254,242,242,0.8)",
                }}
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={700} color="#7f1d1d">
                      Danger Zone
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      Deleting a project removes the project and its project-scoped saved data. This action requires confirmation.
                    </Typography>
                  </Box>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between" alignItems={{ md: "center" }}>
                    <Box>
                      <Typography fontWeight={700} color="#0f172a">
                        Delete Project
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Requirements, design parameters, snapshots, and project-specific counters will be removed for this project.
                      </Typography>
                    </Box>
                    <AppButton
                      hierarchy="danger"
                      startIcon={<DeleteOutlineOutlinedIcon />}
                      onClick={() => setDeleteOpen(true)}
                    >
                      Delete Project
                    </AppButton>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          ) : null}
        </Stack>
      </Box>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete project</DialogTitle>
        <DialogContent>
        <DialogContentText>
          This will permanently remove the project and its project-scoped saved data. Continue only if you are certain.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <AppButton hierarchy="secondary" onClick={() => setDeleteOpen(false)} disabled={deleting}>
          Cancel
        </AppButton>
        <AppButton hierarchy="danger" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete Project"}
        </AppButton>
      </DialogActions>
    </Dialog>
  </ProjectWorkspaceShell>
  );
}
