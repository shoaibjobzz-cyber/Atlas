import { Paper, Stack, Typography } from "@mui/material";

type ValidationSummaryCardProps = {
  label: string;
  value: string;
  supportingText: string;
};

export default function ValidationSummaryCard({
  label,
  value,
  supportingText,
}: ValidationSummaryCardProps) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(15,23,42,0.12)", bgcolor: "#ffffff" }}>
      <Stack spacing={0.75}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={700} color="#0f172a">
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {supportingText}
        </Typography>
      </Stack>
    </Paper>
  );
}
