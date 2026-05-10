import { Box, Divider, Stack, Typography } from "@mui/material";

type RequirementsContextPanelProps = {
  title: string;
  items: Array<{ label: string; value: string }>;
  embedded?: boolean;
};

export default function RequirementsContextPanel({ title, items, embedded = false }: RequirementsContextPanelProps) {
  return (
    <Box
      sx={{
        width: embedded ? "auto" : 320,
        minWidth: embedded ? "auto" : 320,
        flexShrink: 0,
        minHeight: embedded ? "auto" : 0,
        borderLeft: embedded ? "none" : "1px solid rgba(15,23,42,0.10)",
        bgcolor: embedded ? "transparent" : "#f8fafc",
        p: embedded ? 0 : 3,
        display: embedded ? "block" : { xs: "none", xl: "block" },
        overflowX: "hidden",
        overflowY: embedded ? "visible" : "auto",
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography variant="overline" sx={{ color: "#64748b", letterSpacing: 1.4 }}>
            Requirement Context
          </Typography>
          <Typography variant="h6" fontWeight={700} color="#0f172a">
            {title}
          </Typography>
          {!embedded ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Live project context, metadata, and navigation cues for the current workspace.
            </Typography>
          ) : null}
        </Box>
        <Divider />
        <Stack spacing={1.5}>
          {items.map((item) => (
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
