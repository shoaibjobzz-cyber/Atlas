import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import MoreHorizOutlinedIcon from "@mui/icons-material/MoreHorizOutlined";
import PlayCircleOutlineOutlinedIcon from "@mui/icons-material/PlayCircleOutlineOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AppButton from "../components/common/AppButton";
import AppCompactActionButton from "../components/common/AppCompactActionButton";
import AppIconActionButton from "../components/common/AppIconActionButton";
import WorkspaceCommandBar from "../components/common/WorkspaceCommandBar";
import CreateProjectModal from "../components/landing/CreateProjectModal";
import { AtlasLogo } from "../design-system/branding";
import { useAuth } from "../context/authContextCore";
import { routePaths } from "../routes/routePaths";
import { loadBrakePlatformDemoProject, loadBrakingDemoProject } from "../services/demoApi";
import { deleteProject, fetchProjects } from "../services/projectsApi";
import type { ProjectRecord } from "../types/projects";

type ProjectActionMenuState = {
  project: ProjectRecord;
  anchorEl: HTMLElement;
};

function formatProjectStatus(status: ProjectRecord["status"]) {
  return status === "Archived" ? "Archived" : status;
}

function deriveHealthLabel(project: ProjectRecord) {
  if (project.status === "Archived") {
    return "Archived workspace";
  }
  if (project.status === "Draft") {
    return "Needs baseline content";
  }
  if (project.status === "In Review") {
    return "Review in progress";
  }
  return "Workspace active";
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [searchParams] = useSearchParams();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [actionMenu, setActionMenu] = useState<ProjectActionMenuState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const openGraphProject = searchParams.get("openGraphProject");
    const openMatrixProject = searchParams.get("openMatrixProject");
    const standalone = searchParams.get("standalone");
    if (openGraphProject) {
      navigate(
        `${routePaths.projectTraceabilityGraph(openGraphProject)}${standalone === "1" ? "?standalone=1" : ""}`,
        { replace: true }
      );
      return;
    }
    if (openMatrixProject) {
      navigate(
        `${routePaths.projectTraceabilityMatrix(openMatrixProject)}${standalone === "1" ? "?standalone=1" : ""}`,
        { replace: true }
      );
    }
  }, [navigate, searchParams]);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      try {
        const response = await fetchProjects();
        if (!active) {
          return;
        }
        setProjects(response);
        setProjectsError(null);
      } catch (error) {
        if (!active) {
          return;
        }
        setProjectsError(error instanceof Error ? error.message : "Unable to load projects.");
      } finally {
        if (active) {
          setProjectsLoading(false);
        }
      }
    }

    loadProjects();
    return () => {
      active = false;
    };
  }, []);

  const orderedProjects = useMemo(
    () => [...projects].sort((left, right) => new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()),
    [projects]
  );

  const workspaceStats = useMemo(
    () => [
      { label: "Projects", value: String(orderedProjects.length) },
      { label: "Requirements", value: "—" },
      { label: "Open risks", value: "—" },
      { label: "Recent analyses", value: "—" },
    ],
    [orderedProjects.length]
  );

  const recentProjects = orderedProjects;

  async function handleLoadDemoProject(
    loader: () => Promise<{ project_id: string; project_name: string }>,
    projectKind: ProjectRecord["project_kind"],
    description: string,
    errorMessage: string
  ) {
    setDemoLoading(true);
    setDemoError(null);

    try {
      const result = await loader();
      setProjects((current) => {
        if (current.some((project) => project.id === result.project_id)) {
          return current;
        }
        return [
          {
            id: result.project_id,
            name: result.project_name,
            description,
            status: "In Review",
            project_kind: projectKind,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          ...current,
        ];
      });
      navigate(routePaths.projectDashboard(result.project_id));
    } catch (error) {
      setDemoError(error instanceof Error ? error.message : errorMessage);
    } finally {
      setDemoLoading(false);
    }
  }

  async function handleDeleteProject() {
    if (!deleteTarget) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteProject(deleteTarget.id);
      setProjects((current) => current.filter((project) => project.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete project.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Box
      sx={{
        height: "100%",
        maxHeight: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        bgcolor: "#eef3f8",
        color: "#0f172a",
      }}
    >
      <Box sx={{ maxWidth: 1600, mx: "auto", px: { xs: 2, md: 3 }, py: 2.5, minHeight: "100%" }}>
        <Stack spacing={2}>
          <Paper
            elevation={0}
            sx={{
              border: "1px solid rgba(15,23,42,0.10)",
              bgcolor: "#ffffff",
              borderRadius: 0,
            }}
          >
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ lg: "center" }}
              sx={{ px: 3, py: 2 }}
            >
              <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                <AtlasLogo size="medium" polished />
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 780 }}>
                  Engineering workspace for requirements, traceability, feasibility, DFMEA, and deterministic review workflows.
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                <AppButton hierarchy="primary" startIcon={<AddOutlinedIcon />} onClick={() => setCreateModalOpen(true)}>
                  New Project
                </AppButton>
                <AppCompactActionButton
                  startIcon={<FolderOpenOutlinedIcon />}
                  onClick={() => {
                    if (orderedProjects[0]) {
                      navigate(routePaths.projectDashboard(orderedProjects[0].id));
                    }
                  }}
                  disabled={orderedProjects.length === 0}
                >
                  Open Project
                </AppCompactActionButton>
                <AppCompactActionButton
                  startIcon={<PlayCircleOutlineOutlinedIcon />}
                  onClick={() =>
                    void handleLoadDemoProject(
                      loadBrakingDemoProject,
                      "Standard",
                      "Seeded braking-system project used for deterministic MVP verification.",
                      "Unable to load the braking system demo project."
                    )
                  }
                  disabled={demoLoading}
                >
                  {demoLoading ? "Loading Demo..." : "Load Demo"}
                </AppCompactActionButton>
                <AppCompactActionButton
                  startIcon={<PlayCircleOutlineOutlinedIcon />}
                  onClick={() =>
                    void handleLoadDemoProject(
                      loadBrakePlatformDemoProject,
                      "Platform",
                      "Platform-level braking control architecture used to organize multiple braking features.",
                      "Unable to load the brake control platform demo project."
                    )
                  }
                  disabled={demoLoading}
                >
                  {demoLoading ? "Loading Demo..." : "Load Platform Demo"}
                </AppCompactActionButton>
                <AppIconActionButton
                  title="Open workspace actions"
                  ariaLabel="Open workspace actions"
                  onClick={(event) =>
                    setActionMenu({
                      project: orderedProjects[0] ?? {
                        id: "__workspace__",
                        name: "Workspace",
                        description: null,
                        status: "Draft",
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                      },
                      anchorEl: event.currentTarget,
                    })
                  }
                >
                  <MoreHorizOutlinedIcon fontSize="small" />
                </AppIconActionButton>
              </Stack>
            </Stack>

            <WorkspaceCommandBar
              menus={[
                {
                  key: "file",
                  label: "File",
                  items: [
                    { label: "New Project", onClick: () => setCreateModalOpen(true) },
                    {
                      label: "Open Most Recent Project",
                      onClick: () => orderedProjects[0] && navigate(routePaths.projectDashboard(orderedProjects[0].id)),
                      disabled: orderedProjects.length === 0,
                    },
                  ],
                },
                {
                  key: "tools",
                  label: "Tools",
                  items: [
                    {
                      label: demoLoading ? "Loading Demo..." : "Load Demo Project",
                      onClick: () =>
                        void handleLoadDemoProject(
                          loadBrakingDemoProject,
                          "Standard",
                          "Seeded braking-system project used for deterministic MVP verification.",
                          "Unable to load the braking system demo project."
                        ),
                      disabled: demoLoading,
                    },
                    {
                      label: demoLoading ? "Loading Demo..." : "Load Platform Demo",
                      onClick: () =>
                        void handleLoadDemoProject(
                          loadBrakePlatformDemoProject,
                          "Platform",
                          "Platform-level braking control architecture used to organize multiple braking features.",
                          "Unable to load the brake control platform demo project."
                        ),
                      disabled: demoLoading,
                    },
                  ],
                },
                {
                  key: "view",
                  label: "View",
                  items: recentProjects.map((project) => ({
                    label: `Open ${project.name}`,
                    onClick: () => navigate(routePaths.projectDashboard(project.id)),
                  })),
                },
                {
                  key: "more",
                  label: "More",
                  items: [
                    {
                      label: "Sign Out",
                      onClick: () => {
                        void signOut();
                        navigate(routePaths.login);
                      },
                    },
                  ],
                },
              ]}
              statusContent={user?.display_name ? `Signed in as ${user.display_name}` : "Workspace ready"}
            />
          </Paper>

          <Paper elevation={0} sx={{ border: "1px solid rgba(15,23,42,0.10)", bgcolor: "#ffffff", borderRadius: 0 }}>
            <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} sx={{ px: 2.5, py: 1.25 }} useFlexGap flexWrap="wrap">
              {workspaceStats.map((item) => (
                <Box key={item.label} sx={{ minWidth: 150, pr: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#0f172a" sx={{ mt: 0.2 }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>

          {demoError ? <Alert severity="error">{demoError}</Alert> : null}
          {projectsError ? <Alert severity="warning">{projectsError}</Alert> : null}
          {deleteError ? <Alert severity="error">{deleteError}</Alert> : null}

          <Stack direction={{ xs: "column", xl: "row" }} spacing={2} alignItems="stretch">
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                minWidth: 0,
                border: "1px solid rgba(15,23,42,0.10)",
                bgcolor: "#ffffff",
                borderRadius: 0,
              }}
            >
              <Stack spacing={0}>
                <Box sx={{ px: 2.5, py: 1.75, borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
                  <Typography variant="h6" fontWeight={700}>
                    Project Workspace
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                    Persisted engineering projects, launcher actions, and workspace health at a glance.
                  </Typography>
                </Box>

                {projectsLoading ? (
                  <Box sx={{ px: 2.5, py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Loading persisted projects...
                    </Typography>
                  </Box>
                ) : null}

                {!projectsLoading && orderedProjects.length === 0 ? (
                  <Box sx={{ px: 2.5, py: 4 }}>
                    <Stack spacing={1.5} sx={{ maxWidth: 620 }}>
                      <Typography variant="h6" fontWeight={700}>
                        No projects available
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Create a project to start a clean engineering workspace, or load the braking-system demo when you need seeded requirements and traceability data.
                      </Typography>
                      <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
                        <AppButton hierarchy="primary" startIcon={<AddOutlinedIcon />} onClick={() => setCreateModalOpen(true)}>
                          Create Project
                        </AppButton>
                      <AppCompactActionButton
                        startIcon={<PlayCircleOutlineOutlinedIcon />}
                        onClick={() =>
                          void handleLoadDemoProject(
                            loadBrakingDemoProject,
                            "Standard",
                            "Seeded braking-system project used for deterministic MVP verification.",
                            "Unable to load the braking system demo project."
                          )
                        }
                        disabled={demoLoading}
                      >
                        {demoLoading ? "Loading Demo..." : "Load Demo Project"}
                      </AppCompactActionButton>
                      <AppCompactActionButton
                        startIcon={<PlayCircleOutlineOutlinedIcon />}
                        onClick={() =>
                          void handleLoadDemoProject(
                            loadBrakePlatformDemoProject,
                            "Platform",
                            "Platform-level braking control architecture used to organize multiple braking features.",
                            "Unable to load the brake control platform demo project."
                          )
                        }
                        disabled={demoLoading}
                      >
                        {demoLoading ? "Loading Demo..." : "Load Platform Demo"}
                      </AppCompactActionButton>
                      </Stack>
                    </Stack>
                  </Box>
                ) : null}

                {!projectsLoading && orderedProjects.length > 0 ? (
                  <TableContainer sx={{ minHeight: 0 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Project name</TableCell>
                          <TableCell>Identifier</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Last updated</TableCell>
                          <TableCell>Requirements count</TableCell>
                          <TableCell>Health / warnings</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {orderedProjects.map((project) => (
                          <TableRow hover key={project.id}>
                            <TableCell sx={{ minWidth: 260 }}>
                              <Typography fontWeight={700} color="#0f172a">
                                {project.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {project.description || "Persisted engineering workspace ready for requirements and analysis."}
                              </Typography>
                            </TableCell>
                            <TableCell className="atlas-code">{project.id}</TableCell>
                            <TableCell>
                              <Chip size="small" label={formatProjectStatus(project.status)} color={project.status === "Active" ? "success" : project.status === "In Review" ? "warning" : "default"} variant="outlined" />
                            </TableCell>
                            <TableCell>{new Date(project.updated_at).toLocaleString()}</TableCell>
                            <TableCell>—</TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">
                                {deriveHealthLabel(project)}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                <AppCompactActionButton
                                  variant="text"
                                  startIcon={<FolderOpenOutlinedIcon />}
                                  onClick={() => navigate(routePaths.projectDashboard(project.id))}
                                >
                                  Open
                                </AppCompactActionButton>
                                <AppIconActionButton
                                  title={`More actions for ${project.name}`}
                                  ariaLabel={`More actions for ${project.name}`}
                                  onClick={(event) => setActionMenu({ project, anchorEl: event.currentTarget })}
                                >
                                  <MoreHorizOutlinedIcon fontSize="small" />
                                </AppIconActionButton>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : null}
              </Stack>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                width: { xs: "100%", xl: 360 },
                flexShrink: 0,
                border: "1px solid rgba(15,23,42,0.10)",
                bgcolor: "#ffffff",
                borderRadius: 0,
              }}
            >
              <Stack spacing={0}>
                <Box sx={{ px: 2.25, py: 1.75, borderBottom: "1px solid rgba(15,23,42,0.08)" }}>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Recent Projects
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                    Most recently updated workspaces.
                  </Typography>
                </Box>

                {recentProjects.length === 0 ? (
                  <Box sx={{ px: 2.25, py: 2.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      No recent projects yet.
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    {recentProjects.map((project, index) => (
                      <Box
                        key={project.id}
                        sx={{
                          px: 2.25,
                          py: 1.4,
                          borderBottom: index < recentProjects.length - 1 ? "1px solid rgba(15,23,42,0.08)" : "none",
                        }}
                      >
                        <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {project.name}
                            </Typography>
                            <Typography variant="caption" className="atlas-code" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                              {project.id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35 }}>
                              {new Date(project.updated_at).toLocaleString()}
                            </Typography>
                          </Box>
                          <AppCompactActionButton variant="text" onClick={() => navigate(routePaths.projectDashboard(project.id))}>
                            Open
                          </AppCompactActionButton>
                        </Stack>
                      </Box>
                    ))}
                  </Box>
                )}
              </Stack>
            </Paper>
          </Stack>
        </Stack>
      </Box>

      <Menu
        anchorEl={actionMenu?.anchorEl ?? null}
        open={Boolean(actionMenu)}
        onClose={() => setActionMenu(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: 220,
              borderRadius: 1,
              border: "1px solid rgba(15,23,42,0.12)",
              boxShadow: "0 10px 24px rgba(15,23,42,0.08)",
            },
          },
        }}
      >
        {actionMenu?.project.id === "__workspace__" ? (
          [
            <MenuItem key="workspace-settings" onClick={() => setActionMenu(null)} sx={{ gap: 1 }}>
              <SettingsOutlinedIcon fontSize="small" />
              Settings
            </MenuItem>,
            <MenuItem
              key="workspace-signout"
              onClick={() => {
                setActionMenu(null);
                void signOut();
                navigate(routePaths.login);
              }}
              sx={{ gap: 1 }}
            >
              <MoreHorizOutlinedIcon fontSize="small" />
              More
            </MenuItem>,
          ]
        ) : (
          <>
            <MenuItem
              onClick={() => {
                if (!actionMenu) {
                  return;
                }
                navigate(routePaths.projectDashboard(actionMenu.project.id));
                setActionMenu(null);
              }}
              sx={{ gap: 1 }}
            >
              <FolderOpenOutlinedIcon fontSize="small" />
              Open
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (!actionMenu) {
                  return;
                }
                navigate(routePaths.projectSettings(actionMenu.project.id));
                setActionMenu(null);
              }}
              sx={{ gap: 1 }}
            >
              <SettingsOutlinedIcon fontSize="small" />
              Settings
            </MenuItem>
            <MenuItem
              onClick={() => {
                if (!actionMenu) {
                  return;
                }
                setDeleteTarget(actionMenu.project);
                setActionMenu(null);
              }}
              sx={{ gap: 1, color: "#b91c1c" }}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
              Delete
            </MenuItem>
          </>
        )}
      </Menu>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)}>
        <DialogTitle>Delete project</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget
              ? `Delete ${deleteTarget.name} and remove it from the workspace list?`
              : "Delete the selected project?"}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <AppButton hierarchy="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </AppButton>
          <AppButton hierarchy="danger" onClick={() => void handleDeleteProject()} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete"}
          </AppButton>
        </DialogActions>
      </Dialog>

      <CreateProjectModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(project) => {
          setProjects((current) => [project, ...current.filter((item) => item.id !== project.id)]);
          navigate(routePaths.projectDashboard(project.id));
        }}
      />
    </Box>
  );
}
