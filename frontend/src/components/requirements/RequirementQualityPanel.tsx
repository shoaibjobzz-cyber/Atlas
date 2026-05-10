import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { RequirementQualitySummary, RequirementQualityWarning } from "../../types/requirements";

type RequirementQualityPanelProps = {
  summary: RequirementQualitySummary;
  loading: boolean;
  error: string | null;
};

function severityColor(severity: RequirementQualityWarning["severity"]) {
  switch (severity) {
    case "high":
      return "error";
    case "medium":
      return "warning";
    case "low":
      return "default";
  }
}

export default function RequirementQualityPanel({ summary, loading, error }: RequirementQualityPanelProps) {
  const counts = summary.warnings.reduce(
    (accumulator, warning) => {
      accumulator[warning.severity] += 1;
      return accumulator;
    },
    { high: 0, medium: 0, low: 0 }
  );

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(15,23,42,0.10)", bgcolor: "#ffffff", borderRadius: 0 }}>
      <Stack spacing={2}>
        <Box>
          <Typography variant="overline" sx={{ color: "#64748b", letterSpacing: 1.4 }}>
            Requirement Quality
          </Typography>
          <Typography variant="h6" fontWeight={700} color="#0f172a">
            Live Quality Check
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
          <Chip label={`Score ${summary.score}/100`} color={summary.score >= 85 ? "success" : summary.score >= 65 ? "warning" : "error"} />
          <Chip label={`High ${counts.high}`} color="error" variant="outlined" size="small" />
          <Chip label={`Medium ${counts.medium}`} color="warning" variant="outlined" size="small" />
          <Chip label={`Low ${counts.low}`} variant="outlined" size="small" />
        </Stack>

        {loading ? (
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.5 }}>
            <CircularProgress size={20} />
            <Typography variant="body2">Checking requirement quality...</Typography>
          </Stack>
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}

        {!loading && !error && summary.warnings.length === 0 ? (
          <Alert severity="success">No rule-based quality issues were detected in the current wording.</Alert>
        ) : null}

        {!loading && summary.warnings.length > 0 ? (
          <Stack spacing={1.5}>
            {summary.warnings.map((warning, index) => (
              <Box key={`${warning.rule_id}-${index}`}>
                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
                    <Chip size="small" label={warning.severity.toUpperCase()} color={severityColor(warning.severity)} />
                    <Typography fontWeight={700}>{warning.title}</Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {warning.explanation}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Suggestion:</strong> {warning.suggestion}
                  </Typography>
                </Stack>
                {index < summary.warnings.length - 1 ? <Divider sx={{ mt: 1.5 }} /> : null}
              </Box>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}
