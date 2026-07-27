# Crisis Intelligence — Full Project Summary

## What Is This Project?

**Crisis Intelligence** is a **real-time space weather forecasting & decision support platform**. Its job is to monitor the Sun and protect Earth by detecting solar events like **Coronal Mass Ejections (CMEs)**, predicting when and how hard they will hit Earth, and alerting critical infrastructure sectors (satellites, power grids, airlines, GPS, astronauts) with enough lead time to take protective action.

> **Core Philosophy:** *"Machine learning proposes; physics disposes; decision support acts only on validated outputs."*

This is not just a dashboard — it is a full scientific AI system with a backend that does data ingestion → fusion → detection → prediction → physics validation → recommendations, and a frontend that presents all this in real-time.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | Python · FastAPI · Uvicorn |
| **Database** | SQLite (dev) → PostgreSQL (prod) · SQLAlchemy ORM |
| **AI Models** | ONNX format (trained separately in PyTorch) |
| **ML Pipeline** | Custom Python services orchestrated by `pipeline_orchestrator.py` |
| **Frontend** | React 18 · Vite · TypeScript · TailwindCSS |
| **State/Fetch** | TanStack Query (React Query) |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **Live Data** | NOAA RTSW JSON streams (real-time L1 telemetry) |
| **Docker** | Dockerfile + docker-compose.yml for containerization |

---

## Backend Architecture — Full Breakdown

