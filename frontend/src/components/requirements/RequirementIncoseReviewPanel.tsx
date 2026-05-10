import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import TaskAltOutlinedIcon from "@mui/icons-material/TaskAltOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { RequirementQualityIssue, RequirementQualitySummary } from "../../types/requirements";

type RequirementIncoseReviewPanelProps = {
  summary: RequirementQualitySummary;
  loading: boolean;
  error: string | null;
  suggestionIgnored: boolean;
  onAcceptSuggestion: () => void;
  onEditManually: () => void;
  onIgnoreSuggestion: () => void;
};

function severityColor(severity: RequirementQualityIssue["severity"]) {
  switch (severity) {
    case "error":
      return "error";
    case "warning":
      return "warning";
    case "info":
      return "default";
  }
}

export default function RequirementIncoseReviewPanel({
  summary,
  loading,
  error,
  suggestionIgnored,
  onAcceptSuggestion,
  onEditManually,
  onIgnoreSuggestion,
}: RequirementIncoseReviewPanelProps) {
  const counts = summary.issues.reduce(
    (accumulator, issue) => {
      accumulator[issue.severity] += 1;
      return accumulator;
    },
    { error: 0, warning: 0, info: 0 }
  );

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(15,23,42,0.10)", bgcolor: "#ffffff", borderRadius: 0 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="overline" sx={{ color: "#64748b", letterSpacing: 1.4 }}>
            INCOSE Review
          </Typography>
          <Typography variant="h6" fontWeight={700} color="#0f172a">
            Wording and Rewrite Guidance
          </Typography>
          {summary.explanation ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {summary.explanation}
            </Typography>
          ) : null}
        </Box>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
          <Chip label={`Issues ${summary.issues.length}`} variant="outlined" size="small" />
          <Chip label={`Error ${counts.error}`} color="error" variant="outlined" size="small" />
          <Chip label={`Warning ${counts.warning}`} color="warning" variant="outlined" size="small" />
          <Chip label={`Info ${counts.info}`} variant="outlined" size="small" />
        </Stack>

        {loading ? (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Reviewing wording against deterministic INCOSE-style rules...</Typography>
          </Stack>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}

        {!loading && !error && summary.issues.length === 0 ? (
          <Alert severity="success">No deterministic INCOSE-style wording issues were detected in the current draft.</Alert>
        ) : null}

        {!loading && summary.issues.length > 0 ? (
          <Stack spacing={1.5}>
            {summary.issues.map((issue, index) => (
              <Box key={`${issue.rule_id}-${index}`}>
                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                    <Chip size="small" label={issue.severity.toUpperCase()} color={severityColor(issue.severity)} />
                    <Typography fontWeight={700}>{issue.rule_name}</Typography>
                  </Stack>
                  {issue.problematic_phrase ? (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Problematic phrase:</strong> {issue.problematic_phrase}
                    </Typography>
                  ) : null}
                  <Typography variant="body2" color="text.secondary">
                    {issue.explanation}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Suggested correction:</strong> {issue.suggested_correction}
                  </Typography>
                </Stack>
                {index < summary.issues.length - 1 ? <Divider sx={{ mt: 1.5 }} /> : null}
              </Box>
            ))}
          </Stack>
        ) : null}

        {!loading && summary.suggested_rewrite && !suggestionIgnored ? (
          <Stack spacing={1.5} sx={{ pt: 0.5 }}>
            <Divider />
            <Box>
              <Typography variant="subtitle2" color="#0f172a" sx={{ mb: 0.75 }}>
                Suggested Rewrite
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  p: 1.5,
                  border: "1px solid rgba(15,23,42,0.10)",
                  bgcolor: "#f8fafc",
                  whiteSpace: "pre-wrap",
                }}
              >
                {summary.suggested_rewrite.text}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {summary.suggested_rewrite.explanation}
              </Typography>
              {summary.suggested_rewrite.rule_coverage.length > 0 ? (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                  Rule coverage: {summary.suggested_rewrite.rule_coverage.join(", ")}
                </Typography>
              ) : null}
            </Box>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              <Button size="small" variant="contained" startIcon={<TaskAltOutlinedIcon />} onClick={onAcceptSuggestion}>
                Accept Suggestion
              </Button>
              <Button size="small" variant="outlined" startIcon={<EditOutlinedIcon />} onClick={onEditManually}>
                Edit Manually
              </Button>
              <Button size="small" variant="text" startIcon={<VisibilityOffOutlinedIcon />} onClick={onIgnoreSuggestion}>
                Ignore
              </Button>
            </Stack>
          </Stack>
        ) : null}

        {!loading && suggestionIgnored ? (
          <Alert severity="info">Rewrite suggestion ignored for the current draft. Edit the requirement to re-run the recommendation.</Alert>
        ) : null}
      </Stack>
    </Paper>
  );
}
