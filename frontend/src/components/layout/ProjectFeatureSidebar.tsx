import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import AppCompactActionButton from "../common/AppCompactActionButton";
import type { ProjectFeatureCreateInput, ProjectFeatureRecord } from "../../services/projectsApi";

type ProjectFeatureSidebarProps = {
  projectId: string;
  projectName: string;
  features: ProjectFeatureRecord[];
  selectedFeatureId: string | null;
  onSelectFeature: (featureId: string | null) => void;
  onCreateFeature: (payload: ProjectFeatureCreateInput) => Promise<void>;
};

type FeatureDialogValues = {
  name: string;
  kind: "Feature" | "Functional Domain" | "Module";
  description: string;
  parent_feature_id: string | null;
};

const emptyDialogValues: FeatureDialogValues = {
  name: "",
  kind: "Feature",
  description: "",
  parent_feature_id: null,
};

function compareFeatures(left: ProjectFeatureRecord, right: ProjectFeatureRecord) {
  if (left.order_index !== right.order_index) {
    return left.order_index - right.order_index;
  }
  return left.name.localeCompare(right.name);
}

export default function ProjectFeatureSidebar({
  projectId,
  projectName,
  features,
  selectedFeatureId,
  onSelectFeature,
  onCreateFeature,
}: ProjectFeatureSidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogValues, setDialogValues] = useState<FeatureDialogValues>(emptyDialogValues);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const orderedFeatures = useMemo(() => [...features].sort(compareFeatures), [features]);
  const rootFeatures = useMemo(
    () => orderedFeatures.filter((feature) => !feature.parent_feature_id),
    [orderedFeatures]
  );
  const featuresByParent = useMemo(() => {
    const map = new Map<string, ProjectFeatureRecord[]>();
    orderedFeatures.forEach((feature) => {
      if (!feature.parent_feature_id) {
        return;
      }
      const bucket = map.get(feature.parent_feature_id) ?? [];
      bucket.push(feature);
      map.set(feature.parent_feature_id, bucket);
    });
    return map;
  }, [orderedFeatures]);

  function openCreateDialog(parentFeatureId: string | null = null) {
    setDialogValues({
      ...emptyDialogValues,
      parent_feature_id: parentFeatureId,
      kind: parentFeatureId ? "Module" : "Feature",
    });
    setDialogError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setDialogValues(emptyDialogValues);
    setDialogError(null);
    setSaving(false);
  }

  async function handleSave() {
    if (!dialogValues.name.trim()) {
      setDialogError("Feature name is required.");
      return;
    }
    setSaving(true);
    setDialogError(null);
    try {
      await onCreateFeature({
        name: dialogValues.name.trim(),
        kind: dialogValues.kind,
        description: dialogValues.description.trim() || null,
        parent_feature_id: dialogValues.parent_feature_id,
        order_index: features.length,
      });
      closeDialog();
    } catch (error) {
      setDialogError(error instanceof Error ? error.message : "Unable to create feature.");
      setSaving(false);
    }
  }

  function renderFeatureNode(feature: ProjectFeatureRecord, depth = 0) {
    const children = featuresByParent.get(feature.id) ?? [];
    const isCollapsed = collapsed[feature.id] ?? false;
    const hasChildren = children.length > 0;
    const selected = selectedFeatureId === feature.id;

    return (
      <Box key={feature.id}>
        <ListItemButton
          selected={selected}
          onClick={() => onSelectFeature(feature.id)}
          sx={{
            pl: 1.25 + depth * 1.5,
            pr: 1,
            py: 0.7,
            borderRadius: 1,
            mb: 0.35,
            alignItems: "flex-start",
            "&.Mui-selected": {
              bgcolor: "rgba(37,99,235,0.10)",
            },
          }}
        >
          <Box sx={{ minWidth: 20, mr: 0.5, pt: 0.15 }}>
            {hasChildren ? (
              <Box
                component="button"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setCollapsed((current) => ({ ...current, [feature.id]: !current[feature.id] }));
                }}
                sx={{
                  border: "none",
                  bgcolor: "transparent",
                  p: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                {isCollapsed ? (
                  <ChevronRightOutlinedIcon sx={{ fontSize: 16 }} />
                ) : (
                  <ExpandMoreOutlinedIcon sx={{ fontSize: 16 }} />
                )}
              </Box>
            ) : null}
          </Box>
          <ListItemText
            primary={feature.name}
            secondary={feature.kind}
            primaryTypographyProps={{ fontSize: 13.5, fontWeight: selected ? 700 : 600, color: "#0f172a" }}
            secondaryTypographyProps={{ fontSize: 11.5, color: "#64748b" }}
          />
        </ListItemButton>
        {!isCollapsed ? children.map((child) => renderFeatureNode(child, depth + 1)) : null}
      </Box>
    );
  }

  return (
    <>
      <Box
        sx={{
          width: 280,
          minWidth: 280,
          flexShrink: 0,
          borderRight: "1px solid rgba(15,23,42,0.08)",
          bgcolor: "#f8fafc",
          display: { xs: "none", lg: "flex" },
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <Box sx={{ px: 2, py: 1.75, borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
          <Stack direction="row" justifyContent="space-between" spacing={1} alignItems="center">
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="#64748b" sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Platform Structure
              </Typography>
              <Typography variant="body2" fontWeight={700} color="#0f172a" noWrap>
                {projectName}
              </Typography>
            </Box>
            <AppCompactActionButton
              variant="outlined"
              startIcon={<AddOutlinedIcon />}
              onClick={() => openCreateDialog(null)}
            >
              Add Feature
            </AppCompactActionButton>
          </Stack>
        </Box>
        <Box sx={{ p: 1.5, minHeight: 0, overflowY: "auto" }}>
          <List disablePadding>
            <ListItemButton
              selected={selectedFeatureId === null}
              onClick={() => onSelectFeature(null)}
              sx={{ borderRadius: 1, mb: 0.6, "&.Mui-selected": { bgcolor: "rgba(37,99,235,0.10)" } }}
            >
              <ListItemText
                primary="All Platform Features"
                secondary={projectId}
                primaryTypographyProps={{ fontSize: 13.5, fontWeight: selectedFeatureId === null ? 700 : 600 }}
                secondaryTypographyProps={{ fontSize: 11.5, color: "#64748b" }}
              />
            </ListItemButton>
            {rootFeatures.length > 0 ? (
              rootFeatures.map((feature) => renderFeatureNode(feature))
            ) : (
              <Box sx={{ px: 1, py: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  No features exist yet. Add Feature to create the platform hierarchy.
                </Typography>
              </Box>
            )}
          </List>
        </Box>
      </Box>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Platform Node</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {dialogError ? (
              <Typography variant="body2" color="#b91c1c">
                {dialogError}
              </Typography>
            ) : null}
            <TextField
              label="Name"
              value={dialogValues.name}
              onChange={(event) => setDialogValues((current) => ({ ...current, name: event.target.value }))}
              fullWidth
            />
            <TextField
              select
              label="Kind"
              value={dialogValues.kind}
              onChange={(event) =>
                setDialogValues((current) => ({
                  ...current,
                  kind: event.target.value as FeatureDialogValues["kind"],
                }))
              }
              fullWidth
            >
              <MenuItem value="Feature">Feature</MenuItem>
              <MenuItem value="Functional Domain">Functional Domain</MenuItem>
              <MenuItem value="Module">Module</MenuItem>
            </TextField>
            <TextField
              select
              label="Parent"
              value={dialogValues.parent_feature_id ?? ""}
              onChange={(event) =>
                setDialogValues((current) => ({
                  ...current,
                  parent_feature_id: event.target.value || null,
                }))
              }
              fullWidth
            >
              <MenuItem value="">Top level</MenuItem>
              {orderedFeatures.map((feature) => (
                <MenuItem key={feature.id} value={feature.id}>
                  {feature.name} ({feature.kind})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Description"
              value={dialogValues.description}
              onChange={(event) =>
                setDialogValues((current) => ({ ...current, description: event.target.value }))
              }
              fullWidth
              multiline
              minRows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <AppCompactActionButton variant="text" onClick={closeDialog}>
            Cancel
          </AppCompactActionButton>
          <AppCompactActionButton variant="contained" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Creating..." : "Add Feature"}
          </AppCompactActionButton>
        </DialogActions>
      </Dialog>
    </>
  );
}