### Entry Point
- [`backend/api/main.py`](file:///D:/New%20folder/Crisis/backend/api/main.py) — FastAPI app with CORS, lifespan manager, global exception handler, logging via Loguru.
- **Base URL:** `http://localhost:8000`
- **Swagger Docs:** `http://localhost:8000/docs`

### 7 API Routers (`backend/api/routers/`)
| Router | Endpoint Prefix | Purpose |
|---|---|---|
| `events.py` | `/api/v1/events` | CRUD for detected solar events |
| `predictions.py` | `/api/v1/predictions` | Arrival time & impact predictions + consensus |
| `fusion.py` | `/api/v1/fusion` | Satellite fusion weights & fused telemetry snapshots |
| `recommendations.py` | `/api/v1/recommendations` | Stakeholder-specific action recommendations |
| `uncertainty.py` | `/api/v1/uncertainty` | Uncertainty quantification intervals |
| `explanations.py` | `/api/v1/explanations` | AI explainability / SHAP-like artifacts |
| `pipeline.py` | `/api/v1/pipeline/trigger` | Manually trigger the full AI pipeline |

### 10 Backend Services (`backend/services/`)
| Service | What It Does |
|---|---|
| `ingestion_service.py` (30KB) | Fetches & standardizes real-time L1 satellite telemetry from DSCOVR, ACE, WIND, SOHO, GOES |
| `fusion_service.py` (14KB) | Bayesian-weighted fusion of multi-satellite measurements using the custom Helios Fusion Algorithm |
| `detection_service.py` (12KB) | Detects anomalies in fused data that indicate an incoming CME or solar flare |
| `prediction_service.py` (14KB) | Runs ONNX ML models to predict CME arrival time and geomagnetic storm intensity |
| `physics_validation_service.py` (19KB) | Validates AI predictions against physical laws (conservation of momentum, Alfvén speed, etc.) |
| `uq_service.py` (9KB) | Uncertainty Quantification — computes error bounds on predictions |
| `explainability_service.py` (9KB) | Generates XAI artifacts (SHAP-like feature attributions) |
| `decision_support_service.py` (17KB) | Converts validated predictions into sector-specific recommendations |
| `recovery_service.py` (12KB) | Fills missing satellite data using interpolation / cross-satellite estimation |
| `pipeline_orchestrator.py` (19KB) | Coordinates the full pipeline in strict sequence |

### 2 Trained ML Models (`backend/models/`)
| Model | File | Purpose |
|---|---|---|
| CME Arrival Predictor | `cme_arrival_model.onnx` (131 KB) | Predicts when a detected CME will arrive at Earth (in hours) |
| CME Impact Predictor | `cme_impact_model.onnx` (146 KB) | Predicts the severity/impact of the CME on Earth systems |

### Database — 15-Table Schema (`backend/core/models.py`)
Organized in 5 domains:

| Domain | Tables |
|---|---|
| **A — Spacecraft Metadata** | `satellites`, `instruments`, `time_series_meta` |
| **B — Pipeline & Fusion** | `pipeline_runs`, `fusion_snapshots` |
| **C — Events** | `events`, `event_observations` |
| **D — AI Outputs** | `model_runs`, `predictions`, `uncertainty_estimates`, `explanations`, `physics_validation_results` |
| **E — Decision & Governance** | `users`, `recommendations`, `audit_logs` |

The database currently runs as **SQLite** (`helios.db`) in development. It has been seeded with **2 real CME events** from previous pipeline runs:
- **Event 1:** CME detected at 2026-07-17, `ACTIVE` status.
- The Helios consensus model predicted an arrival time of **+42.5 hours**.

---

## Full Pipeline Flow (Strict Ordering)

```
1. INGEST    → Pull live data from DSCOVR, ACE, WIND, SOHO via NOAA APIs
2. STANDARDIZE → Convert to common units and timestamps
3. QUALITY FLAG → Mark bad/missing data
4. RECOVER   → Fill gaps with cross-satellite interpolation
5. FUSE      → Multi-satellite Bayesian weighted fusion
6. DETECT    → Anomaly detection → Create CME Event record
7. PREDICT   → Run ONNX models → Generate arrival time prediction
8. UQ        → Compute uncertainty bounds (error ranges)
9. EXPLAIN   → Generate feature importance artifacts
10. CONSENSUS → Aggregate individual model votes into one consensus
11. PHYSICS VALIDATE → Hard gate: prediction must pass physical laws
12. DECIDE   → Generate sector-specific recommendations
13. PRESENT  → Frontend dashboard displays all outputs
```

**Key constraint:** Physics Validation is a **hard gate**. If a prediction fails physics, `automation_allowed = false` and no automated alerts are sent.

---

## The Helios Fusion Algorithm (Module 3 — Core Innovation)

This is the heart of the data intelligence layer. It dynamically re-weights satellite data based on quality.

**Base Formula:**
```
w_i(t) = α·R_i(t) + β·Q_i(t) + γ·S_i
x_fused(t) = Σ w_i(t)·x_i(t) / Σ w_i(t)
```

**Where:**
- **R_i(t)** = Reliability Score (detects outliers using Z-score, noise via variance, long-term consistency)
- **Q_i(t)** = Recency Score (data freshness, decays exponentially with `τ=300s`)
- **S_i** = Spatial Relevance (orbit geometry — L1 point satellites weighted higher)
- **F_i(t)** = Instrument Status Flag (hard gate — critical failures excluded entirely)

**Tunable Parameters (configured in backend):**
- `α = 0.5` (Reliability weight)
- `β = 0.3` (Recency weight)
- `γ = 0.2` (Spatial relevance weight)
- `Z_MAX = 3.0` (Outlier threshold in standard deviations)

---

## Data Sources — Live Satellites

| Satellite | Agency | Orbit | Instruments Used |
|---|---|---|---|
| **DSCOVR** | NASA/NOAA | L1 Lagrange Point | Plasma, Mag field |
| **ACE** | NASA | L1 Lagrange Point | Solar Wind, Mag |
| **WIND** | NASA | L1 Lagrange Point | Plasma, Mag, Particles |
| **SOHO** | ESA/NASA | L1 Lagrange Point | LASCO coronagraph |
| **GOES-16/18** | NOAA | GEO Orbit | X-Ray flux |
| **Aditya-L1** | ISRO | L1 Lagrange Point | SWIS, VELC |

**Live data streams actively fetched from NOAA:**
- `rtsw_wind_1m.json` — Solar wind speed, proton density, temperature (1-min cadence)
- `rtsw_mag_1m.json` — Magnetic field Bz component in GSM coordinates (1-min cadence)

---

## Frontend Architecture — All Pages

**Location:** `D:\New folder\Crisis\Crisis Dashboard\`  
**Stack:** React 18 + Vite + TypeScript + TailwindCSS

### Pages (7 total)
| Page | Route | Status | Description |
|---|---|---|---|
| **Mission Control** | `/mission-control` | ✅ **LIVE** | Real-time overview with 5 widgets |
| **Data Fusion** | `/data-fusion` | ✅ **LIVE** | Satellite weights & fused parameters engine |
| **AI Explainability** | `/ai-explainability` | 🔨 **Building** | Neural pathway graph + SHAP chart |
| **Event Analysis** | `/event-analysis` | ⏳ Placeholder | Detailed CME event analysis |
| **Historical Analytics** | `/historical-analytics` | ⏳ Placeholder | Past events & model accuracy |
| **Settings** | `/settings` | ⏳ Placeholder | System configuration |

### Mission Control (Fully Built) — 5 Widgets
1. **Status Cards** — Mission health, active satellites, alert level, data quality (live from backend)
2. **Events Timeline** — List of detected CME events with severity badges (live from `/api/v1/events`)
3. **Solar Parameters Chart** — Real-time dual-axis area chart of Solar Wind Speed vs Magnetic Field Bz, fetched live from NOAA. `staleTime=60s` to prevent lag. Expandable fullscreen + CSV download.
4. **Prediction Summary** — Shows AI consensus: Kp Index, Arrival Time (+42.5h from backend), Storm Probability, Physics Validation badge (live from `/api/v1/predictions`)
5. **Impact Summary** — Risk scores for Satellites, Power Grid, Airlines, GPS, Astronauts (live from `/api/v1/recommendations`)

### Data Fusion (Fully Built)
- **Left:** 4 satellite cards (DSCOVR, ACE, WIND, SOHO) each showing AI Weight (Trust Score %), health status, latency
- **Center:** Animated Fusion Engine visualization (rotating rings, pulsing data streams, Kalman Filter status badge)
- **Right:** Fused parameter table showing each measured parameter and its consensus value
- All data pulled live from `/api/v1/fusion/latest`

### AI Explainability (Currently Building)
- **Left Top:** `ModelConfidenceMetrics` — SVG radial confidence dial, uncertainty bound, physics validation badge
- **Left Bottom:** `FeatureImportanceChart` — Horizontal bar chart (SHAP-style) showing which parameters drove the prediction
- **Right:** `NeuralNetworkGraph` — Animated SVG node-graph showing data flowing from 4 satellite nodes → 3 parameter nodes → Physics Validation node → Consensus Output node with pulse animations

### Frontend Services (`src/services/api.ts`)
All backend calls go through one typed file:
- `getRecentEvents()` — CME events
- `getPredictionSummary()` — Parses nested consensus response structure
- `getImpactSummary()` — Aggregates recommendations by risk level
- `getFusionResults()` — Fusion weights per parameter
- `getSatelliteHealth()` — Derives health from fusion weights
- `getSolarParameters()` — Fetches NOAA live JSON streams directly
- `getMissionStatus()` — Derives from events + satellites
- `getSystemStatusOverview()` — System health overview

### TypeScript Types (`src/types/types.ts`)
Fully typed interfaces: `CMEEvent`, `PredictionResult`, `ImpactRisk`, `SolarParameter`, `SatelliteHealth`, `FusionResult`, `MissionStatus`, `SystemStatusOverview` + shared enums (`Severity`, `AlertLevel`, etc.)

### Reusable UI Components (`src/components/ui-custom/`)
- `GlassCard` — Glassmorphism dark card base
- `ChartWrapper` — Chart container with **Expand (fullscreen dialog)** + **Download CSV** built-in
- `AppDialog` — Radix UI powered modal (used for chart fullscreen)
- `LoadingSkeleton`, `EmptyState`, `ErrorState`

---

## DevOps & Infrastructure

| File | Purpose |
|---|---|
| `Dockerfile` | Production container build |
| `docker-compose.yml` | Multi-container orchestration |
| `alembic/` | Database migration scripts |
| `requirements.txt` | Python dependencies |
| `historical_cme_catalog.csv` | 2MB historical CME data for model training |
| `mlruns/` | MLflow experiment tracking directory |
| `logs/` | Application log files |

---

## Current Live Data in Database

| What | Value |
|---|---|
| Events stored | 2 CME events |
| Latest event | ID=1, ACTIVE, detected 2026-07-17 |
| Consensus prediction | Arrival time: **+42.5 hours** |
| Fusion snapshots | Stored per pipeline run |
| Pipeline runs | Manually triggered via `/api/v1/pipeline/trigger` |

---

## What's Working vs What's Next

### ✅ Fully Working
- Backend API running on port 8000 with all 7 routers
- SQLite database with 15-table schema + seeded data
- Pipeline orchestrator (manually triggered)
- Mission Control dashboard — all 5 widgets with live data
- Data Fusion dashboard — satellite weights + fusion engine
- Real-time NOAA telemetry in Solar Parameters chart
- ChartWrapper with expand + CSV download

### 🔨 In Progress
- AI Explainability dashboard (being built now)

### ⏳ Remaining Pages
- Event Analysis (CME propagation map + timeline detail)
- Historical Analytics (accuracy charts + event frequency)
- Settings page

### 📋 Known Limitations / Mock Data
- Kp Index and Storm Probability are currently mocked (8.5, 95%) since the backend ONNX model only outputs arrival time currently
- AI Explainability SHAP values are derived on the frontend from fusion weights (backend `explanations` table not yet fully populated)
- Satellite latency values are synthetically generated for UI realism

---

## Key Design Decisions Made

1. **Physics as a hard gate** — No automated recommendation without physics validation passing
2. **Frontend fetches NOAA directly** — For the real-time Solar Parameters chart to avoid proxy overhead
3. **`staleTime=60s`** on NOAA queries to prevent heavy JSON re-fetches on every tab switch
4. **Unified `ChartWrapper`** — All charts get expand/download for free via one reusable component
5. **ONNX for AI models** — Framework-agnostic, fast inference, no PyTorch runtime needed in production
6. **SQLite in dev, PostgreSQL in prod** — Easy local development, production-grade at scale

---

*Last Updated: July 18, 2026*
