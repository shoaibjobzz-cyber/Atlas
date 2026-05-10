import {
  Alert,
  Box,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AppButton from "../common/AppButton";
import type { Requirement, RequirementFormErrors, RequirementFormValues } from "../../types/requirements";
import type { ProjectFeatureRecord } from "../../services/projectsApi";
import {
  requirementPriorityOptions,
  requirementStatusOptions,
  requirementTypeOptions,
} from "../../types/requirements";

type RequirementEditorFormProps = {
  mode: "create" | "edit";
  values: RequirementFormValues;
  errors: RequirementFormErrors;
  parentOptions: Requirement[];
  featureOptions?: ProjectFeatureRecord[];
  showFeatureField?: boolean;
  currentRequirementId?: string | null;
  idPreviewLoading?: boolean;
  idPreviewHelperText?: string;
  readOnly?: boolean;
  submitting: boolean;
  submitError: string | null;
  onChange: <K extends keyof RequirementFormValues>(field: K, value: RequirementFormValues[K]) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export default function RequirementEditorForm({
  mode,
  values,
  errors,
  parentOptions,
  featureOptions = [],
  showFeatureField = false,
  currentRequirementId,
  idPreviewLoading = false,
  idPreviewHelperText,
  readOnly = false,
  submitting,
  submitError,
  onChange,
  onSubmit,
  onCancel,
}: RequirementEditorFormProps) {
  const inputsDisabled = readOnly || submitting;

  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        p: { xs: 2, md: 3 },
        border: "1px solid rgba(15,23,42,0.10)",
        borderTop: "none",
        bgcolor: "#ffffff",
        borderRadius: 0,
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#0f172a">
            {mode === "create" ? "Create Requirement" : "Edit Requirement"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Capture requirement content and engineering context using the project-defined fields.
          </Typography>
        </Box>

        {readOnly ? (
          <Alert severity="warning">
            This requirement has been deleted. It is available for historical review only and cannot be edited.
          </Alert>
        ) : null}
        {submitError ? <Alert severity="error">{submitError}</Alert> : null}

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Requirement ID"
              value={mode === "create" ? (idPreviewLoading ? "Generating..." : values.id || "ID will update on save") : values.id}
              disabled
              error={Boolean(errors.id)}
              helperText={mode === "create" ? idPreviewHelperText : errors.id}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Project ID" value={values.project_id} disabled />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              value={values.title}
              disabled={inputsDisabled}
              error={Boolean(errors.title)}
              helperText={errors.title}
              onChange={(event) => onChange("title", event.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              id="requirement-text-input"
              fullWidth
              label="Requirement Text"
              multiline
              minRows={6}
              value={values.text}
              disabled={inputsDisabled}
              error={Boolean(errors.text)}
              helperText={errors.text}
              onChange={(event) => onChange("text", event.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 0.5 }} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="#0f172a">
              Classification and Traceability
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Type"
              value={values.type}
              disabled={inputsDisabled}
              onChange={(event) => onChange("type", event.target.value as RequirementFormValues["type"])}
            >
              {requirementTypeOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Priority"
              value={values.priority}
              disabled={inputsDisabled}
              onChange={(event) => onChange("priority", event.target.value as RequirementFormValues["priority"])}
            >
              {requirementPriorityOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              select
              fullWidth
              label="Status"
              value={values.status}
              disabled={inputsDisabled}
              onChange={(event) => onChange("status", event.target.value as RequirementFormValues["status"])}
            >
              {requirementStatusOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              select
              fullWidth
              label="Parent Requirement"
              value={values.parent_requirement_id ?? ""}
              disabled={inputsDisabled}
              onChange={(event) => onChange("parent_requirement_id", event.target.value || null)}
            >
              <MenuItem value="">None</MenuItem>
              {parentOptions
                .filter((option) => option.id !== currentRequirementId)
                .map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.requirement_code} - {option.title}
                  </MenuItem>
                ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Subsystem"
              value={values.subsystem ?? ""}
              disabled={inputsDisabled}
              onChange={(event) => onChange("subsystem", event.target.value || null)}
            />
          </Grid>
          {showFeatureField ? (
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Feature / Domain / Module"
                value={values.feature_id ?? ""}
                disabled={inputsDisabled}
                onChange={(event) => onChange("feature_id", event.target.value || null)}
              >
                <MenuItem value="">All platform features</MenuItem>
                {featureOptions.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name} ({option.kind})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          ) : null}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Verification Method"
              value={values.verification_method ?? ""}
              disabled={inputsDisabled}
              onChange={(event) => onChange("verification_method", event.target.value || null)}
            />
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 0.5 }} />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle2" color="#0f172a">
              Engineering Notes
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Rationale"
              multiline
              minRows={3}
              value={values.rationale ?? ""}
              disabled={inputsDisabled}
              onChange={(event) => onChange("rationale", event.target.value || null)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Assumptions"
              multiline
              minRows={3}
              value={values.assumptions ?? ""}
              disabled={inputsDisabled}
              onChange={(event) => onChange("assumptions", event.target.value || null)}
            />
          </Grid>
        </Grid>

        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
          <AppButton hierarchy="secondary" onClick={onCancel} disabled={submitting}>
            {readOnly ? "Back" : "Cancel"}
          </AppButton>
          <AppButton hierarchy="primary" onClick={onSubmit} disabled={inputsDisabled}>
            {submitting ? "Saving..." : mode === "create" ? "Create Requirement" : "Save Changes"}
          </AppButton>
        </Stack>
      </Stack>
    </Paper>
  );
}
