import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import {
  Alert,
  Box,
  CircularProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import AppButton from "../components/common/AppButton";
import AppCompactActionButton from "../components/common/AppCompactActionButton";
import ProjectWorkspaceShell from "../components/layout/ProjectWorkspaceShell";
import DesignParameterDialog from "../components/design-data/DesignParameterDialog";
import RequirementsContextPanel from "../components/requirements/RequirementsContextPanel";
import { createDesignParameter, deleteDesignParameter, fetchDesignParameters, updateDesignParameter } from "../services/designParametersApi";
import { fetchRequirements } from "../services/requirementsApi";
import type { DesignParameter, DesignParameterFormErrors, DesignParameterFormValues } from "../types/designParameters";
import type { Requirement } from "../types/requirements";

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

const emptyFormValues: DesignParameterFormValues = {
  id: "",
  project_id: "",
  name: "",
  subsystem: null,
  parameter_name: "",
  value: "",
  unit: null,
  source_document: null,
  revision: null,
  notes: null,
  requirement_ids: [],
};

function validate(values: DesignParameterFormValues, mode: "create" | "edit"): DesignParameterFormErrors {
  const errors: DesignParameterFormErrors = {};
  if (mode === "create" && values.id.trim().length < 1) {
    errors.id = "ID is required.";
  }
  if (values.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }
  if (values.parameter_name.trim().length < 2) {
    errors.parameter_name = "Parameter name must be at least 2 characters.";
  }
  if (values.value.trim().length < 1) {
    errors.value = "Value is required.";
  }
  return errors;
}

export default function DesignDataPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? "";
  const [designParameters, setDesignParameters] = useState<DesignParameter[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterSubsystem, setFilterSubsystem] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [formValues, setFormValues] = useState<DesignParameterFormValues>(emptyFormValues);
  const [formErrors, setFormErrors] = useState<DesignParameterFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async (selectedSubsystem?: string) => {
    setLoading(true);
    try {
      const [designDataResponse, requirementsResponse] = await Promise.all([
        fetchDesignParameters(projectId, selectedSubsystem && selectedSubsystem !== "all" ? selectedSubsystem : undefined),
        fetchRequirements(projectId),
      ]);
      setDesignParameters(designDataResponse);
      setRequirements(requirementsResponse);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load design data.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setError("Project context is missing.");
      setLoading(false);
      return;
    }
    loadData(filterSubsystem);
  }, [filterSubsystem, loadData, projectId]);

  const subsystemOptions = useMemo(
    () =>
      Array.from(
        new Set(designParameters.map((item) => item.subsystem).filter((item): item is string => Boolean(item)))
      ).sort(),
    [designParameters]
  );

  const contextItems = [
    { label: "Project ID", value: projectId || "Unknown" },
    { label: "Visible parameters", value: String(designParameters.length) },
    { label: "Subsystem filter", value: filterSubsystem === "all" ? "All" : filterSubsystem },
    { label: "Linked requirements available", value: String(requirements.length) },
  ];

  function openCreateDialog() {
    setDialogMode("create");
    setFormValues({ ...emptyFormValues, project_id: projectId });
    setFormErrors({});
    setSubmitError(null);
    setDialogOpen(true);
  }

  function openEditDialog(parameter: DesignParameter) {
    setDialogMode("edit");
    setFormValues({
      id: parameter.id,
      project_id: parameter.project_id,
      name: parameter.name,
      subsystem: parameter.subsystem,
      parameter_name: parameter.parameter_name,
      value: parameter.value,
      unit: parameter.unit,
      source_document: parameter.source_document,
      revision: parameter.revision,
      notes: parameter.notes,
      requirement_ids: parameter.linked_requirements.map((item) => item.id),
    });
    setFormErrors({});
    setSubmitError(null);
    setDialogOpen(true);
  }

  function handleChange<K extends keyof DesignParameterFormValues>(field: K, value: DesignParameterFormValues[K]) {
    setFormValues((current) => ({ ...current, [field]: value }));
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSave() {
    const errors = validate(formValues, dialogMode);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      if (dialogMode === "create") {
        await createDesignParameter(formValues);
      } else {
        const { id: designParameterId, ...payload } = formValues;
        await updateDesignParameter(designParameterId, payload);
      }
      setDialogOpen(false);
      await loadData(filterSubsystem);
    } catch (saveError) {
      setSubmitError(saveError instanceof Error ? saveError.message : "Unable to save design parameter.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(designParameterId: string) {
    if (!window.confirm("Delete this design parameter?")) {
      return;
    }

    try {
      await deleteDesignParameter(designParameterId);
      await loadData(filterSubsystem);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete design parameter.");
    }
  }

  return (
    <ProjectWorkspaceShell
      projectId={projectId}
      activeNavKey="design-data"
      rightPanel={<RequirementsContextPanel title="Design Data" items={contextItems} />}
    >
      <Box sx={{ p: 3 }}>
        <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(15,23,42,0.12)", bgcolor: "#ffffff" }}>
          <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} alignItems={{ md: "center" }}>
            <Box>
              <Typography variant="h5" fontWeight={700} color="#0f172a">
                Design Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Manage engineering parameters and link them to requirement records.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1.5}>
              <Select value={filterSubsystem} size="small" onChange={(event) => setFilterSubsystem(event.target.value)}>
                <MenuItem value="all">All subsystems</MenuItem>
                {subsystemOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              <AppButton hierarchy="primary" startIcon={<AddOutlinedIcon />} onClick={openCreateDialog}>
                New Parameter
              </AppButton>
            </Stack>
          </Stack>

          {loading ? (
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 4 }}>
              <CircularProgress size={22} />
              <Typography variant="body2">Loading design data...</Typography>
            </Stack>
          ) : null}

          {error ? <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert> : null}

          {!loading && !error && designParameters.length === 0 ? (
            <Alert severity="info" sx={{ mt: 3 }}>
              No design parameters found for the current filter.
            </Alert>
          ) : null}

          {!loading && !error && designParameters.length > 0 ? (
            <Box sx={{ mt: 3, overflowX: "auto" }}>
              <Table sx={{ minWidth: 980 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f8fafc" }}>
                    <TableCell sx={stickyIdHeaderSx}>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Subsystem</TableCell>
                  <TableCell>Parameter</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Linked Requirements</TableCell>
                  <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {designParameters.map((parameter) => (
                    <TableRow key={parameter.id} hover>
                      <TableCell sx={{ ...stickyIdColumnSx, fontWeight: 700, whiteSpace: "nowrap" }}>
                        {parameter.id}
                      </TableCell>
                    <TableCell>{parameter.name}</TableCell>
                    <TableCell>{parameter.subsystem || "Unassigned"}</TableCell>
                    <TableCell>{parameter.parameter_name}</TableCell>
                    <TableCell>
                      {parameter.value} {parameter.unit ?? ""}
                    </TableCell>
                    <TableCell>
                      {parameter.source_document || "Manual entry"}
                      {parameter.revision ? ` (Rev ${parameter.revision})` : ""}
                    </TableCell>
                    <TableCell>{parameter.linked_requirements.map((item) => item.id).join(", ") || "None"}</TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <AppCompactActionButton startIcon={<EditOutlinedIcon />} onClick={() => openEditDialog(parameter)}>
                          Edit
                        </AppCompactActionButton>
                        <AppCompactActionButton
                          tone="danger"
                          startIcon={<DeleteOutlineOutlinedIcon />}
                          onClick={() => handleDelete(parameter.id)}
                        >
                          Delete
                        </AppCompactActionButton>
                      </Stack>
                    </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : null}
        </Paper>
      </Box>

      <DesignParameterDialog
        open={dialogOpen}
        mode={dialogMode}
        values={formValues}
        errors={formErrors}
        requirements={requirements}
        saving={saving}
        submitError={submitError}
        onChange={handleChange}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </ProjectWorkspaceShell>
  );
}
