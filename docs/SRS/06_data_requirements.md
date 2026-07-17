# 6. Data Requirements

**Helios Intelligence / Solar Sentinel AI**  
**Version:** 1.0 (Target Architecture)  
**Storage strategy:** Hybrid — TSDB/object store for volume; PostgreSQL for provenance and trust.

---

## 6.1 Purpose

This section defines how the system stores, references, and traces all data required for trustworthy space-weather decision support. The design separates high-volume time-series measurements from structured records for events, predictions, uncertainties, explanations, physics validation, recommendations, and audit logs.

---

## 6.2 Storage architecture

### 6.2.1 Hybrid model

| Layer | Technology | Contents |
|-------|------------|----------|
| **Hot time-series** | InfluxDB / TimescaleDB (optional) | High-cadence plasma, X-ray, flux streams |
| **Cold / archival** | Parquet, CDF on object storage | Raw and processed spacecraft files |
| **Relational (canonical)** | PostgreSQL 14+ | Events, predictions, UQ, physics gate, DSS, audit |

PostgreSQL is the **source of truth** for anything that appears in recommendations or the dashboard. Time-series backends are referenced via `time_series_meta.storage_location`.

### 6.2.2 Architecture diagram

See `docs/diagrams/storage_architecture.mmd`.

### 6.2.3 Retention policy

| Data class | Retention | Rationale |
|------------|-----------|-----------|
| Raw Parquet/CDF | 2 years | Reprocessing, retraining |
| TSDB hot window | 90 days | Live dashboard queries |
| `events`, `predictions`, related rows | 5 years | Scientific audit, case studies |
| `audit_logs` | 7 years | Trust and governance |
| `fusion_snapshots` | 1 year (rolling) | Fusion debug; compress older |

---

## 6.3 Relational schema overview (15 tables)

The target architecture comprises **15 PostgreSQL tables** grouped into five domains:

### Domain A — Spacecraft metadata (3 tables)

| Table | Purpose |
|-------|---------|
| `satellites` | Spacecraft registry (Aditya-L1, SOHO, DSCOVR, GOES, ACE, WIND) |
| `instruments` | Per-satellite instruments (SWIS, VELC, LASCO, XRS, etc.) |
| `time_series_meta` | Pointers to raw/processed series in TSDB or object storage |

### Domain B — Pipeline and fusion (2 tables)

| Table | Purpose |
|-------|---------|
| `pipeline_runs` | End-to-end inference pass traceability |
| `fusion_snapshots` | Per-timestep fusion weights and fused values (Module 3 audit) |

### Domain C — Events (2 tables)

| Table | Purpose |
|-------|---------|
| `events` | Detected solar events (CME, flare, HSS, SEP, CIR) |
| `event_observations` | Which satellite/instrument observed each event, with quality score |

### Domain D — AI outputs (5 tables)

| Table | Purpose |
|-------|---------|
| `model_runs` | Registered model versions and training metrics |
| `predictions` | Per-event forecasts (arrival, intensity, impact probability, etc.) |
| `uncertainty_estimates` | Predictive intervals, reliability, model agreement |
| `explanations` | SHAP, physics-aligned text, NL summaries |
| `physics_validation_results` | Physics gate outcome (PASS / SOFT_FAIL / HARD_FAIL) |

### Domain E — Decision support and governance (3 tables)

| Table | Purpose |
|-------|---------|
| `users` | Scientist, operator, admin roles |
| `recommendations` | DSS outputs per stakeholder class |
| `audit_logs` | Views, acknowledgements, overrides |

**Canonical SQL:** `ops/deployment/sql/schema_full.sql`  
**ER diagram:** `docs/diagrams/schema_er.mmd`

---

## 6.4 Module-to-table traceability

| Module | Primary tables | Key audit fields |
|--------|----------------|------------------|
| 1 — Event Detection | `events`, `event_observations` | `detection_source`, `detection_confidence` |
| 2 — Multi-Satellite Ingestion | `time_series_meta`, `instruments` | `storage_location`, `resolution_sec` |
| 3 — Adaptive Fusion | `fusion_snapshots` | `weights_json` (w, R, Q, S, F, O, N, V) |
| 4 — Missing Data Recovery | `time_series_meta`, `fusion_snapshots` | quality flags in `event_observations.quality_score` |
| 5 — Prediction | `predictions`, `model_runs` | `model_run_id`, `pipeline_run_id` |
| 6 — Uncertainty Quantification | `uncertainty_estimates` | `reliability_score`, `model_agreement_score` |
| 7 — Explainable AI | `explanations` | `importance_json`, `physics_explanation` |
| 8 — AI Consensus | `predictions` (`is_consensus=true`) | `base_models_included` |
| 9 — Physics Validation | `physics_validation_results` | `validation_status`, `automation_allowed` |
| 10 — Decision Support | `recommendations` | `justification_text`, `action_priority` |
| 11 — Dashboard | reads all above + `audit_logs` | `action_type` |

