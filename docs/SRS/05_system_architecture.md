# 5. System Architecture

**Helios Intelligence / Solar Sentinel AI**  
**Version:** 1.0  
**Classification:** Trustworthy AI Scientific Decision Support Platform for Space Weather

---

## 5.1 Purpose

This section describes the logical, process, deployment, and data architecture of Helios Intelligence. The system ingests multi-satellite space-weather data, fuses and recovers missing streams, detects and predicts solar events, quantifies uncertainty, explains model outputs, validates predictions against physics, and delivers stakeholder-specific recommendations through a scientific dashboard.

**Core design principle:** Machine learning proposes; physics disposes; decision support acts only on validated outputs.

---

## 5.2 Architectural views

The system is documented using four complementary views:

| View | Description | Artifact |
|------|-------------|----------|
| **Logical** | Modules, layers, and dependencies | `docs/diagrams/architecture.mmd` |
| **Process** | End-to-end data and inference flow | `docs/diagrams/dataflow.mmd` |
| **Component** | Services, classes, and interfaces | `docs/diagrams/components.mmd` |
| **Deployment** | Runtime topology and scaling | `docs/diagrams/deployment.mmd` |

---

## 5.3 Logical architecture

### 5.3.1 Layer model

The system is organized into six horizontal layers:

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 6 — Presentation                                         │
│  Event Intelligence Dashboard (timeline, UQ bands, explanations)│
├─────────────────────────────────────────────────────────────────┤
│  Layer 5 — Decision Support                                     │
│  Stakeholder mapping, action plans, audit logging               │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4 — Trust & Validation                                   │
│  Physics Validation Engine (gatekeeper)                         │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3 — AI Engine                                            │
│  Detection → Prediction → UQ + Explainability → Consensus       │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2 — Data Intelligence                                    │
│  Multi-satellite ingestion, fusion, missing-data recovery       │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1 — Data Sources                                         │
│  Aditya-L1, SOHO, DSCOVR, GOES, ACE, WIND                       │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3.2 Module map (11 modules)

| Module | Name | Layer | Primary responsibility |
|--------|------|-------|------------------------|
| 1 | Solar Event Detection Engine | AI Engine | Detect and classify CME, flare, HSS, SEP |
| 2 | Multi-Satellite Intelligence | Data Intelligence | Ingest, time-sync, cross-satellite validation |
| 3 | Adaptive AI Fusion Engine | Data Intelligence | Reliability-weighted multi-satellite fusion |
| 4 | Missing Data Recovery Engine | Data Intelligence | Gap-fill with confidence scoring |
| 5 | Prediction Engine | AI Engine | Arrival, intensity, duration, impact probability |
| 6 | Uncertainty Quantification Engine | AI Engine | Predictive intervals, calibration, model agreement |
| 7 | Explainable AI Engine | AI Engine | SHAP, physics-aligned text, NL summaries |
| 8 | AI Consensus Engine | AI Engine | Multi-model distribution aggregation |
| 9 | Physics Validation Engine | Trust & Validation | Domain rule checks; automation gate |
| 10 | Scientific Decision Support | Decision Support | Stakeholder-specific recommendations |
| 11 | Event Intelligence Dashboard | Presentation | Live visualization and audit trail |

### 5.3.3 Corrected inference pipeline

Post-fusion processing enforces strict ordering:

```
DET → PRED → [UQ + EXP] → CONSENSUS → PHYSICS VALIDATION → DSS → Dashboard
```

| Stage | May gate DSS? | Rationale |
|-------|---------------|-----------|
| Detection | No | Produces candidates only |
| Prediction | No | Raw model output |
| UQ + Explainability | No | Characterize uncertainty; inform humans |
| Consensus | No | Aggregate model families |
| **Physics Validation** | **Yes** | Hard/soft gate on physical plausibility |
| DSS | — | Only consumes validated predictions |
| Dashboard | — | Shows validated + rejected-with-reason |

**Implication:** Even unanimous ML agreement on a physically impossible outcome (e.g., CME faster than allowed, absurd dynamic pressure) is blocked or downgraded before any operational recommendation.

---

## 5.4 Process architecture

### 5.4.1 End-to-end dataflow

See `docs/diagrams/dataflow.mmd`.

**Stages:**

1. **Ingest** — Connectors fetch CDF, API, or catalog data from spacecraft sources.
2. **Standardize** — Unit conversion, UTC alignment, resampling to common grid.
3. **Quality flag** — Outlier, noise, gap detection per satellite.
4. **Fuse** — Adaptive weighted fusion (Module 3 formula).
5. **Recover** — Cross-satellite gap-fill for missing intervals.
6. **Detect** — Sequence labeling for event types.
7. **Predict** — Per-event arrival, intensity, impact forecasts.
8. **UQ + Explain** — Parallel computation on model outputs.
9. **Consensus** — Aggregate distributions across model zoo.
10. **Physics validate** — Apply rule catalog (PHY-01 … PHY-52).
11. **Decide** — Map to stakeholder actions if `automation_allowed=true`.
12. **Present** — Dashboard + API + audit log.

