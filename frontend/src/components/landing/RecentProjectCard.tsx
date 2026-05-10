import ArrowForwardOutlinedIcon from "@mui/icons-material/ArrowForwardOutlined";
import { Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { routePaths } from "../../routes/routePaths";
import type { RecentProject } from "../../types/projects";

type RecentProjectCardProps = {
  project: RecentProject;
};

export default function RecentProjectCard({ project }: RecentProjectCardProps) {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: "1px solid rgba(15,23,42,0.12)",
        bgcolor: "#ffffff",
        minHeight: 188,
      }}
    >
      <Stack spacing={1.5} sx={{ height: "100%" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <div>
            <Typography variant="h6" fontWeight={700} color="#0f172a">
              {project.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {project.owner}
            </Typography>
          </div>
          <Chip label={project.status} size="small" color="primary" variant="outlined" />
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {project.summary}
        </Typography>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="caption" color="text.secondary">
            {project.updatedAt}
          </Typography>
          <Button
            size="small"
            endIcon={<ArrowForwardOutlinedIcon />}
            onClick={() => navigate(routePaths.projectDashboard(project.id))}
          >
            Open Dashboard
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

