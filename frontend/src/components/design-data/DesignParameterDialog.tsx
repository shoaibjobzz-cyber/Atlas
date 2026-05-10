import {
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Checkbox,
  ListItemText,
} from "@mui/material";
import AppButton from "../common/AppButton";
import type { Requirement } from "../../types/requirements";
import type { DesignParameterFormErrors, DesignParameterFormValues } from "../../types/designParameters";

type DesignParameterDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  values: DesignParameterFormValues;
  errors: DesignParameterFormErrors;
  requirements: Requirement[];
  saving: boolean;
  submitError: string | null;
  onChange: <K extends keyof DesignParameterFormValues>(field: K, value: DesignParameterFormValues[K]) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function DesignParameterDialog({
  open,
  mode,
  values,
  errors,
  requirements,
  saving,
  submitError,
  onChange,
  onClose,
  onSave,
}: DesignParameterDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{mode === "create" ? "Create Design Parameter" : "Edit Design Parameter"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {submitError ? <Alert severity="error">{submitError}</Alert> : null}

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="ID"
                value={values.id}
                disabled={mode === "edit"}
                error={Boolean(errors.id)}
                helperText={errors.id}
                onChange={(event) => onChange("id", event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Name"
                value={values.name}
                error={Boolean(errors.name)}
                helperText={errors.name}
                onChange={(event) => onChange("name", event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Subsystem"
                value={values.subsystem ?? ""}
                onChange={(event) => onChange("subsystem", event.target.value || null)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Parameter Name"
                value={values.parameter_name}
                error={Boolean(errors.parameter_name)}
                helperText={errors.parameter_name}
                onChange={(event) => onChange("parameter_name", event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Value"
                value={values.value}
                error={Boolean(errors.value)}
                helperText={errors.value}
                onChange={(event) => onChange("value", event.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Unit"
                value={values.unit ?? ""}
                onChange={(event) => onChange("unit", event.target.value || null)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Source Document"
                value={values.source_document ?? ""}
                onChange={(event) => onChange("source_document", event.target.value || null)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Revision"
                value={values.revision ?? ""}
                onChange={(event) => onChange("revision", event.target.value || null)}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                Linked Requirements
              </Typography>
              <Select
                fullWidth
                multiple
                value={values.requirement_ids}
                onChange={(event) => onChange("requirement_ids", event.target.value as string[])}
                renderValue={(selected) => (selected as string[]).join(", ")}
              >
                {requirements.map((requirement) => (
                  <MenuItem key={requirement.id} value={requirement.id}>
                    <Checkbox checked={values.requirement_ids.includes(requirement.id)} />
                    <ListItemText primary={`${requirement.requirement_code} - ${requirement.title}`} secondary={requirement.type} />
                  </MenuItem>
                ))}
              </Select>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                minRows={3}
                value={values.notes ?? ""}
                onChange={(event) => onChange("notes", event.target.value || null)}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <AppButton hierarchy="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </AppButton>
        <AppButton hierarchy="primary" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : mode === "create" ? "Create" : "Save"}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}