### 5.4.2 Pipeline run lifecycle

Every inference pass creates a `pipeline_runs` record:

| Phase | `status` | Writes |
|-------|----------|--------|
| Start | `running` | `pipeline_runs` |
| Fusion complete | `running` | `fusion_snapshots` |
| Detection complete | `running` | `events`, `event_observations` |
| Prediction complete | `running` | `predictions` (per model + consensus) |
| Trust chain complete | `running` | `uncertainty_estimates`, `explanations`, `physics_validation_results` |
| DSS complete | `success` | `recommendations`, `audit_logs` |
| Partial failure | `partial` | Best-effort writes + error in `audit_logs` |
| Fatal failure | `failed` | Rollback in-flight; prior data retained |

### 5.4.3 Core sequence flows

| Flow | Diagram |
|------|---------|
| New CME detected → recommendation | `docs/diagrams/sequence_cme_detected.mmd` |
| Consensus high-risk → physics rejects → DSS downgrade | `docs/diagrams/sequence_physics_reject.mmd` |

---

## 5.5 Component architecture

### 5.5.1 Backend services

| Service | Module(s) | Location | Responsibility |
|---------|-----------|----------|----------------|
| `IngestionService` | 2 | `backend/services/ingestion_service.py` | Fetch, normalize, register `time_series_meta` |
| `FusionService` | 3 | `backend/services/fusion_service.py` | Compute weights, emit `fusion_snapshots` |
| `RecoveryService` | 4 | `backend/services/recovery_service.py` | Gap detection and cross-sat reconstruction |
| `DetectionService` | 1 | `backend/services/detection_service.py` | Event detection; write `events` |
| `PredictionService` | 5, 8 | `backend/services/prediction_service.py` | Model inference + consensus |
| `UQService` | 6 | `backend/services/uq_service.py` | Intervals, calibration scores |
| `ExplainabilityService` | 7 | `backend/services/explainability_service.py` | SHAP, physics text, NL summary |
| `PhysicsValidationService` | 9 | `backend/services/physics_validation_service.py` | Rule engine; gatekeeper |
| `DecisionSupportService` | 10 | `backend/services/decision_support_service.py` | Stakeholder recommendations |
| `PipelineOrchestrator` | all | `backend/services/pipeline_orchestrator.py` | Ordered execution, `pipeline_runs` |

### 5.5.2 AI inference layer

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `DetectorInference` | `ai/inference/detector_inference.py` | Event detection models |
| `FusionInference` | `ai/inference/fusion_inference.py` | Learned fusion assist (optional) |
| `ConsensusInference` | `ai/inference/consensus_inference.py` | Distribution-level aggregation |
| Model artifacts | `ai/models/{detection,prediction,uq,explainability,recovery}/` | Versioned weights |

### 5.5.3 API layer

| Router | Endpoints | Consumer |
|--------|-----------|----------|
| `events` | `GET /events`, `GET /events/{id}` | Dashboard, external clients |
| `predictions` | `GET /predictions/{event_id}` | Dashboard detail pane |
| `uncertainty` | `GET /uncertainty/{prediction_id}` | Confidence bands |
| `explanations` | `GET /explanations/{prediction_id}` | Explanation panel |
| `recommendations` | `GET /recommendations`, `GET /recommendations/{event_id}` | Action plans |
| `fusion` | `GET /fusion/{timestamp}` | Weight breakdown |
| `audit` | `GET /audit/{event_id}` | Provenance trail |
| `stream` | `WS /stream/events` | Live dashboard updates |

Entry point: `backend/api/main.py`

### 5.5.4 Component diagram

See `docs/diagrams/components.mmd`.

---

## 5.6 Deployment architecture

### 5.6.1 Runtime topology

See `docs/diagrams/deployment.mmd`.

**Default deployment (single-environment demo):**

| Component | Technology | Notes |
|-----------|------------|-------|
| API server | FastAPI + Uvicorn | REST + WebSocket |
| Worker | Python async / Celery (optional) | Pipeline orchestration |
| Relational DB | PostgreSQL 14+ | 15-table canonical schema |
| Object storage | Local / S3-compatible | Parquet, CDF archives |
| TSDB (optional) | TimescaleDB or InfluxDB | Hot time-series window |
| Dashboard | React + Vite | `dashboard/` |
| AI models | ONNX / PyTorch artifacts | Loaded by inference services |

### 5.6.2 Scaling strategy

| Bottleneck | Scale approach |
|------------|----------------|
| Ingestion throughput | Horizontal ingestion workers per satellite |
| Fusion + detection latency | Batch timesteps; cache `fusion_snapshots` |
| Multi-model inference | GPU node pool; model parallelism |
| Dashboard reads | Read replicas; WebSocket fan-out |
| Audit / compliance | Append-only `audit_logs`; archive to cold storage |

