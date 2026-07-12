import { Suspense, lazy } from "react";
import { Box } from "@mui/material";
import { Navigate, Route, Routes } from "react-router-dom";
import WorkspaceStatePanel from "../components/common/WorkspaceStatePanel";
import { useAuth } from "../context/authContextCore";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import ProjectDashboardPage from "../pages/ProjectDashboardPage";
import ProjectSettingsPage from "../pages/ProjectSettingsPage";
import RequirementDetailPage from "../pages/RequirementDetailPage";
import RequirementFormPage from "../pages/RequirementFormPage";
import RequirementsListPage from "../pages/RequirementsListPage";
import { routePaths } from "./routePaths";

const DesignDataPage = lazy(() => import("../pages/DesignDataPage"));
const DfmeaPage = lazy(() => import("../pages/DfmeaPage"));
const EcuRequirementMergerPage = lazy(() => import("../pages/EcuRequirementMergerPage"));
const ReportsPage = lazy(() => import("../pages/ReportsPage"));
const RequirementGenerationPage = lazy(() => import("../pages/RequirementGenerationPage"));
const TraceabilityGraphPage = lazy(() => import("../pages/TraceabilityGraphPage"));
const TraceabilityMatrixPage = lazy(() => import("../pages/TraceabilityMatrixPage"));
const ValidationPage = lazy(() => import("../pages/ValidationPage"));

function RouteLoadingFallback() {
  return (
    <Box
      sx={{
        minHeight: "100%",
        p: { xs: 2, md: 3 },
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
      }}
    >
      <Box sx={{ width: "min(880px, 100%)", mt: { xs: 2, md: 4 } }}>
        <WorkspaceStatePanel
          state="loading"
          title="Loading workspace"
          message="Preparing the selected view and loading its project data."
        />
      </Box>
    </Box>
  );
}

function LazyRoute({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <RouteLoadingFallback />;
  }

  if (!user) {
    return <Navigate to={routePaths.login} replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path={routePaths.login} element={<LoginPage />} />
      <Route path={routePaths.landing} element={<ProtectedRoute><LandingPage /></ProtectedRoute>} />
      <Route path={routePaths.projectDashboard()} element={<ProtectedRoute><ProjectDashboardPage /></ProtectedRoute>} />
      <Route path={routePaths.projectSettings()} element={<ProtectedRoute><ProjectSettingsPage /></ProtectedRoute>} />
      <Route
        path={routePaths.projectRequirementGeneration()}
        element={
          <ProtectedRoute>
            <LazyRoute>
              <RequirementGenerationPage />
            </LazyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routePaths.projectEcuRequirementMerger()}
        element={
          <ProtectedRoute>
            <LazyRoute>
              <EcuRequirementMergerPage />
            </LazyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routePaths.projectTraceabilityGraph()}
        element={
          <ProtectedRoute>
            <LazyRoute>
              <TraceabilityGraphPage />
            </LazyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routePaths.projectTraceabilityMatrix()}
        element={
          <ProtectedRoute>
            <LazyRoute>
              <TraceabilityMatrixPage />
            </LazyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routePaths.projectDesignData()}
        element={
          <ProtectedRoute>
            <LazyRoute>
              <DesignDataPage />
            </LazyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routePaths.projectDfmea()}
        element={
          <ProtectedRoute>
            <LazyRoute>
              <DfmeaPage />
            </LazyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routePaths.projectValidation()}
        element={
          <ProtectedRoute>
            <LazyRoute>
              <ValidationPage />
            </LazyRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path={routePaths.projectReports()}
        element={
          <ProtectedRoute>
            <LazyRoute>
              <ReportsPage />
            </LazyRoute>
          </ProtectedRoute>
        }
      />
      <Route path={routePaths.projectRequirements()} element={<ProtectedRoute><RequirementsListPage /></ProtectedRoute>} />
      <Route path={routePaths.projectRequirementNew()} element={<ProtectedRoute><RequirementFormPage /></ProtectedRoute>} />
      <Route path={routePaths.projectRequirementDetail()} element={<ProtectedRoute><RequirementDetailPage /></ProtectedRoute>} />
      <Route path={routePaths.projectRequirementEdit()} element={<ProtectedRoute><RequirementFormPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={routePaths.landing} replace />} />
    </Routes>
  );
}
