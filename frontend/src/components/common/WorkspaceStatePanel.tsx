import { Alert, CircularProgress, Paper, Stack, Typography } from "@mui/material";

type WorkspaceStatePanelProps = {
  state: "loading" | "empty" | "error";
  title: string;
  message: string;
};

export default function WorkspaceStatePanel({ state, title, message }: WorkspaceStatePanelProps) {
  if (state === "loading") {
    return (
      <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(15,23,42,0.10)", bgcolor: "#ffffff" }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Stack spacing={0.25}>
            <Typography variant="subtitle2" fontWeight={700}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {message}
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    );
  }

  return (
    <Alert severity={state === "error" ? "error" : "info"} sx={{ border: "1px solid rgba(15,23,42,0.08)" }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.25 }}>
        {title}
      </Typography>
      <Typography variant="body2">{message}</Typography>
    </Alert>
  );
}
