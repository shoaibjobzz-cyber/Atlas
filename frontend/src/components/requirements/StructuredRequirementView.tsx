import { Box, Divider, Grid, Stack, Typography } from "@mui/material";
import type { StructuredRequirementFields } from "../../types/requirements";

type StructuredRequirementViewProps = {
  parsedRequirement: StructuredRequirementFields | null;
};

type StructuredFieldRowProps = {
  label: string;
  value: string | null;
};

type StructuredSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

function StructuredFieldRow({ label, value }: StructuredFieldRowProps) {
  return (
    <Box
      sx={{
        py: 1.35,
        borderBottom: "1px solid rgba(15,23,42,0.08)",
      }}
    >
      <Typography variant="caption" color="#64748b" sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}>
        {label}
      </Typography>
      <Typography fontWeight={600} color="#0f172a" sx={{ mt: 0.45 }}>
        {value || "Not extracted"}
      </Typography>
    </Box>
  );
}

function StructuredSection({ title, description, children }: StructuredSectionProps) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} color="#0f172a">
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.45 }}>
          {description}
        </Typography>
      ) : null}
      <Box sx={{ mt: 1.25 }}>{children}</Box>
    </Box>
  );
}

export default function StructuredRequirementView({ parsedRequirement }: StructuredRequirementViewProps) {
  const parsed = parsedRequirement ?? {
    actor: null,
    action: null,
    object: null,
    parameter: null,
    operator: null,
    value: null,
    unit: null,
    timing: null,
    condition: null,
    scope: null,
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="body2" color="text.secondary">
          Deterministic structured extraction of the current requirement wording. Missing values stay visible without
          extra emphasis when the parser cannot infer them confidently.
        </Typography>
      </Box>

      <Divider />

      <StructuredSection
        title="Requirements Overview"
        description="Core actor-action-object structure for the current requirement wording."
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StructuredFieldRow label="Actor" value={parsed.actor} />
          </Grid>
          <Grid item xs={12} md={6}>
            <StructuredFieldRow label="Action" value={parsed.action} />
          </Grid>
          <Grid item xs={12} md={6}>
            <StructuredFieldRow label="Object" value={parsed.object} />
          </Grid>
          <Grid item xs={12} md={6}>
            <StructuredFieldRow label="Parameter" value={parsed.parameter} />
          </Grid>
        </Grid>
      </StructuredSection>

      <Divider />

      <StructuredSection
        title="Validation Summary"
        description="Constraint values and comparison details extracted from the current text."
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StructuredFieldRow label="Operator" value={parsed.operator} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StructuredFieldRow label="Value" value={parsed.value} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StructuredFieldRow label="Unit" value={parsed.unit} />
          </Grid>
        </Grid>
      </StructuredSection>

      <Divider />

      <StructuredSection
        title="Recent Activity"
        description="Timing, condition, and scope cues inferred from the current requirement text."
      >
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <StructuredFieldRow label="Timing" value={parsed.timing} />
          </Grid>
          <Grid item xs={12} md={6}>
            <StructuredFieldRow label="Condition" value={parsed.condition} />
          </Grid>
          <Grid item xs={12}>
            <StructuredFieldRow label="Scope" value={parsed.scope} />
          </Grid>
        </Grid>
      </StructuredSection>
    </Stack>
  );
}
