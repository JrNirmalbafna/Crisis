// ─────────────────────────────────────────────────────────────────────────────
// router/index.tsx
// Landing page is at root — no sidebar/topbar.
// All dashboard pages are nested under DashboardLayout (sidebar + topbar).
// ─────────────────────────────────────────────────────────────────────────────
import { createBrowserRouter, Navigate } from "react-router-dom";
import { ROUTES } from "../constants/constants";

// ── Layout ────────────────────────────────────────────────────────────────────
import DashboardLayout from "../layouts/DashboardLayout";

// ── Pages ─────────────────────────────────────────────────────────────────────
import LandingPage               from "../pages/landing";
import MissionControlPage        from "../pages/mission-control";
import DataFusionPage            from "../pages/data-fusion";
import AIExplainabilityPage      from "../pages/ai-explainability";
import EventAnalysisPage         from "../pages/event-analysis";
import HistoricalAnalyticsPage   from "../pages/historical-analytics";
import SettingsPage              from "../pages/settings";

export const router = createBrowserRouter([
  // ── Landing — standalone, no layout shell ────────────────────────────────
  {
    path:    ROUTES.LANDING,
    element: <LandingPage />,
  },

  // ── Dashboard shell — sidebar + topbar wraps all six pages ───────────────
  {
    element: <DashboardLayout />,
    children: [
      {
        path:    ROUTES.MISSION_CONTROL,
        element: <MissionControlPage />,
      },
      {
        path:    ROUTES.DATA_FUSION,
        element: <DataFusionPage />,
      },
      {
        path:    ROUTES.AI_EXPLAINABILITY,
        element: <AIExplainabilityPage />,
      },
      {
        path:    ROUTES.EVENT_ANALYSIS,
        element: <EventAnalysisPage />,
      },
      {
        path:    ROUTES.HISTORICAL_ANALYTICS,
        element: <HistoricalAnalyticsPage />,
      },
      {
        path:    ROUTES.SETTINGS,
        element: <SettingsPage />,
      },
    ],
  },

  // ── Catch-all → redirect to Mission Control ───────────────────────────────
  {
    path: "*",
    element: <Navigate to={ROUTES.MISSION_CONTROL} replace />,
  },
]);
