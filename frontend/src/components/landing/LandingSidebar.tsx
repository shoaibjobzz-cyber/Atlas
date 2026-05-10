import AddBoxOutlinedIcon from "@mui/icons-material/AddBoxOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import { AtlasLogo } from "../../design-system/branding";

type LandingSidebarProps = {
  currentUserName?: string;
  onCreateProject: () => void;
  onLoadDemoProject: () => void;
  onOpenExistingProject: () => void;
  onOpenRecentProjects: () => void;
  onOpenHelp: () => void;
  onSignOut?: () => void;
  loadingDemo?: boolean;
};

export default function LandingSidebar({
  currentUserName,
  onCreateProject,
  onLoadDemoProject,
  onOpenExistingProject,
  onOpenRecentProjects,
  onOpenHelp,
  onSignOut,
  loadingDemo = false,
}: LandingSidebarProps) {
  return (
    <Box
      sx={{
        width: 280,
        minWidth: 280,
        height: "100%",
        maxHeight: "100vh",
        bgcolor: "#132238",
        color: "#f8fafc",
        borderRight: "1px solid rgba(255,255,255,0.08)",
        px: 3,
        py: 3,
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
      }}
    >
      <Stack spacing={3} sx={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden", pr: 0.5 }}>
        <Box>
          <AtlasLogo size="small" />
          <Typography variant="h5" fontWeight={700}>
            Project Hub
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(248,250,252,0.72)", mt: 1 }}>
            Start, open, and review engineering requirement projects from one desktop-style workspace.
          </Typography>
          {currentUserName ? (
            <Typography variant="caption" sx={{ color: "rgba(248,250,252,0.64)", mt: 1.25, display: "block" }}>
              Signed in as {currentUserName}
            </Typography>
          ) : null}
        </Box>

        <Stack spacing={1.25}>
          <Button
            variant="contained"
            startIcon={<AddBoxOutlinedIcon />}
            onClick={onCreateProject}
            sx={{ justifyContent: "flex-start", py: 1.2 }}
          >
            Create New Project
          </Button>
          <Button
            variant="outlined"
            startIcon={<EngineeringOutlinedIcon />}
            onClick={onLoadDemoProject}
            disabled={loadingDemo}
            sx={{
              justifyContent: "flex-start",
              py: 1.2,
              borderColor: "rgba(255,255,255,0.2)",
              color: "#f8fafc",
            }}
          >
            {loadingDemo ? "Loading Demo Project..." : "Load Demo Project"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FolderOpenOutlinedIcon />}
            onClick={onOpenExistingProject}
            sx={{
              justifyContent: "flex-start",
              py: 1.2,
              borderColor: "rgba(255,255,255,0.2)",
              color: "#f8fafc",
            }}
          >
            Open Existing Project
          </Button>
          <Button
            variant="text"
            startIcon={<HistoryOutlinedIcon />}
            onClick={onOpenRecentProjects}
            sx={{ justifyContent: "flex-start", py: 1.2, color: "#cbd5e1" }}
          >
            Recent Projects
          </Button>
          <Button
            variant="text"
            startIcon={<HelpOutlineOutlinedIcon />}
            onClick={onOpenHelp}
            sx={{ justifyContent: "flex-start", py: 1.2, color: "#cbd5e1" }}
          >
            Help
          </Button>
        </Stack>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />

        <Box>
          <Typography variant="subtitle2" fontWeight={600}>
            MVP Focus
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: "rgba(248,250,252,0.72)" }}>
            Deterministic requirement quality checks, structured engineering workflows, and traceable evidence-first feedback.
          </Typography>
        </Box>
      </Stack>

      {onSignOut ? (
        <Box sx={{ pt: 2, mt: 2, borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          <Button
            variant="text"
            startIcon={<LogoutOutlinedIcon />}
            onClick={onSignOut}
            sx={{ justifyContent: "flex-start", py: 1.2, color: "#cbd5e1", width: "100%" }}
          >
            Sign Out
          </Button>
        </Box>
      ) : null}
    </Box>
  );
}
