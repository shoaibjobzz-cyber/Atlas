import { useState } from "react";
import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AppButton from "../common/AppButton";
import { createProject } from "../../services/projectsApi";
import type { ProjectRecord } from "../../types/projects";

type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (project: ProjectRecord) => void;
};

export default function CreateProjectModal({ open, onClose, onCreated }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectKind, setProjectKind] = useState<"Standard" | "Platform">("Standard");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function handleClose() {
    setProjectName("");
    setProjectDescription("");
    setProjectKind("Standard");
    setSubmitError(null);
    setSubmitting(false);
    onClose();
  }

  async function handleCreate() {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const project = await createProject({
        name: projectName.trim(),
        description: projectDescription.trim() || null,
        status: "Draft",
        project_kind: projectKind,
      });
      handleClose();
      onCreated(project);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create project.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Create New Project</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Create a persisted engineering project record for requirement authoring, design data, and traceability work.
          </Typography>
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}
          <TextField
            select
            label="Project Type"
            value={projectKind}
            onChange={(event) => setProjectKind(event.target.value as "Standard" | "Platform")}
            fullWidth
            disabled={submitting}
          >
            <MenuItem value="Standard">Standard Project</MenuItem>
            <MenuItem value="Platform">Platform Project</MenuItem>
          </TextField>
          <TextField
            label="Project Name"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            fullWidth
            disabled={submitting}
          />
          <TextField
            label="Description"
            value={projectDescription}
            onChange={(event) => setProjectDescription(event.target.value)}
            multiline
            minRows={3}
            fullWidth
            disabled={submitting}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <AppButton hierarchy="secondary" onClick={handleClose} disabled={submitting}>Cancel</AppButton>
        <AppButton hierarchy="primary" onClick={handleCreate} disabled={projectName.trim().length < 2 || submitting}>
          {submitting ? "Creating..." : "Create Project"}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}
