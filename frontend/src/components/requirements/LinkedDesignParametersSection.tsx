import { Alert, Paper, Stack, Typography } from "@mui/material";
import type { LinkedDesignParameterReference } from "../../types/designParameters";

type LinkedDesignParametersSectionProps = {
  parameters: LinkedDesignParameterReference[];
};

export default function LinkedDesignParametersSection({ parameters }: LinkedDesignParametersSectionProps) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="h6" fontWeight={700} color="#0f172a">
        Linked Engineering Data
      </Typography>
      {parameters.length === 0 ? (
        <Alert severity="info">No design parameters are linked to this requirement yet.</Alert>
      ) : null}
      {parameters.map((parameter) => (
        <Paper key={parameter.id} elevation={0} sx={{ p: 2, border: "1px solid rgba(15,23,42,0.12)" }}>
          <Stack spacing={0.75}>
            <Typography fontWeight={700}>
              {parameter.id} - {parameter.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {parameter.parameter_name}: {parameter.value} {parameter.unit ?? ""}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Subsystem: {parameter.subsystem || "Unassigned"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Source: {parameter.source_document || "Manual entry"} {parameter.revision ? `(Rev ${parameter.revision})` : ""}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
