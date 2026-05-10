import {
  Alert,
  Autocomplete,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
} from "@mui/material";
import AppButton from "../common/AppButton";
import { dfmeaStatusOptions } from "../../types/dfmea";
import type { DfmeaEntryFormErrors, DfmeaEntryFormValues } from "../../types/dfmea";
import type { Requirement } from "../../types/requirements";

type DfmeaEntryDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  values: DfmeaEntryFormValues;
  errors: DfmeaEntryFormErrors;
  requirements: Requirement[];
  saving: boolean;
  submitError: string | null;
  onChange: <K extends keyof DfmeaEntryFormValues>(field: K, value: DfmeaEntryFormValues[K]) => void;
  onClose: () => void;
  onSave: () => void;
};

export default function DfmeaEntryDialog({
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
}: DfmeaEntryDialogProps) {
  const rpn = values.severity * values.occurrence * values.detection;
  const selectedRequirement =
    requirements.find((requirement) => requirement.id === values.requirement_id) ?? null;

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        {mode === "create" ? "Create DFMEA From Requirement" : "Edit DFMEA Entry"}
      </DialogTitle>
      <DialogContent dividers>
        {submitError ? <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert> : null}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              fullWidth
              options={requirements}
              value={selectedRequirement}
              getOptionLabel={(requirement) =>
                `${requirement.requirement_code} - ${requirement.title}`
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, requirement) => onChange("requirement_id", requirement?.id ?? "")}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Linked Requirement"
                  error={Boolean(errors.requirement_id)}
                  helperText={
                    errors.requirement_id ??
                    "Search by requirement code or title to anchor this DFMEA entry."
                  }
                />
              )}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Owner"
              value={values.owner ?? ""}
              onChange={(event) => onChange("owner", event.target.value || null)}
              helperText="Engineer or team responsible for the action."
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Function"
              multiline
              minRows={2}
              value={values.function}
              onChange={(event) => onChange("function", event.target.value)}
              error={Boolean(errors.function)}
              helperText={errors.function}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Failure Mode"
              multiline
              minRows={2}
              value={values.failure_mode}
              onChange={(event) => onChange("failure_mode", event.target.value)}
              error={Boolean(errors.failure_mode)}
              helperText={errors.failure_mode}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Failure Effect"
              multiline
              minRows={2}
              value={values.failure_effect}
              onChange={(event) => onChange("failure_effect", event.target.value)}
              error={Boolean(errors.failure_effect)}
              helperText={errors.failure_effect}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Potential Cause"
              multiline
              minRows={2}
              value={values.potential_cause}
              onChange={(event) => onChange("potential_cause", event.target.value)}
              error={Boolean(errors.potential_cause)}
              helperText={errors.potential_cause}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Current Prevention Controls"
              multiline
              minRows={2}
              value={values.current_prevention_controls ?? ""}
              onChange={(event) => onChange("current_prevention_controls", event.target.value || null)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Current Detection Controls"
              multiline
              minRows={2}
              value={values.current_detection_controls ?? ""}
              onChange={(event) => onChange("current_detection_controls", event.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              type="number"
              fullWidth
              label="Severity"
              value={values.severity}
              onChange={(event) => onChange("severity", Number(event.target.value))}
              inputProps={{ min: 1, max: 10 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              type="number"
              fullWidth
              label="Occurrence"
              value={values.occurrence}
              onChange={(event) => onChange("occurrence", Number(event.target.value))}
              inputProps={{ min: 1, max: 10 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              type="number"
              fullWidth
              label="Detection"
              value={values.detection}
              onChange={(event) => onChange("detection", Number(event.target.value))}
              inputProps={{ min: 1, max: 10 }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField fullWidth label="RPN" value={rpn} disabled helperText="Calculated automatically." />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Status"
              value={values.status}
              onChange={(event) => onChange("status", event.target.value as DfmeaEntryFormValues["status"])}
            >
              {dfmeaStatusOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Recommended Action"
              multiline
              minRows={2}
              value={values.recommended_action ?? ""}
              onChange={(event) => onChange("recommended_action", event.target.value || null)}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <AppButton hierarchy="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </AppButton>
        <AppButton hierarchy="primary" onClick={onSave} disabled={saving}>
          {saving ? "Saving..." : mode === "create" ? "Create Entry" : "Save Changes"}
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}