---

## 6.5 Entity specifications

### 6.5.1 `satellites`

Stores spacecraft metadata. Seeded with Aditya-L1, DSCOVR, SOHO, GOES-16, ACE, WIND.

**Key fields:** `name` (unique), `agency`, `orbit_type` (L1, GEO, LEO), `is_active`.

### 6.5.2 `instruments`

Child of `satellites`. Examples: SWIS (particle), VELC (coronagraph), GOES XRS.

**Key fields:** `type`, `status` (operational, degraded, offline).

### 6.5.3 `time_series_meta`

Relational pointer to bulk data. Does **not** store time-series values inline.

**Key fields:**
- `parameter_name` — bulk_speed, density, temperature, xray_flux, etc.
- `storage_type` — parquet, cdf, tsdb
- `storage_location` — S3 URI, file path, or TSDB measurement name
- `resolution_sec` — cadence in seconds

### 6.5.4 `pipeline_runs`

One row per end-to-end pipeline execution (scheduled, new_data, manual).

**Key fields:** `input_data_hash`, `config_version`, `status` (running, success, partial, failed).

Links to `events.pipeline_run_id` and `predictions.pipeline_run_id` for full provenance.

### 6.5.5 `fusion_snapshots`

Audit trail for Module 3 adaptive fusion.

**`weights_json` structure (example):**
```json
{
  "1": {"w": 0.62, "R": 0.85, "Q": 0.99, "S": 0.95, "F": 1, "O": 0.05, "N": 0.12, "V": 0.08},
  "2": {"w": 0.38, "R": 0.71, "Q": 0.88, "S": 0.90, "F": 1, "O": 0.22, "N": 0.18, "V": 0.15}
}
```

### 6.5.6 Fusion methodology (Module 3)

The system uses a reliability-weighted fusion formula to combine multi-satellite measurements. For any scalar parameter x (e.g., bulk speed, density, field proxy):

#### Base fusion formula

For satellite i at time t:

```
wi(t) = α · Ri(t) + β · Qi(t) + γ · Si
xfused(t) = Σi wi(t) · xi(t) / Σi wi(t)
```

Where:
- **Ri(t)** = reliability score (0–1)
- **Qi(t)** = recency / data-freshness score (0–1)
- **Si** = spatial relevance (geometry / orbit configuration) (0–1)
- **α, β, γ** = weighting coefficients (sum to 1 for interpretability)
- **wi(t)** = final weight for satellite i at time t (normalized)

All scores are normalized to [0,1] and weights are optionally normalized such that Σi wi(t) = 1.

#### Reliability score Ri(t)

Measures data quality based on outliers, noise, and consistency:

```
Ri(t) = 1 - λ1 · Oi(t) - λ2 · Ni(t) - λ3 · Vi(t)
```

Where:
- **Oi(t)** = outlier score (0–1)
- **Ni(t)** = noise estimate (0–1)
- **Vi(t)** = relative variance / inconsistency (0–1)
- **λ1, λ2, λ3** = penalty coefficients

Ri(t) is clipped to [0,1].

##### Outlier score Oi(t)

For parameter v at time t:
1. Compute cross-satellite mean and std:
   ```
   μv(t) = (1/N) · Σj vj(t)
   σv(t) = sqrt((1/N) · Σj (vj(t) - μv(t))²)
   ```
2. Z-score for satellite i:
   ```
   zi(t) = (vi(t) - μv(t)) / (σv(t) + ε)
   ```
3. Outlier score:
   ```
   Oi(t) = min(1, |zi(t)| / zmax)
   ```
   where zmax = 3 (typical threshold)

##### Noise score Ni(t)

