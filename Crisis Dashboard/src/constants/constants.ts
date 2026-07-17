// ─────────────────────────────────────────────────────────────────────────────
// Constants — CME Space Weather Intelligence Dashboard
// ─────────────────────────────────────────────────────────────────────────────

// ── Route Paths ──────────────────────────────────────────────────────────────

export const ROUTES = {
  LANDING:              "/",
  MISSION_CONTROL:      "/mission-control",
  DATA_FUSION:          "/data-fusion",
  AI_EXPLAINABILITY:    "/ai-explainability",
  EVENT_ANALYSIS:       "/event-analysis",
  HISTORICAL_ANALYTICS: "/historical-analytics",
  SETTINGS:             "/settings",
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = (typeof ROUTES)[RouteKey];

// ── Navigation Items ─────────────────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  path: RoutePath;
  iconName: string; // Lucide icon name string — resolved in Sidebar component
  badge?: string;   // e.g. "LIVE", "BETA"
}

export const NAV_ITEMS: NavItem[] = [
  {
    id:       "mission-control",
    label:    "Mission Control",
    path:     ROUTES.MISSION_CONTROL,
    iconName: "LayoutDashboard",
    badge:    "LIVE",
  },
  {
    id:       "data-fusion",
    label:    "Data Fusion",
    path:     ROUTES.DATA_FUSION,
    iconName: "Satellite",
  },
  {
    id:       "ai-explainability",
    label:    "AI Explainability",
    path:     ROUTES.AI_EXPLAINABILITY,
    iconName: "BrainCircuit",
  },
  {
    id:       "event-analysis",
    label:    "Event Analysis",
    path:     ROUTES.EVENT_ANALYSIS,
    iconName: "Zap",
  },
  {
    id:       "historical-analytics",
    label:    "Historical Analytics",
    path:     ROUTES.HISTORICAL_ANALYTICS,
    iconName: "BarChart3",
  },
  {
    id:       "settings",
    label:    "Settings",
    path:     ROUTES.SETTINGS,
    iconName: "Settings",
  },
];

// ── CME Severity Config ───────────────────────────────────────────────────────

export const CME_SEVERITY_CONFIG = {
  minor:    { label: "Minor",    color: "#3B82F6", bgColor: "rgba(59,130,246,0.12)"  },
  moderate: { label: "Moderate", color: "#F59E0B", bgColor: "rgba(245,158,11,0.12)" },
  strong:   { label: "Strong",   color: "#F97316", bgColor: "rgba(249,115,22,0.12)" },
  extreme:  { label: "Extreme",  color: "#EF4444", bgColor: "rgba(239,68,68,0.12)"  },
} as const;

// ── Risk Level Config ─────────────────────────────────────────────────────────

export const RISK_LEVEL_CONFIG = {
  low:      { label: "Low",      color: "#10B981", bgColor: "rgba(16,185,129,0.12)"  },
  elevated: { label: "Elevated", color: "#F59E0B", bgColor: "rgba(245,158,11,0.12)" },
  high:     { label: "High",     color: "#F97316", bgColor: "rgba(249,115,22,0.12)" },
  extreme:  { label: "Extreme",  color: "#EF4444", bgColor: "rgba(239,68,68,0.12)"  },
} as const;

// ── Kp / Dst Thresholds ───────────────────────────────────────────────────────

export const KP_THRESHOLDS = {
  QUIET:     { max: 3,   label: "Quiet",    level: "low"      },
  UNSETTLED: { max: 4,   label: "Unsettled",level: "elevated" },
  STORM_G1:  { max: 5,   label: "G1 Storm", level: "elevated" },
  STORM_G2:  { max: 6,   label: "G2 Storm", level: "high"     },
  STORM_G3:  { max: 7,   label: "G3 Storm", level: "high"     },
  STORM_G4:  { max: 8,   label: "G4 Storm", level: "extreme"  },
  STORM_G5:  { max: 9,   label: "G5 Storm", level: "extreme"  },
} as const;

// ── App Meta ──────────────────────────────────────────────────────────────────

export const APP_META = {
  name:        "Helios",
  fullName:    "CME Space Weather Intelligence Dashboard",
  version:     "1.0.0",
  description: "AI-powered Coronal Mass Ejection monitoring — Aditya-L1 · SOHO · DSCOVR · GOES",
  tagline:     "Real-time Space Weather Intelligence",
} as const;

// ── Data Refresh Intervals (ms) ───────────────────────────────────────────────

export const REFRESH_INTERVALS = {
  MISSION_STATUS:  30_000,   // 30 s
  SATELLITE_DATA:  60_000,   // 1 min
  CME_EVENTS:      120_000,  // 2 min
  PREDICTIONS:     300_000,  // 5 min
} as const;
