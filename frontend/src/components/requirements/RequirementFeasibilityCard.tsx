import { Alert, Chip, Paper, Stack, Typography } from "@mui/material";
import type { RequirementFeasibilityAssessment } from "../../types/requirements";

type RequirementFeasibilityCardProps = {
  assessment: RequirementFeasibilityAssessment | null;
  error: string | null;
};

function chipColor(status: RequirementFeasibilityAssessment["assessment_status"]) {
  switch (status) {
    case "feasible":
      return "success";
    case "likely_infeasible":
      return "error";
    case "warning":
      return "warning";
    case "insufficient_data":
      return "default";
  }
}

function formatComputedValue(value: string | number | boolean | null | string[] | number[]) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "None";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2);
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  return value ?? "Not available";
}

export default function RequirementFeasibilityCard({ assessment, error }: RequirementFeasibilityCardProps) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(15,23,42,0.12)" }}>
      <Stack spacing={1.5}>
        <Typography variant="h6" fontWeight={700} color="#0f172a">
          Feasibility
        </Typography>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {!error && !assessment ? (
          <Alert severity="info">No feasibility assessment is available yet.</Alert>
        ) : null}

        {assessment ? (
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
              <Chip label={assessment.assessment_status.replace("_", " ")} color={chipColor(assessment.assessment_status)} />
              <Chip label={`Confidence ${Math.round(assessment.confidence * 100)}%`} variant="outlined" size="small" />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {assessment.explanation}
            </Typography>

            <Stack spacing={0.75}>
              <Typography variant="subtitle2" fontWeight={700}>
                Computed Values
              </Typography>
              {Object.keys(assessment.computed_values).length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No computed values were produced for this assessment.
                </Typography>
              ) : (
                Object.entries(assessment.computed_values).map(([key, value]) => (
                  <Typography key={key} variant="body2" color="text.secondary">
                    {key}: {formatComputedValue(value)}
                  </Typography>
                ))
              )}
            </Stack>

            <Stack spacing={0.75}>
              <Typography variant="subtitle2" fontWeight={700}>
                Evidence Used
              </Typography>
              {assessment.evidence_used.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No evidence items were available.
                </Typography>
              ) : (
                assessment.evidence_used.map((item, index) => (
                  <Typography key={`${item.source}-${index}`} variant="body2" color="text.secondary">
                    {item.source}: {item.detail}
                  </Typography>
                ))
              )}
            </Stack>

            <Stack spacing={0.75}>
              <Typography variant="subtitle2" fontWeight={700}>
                Assumptions
              </Typography>
              {assessment.assumptions.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No additional assumptions were needed.
                </Typography>
              ) : (
                assessment.assumptions.map((item, index) => (
                  <Typography key={index} variant="body2" color="text.secondary">
                    {item}
                  </Typography>
                ))
              )}
            </Stack>
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}
