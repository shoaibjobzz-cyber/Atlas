import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import {
  Alert,
  Box,
  Chip,
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
import { useParams, useSearchParams } from "react-router-dom";
import AppButton from "../components/common/AppButton";
import AppCompactActionButton from "../components/common/AppCompactActionButton";
import DfmeaEntryDialog from "../components/dfmea/DfmeaEntryDialog";
import ProjectWorkspaceShell from "../components/layout/ProjectWorkspaceShell";
import RequirementsContextPanel from "../components/requirements/RequirementsContextPanel";
import {
  createDfmeaEntry,
  deleteDfmeaEntry,
  fetchDfmeaEntries,
  fetchDfmeaFilters,
  updateDfmeaEntry,
} from "../services/dfmeaApi";
import { fetchRequirements } from "../services/requirementsApi";
import type {
  DfmeaEntry,
  DfmeaEntryFormErrors,
  DfmeaEntryFormValues,
  DfmeaFilters,
} from "../types/dfmea";
import { dfmeaStatusOptions } from "../types/dfmea";
import type { Requirement } from "../types/requirements";

const emptyFormValues: DfmeaEntryFormValues = {
  project_id: "",
  requirement_id: "",
  function: "",
  failure_mode: "",
  failure_effect: "",
  potential_cause: "",
  current_prevention_controls: null,
  current_detection_controls: "",
  severity: 5,
  occurrence: 5,
  detection: 5,
  recommended_action: null,
  owner: null,
  status: "Open",
  related_requirement_ids: [],
};

function validate(values: DfmeaEntryFormValues): DfmeaEntryFormErrors {
  const errors: DfmeaEntryFormErrors = {};
  if (!values.requirement_id) {
    errors.requirement_id = "Requirement is required.";
  }
  if (values.function.trim().length < 3) {
    errors.function = "Function must be at least 3 characters.";
  }
  return errors;
}

function toFormValues(entry: DfmeaEntry): DfmeaEntryFormValues {
  return {
    id: entry.id,
    project_id: entry.project_id,
    requirement_id: entry.requirement_id,
    function: entry.function,
    failure_mode: entry.failure_mode,
    failure_effect: entry.failure_effect,
    potential_cause: entry.potential_cause,
    current_prevention_controls: entry.current_prevention_controls,
    current_detection_controls: entry.current_detection_controls ?? "",
    severity: entry.severity,
    occurrence: entry.occurrence,
    detection: entry.detection,
    recommended_action: entry.recommended_action,
    owner: entry.owner,
    status: entry.status,
    related_requirement_ids: entry.related_requirement_ids,
  };
}

export default function DfmeaPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? "";
  const [searchParams] = useSearchParams();
  const selectedFeatureId = searchParams.get("featureId");
  const [entries, setEntries] = useState<DfmeaEntry[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSubsystem, setFilterSubsystem] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [highRiskOnly, setHighRiskOnly] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [formValues, setFormValues] = useState<DfmeaEntryFormValues>(emptyFormValues);
  const [formErrors, setFormErrors] = useState<DfmeaEntryFormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterOptions, setFilterOptions] = useState<DfmeaFilters>({
    project_id: "",
    statuses: [],
    subsystems: [],
    requirement_types: [],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [entriesResponse, requirementsResponse, filtersResponse] = await Promise.all([
        fetchDfmeaEntries(projectId),
        fetchRequirements(projectId),
        fetchDfmeaFilters(projectId),
      ]);
      setEntries(entriesResponse);
      setRequirements(requirementsResponse);
      setFilterOptions(filtersResponse);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load DFMEA workspace.");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      setError("Project context is missing.");
      return;
    }
    void loadData();
  }, [loadData, projectId]);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (selectedFeatureId && entry.requirement.feature_id !== selectedFeatureId) {
        return false;
      }
      if (filterStatus !== "all" && entry.status !== filterStatus) {
        return false;
      }
      if (filterSubsystem !== "all" && (entry.requirement.subsystem ?? "") !== filterSubsystem) {
        return false;
      }
      if (filterType !== "all" && entry.requirement.type !== filterType) {
        return false;
      }
      if (highRiskOnly && entry.rpn < 120) {
        return false;
      }
      return true;
    });
  }, [entries, filterStatus, filterSubsystem, filterType, highRiskOnly, selectedFeatureId]);

  const scopedRequirements = useMemo(
    () =>
      selectedFeatureId
        ? requirements.filter((requirement) => requirement.feature_id === selectedFeatureId)
        : requirements,
    [requirements, selectedFeatureId]
  );

  const contextItems = [
    { label: "Project ID", value: projectId || "Unknown" },
    { label: "Visible DFMEA entries", value: String(filteredEntries.length) },
    { label: "High-risk items", value: String(entries.filter((entry) => entry.rpn >= 120).length) },
    { label: "Tracked requirements", value: String(scopedRequirements.length) },
    { label: "Feature scope", value: selectedFeatureId ?? "All platform features" },
  ];

  function openCreateDialog() {
    const selectedRequirement = scopedRequirements[0] ?? null;
    setDialogMode("create");
    setFormValues({
      ...emptyFormValues,
      project_id: projectId,
      requirement_id: selectedRequirement?.id ?? "",
      function: selectedRequirement?.text ?? "",
    });
    setFormErrors({});
    setSubmitError(null);
    setDialogOpen(true);
  }

  function openEditDialog(entry: DfmeaEntry) {
    setDialogMode("edit");
    setFormValues(toFormValues(entry));
    setFormErrors({});
    setSubmitError(null);
    setDialogOpen(true);
  }

  function handleChange<K extends keyof DfmeaEntryFormValues>(field: K, value: DfmeaEntryFormValues[K]) {
    setFormValues((current) => {
      const next = { ...current, [field]: value };
      if (field === "requirement_id" && dialogMode === "create" && !current.function.trim()) {
        const selectedRequirement = requirements.find((requirement) => requirement.id === value);
        if (selectedRequirement) {
          next.function = selectedRequirement.text;
        }
      }
      return next;
    });
    setFormErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSave() {
    const errors = validate(formValues);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      if (dialogMode === "create") {
        await createDfmeaEntry(formValues);
      } else {
        const { id: entryId, ...payload } = formValues;
        await updateDfmeaEntry(entryId || "", payload);
      }
      setDialogOpen(false);
      await loadData();
    } catch (saveError) {
      setSubmitError(saveError instanceof Error ? saveError.message : "Unable to save DFMEA entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId: string) {
    if (!window.confirm("Delete this DFMEA entry?")) {
      return;
    }
    try {
      await deleteDfmeaEntry(entryId);
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete DFMEA entry.");
    }
  }

  return (
    <ProjectWorkspaceShell
      projectId={projectId}
      activeNavKey="dfmea"
      rightPanel={<RequirementsContextPanel title="Risk / DFMEA" items={contextItems} />}
    >
      <Box sx={{ p: 3 }}>
        <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(15,23,42,0.12)", bgcolor: "#ffffff" }}>
          <Stack spacing={2.5}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} alignItems={{ md: "center" }}>
              <Box>
                <Typography variant="h5" fontWeight={700} color="#0f172a">
                  DFMEA
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                  Review linked failure modes, prioritize risk with RPN scoring, and create new entries directly from requirements.
                </Typography>
              </Box>
              <AppButton hierarchy="primary" startIcon={<AddOutlinedIcon />} onClick={openCreateDialog}>
                Create DFMEA From Requirement
              </AppButton>
            </Stack>

            <Stack direction={{ xs: "column", lg: "row" }} spacing={1.5} alignItems={{ lg: "center" }}>
              <Select size="small" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
                <MenuItem value="all">All statuses</MenuItem>
                {(filterOptions.statuses.length > 0 ? filterOptions.statuses : [...dfmeaStatusOptions]).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              <Select size="small" value={filterSubsystem} onChange={(event) => setFilterSubsystem(event.target.value)}>
                <MenuItem value="all">All subsystems</MenuItem>
                {filterOptions.subsystems.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              <Select size="small" value={filterType} onChange={(event) => setFilterType(event.target.value)}>
                <MenuItem value="all">All requirement types</MenuItem>
                {filterOptions.requirement_types.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
              <AppCompactActionButton
                variant={highRiskOnly ? "contained" : "outlined"}
                tone={highRiskOnly ? "danger" : "neutral"}
                startIcon={<WarningAmberOutlinedIcon />}
                onClick={() => setHighRiskOnly((current) => !current)}
              >
                {highRiskOnly ? "Showing High RPN" : "High RPN Only"}
              </AppCompactActionButton>
            </Stack>

            {loading ? <Alert severity="info">Loading DFMEA workspace...</Alert> : null}
            {error ? <Alert severity="error">{error}</Alert> : null}

            {!loading && !error && filteredEntries.length === 0 ? (
              <Alert severity="info">No DFMEA entries match the current filters.</Alert>
            ) : null}

            {!loading && !error && filteredEntries.length > 0 ? (
              <Box sx={{ overflowX: "auto" }}>
                <Typography
                  variant="caption"
                  color="#64748b"
                  sx={{ display: "block", mb: 1.1, textTransform: "uppercase", letterSpacing: "0.08em" }}
                >
                  DFMEA Risk Register
                </Typography>
                <Table sx={{ minWidth: 1240 }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f8fafc" }}>
                      <TableCell>Requirement</TableCell>
                      <TableCell>Function / Failure Mode</TableCell>
                      <TableCell>Effect / Cause</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">S</TableCell>
                      <TableCell align="center">O</TableCell>
                      <TableCell align="center">D</TableCell>
                      <TableCell align="center">RPN</TableCell>
                      <TableCell>Owner</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id} hover>
                        <TableCell sx={{ minWidth: 200 }}>
                          <Typography fontWeight={700}>{entry.requirement.requirement_code}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {entry.requirement.title}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 240 }}>
                          <Typography variant="body2" fontWeight={600}>{entry.function}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Failure mode: {entry.failure_mode || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 260 }}>
                          <Typography variant="body2">Effect: {entry.failure_effect || "—"}</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Cause: {entry.potential_cause || "—"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={entry.status}
                            color={entry.status === "Closed" ? "success" : entry.rpn >= 120 ? "error" : "default"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">{entry.severity}</TableCell>
                        <TableCell align="center">{entry.occurrence}</TableCell>
                        <TableCell align="center">{entry.detection}</TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            label={entry.rpn}
                            color={entry.rpn >= 160 ? "error" : entry.rpn >= 120 ? "warning" : "default"}
                          />
                        </TableCell>
                        <TableCell>{entry.owner || "Unassigned"}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <AppCompactActionButton onClick={() => openEditDialog(entry)} startIcon={<EditOutlinedIcon />}>
                              Edit
                            </AppCompactActionButton>
                            <AppCompactActionButton tone="danger" onClick={() => handleDelete(entry.id)} startIcon={<DeleteOutlineOutlinedIcon />}>
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
          </Stack>
        </Paper>
      </Box>

      <DfmeaEntryDialog
        open={dialogOpen}
        mode={dialogMode}
        values={formValues}
        errors={formErrors}
        requirements={scopedRequirements}
        saving={saving}
        submitError={submitError}
        onChange={handleChange}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </ProjectWorkspaceShell>
  );
}
