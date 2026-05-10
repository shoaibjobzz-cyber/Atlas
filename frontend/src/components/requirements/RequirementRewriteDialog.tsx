import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import AppButton from "../common/AppButton";
import { fetchRequirementRewriteSuggestions } from "../../services/generationApi";
import type { RequirementRewriteSuggestion, RewriteGoal } from "../../types/generation";
import type { RequirementType } from "../../types/requirements";
import RequirementCorrelationSection from "./RequirementCorrelationSection";
import StructuredRequirementView from "./StructuredRequirementView";

type RequirementRewriteDialogProps = {
  open: boolean;
  projectId: string;
  requirementId?: string | null;
  requirementCode?: string | null;
  title: string;
  text: string;
  type: RequirementType;
  onClose: () => void;
  onApply: (suggestion: RequirementRewriteSuggestion) => void;
};

const rewriteGoalOptions: { id: RewriteGoal; label: string }[] = [
  { id: "make_measurable", label: "Make measurable" },
  { id: "improve_testability", label: "Improve testability" },
  { id: "reduce_ambiguity", label: "Reduce ambiguity" },
  { id: "clarify_units_conditions_scope", label: "Clarify units / conditions / scope" },
  { id: "decompose_wording", label: "Decompose wording" },
];

function formatGenerationError(message: string) {
  try {
    const parsed = JSON.parse(message) as { detail?: string };
    if (typeof parsed.detail === "string" && parsed.detail.trim()) {
      return parsed.detail;
    }
  } catch {
    // Fall back to the original message when the backend did not return JSON detail.
  }

  return message;
}

