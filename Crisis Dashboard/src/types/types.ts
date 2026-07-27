// ─────────────────────────────────────────────────────────────────────────────
// Shared TypeScript Interfaces — CME Space Weather Intelligence Dashboard
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared Enums / Unions ───────────────────────────────────────────────────

export type Severity = "low" | "medium" | "high" | "critical";
export type AlertLevel = "Normal" | "Elevated" | "High" | "Extreme";
export type ValidationStatus = "Passed" | "Flagged" | "Failed" | "N/A";
export type SystemHealth = "healthy" | "degraded" | "outage";
export type CMEStatus = "incoming" | "active" | "passed" | "archived";
export type CMEEventType = "Halo CME" | "Solar Flare" | "Solar Wind" | "SEP" | "CIR";
export type ModelName = "helios-consensus" | "lstm-ensemble" | "physics-based" | "empirical";
export type SatelliteId = "ADITYA_L1" | "SOHO" | "DSCOVR" | "GOES";
export type SatelliteStatus = "nominal" | "warning" | "critical" | "inactive";

// ── System & Mission Status ─────────────────────────────────────────────────

export interface MissionStatus {
  activeSatellites: number;
  totalSatellites: number;
  activeAlerts: number;
  pendingPredictions: number;
  lastUpdated: string; // ISO-8601
  systemHealth: SystemHealth;
}

export interface SystemStatusOverview {
  statusText: string;
  statusColor: "green" | "amber" | "red"; // UI driver
  alertLevel: AlertLevel;
  /** 0-100 percentage representing data stream integrity */
  dataQuality: number;
  physicsValidation: ValidationStatus;
  /** 0-100 percentage representing AI model confidence */
  aiConfidence: number;
}

// ── CME Events ──────────────────────────────────────────────────────────────

export interface CMEEvent {
  id: string;
  /** ISO-8601 detection timestamp */
  detectedAt: string;
  /** Predicted Earth-arrival time (ISO-8601) */
  estimatedArrival?: string;
  severity: Severity;
  status: CMEStatus;
  /** CME propagation speed in km/s */
  speed?: number;
  /** Angular width in degrees */
  angularWidth?: number;
  /** Source satellite IDs */
  sources: SatelliteId[];
  /** Confidence score 0–1 */
  confidence: number;
  description?: string;
  type: CMEEventType;
}

// ── Predictions ─────────────────────────────────────────────────────────────

export interface PredictionResult {
  id: string;
  eventId?: string;
  model: ModelName;
  /** Predicted Kp index (0–9 scale) */
  kpIndex?: number;
  /** Predicted Dst index in nT */
  dstIndex?: number;
  /** Geomagnetic storm probability 0–1 */
  stormProbability: number;
  /** Prediction horizon in hours */
  horizonHours: number;
  /** Model confidence / epistemic uncertainty 0–1 */
  uncertainty: number;
  /** Indicates if physics-based constraints were satisfied */
  physicsValidated: boolean;
  /** Lower bound error range */
  errorRangeMin: number;
  /** Upper bound error range */
  errorRangeMax: number;
  createdAt: string; // ISO-8601
}

// ── Risk Assessment ─────────────────────────────────────────────────────────

export interface ImpactRisk {
  id: string;
  eventId?: string;
  overallRisk: Severity;
  /** 0–100 composite risk score */
  riskScore: number;
  
  gpsRisk: Severity;
  satelliteRisk: Severity;
  powerGridRisk: Severity;
  airlinesRisk: Severity;
  astronautRisk: Severity;
  
  generatedAt: string; // ISO-8601
  validUntil: string;  // ISO-8601
  recommendations: string[];
}

// ── Telemetry & Fusion ──────────────────────────────────────────────────────

export interface SolarParameter {
  timestamp: string; // ISO-8601
  /** Solar wind speed in km/s */
  speed: number;
  /** Proton density in p/cm³ */
  density: number;
  /** Magnetic Field (Bz) in nT */
  magneticField: number;
  /** Thermal speed in km/s */
  thermalSpeed: number;
  /** Energy flux */
  energyFlux: number;
}

export type OrbitPosition = 'L1 Lagrange Point' | 'Earth Orbit';

export interface SatelliteInfo {
  id: string; // e.g. 'Aditya-L1', 'SOHO', 'DSCOVR', 'GOES-16' — matches SatelliteHealth.name
  name: string;
  agency: string;
  launchYear: number;
  role: string;
  orbitPosition: OrbitPosition;
}

export interface SatelliteHealth {
  name: string;
  health: SatelliteStatus;
  /** Signal strength or quality */
  signal: string;
  /** Latency in milliseconds */
  latency: number;
  /** Percentage of missing packets */
  missingPercent: number;
  /** 0-100 score indicating data reliability */
  trustScore: number;
  /** 0-100 percentage contribution to consensus */
  contributionPercent: number;
}

export interface FusionResult {
  timestamp: string; // ISO-8601
  parameterName: string;
  /** Map of satellite ID to its individual measurement */
  individualReadings: Record<string, number>;
  /** The final fused/consensus value */
  fusedValue: number;
}

// ── API / Generic ───────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type ApiResponse<T> = { success: true; data: T } | { success: false; error: ApiError };

// ── UI State ─────────────────────────────────────────────────────────────────

export type Theme = "dark";

export interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
}
