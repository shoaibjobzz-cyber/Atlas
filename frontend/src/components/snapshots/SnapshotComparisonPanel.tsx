import CompareArrowsOutlinedIcon from "@mui/icons-material/CompareArrowsOutlined";
import { Grid, Paper, Stack, Typography } from "@mui/material";
import type { ProjectSnapshotComparison } from "../../types/projectSnapshots";

type SnapshotComparisonPanelProps = {
  comparison: ProjectSnapshotComparison;
  labels?: Record<string, string>;
};

function formatDelta(value: number) {
  if (value > 0) {
    return `+${value}`;
  }
  return `${value}`;
}

export default function SnapshotComparisonPanel({
  comparison,
  labels = {},
}: SnapshotComparisonPanelProps) {
  return (
    <Paper elevation={0} sx={{ p: 2.5, border: "1px solid rgba(15,23,42,0.12)", bgcolor: "#f8fafc" }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.25} alignItems="center">
          <CompareArrowsOutlinedIcon fontSize="small" />
          <Stack spacing={0.25}>
            <Typography variant="h6" fontWeight={700} color="#0f172a">
              Current vs Snapshot Comparison
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Comparing the live project state against {comparison.snapshot.name}.
            </Typography>
          </Stack>
        </Stack>
        <Grid container spacing={1.5}>
          {Object.entries(comparison.deltas).map(([key, delta]) => (
            <Grid item xs={12} sm={6} lg={3} key={key}>
              <Paper elevation={0} sx={{ p: 1.75, border: "1px solid rgba(15,23,42,0.08)", bgcolor: "#ffffff" }}>
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {labels[key] ?? key.replace(/_/g, " ")}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} color="#0f172a">
                    {formatDelta(delta.delta)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Current {delta.current} • Snapshot {delta.snapshot}
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Paper>
  );
}