export default function RequirementRewriteDialog({
  open,
  projectId,
  requirementId,
  requirementCode,
  title,
  text,
  type,
  onClose,
  onApply,
}: RequirementRewriteDialogProps) {
  const [selectedGoals, setSelectedGoals] = useState<RewriteGoal[]>([
    "make_measurable",
    "reduce_ambiguity",
    "clarify_units_conditions_scope",
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<RequirementRewriteSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectedSuggestion = suggestions[selectedIndex] ?? null;
  const canRequest = title.trim().length >= 3 && text.trim().length >= 10;
  const selectedProvider = selectedSuggestion?.generation_metadata.generation_provider ?? null;

  function toggleGoal(goal: RewriteGoal) {
    setSelectedGoals((current) =>
      current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal]
    );
  }

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetchRequirementRewriteSuggestions({
        project_id: projectId,
        requirement_id: requirementId ?? null,
        title,
        text,
        type,
        goals: selectedGoals,
      });
      setSuggestions(response.suggestions);
      setSelectedIndex(0);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? formatGenerationError(requestError.message)
          : "Unable to generate rewrite suggestions."
      );
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopySuggestion() {
    if (!selectedSuggestion) {
      return;
    }
    await navigator.clipboard.writeText(selectedSuggestion.text);
  }

  const qualityWarnings = useMemo(
    () => selectedSuggestion?.validation.quality_summary.warnings ?? [],
    [selectedSuggestion]
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Rewrite / Improve Requirement</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Alert severity="warning">
            Rewrite suggestions are review-first drafts. The current requirement remains unchanged until you explicitly
            accept a suggestion.
          </Alert>

          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(15,23,42,0.10)", borderRadius: 0 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle1" fontWeight={700}>
                Original Requirement
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {text}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {rewriteGoalOptions.map((goal) => (
                  <Chip
                    key={goal.id}
                    label={goal.label}
                    color={selectedGoals.includes(goal.id) ? "primary" : "default"}
                    variant={selectedGoals.includes(goal.id) ? "filled" : "outlined"}
                    onClick={() => toggleGoal(goal.id)}
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={1.25}>
                <AppButton
                  hierarchy="primary"
                  startIcon={<AutoAwesomeOutlinedIcon />}
                  onClick={handleGenerate}
                  disabled={!canRequest || loading}
                >
                  {loading ? "Generating..." : suggestions.length > 0 ? "Refresh Suggestions" : "Generate Suggestions"}
                </AppButton>
              </Stack>
            </Stack>
          </Paper>

          {error ? <Alert severity="error">{error}</Alert> : null}

          {selectedProvider ? (
            <Alert severity="info">
              Source: {selectedSuggestion?.generation_metadata.generation_source}
              {selectedProvider ? ` | Provider: ${selectedProvider}` : ""}
              {selectedSuggestion?.generation_metadata.generated_from_requirement_id && requirementCode
                ? ` | Based on requirement: ${requirementCode}`
                : ""}
            </Alert>
          ) : null}

          {suggestions.length > 0 ? (
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Stack spacing={1.5}>
                  {suggestions.map((suggestion, index) => (
                    <Paper
                      key={`${suggestion.title}-${index}`}
                      elevation={0}
                      sx={{
                        p: 2,
                        border: "1px solid rgba(15,23,42,0.10)",
                        borderRadius: 0,
                        bgcolor: selectedIndex === index ? "#eff6ff" : "#ffffff",
                      }}
                    >
                      <Stack spacing={1}>
                        <Typography fontWeight={700}>{suggestion.title}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {suggestion.rationale}
                        </Typography>
                        <AppButton
                          hierarchy={selectedIndex === index ? "primary" : "secondary"}
                          onClick={() => setSelectedIndex(index)}
                        >
                          {selectedIndex === index ? "Selected" : "Review Suggestion"}
                        </AppButton>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </Grid>

              <Grid item xs={12} md={8}>
                {selectedSuggestion ? (
                  <Stack spacing={2}>
                    <Paper
                      elevation={0}
                      sx={{ p: 2.5, border: "1px solid rgba(15,23,42,0.10)", borderRadius: 0, bgcolor: "#ffffff" }}
                    >
                      <Stack spacing={1.25}>
                        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                          <Typography variant="subtitle1" fontWeight={700}>
                            Suggested Rewrite
                          </Typography>
                          <Chip label={selectedSuggestion.draft_label} size="small" color="warning" variant="outlined" />
                        </Stack>
                        <Typography variant="body2" color="text.secondary">
                          {selectedSuggestion.title}
                        </Typography>
                        <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                          {selectedSuggestion.text}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Why this is better: {selectedSuggestion.rationale}
                        </Typography>
                      </Stack>
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{ p: 2.5, border: "1px solid rgba(15,23,42,0.10)", borderRadius: 0, bgcolor: "#ffffff" }}
                    >
                      <Stack spacing={2}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          Validation Preview
                        </Typography>

                        <Box>
                          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                            <Typography variant="subtitle2" fontWeight={700}>
                              Quality Warnings
                            </Typography>
                            <Chip
                              size="small"
                              label={`Score ${selectedSuggestion.validation.quality_summary.score}/100`}
                              variant="outlined"
                            />
                          </Stack>
                          {qualityWarnings.length === 0 ? (
                            <Alert severity="success" sx={{ mt: 1.5 }}>
                              No deterministic quality warnings were raised for this rewrite.
                            </Alert>
                          ) : (
                            <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                              {qualityWarnings.map((warning) => (
                                <Paper
                                  key={`${warning.rule_id}-${warning.title}`}
                                  elevation={0}
                                  sx={{ p: 1.5, border: "1px solid rgba(15,23,42,0.08)", borderRadius: 0 }}
                                >
                                  <Stack spacing={0.5}>
                                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                      <Chip
                                        size="small"
                                        label={warning.severity}
                                        color={
                                          warning.severity === "high"
                                            ? "error"
                                            : warning.severity === "medium"
                                              ? "warning"
                                              : "default"
                                        }
                                      />
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

                        <Divider />
                        <StructuredRequirementView parsedRequirement={selectedSuggestion.validation.parsed_requirement} />

                        <RequirementCorrelationSection
                          title="Related Requirements"
                          emptyMessage="No related project requirements were identified for this suggestion."
                          tone="related"
                          items={selectedSuggestion.validation.correlation_summary.related_requirements}
                        />

                        <RequirementCorrelationSection
                          title="Potential Conflicts"
                          emptyMessage="No conflicts were detected for this suggestion against the current project baseline."
                          tone="conflict"
                          items={selectedSuggestion.validation.correlation_summary.potential_conflicts}
                        />
                      </Stack>
                    </Paper>
                  </Stack>
                ) : null}
              </Grid>
            </Grid>
          ) : !loading ? (
            <Alert severity="info">
              Generate one or more rewrite suggestions to review the proposed wording and validation preview.
            </Alert>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <AppButton hierarchy="tertiary" onClick={onClose}>
          Discard
        </AppButton>
        <AppButton
          hierarchy="secondary"
          startIcon={<ContentCopyOutlinedIcon />}
          onClick={handleCopySuggestion}
          disabled={!selectedSuggestion}
        >
          Copy Rewrite
        </AppButton>
        <AppButton
          hierarchy="primary"
          startIcon={<RefreshOutlinedIcon />}
          onClick={() => selectedSuggestion && onApply(selectedSuggestion)}
          disabled={!selectedSuggestion}
        >
          Accept Rewrite
        </AppButton>
      </DialogActions>
    </Dialog>
  );
}
