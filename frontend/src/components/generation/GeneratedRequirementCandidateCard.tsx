import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import DoNotDisturbOnOutlinedIcon from "@mui/icons-material/DoNotDisturbOnOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import AppCompactActionButton from "../common/AppCompactActionButton";
import RequirementCorrelationSection from "../requirements/RequirementCorrelationSection";
import StructuredRequirementView from "../requirements/StructuredRequirementView";
import {
  requirementPriorityOptions,
  requirementTypeOptions,
} from "../../types/requirements";
import type { GeneratedRequirementDraftState } from "../../types/generation";

type GeneratedRequirementCandidateCardProps = {
  candidate: GeneratedRequirementDraftState;
  index: number;
  onChange: <K extends keyof GeneratedRequirementDraftState>(field: K, value: GeneratedRequirementDraftState[K]) => void;
  onDecisionChange: (decision: "accepted" | "rejected") => void;
};

export default function GeneratedRequirementCandidateCard({
  candidate,
  index,
  onChange,
  onDecisionChange,
}: GeneratedRequirementCandidateCardProps) {
  const qualitySummary = candidate.validation.quality_summary;

  return (
    <Paper elevation={0} sx={{ border: "1px solid rgba(15,23,42,0.12)", borderRadius: 0, bgcolor: "#ffffff" }}>
      <Stack spacing={0}>
        <Box sx={{ px: 3, py: 2.5, borderBottom: "1px solid rgba(15,23,42,0.10)", bgcolor: "#f8fafc" }}>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between" alignItems={{ lg: "center" }}>
            <Box>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                <Typography variant="h6" fontWeight={700} color="#0f172a">
                  Candidate {index + 1}
                </Typography>
                <Chip
                  size="small"
                  icon={<AutoAwesomeOutlinedIcon />}
                  label={candidate.draft_label}
                  color="warning"
                  variant="outlined"
                />
                <Chip
                  size="small"
                  label={candidate.decision === "accepted" ? "Accepted for save" : "Rejected"}
                  color={candidate.decision === "accepted" ? "success" : "default"}
                  variant="outlined"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                Source: {candidate.generation_metadata.generation_source}
                {candidate.generation_metadata.generation_provider
                  ? ` | Provider: ${candidate.generation_metadata.generation_provider}`
                  : ""}
                {candidate.generation_metadata.generated_from_requirement_id
                  ? " | Generated from the selected source requirement"
                  : ""}
                {candidate.parent_requirement_id ? " | Child of the selected parent requirement" : ""}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
              <AppCompactActionButton
                variant={candidate.decision === "accepted" ? "contained" : "outlined"}
                tone={candidate.decision === "accepted" ? "accent" : "neutral"}
                startIcon={<CheckCircleOutlineOutlinedIcon />}
                onClick={() => onDecisionChange("accepted")}
              >
                Accept
              </AppCompactActionButton>
              <AppCompactActionButton
                variant={candidate.decision === "rejected" ? "contained" : "outlined"}
                tone={candidate.decision === "rejected" ? "danger" : "neutral"}
                startIcon={<DoNotDisturbOnOutlinedIcon />}
                onClick={() => onDecisionChange("rejected")}
              >
                Reject
              </AppCompactActionButton>
            </Stack>
          </Stack>
        </Box>

        <Box sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Requirement ID"
                  value="Auto on save"
                  disabled
                  helperText="Final requirement IDs are assigned automatically when this draft is saved."
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Hierarchy"
                  value={candidate.suggested_hierarchy || "Auto on save"}
                  disabled
                  helperText={
                    candidate.suggested_hierarchy
                      ? "Preview generated by the backend from the current parent-child structure."
                      : "Hierarchy is assigned automatically when this draft is saved."
                  }
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Type"
                  value={candidate.type}
                  onChange={(event) => onChange("type", event.target.value as GeneratedRequirementDraftState["type"])}
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
                  value={candidate.priority}
                  onChange={(event) =>
                    onChange("priority", event.target.value as GeneratedRequirementDraftState["priority"])
                  }
                >
                  {requirementPriorityOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  value={candidate.title}
                  onChange={(event) => onChange("title", event.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Requirement Text"
                  multiline
                  minRows={4}
                  value={candidate.text}
                  onChange={(event) => onChange("text", event.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Subsystem"
                  value={candidate.subsystem ?? ""}
                  onChange={(event) => onChange("subsystem", event.target.value || null)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Verification Method"
                  value={candidate.verification_method ?? ""}
                  onChange={(event) => onChange("verification_method", event.target.value || null)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Rationale"
                  multiline
                  minRows={2}
                  value={candidate.rationale ?? ""}
                  onChange={(event) => onChange("rationale", event.target.value || null)}
                />
              </Grid>
            </Grid>

            <Accordion defaultExpanded disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                <Typography fontWeight={700}>Validation Review</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Stack spacing={3}>
                  <Box>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                      <Typography variant="subtitle1" fontWeight={700}>
                        Quality Warnings
                      </Typography>
                      <Chip size="small" label={`Score ${qualitySummary.score}/100`} variant="outlined" />
                    </Stack>
                    {qualitySummary.warnings.length === 0 ? (
                      <Alert severity="success" sx={{ mt: 1.5 }}>
                        No deterministic quality warnings were produced for this draft.
                      </Alert>
                    ) : (
                      <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                        {qualitySummary.warnings.map((warning) => (
                          <Paper
                            key={warning.rule_id}
                            elevation={0}
                            sx={{ p: 1.5, border: "1px solid rgba(15,23,42,0.08)", borderRadius: 0 }}
                          >
                            <Stack spacing={0.5}>
                              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                <Chip size="small" label={warning.severity} color={warning.severity === "high" ? "error" : warning.severity === "medium" ? "warning" : "default"} />
                                <Typography fontWeight={700}>{warning.title}</Typography>
                              </Stack>
                              <Typography variant="body2" color="text.secondary">
                                {warning.explanation}
                              </Typography>
                              <Typography variant="body2">Suggestion: {warning.suggestion}</Typography>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </Box>

                  <StructuredRequirementView parsedRequirement={candidate.validation.parsed_requirement} />

                  <RequirementCorrelationSection
                    title="Related Requirements"
                    emptyMessage="No related project requirements were identified for this generated draft."
                    tone="related"
                    items={candidate.validation.correlation_summary.related_requirements}
                  />

                  <RequirementCorrelationSection
                    title="Potential Conflicts"
                    emptyMessage="No conflicts were detected for this generated draft against the current project baseline."
                    tone="conflict"
                    items={candidate.validation.correlation_summary.potential_conflicts}
                  />
                </Stack>
              </AccordionDetails>
            </Accordion>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
