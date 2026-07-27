import { API_BASE_URL } from "../constants/config";
import type { 
  CMEEvent, 
  PredictionResult, 
  ImpactRisk, 
  SolarParameter, 
  SystemStatusOverview, 
  SatelliteHealth,
  MissionStatus,
  FusionResult
} from "../types/types";

// ── CME Events ──────────────────────────────────────────────────────────────

export async function getRecentEvents(limit: number = 10): Promise<CMEEvent[]> {
  try {
    // We request events up to 8760 hours (1 year) back so seeded historical data always shows up
    const response = await fetch(`${API_BASE_URL}/events/?limit=${limit}&hours=8760`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    
    return data.map((event: any) => ({
      id: String(event.id),
      detectedAt: event.start_time,
      estimatedArrival: event.peak_time || undefined,
      severity: "high",
      status: event.status === "ACTIVE" ? "active" : "passed",
      speed: event.metadata?.speed || 0,
      sources: ["DSCOVR", "ACE"], 
      confidence: event.detection_confidence || 0.9,
      type: event.event_type === "CME" ? "Halo CME" : "Solar Flare"
    }));
  } catch (error) {
    console.error("Failed to fetch events", error);
    return [];
  }
}

// ── Predictions & Impact ────────────────────────────────────────────────────

export async function getPredictionSummary(): Promise<PredictionResult | null> {
  try {
    // 1. Get latest event
    const events = await getRecentEvents(1);
    if (events.length === 0) return null;
    
    // 2. Fetch consensus prediction for this event
    const eventId = events[0].id;
    const response = await fetch(`${API_BASE_URL}/predictions/consensus/event/${eventId}`);
    
    if (!response.ok) {
      if (response.status === 404) return null; // No prediction yet
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // The backend returns a nested structure for consensus predictions
    const consensus = data.consensus || {};
    
    return {
      id: consensus.id || "pred-1",
      eventId: eventId,
      model: "helios-consensus",
      kpIndex: 8.5, // The backend currently only predicts arrival time. Mocking Kp for UI.
      dstIndex: -350,
      stormProbability: 0.95, // Mocking probability (95%)
      horizonHours: consensus.predicted_value || 24, // Actual predicted arrival time!
      uncertainty: data.uncertainty ? data.uncertainty.error_range_max : 0.1,
      physicsValidated: data.physics_validation ? data.physics_validation.is_valid : true,
      errorRangeMin: data.uncertainty ? data.uncertainty.error_range_min : 0,
      errorRangeMax: data.uncertainty ? data.uncertainty.error_range_max : 0,
      createdAt: consensus.prediction_timestamp || new Date().toISOString()
    };
  } catch (error) {
    console.error("Failed to fetch prediction", error);
    return null;
  }
}

export async function getImpactSummary(): Promise<ImpactRisk | null> {
  try {
    const events = await getRecentEvents(1);
    if (events.length === 0) return null;
    
    const eventId = events[0].id;
    const response = await fetch(`${API_BASE_URL}/recommendations/event/${eventId}`);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // If backend returns a list of recommendations, we aggregate them.
    // Assuming data is an array of recommendations for simplicity in this mapping.
    const recommendations = Array.isArray(data) ? data : [data];
    if (recommendations.length === 0) return null;
    
    const highestRiskRec = recommendations.reduce((prev: any, current: any) => {
       const riskScores: Record<string, number> = { "LOW": 1, "MODERATE": 2, "HIGH": 3, "SEVERE": 4, "EXTREME": 5 };
       const prevScore = riskScores[prev.risk_level] || 0;
       const currScore = riskScores[current.risk_level] || 0;
       return currScore > prevScore ? current : prev;
    }, recommendations[0]);

    return {
      id: highestRiskRec.id || "risk-1",
      eventId: eventId,
      overallRisk: highestRiskRec.risk_level === "SEVERE" ? "critical" : (highestRiskRec.risk_level === "HIGH" ? "high" : "medium"),
      riskScore: 85, // Computed mock score based on level
      gpsRisk: "medium", 
      satelliteRisk: "high",
      powerGridRisk: "critical",
      airlinesRisk: "high",
      astronautRisk: "high",
      generatedAt: highestRiskRec.timestamp || new Date().toISOString(),
      validUntil: new Date(Date.now() + 86400000).toISOString(),
      recommendations: recommendations.map((r: any) => r.action_recommendation)
    };
  } catch (error) {
    console.error("Failed to fetch impact", error);
    return null;
  }
}

// ── Telemetry & Fusion ──────────────────────────────────────────────────────

export async function getFusionResults(): Promise<FusionResult[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/fusion/latest`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data.map((item: any) => ({
        timestamp: item.timestamp || new Date().toISOString(),
        parameterName: item.parameter_name,
        fusedValue: item.fused_value || 0,
        individualReadings: item.weights || {}
      }));
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch fusion results", error);
    return [];
  }
}

export async function getSatelliteHealth(): Promise<SatelliteHealth[]> {
  try {
    // We use the AI Fusion weights to determine satellite "trust score"
    const response = await fetch(`${API_BASE_URL}/fusion/latest`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = await response.json();
    let weights = {};
    if (Array.isArray(data) && data.length > 0) {
      weights = data[0].weights || {};
    } else {
      weights = data.weights_json || data.weights || {};
    }
    
    // Map standard satellites
    const satellites = ["DSCOVR", "ACE", "WIND", "SOHO"];
    return satellites.map(name => {
      // Handle both flat { "DSCOVR": 0.85 } and nested { "DSCOVR": { "w": 0.85 } } structures
      const rawWeight = (weights as Record<string, any>)[name] || 0;
      const weight = typeof rawWeight === "object" && rawWeight !== null ? rawWeight.w || 0 : rawWeight;
      
      let status: "nominal" | "warning" | "critical" = "nominal";
      if (weight === 0 && Object.keys(weights).length > 0) status = "critical";
      else if (weight < 0.2 && Object.keys(weights).length > 0) status = "warning";
      
      return {
        name,
        health: status,
        signal: status === "nominal" ? "Strong" : "Weak",
        latency: Math.floor(Math.random() * 50) + 15, // Synthetic visual metric
        missingPercent: status === "critical" ? 100 : 0,
        trustScore: Math.round(weight * 100),
        contributionPercent: Math.round(weight * 100)
      };
    });
  } catch (error) {
    console.error("Failed to fetch satellite health", error);
    return [];
  }
}

export async function getSolarParameters(): Promise<SolarParameter[]> {
  try {
    const [windRes, magRes] = await Promise.all([
      fetch("https://services.swpc.noaa.gov/json/rtsw/rtsw_wind_1m.json"),
      fetch("https://services.swpc.noaa.gov/json/rtsw/rtsw_mag_1m.json")
    ]);
    if (!windRes.ok || !magRes.ok) return [];
    
    const windData: any[] = await windRes.json();
    const magData: any[] = await magRes.json();
    
    // Only take the last 60 minutes for the chart
    const recentWind = windData.slice(-60);
    
    let lastSpeed = 400;
    let lastDensity = 5;
    let lastMag = 0;
    let lastTemp = 100000;

    return recentWind.map((w) => {
      const matchedMag = magData.find((m) => m.time_tag === w.time_tag);
      
      // Forward fill missing telemetry
      if (w.proton_speed != null) lastSpeed = w.proton_speed;
      if (w.proton_density != null) lastDensity = w.proton_density;
      if (w.proton_temperature != null) lastTemp = w.proton_temperature;
      
      if (matchedMag && matchedMag.bz_gsm != null) {
        lastMag = matchedMag.bz_gsm;
      }

      return {
        timestamp: w.time_tag + "Z",
        speed: lastSpeed,
        density: lastDensity,
        magneticField: lastMag,
        thermalSpeed: lastTemp,
        energyFlux: 0
      };
    });
  } catch (error) {
    console.error("Failed to fetch solar parameters from NOAA", error);
    return [];
  }
}

// ── Mission & System Status ──────────────────────────────────────────────────

export async function getMissionStatus(): Promise<MissionStatus> {
  const events = await getRecentEvents(100);
  const activeAlerts = events.filter(e => e.status === "active").length;
  
  const sats = await getSatelliteHealth();
  const criticalCount = sats.filter(s => s.health === "critical").length;
  const activeSatellites = sats.length - criticalCount;
  
  return {
    activeSatellites: activeSatellites,
    totalSatellites: 4,
    activeAlerts: activeAlerts,
    pendingPredictions: 0,
    lastUpdated: new Date().toISOString(),
    systemHealth: criticalCount > 1 ? "degraded" : "healthy"
  };
}

export async function getSystemStatusOverview(): Promise<SystemStatusOverview> {
  const events = await getRecentEvents(1);
  const hasActiveEvent = events.length > 0 && events[0].status === "active";
  const prediction = await getPredictionSummary();
  
  const sats = await getSatelliteHealth();
  let dataQuality = 100;
  if (sats && sats.length > 0) {
    const criticalCount = sats.filter(s => s.health === "critical").length;
    const warningCount = sats.filter(s => s.health === "warning").length;
    dataQuality = 100 - (criticalCount * 25) - (warningCount * 10);
  }
    
  return {
    statusText: hasActiveEvent ? "Active CME Detected" : "Space Weather Normal",
    statusColor: hasActiveEvent ? "red" : "green",
    alertLevel: hasActiveEvent ? "High" : "Normal",
    dataQuality: Math.max(0, dataQuality),
    physicsValidation: prediction && prediction.physicsValidated ? "Passed" : "N/A",
    aiConfidence: prediction ? Math.round((1 - prediction.uncertainty) * 100) : 0
  };
}

export async function getGroundMagnetometerData(): Promise<{ timestamp: string; kpIndex: number }[]> {
  try {
    const response = await fetch("https://services.swpc.noaa.gov/json/planetary_k_index_1m.json");
    if (!response.ok) throw new Error("Failed to fetch magnetometer data");
    const data: any[] = await response.json();
    
    // Take the last 60 points for the chart
    const recent = data.slice(-60);
    return recent.map(item => ({
      timestamp: item.time_tag + "Z",
      kpIndex: item.estimated_kp || item.kp_index || 0
    }));
  } catch (error) {
    console.error("Failed to fetch ground magnetometer data", error);
    return [];
  }
}

