import { Box, Divider, Stack, Typography } from "@mui/material";
import type { ContextPanelItem, DashboardSummary } from "../../types/dashboard";

type DashboardRightPanelProps = {
  summary: DashboardSummary;
  contextItems: ContextPanelItem[];
};

export default function DashboardRightPanel({ summary, contextItems }: DashboardRightPanelProps) {
  return (
    <Box
      sx={{
        width: 320,
        minWidth: 320,
        flexShrink: 0,
        minHeight: 0,
        borderLeft: "1px solid rgba(15,23,42,0.12)",
        bgcolor: "#f8fafc",
        p: 3,
        overflowX: "hidden",
        overflowY: "auto",
      }}
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="overline" sx={{ color: "#64748b", letterSpacing: 1.4 }}>
            Context Panel
          </Typography>
          <Typography variant="h6" fontWeight={700} color="#0f172a">
            Project Context
          </Typography>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            Project ID
          </Typography>
          <Typography fontWeight={600}>{summary.projectId}</Typography>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            Owner
          </Typography>
          <Typography fontWeight={600}>{summary.owner}</Typography>
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            Last updated
          </Typography>
          <Typography fontWeight={600}>{summary.updatedAt}</Typography>
        </Box>

        <Divider />

        <Stack spacing={1.5}>
          {contextItems.map((item) => (
            <Box key={item.label}>
              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>
              <Typography fontWeight={600}>{item.value}</Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}
