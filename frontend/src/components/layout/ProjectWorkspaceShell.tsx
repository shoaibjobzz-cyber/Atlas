import { Box } from "@mui/material";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  createProjectFeature,
  fetchProject,
  fetchProjectFeatures,
  type ProjectFeatureCreateInput,
  type ProjectFeatureRecord,
  type ProjectRecord,
} from "../../services/projectsApi";
import DashboardLeftNav from "../dashboard/DashboardLeftNav";
import DashboardTopToolbar from "../dashboard/DashboardTopToolbar";
import { buildDashboardNavItems } from "../../data/dashboard";
import type { DashboardNavKey } from "../../types/dashboard";
import { getProjectNavPath, routePaths } from "../../routes/routePaths";
import type { DashboardSummary } from "../../types/dashboard";
import ProjectFeatureSidebar from "./ProjectFeatureSidebar";

type ProjectWorkspaceShellProps = {
  projectId: string;
  activeNavKey: DashboardNavKey;
  children: ReactNode;
  rightPanel?: ReactNode;
  projectOverride?: ProjectRecord | null;
};

function prettifyProjectName(projectId: string): string {
  return (
    projectId
      .split("-")
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "Project Workspace"
  );
}

function formatDateLabel(value: string): string {
  return new Date(value).toLocaleString();
}

function buildToolbarSummary(
  projectId: string,
  project: ProjectRecord | null,
  currentUserName?: string
): DashboardSummary {
  if (!project) {
    return {
      projectName: prettifyProjectName(projectId),
      projectId,
      owner: currentUserName ?? "Signed-in user",
      status: "Loading",
      baseline: "Current workspace",
      revision: "Loading metadata",
      updatedAt: "Loading...",
    };
  }

  return {
    projectName: project.name,
    projectId: project.id,
    owner: currentUserName ?? "Signed-in user",
    status: project.status,
    baseline: `Created ${new Date(project.created_at).toLocaleDateString()}`,
    revision: "Current workspace",
    updatedAt: formatDateLabel(project.updated_at),
  };
}

export default function ProjectWorkspaceShell({
  projectId,
  activeNavKey,
  children,
  rightPanel,
  projectOverride,
}: ProjectWorkspaceShellProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [navPinned, setNavPinned] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    return window.localStorage.getItem("atlas.projectNavPinned") !== "false";
  });
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [features, setFeatures] = useState<ProjectFeatureRecord[]>([]);

  const effectiveProject = projectOverride ?? project;
  const summary = buildToolbarSummary(projectId, effectiveProject, user?.display_name);
  const isPlatformProject = effectiveProject?.project_kind === "Platform";
  const selectedFeatureId = useMemo(() => {
    const currentParams = new URLSearchParams(location.search);
    return currentParams.get("featureId");
  }, [location.search]);

  useEffect(() => {
    let active = true;

    setProject(null);
    setFeatures([]);

    async function loadProject() {
      try {
        const response = await fetchProject(projectId);
        if (!active) {
          return;
        }
        setProject(response);
        if (response.project_kind === "Platform") {
          try {
            const featureResponse = await fetchProjectFeatures(projectId);
            if (!active) {
              return;
            }
            setFeatures(featureResponse);
          } catch {
            if (!active) {
              return;
            }
            setFeatures([]);
          }
        }
      } catch {
        if (!active) {
          return;
        }
        setProject(null);
        setFeatures([]);
      }
    }

    void loadProject();
    return () => {
      active = false;
    };
  }, [projectId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    console.log("[Atlas][PlatformSidebar]", {
      projectId,
      projectKind: effectiveProject?.project_kind ?? null,
      isPlatformProject,
      featureCount: features.length,
      selectedFeatureId,
      mounted: isPlatformProject,
    });
  }, [effectiveProject?.project_kind, features.length, isPlatformProject, projectId, selectedFeatureId]);

  function handleTogglePinned() {
    setNavPinned((current) => {
      const next = !current;
      window.localStorage.setItem("atlas.projectNavPinned", String(next));
      return next;
    });
  }

  function buildCurrentPageSearch(nextFeatureId: string | null): string {
    const params = new URLSearchParams(location.search);
    if (nextFeatureId) {
      params.set("featureId", nextFeatureId);
    } else {
      params.delete("featureId");
    }
    const nextSearch = params.toString();
    return nextSearch ? `?${nextSearch}` : "";
  }

  function buildFeatureContextSearch(nextFeatureId: string | null): string {
    if (!nextFeatureId) {
      return "";
    }
    return `?featureId=${encodeURIComponent(nextFeatureId)}`;
  }

  async function handleCreateFeature(payload: ProjectFeatureCreateInput) {
    await createProjectFeature(projectId, payload);
    if ((effectiveProject ?? project)?.project_kind === "Platform") {
      const featureResponse = await fetchProjectFeatures(projectId);
      setFeatures(featureResponse);
    }
  }

  return (
    <Box
      sx={{
        height: "100vh",
        maxHeight: "100vh",
        bgcolor: "#edf2f8",
        display: "flex",
        overflow: "hidden",
      }}
    >
      <DashboardLeftNav
        items={buildDashboardNavItems(projectId)}
        activeKey={activeNavKey}
        pinned={navPinned}
        onTogglePinned={handleTogglePinned}
        onSelect={(item) => {
          if (item.disabled) {
            return;
          }
          navigate({
            pathname: getProjectNavPath(projectId, item.key),
            search: buildFeatureContextSearch(selectedFeatureId),
          });
        }}
      />

      <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <DashboardTopToolbar
          summary={summary}
          currentUserName={user?.display_name}
          onOpenSettings={() => navigate(routePaths.projectSettings(projectId))}
          onSignOut={async () => {
            await signOut();
            navigate("/login");
          }}
          onCloseProject={() => navigate("/")}
        />
        <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", overflow: "hidden" }}>
          {isPlatformProject ? (
            <ProjectFeatureSidebar
              projectId={projectId}
              projectName={effectiveProject.name}
              features={features}
              selectedFeatureId={selectedFeatureId}
              onSelectFeature={(featureId) =>
                navigate({
                  pathname: location.pathname,
                  search: buildCurrentPageSearch(featureId),
                })
              }
              onCreateFeature={handleCreateFeature}
            />
          ) : null}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              overflowX: "auto",
              overflowY: "auto",
            }}
          >
            {children}
          </Box>
          {rightPanel}
        </Box>
      </Box>
    </Box>
  );
}