Uses short-term variance in sliding window [t-k, ..., t, ..., t+k]:
```
σi,local²(t) = Var(xi(t-k:t+k))
Ni(t) = min(1, σi,local(t) / σref)
```
where σref = historical "normal noise level" from quiet-time data.

##### Relative variance Vi(t)

Long-term consistency over window [t-L, t]:
```
Vi(t) = (1/L) · Στ=t-L to t (xi(τ) - μx(τ))² / (σx²(τ) + ε)
```
Normalized by cap value and clipped to [0,1].

#### Recency score Qi(t)

Penalizes stale data:
```
Qi(t) = exp(-Δti(t) / τ)
```
Where:
- **Δti(t)** = time since last valid observation for satellite i
- **τ** = time constant (e.g., 5 minutes)

Fresh data (Δt ≈ 0) → Q ≈ 1; stale data (Δt >> τ) → Q → 0.

#### Spatial relevance Si

Geometry-based relevance for space weather:

```
Si = η1 · Ai + η2 · Gi
```

##### Alignment score Ai

Angular separation from Sun-Earth line:
```
Ai = cos(θi)
Ai' = (Ai + 1) / 2
```
Where θi = angle at Sun between satellite i and Earth.

- On Sun-Earth line (θ = 0) → Ai' = 1
- Orthogonal (90°) → Ai' ≈ 0.5
- Opposite (180°) → Ai' = 0

##### Geometric relevance Gi

Radial distance and time-lag factors:
```
Gi = exp(-|ri - rEarth| / Δr)
```
Where ri = satellite distance from Sun, rEarth ≈ 1 AU, Δr = scale parameter.

#### Instrument status flag Fi(t)

Hard gating for instrument health:
```
wi(t) ← wi(t) · Fi(t)
```
Where Fi(t) ∈ {0,1} (0 = degraded/offline, 1 = healthy).

#### Complete fusion algorithm

1. Compute intermediate scores:
   ```
   Ri(t) = clip(1 - λ1·Oi(t) - λ2·Ni(t) - λ3·Vi(t), 0, 1)
   Qi(t) = exp(-Δti(t) / τ)
   Ai' = (cos(θi) + 1) / 2
   Gi = exp(-|ri - rEarth| / Δr)
   Si = δ1·Ai' + δ2·Gi
   ```

2. Combine into raw weight:
   ```
   wiraw(t) = Fi(t) · (α·Ri(t) + β·Qi(t) + γ·Si)
   ```

3. Normalize:
   ```
   wi(t) = wiraw(t) / (Σj wjraw(t) + ε)
   ```

4. Fuse parameter:
   ```
   xfused(t) = Σi wi(t) · xi(t)
   ```

#### Advanced physics-aware enhancements

##### Dynamic pressure consistency

Dynamic ram pressure: `Pd,i(t) = ρi(t) · vi²(t) ∝ ni(t) · vi²(t)`

Inconsistent Pd across satellites → increase outlier score.

##### Plasma beta consistency (if magnetic data available)

```
βi(t) = (2·μ0·ni·kB·Ti) / Bi²
```
Wildly inconsistent β across satellites → reduce reliability score.

##### Temporal smoothness penalties

```
Di(t) = |xi(t) - xi(t-Δt)|
```
Unreasonably large derivatives → increase noise/outlier scores.

### 6.5.7 `events`

Canonical solar event record.

**`event_type` values:** CME, HALO_CME, SOLAR_FLARE, HSS, SEP, CIR  
**`status` values:** pending_validation, validated, rejected, physics_blocked  
**`detection_source`:** AI, manual, external_catalog

### 6.5.8 `event_observations`

Links events to observing satellites/instruments and optional `time_series_meta` rows.

**`quality_score`:** 0–1, derived from fusion reliability at observation window.

### 6.5.9 `model_runs`

Registry of trained models.

**`model_family` values:** RandomForest, XGBoost, PINN, Transformer, LSTM  
**`metrics_json`:** F1, MAE, CRPS, calibration coverage, etc.

### 6.5.10 `predictions`

One row per (event, model, prediction_type). Consensus rows have `is_consensus=true`.

**`prediction_type` values:** arrival_time, intensity, duration, impact_prob, propagation_speed  
**`predicted_unit` examples:** epoch_seconds, nT, probability, km_s

### 6.5.11 `uncertainty_estimates`

1:1 with `predictions`. Stores predictive intervals and calibration metadata.

