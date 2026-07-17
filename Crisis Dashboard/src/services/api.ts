import { API_BASE_URL } from "../constants/config";
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
import {
  mockMissionStatus,
  mockCurrentEventStatus,
  mockTimelineEvents,
  mockPrediction,
  mockImpactAssessment,
  mockSolarParameters,
  mockSatelliteHealth,
  mockFusionResults,
} from "../constants/mockData";

/**
 * Utility to simulate network delay for testing loading states.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const BASE_DELAY = 450; // 450ms artificial delay

// ── Mission & System Status ──────────────────────────────────────────────────

export async function getMissionStatus(): Promise<MissionStatus> {
  await delay(BASE_DELAY);
  // TODO(backend): replace with fetch(`${API_BASE_URL}/mission-status`).then(res => res.json())
  return mockMissionStatus;
}

export async function getSystemStatusOverview(): Promise<SystemStatusOverview> {
  await delay(BASE_DELAY);
  // TODO(backend): replace with fetch(`${API_BASE_URL}/system-status-overview`).then(res => res.json())
  return mockCurrentEventStatus;
}

// ── CME Events ──────────────────────────────────────────────────────────────

export async function getRecentEvents(limit: number = 10): Promise<CMEEvent[]> {
  await delay(BASE_DELAY + 100);
  // TODO(backend): replace with fetch(`${API_BASE_URL}/events?limit=${limit}`).then(res => res.json())
  return mockTimelineEvents.slice(0, limit);
}

// ── Predictions & Impact ────────────────────────────────────────────────────

export async function getPredictionSummary(): Promise<PredictionResult> {
  await delay(BASE_DELAY + 200);
  // TODO(backend): replace with fetch(`${API_BASE_URL}/predictions/latest`).then(res => res.json())
  return mockPrediction;
}

export async function getImpactSummary(): Promise<ImpactRisk> {
  await delay(BASE_DELAY + 150);
  // TODO(backend): replace with fetch(`${API_BASE_URL}/impact-assessment/latest`).then(res => res.json())
  return mockImpactAssessment;
}

// ── Telemetry & Parameters ──────────────────────────────────────────────────

export async function getSolarParameters(rangeHours: number = 24): Promise<SolarParameter[]> {
  await delay(BASE_DELAY + 300);
  // TODO(backend): replace with fetch(`${API_BASE_URL}/telemetry/solar-parameters?hours=${rangeHours}`).then(res => res.json())
  return mockSolarParameters;
}

export async function getSatelliteHealth(): Promise<SatelliteHealth[]> {
  await delay(BASE_DELAY);
  // TODO(backend): replace with fetch(`${API_BASE_URL}/satellites/health`).then(res => res.json())
  return mockSatelliteHealth;
}

export async function getFusionResults(rangeHours: number = 12): Promise<FusionResult[]> {
  await delay(BASE_DELAY + 250);
  // TODO(backend): replace with fetch(`${API_BASE_URL}/fusion-results?hours=${rangeHours}`).then(res => res.json())
  return mockFusionResults;
}
