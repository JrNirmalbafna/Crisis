import type {
  MissionStatus,
  SystemStatusOverview,
  CMEEvent,
  PredictionResult,
  ImpactRisk,
  SolarParameter,
  SatelliteHealth,
  FusionResult,
} from "../types/types";

// ── Mission Status & Overview ────────────────────────────────────────────────

export const mockMissionStatus: MissionStatus = {
  activeSatellites: 4,
  totalSatellites: 4,
  activeAlerts: 2,
  pendingPredictions: 0,
  lastUpdated: new Date().toISOString(),
  systemHealth: "healthy",
};

export const mockCurrentEventStatus: SystemStatusOverview = {
  statusText: "Event Detected",
  statusColor: "amber",
  alertLevel: "High",
  dataQuality: 94,
  physicsValidation: "Passed",
  aiConfidence: 92,
};

// ── Timeline Events ─────────────────────────────────────────────────────────

export const mockTimelineEvents: CMEEvent[] = [
  {
    id: "evt-1",
    detectedAt: "2026-07-17T12:05:00Z",
    severity: "high",
    status: "active",
    sources: ["SOHO"],
    confidence: 0.95,
    type: "Halo CME",
    description: "Asymmetric full halo CME detected from AR3190.",
  },
  {
    id: "evt-2",
    detectedAt: "2026-07-17T11:42:00Z",
    severity: "high",
    status: "passed",
    sources: ["GOES"],
    confidence: 0.98,
    type: "Solar Flare",
    description: "X1.2 class flare peaked, associated with radio bursts.",
  },
  {
    id: "evt-3",
    detectedAt: "2026-07-17T09:15:00Z",
    severity: "low",
    status: "passed",
    sources: ["DSCOVR"],
    confidence: 0.85,
    type: "Solar Wind",
    description: "Mild solar wind enhancement observed at L1.",
  },
  {
    id: "evt-4",
    detectedAt: "2026-07-16T18:30:00Z",
    severity: "medium",
    status: "passed",
    sources: ["GOES"],
    confidence: 0.90,
    type: "SEP",
    description: "Proton flux crossed 10 pfu threshold at >10 MeV.",
  },
  {
    id: "evt-5",
    detectedAt: "2026-07-15T04:20:00Z",
    severity: "low",
    status: "archived",
    sources: ["ADITYA_L1"],
    confidence: 0.88,
    type: "CIR",
    description: "Corotating interaction region passage complete.",
  },
];

// ── Prediction Data ─────────────────────────────────────────────────────────

export const mockPrediction: PredictionResult = {
  id: "pred-1",
  eventId: "evt-1",
  model: "helios-consensus",
  kpIndex: 7.2,
  dstIndex: -125,
  stormProbability: 0.89,
  horizonHours: 36,
  uncertainty: 0.12,
  physicsValidated: true,
  errorRangeMin: -15,
  errorRangeMax: 20,
  createdAt: new Date().toISOString(),
};

// ── Impact Data ─────────────────────────────────────────────────────────────

export const mockImpactAssessment: ImpactRisk = {
  id: "risk-1",
  eventId: "evt-1",
  overallRisk: "high",
  riskScore: 82,
  
  gpsRisk: "low",
  satelliteRisk: "high",
  powerGridRisk: "medium",
  airlinesRisk: "medium",
  astronautRisk: "low",
  
  generatedAt: new Date().toISOString(),
  validUntil: new Date(Date.now() + 86400000).toISOString(),
  recommendations: ["Issue G3 storm watch", "Notify grid operators"],
};

// ── Solar Parameters Time Series ─────────────────────────────────────────────

export const mockSolarParameters: SolarParameter[] = Array.from({ length: 24 }, (_, i) => {
  const time = new Date();
  time.setHours(time.getHours() - (23 - i));
  
  const isShock = i > 16;
  const speed = isShock ? 650 + Math.random() * 50 : 400 + Math.random() * 20;
  const density = isShock ? 25 + Math.random() * 10 : 5 + Math.random() * 3;
  const temp = isShock ? 300 + Math.random() * 50 : 100 + Math.random() * 20;
  
  return {
    timestamp: time.toISOString(),
    speed: speed,
    density: density,
    thermalSpeed: temp,
    energyFlux: (speed * density * temp) / 100000,
  };
});

// ── Satellite Health & Fusion ────────────────────────────────────────────────

export const mockSatelliteHealth: SatelliteHealth[] = [
  { name: "Aditya-L1", health: "nominal", signal: "Strong", latency: 45, missingPercent: 0.2, trustScore: 98, contributionPercent: 35 },
  { name: "DSCOVR", health: "warning", signal: "Fair", latency: 120, missingPercent: 4.5, trustScore: 82, contributionPercent: 20 },
  { name: "SOHO", health: "nominal", signal: "Good", latency: 85, missingPercent: 1.1, trustScore: 92, contributionPercent: 25 },
  { name: "GOES-16", health: "nominal", signal: "Strong", latency: 15, missingPercent: 0.0, trustScore: 99, contributionPercent: 20 },
];

export const mockFusionResults: FusionResult[] = Array.from({ length: 12 }, (_, i) => {
  const time = new Date();
  time.setHours(time.getHours() - (11 - i));
  
  return {
    timestamp: time.toISOString(),
    individualReadings: {
      "ADITYA_L1": 420 + Math.random() * 10,
      "DSCOVR": 415 + Math.random() * 15,
      "SOHO": 418 + Math.random() * 12,
    },
    fusedValue: 418 + Math.random() * 5,
  };
});