**Example narrative:** "Arrival = 19:00 UTC ± 18 min, 90% PI, model agreement 0.94."

### 6.5.12 `explanations`

1:many with `predictions`. Multiple explanation types per prediction allowed.

**`explanation_type` values:** feature_importance, physics_text, nl_summary

### 6.5.13 `physics_validation_results`

1:1 with consensus `predictions`. **Mandatory gate before DSS.**

**`validation_status`:** PASS, SOFT_FAIL, HARD_FAIL  
**`violated_rules` structure:**
```json
[
  {"id": "PHY-03", "severity": "HARD", "observed": 28.0, "limit": 15.0, "message": "Dynamic pressure exceeds plausible range"}
]
```

**`automation_allowed`:** false on HARD_FAIL — DSS must not issue automated operational actions.

### 6.5.14 `recommendations`

DSS output. Must reference a physics-validated `prediction_id`.

**`target_system` values:** satellite_ops, power_grid, astronauts, ground_station, scientist_review  
**`action_priority` values:** low, medium, high, critical

### 6.5.15 `audit_logs`

Immutable append-only log of human and system actions.

**`action_type` values:** viewed, acknowledged, overridden, pipeline_completed, physics_blocked

### 6.5.16 `users`

Role-based access: scientist, operator, admin.

---

## 6.6 Data flow and write ordering

Enforced write sequence (matches pipeline):

```
time_series_meta  →  fusion_snapshots  →  events  →  event_observations
       →  predictions (per model)  →  predictions (consensus)
       →  uncertainty_estimates  →  explanations
       →  physics_validation_results  →  recommendations  →  audit_logs
```

**Constraint:** `recommendations` rows MUST NOT be inserted unless a corresponding `physics_validation_results` row exists for the referenced `prediction_id`.

---

## 6.7 Indexes

Defined in `schema_full.sql`:

- `events(start_time DESC, event_type)`
- `predictions(event_id)` partial index on `is_consensus = TRUE`
- `fusion_snapshots(timestamp DESC, parameter_name)`
- `audit_logs(event_id, timestamp DESC)`

---

## 6.8 Functional requirements (data)

| ID | Requirement |
|----|-------------|
| FR-DATA-1 | System shall store bulk time-series in object storage or TSDB; Postgres shall store metadata pointers only. |
| FR-DATA-2 | Every detected event shall be traceable to a `pipeline_run_id`. |
| FR-DATA-3 | Every consensus prediction shall have exactly one `uncertainty_estimates` row and one `physics_validation_results` row before DSS writes. |
| FR-DATA-4 | Fusion weight breakdown shall be persisted in `fusion_snapshots.weights_json`. |
| FR-DATA-5 | All timestamps shall be stored as UTC (`TIMESTAMPTZ`). |
| FR-DATA-6 | `audit_logs` shall be append-only; no updates or deletes by application code. |
| FR-DATA-7 | Physics HARD_FAIL shall set `automation_allowed=false` on the validation record. |

---

## 6.9 Non-functional requirements (data)

| ID | Requirement |
|----|-------------|
| NFR-DATA-1 | Event + prediction query by ID shall complete in &lt; 100 ms on reference Postgres instance. |
| NFR-DATA-2 | Schema migrations shall be version-controlled alongside `schema_full.sql`. |
| NFR-DATA-3 | Database backups shall run daily with 30-day retention. |

---

## 6.10 End-to-end trace example

```
pipeline_runs #a1b2c3...
  └─ events #1042 (HALO_CME, 2026-07-10 08:00 UTC)
       ├─ event_observations (Aditya-L1/SWIS, quality=0.91)
       ├─ fusion_snapshots (bulk_speed @ 08:15, w_ADITYA=0.62)
       └─ predictions #8801 (arrival_time, consensus)
            ├─ uncertainty_estimates (PI90: 01:30–02:30 UTC)
            ├─ explanations (SHAP: bulk_speed 0.4, halo_width 0.3)
            ├─ physics_validation_results (SOFT_FAIL: PHY-13, mult=0.7)
            └─ recommendations (satellite_ops: increase_monitoring, MEDIUM)
                 └─ audit_logs (scientist_01: acknowledged)
```

---

## 6.11 References

- NOAA space weather data management practices
- CDAW CME catalogs (external_catalog_id linkage)
- IEEE / UQ literature for calibration metadata in `uncertainty_estimates.details_json`
