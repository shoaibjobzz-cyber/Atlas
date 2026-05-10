import { useEffect, useState } from "react";
import { Alert, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { requestJson } from "../../services/httpClient";
import { fetchProjects, type ProjectRecord } from "../../services/projectsApi";

type HealthResponse = {
  status: string;
  service: string;
};

export default function SystemStatusPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [healthResponse, projectsResponse] = await Promise.all([
          requestJson<HealthResponse>("/health"),
          fetchProjects(),
        ]);
        if (!active) {
          return;
        }
        setHealth(healthResponse);
        setProjects(projectsResponse);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load platform readiness.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(15,23,42,0.12)", bgcolor: "#ffffff" }}>
      <Typography variant="h6" fontWeight={700} color="#0f172a" gutterBottom>
        Platform Readiness
      </Typography>

      {loading ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <CircularProgress size={20} />
          <Typography variant="body2">Checking backend connectivity...</Typography>
        </Stack>
      ) : null}

      {error ? <Alert severity="error">{error}</Alert> : null}

      {!loading && !error ? (
        <Stack spacing={1}>
          <Typography variant="body2">Health: {health?.status ?? "unknown"}</Typography>
          <Typography variant="body2">Service: {health?.service ?? "unknown"}</Typography>
          <Typography variant="body2">Projects available: {projects.length}</Typography>
        </Stack>
      ) : null}
    </Paper>
  );
}