### 5.6.3 Environment tiers

| Tier | Purpose | Data |
|------|---------|------|
| **Development** | Local laptop; sample CDF/Parquet | CDAW catalogs, synthetic gaps |
| **Staging** | Integration testing | Historical event replay |
| **Production** | Live operations (future) | Real-time feeds with graceful degradation |

---

## 5.7 Data architecture integration

Architecture and data design are tightly coupled. See `06_data_requirements.md`.

**Hybrid storage:**

- **Bulk:** Parquet/CDF/TSDB for time-series volume.
- **Canonical:** PostgreSQL for events, predictions, trust artifacts.

**Key tables by layer:**

| Layer | Tables |
|-------|--------|
| Data Intelligence | `satellites`, `instruments`, `time_series_meta`, `fusion_snapshots` |
| AI Engine | `model_runs`, `predictions`, `uncertainty_estimates`, `explanations` |
| Trust | `physics_validation_results` |
| DSS | `recommendations`, `audit_logs`, `users` |
| Traceability | `pipeline_runs` (cross-cutting) |

---

## 5.8 Cross-cutting concerns

### 5.8.1 Trust and governance

- Every consensus `prediction` has a `physics_validation_results` row before DSS writes.
- `fusion_snapshots.weights_json` provides auditable fusion provenance.
- `audit_logs` is append-only.
- `model_runs.version` + `pipeline_runs.config_version` enable reproducibility.

### 5.8.2 Graceful degradation

| Failure | System behavior |
|---------|-----------------|
| One satellite offline | Fusion reweights; `F_i(t)=0` for that instrument |
| One model fails inference | Consensus proceeds with remaining models; lower `model_agreement_score` |
| Physics HARD_FAIL | `automation_allowed=false`; advisory-only DSS mode |
| Database partial write | `pipeline_runs.status=partial`; no recommendation without physics row |

### 5.8.3 Security (architectural)

- Role-based API access: scientist, operator, admin (`users.role`).
- HTTPS for all external interfaces.
- WebSocket auth token for live stream.
- No autonomous satellite commanding — recommendations only.

---

## 5.9 AI vs non-AI division

| Capability | AI | Non-AI |
|------------|-----|--------|
| Event detection | Yes | — |
| Arrival/intensity prediction | Yes | — |
| Uncertainty quantification | Yes | — |
| Missing-data reconstruction | Yes | — |
| Adaptive fusion weighting | Yes (scores); formula is rule-based | Fusion formula structure |
| Physics validation | — | Rule engine (PHY-01…) |
| Decision support mapping | — | Stakeholder rules |
| Dashboard / API | — | React, FastAPI |
| Audit / logging | — | Append-only store |
| Access control | — | RBAC |

---

## 5.10 Repository structure (architecture-aligned)

```
helios-intelligence/
├── docs/
│   ├── SRS/
│   │   ├── 05_system_architecture.md   ← this document
│   │   └── 06_data_requirements.md
│   └── diagrams/
│       ├── architecture.mmd
│       ├── dataflow.mmd
│       ├── components.mmd
│       ├── deployment.mmd
│       ├── sequence_cme_detected.mmd
│       ├── sequence_physics_reject.mmd
│       ├── schema_er.mmd
│       └── storage_architecture.mmd
├── data/
│   ├── raw/          # Spacecraft CDF, API dumps
│   ├── processed/    # Normalized Parquet
│   └── catalogs/     # CME, flare, SEP event lists
├── backend/
│   ├── api/
│   │   ├── main.py
│   │   └── routers/
│   ├── services/     # One service per module cluster
│   └── core/         # config, database, models
├── ai/
│   ├── models/
│   ├── training/
│   └── inference/
├── dashboard/
│   └── src/
└── ops/
    └── deployment/
        ├── sql/
        └── docker/
```

---

## 5.11 Architectural requirements

| ID | Requirement |
|----|-------------|
| AR-1 | System shall enforce pipeline ordering: DET → PRED → [UQ+EXP] → CONSENSUS → PHYSICS → DSS. |
| AR-2 | Physics Validation shall gate all automated DSS outputs. |
| AR-3 | Each pipeline execution shall create exactly one `pipeline_runs` record. |
| AR-4 | Fusion weight breakdown shall be persisted before event detection. |
| AR-5 | API shall expose provenance (model version, physics status, fusion weights) for every event. |
| AR-6 | System shall degrade gracefully when one or more satellites are unavailable. |
| AR-7 | Dashboard shall distinguish physics-validated vs rejected predictions visually. |
| AR-8 | All inter-service communication shall use typed schemas (Pydantic / JSON Schema). |

---

## 5.12 References

- `06_data_requirements.md` — hybrid storage, 15-table schema
- `docs/diagrams/` — Mermaid architecture artifacts
- NOAA space weather data management practices
- Aditya-L1 mission documentation (ISRO)
