import { Alert, Box, Chip, Paper, Stack, Typography } from "@mui/material";
import type { RequirementCorrelationItem } from "../../types/requirements";

type RequirementCorrelationSectionProps = {
  title: string;
  emptyMessage: string;
  tone: "related" | "conflict";
  items: RequirementCorrelationItem[];
};

export default function RequirementCorrelationSection({
  title,
  emptyMessage,
  tone,
  items,
}: RequirementCorrelationSectionProps) {
  const chipColor = tone === "conflict" ? "error" : "primary";

  return (
    <Stack spacing={1.5}>
      <Box>
        <Typography variant="h6" fontWeight={700} color="#0f172a">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {tone === "conflict"
            ? "Potential contradictions or incompatible engineering constraints."
            : "Requirements that appear connected by subsystem, parameter, unit, or scope."}
        </Typography>
      </Box>

      {items.length === 0 ? <Alert severity="info">{emptyMessage}</Alert> : null}

      {items.map((item, index) => (
        <Paper key={`${item.requirement?.id ?? "self"}-${index}`} elevation={0} sx={{ p: 2, border: "1px solid rgba(15,23,42,0.12)" }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
              {item.requirement ? (
                <>
                  <Typography fontWeight={700}>{item.requirement.requirement_code}</Typography>
                  <Chip size="small" label={item.requirement.type} variant="outlined" color={chipColor} />
                  <Chip size="small" label={item.requirement.status} variant="outlined" />
                </>
              ) : (
                <Chip size="small" label="Current Requirement" variant="outlined" color={chipColor} />
              )}
            </Stack>
            {item.requirement ? (
              <Typography fontWeight={600}>{item.requirement.title}</Typography>
            ) : null}
            <Typography variant="body2" color="text.secondary">
              {item.reason}
            </Typography>
          </Stack>
        </Paper>
      ))}
    </Stack>
  );
}
