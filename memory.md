# Helios Intelligence - Project Memory

**Project Status**: Active Development  
**Last Updated**: July 17, 2026  
**Version**: 1.0 (Target Architecture)

---

## Project Overview

**Helios Intelligence** is a Trustworthy AI Scientific Decision Support Platform for Space Weather. The system ingests multi-satellite data, fuses measurements using physics-aware algorithms, detects solar events, predicts their impact on Earth, and provides stakeholder-specific recommendations with full uncertainty quantification and physics validation.

### Core Philosophy
**Machine learning proposes; physics disposes; decision support acts only on validated outputs.**

---

## Architecture Decisions

### Canonical Architecture
- **Database**: 15-table PostgreSQL schema (canonical)
- **Storage**: Hybrid approach - PostgreSQL for metadata/events, Parquet/CDF/TSDB for time-series
- **API**: FastAPI + Uvicorn (REST + WebSocket)
- **AI Models**: PyTorch/ONNX artifacts
- **Dashboard**: React + Vite

### Deprecated
- MVP 7-table schema (deprecated reference only)

---

## System Modules (11 Modules)

| Module | Name | Layer | Status |
|--------|------|-------|--------|
| 1 | Solar Event Detection Engine | AI Engine | Designed |
| 2 | Multi-Satellite Intelligence | Data Intelligence | Designed |
| 3 | Adaptive AI Fusion Engine | Data Intelligence | **Algorithm Complete** |
| 4 | Missing Data Recovery Engine | Data Intelligence | Designed |
| 5 | Prediction Engine | AI Engine | Designed |
| 6 | Uncertainty Quantification Engine | AI Engine | Designed |
| 7 | Explainable AI Engine | AI Engine | Designed |
| 8 | AI Consensus Engine | AI Engine | Designed |
| 9 | Physics Validation Engine | Trust & Validation | Designed |
| 10 | Scientific Decision Support | Decision Support | Designed |
| 11 | Event Intelligence Dashboard | Presentation | Designed |

---

## Database Schema (15 Tables)

### Domain A — Spacecraft metadata (3 tables)
1. `satellites` - Spacecraft registry
2. `instruments` - Per-satellite instruments
3. `time_series_meta` - Pointers to bulk TS data

### Domain B — Pipeline and fusion (2 tables)
4. `pipeline_runs` - Inference pass traceability
5. `fusion_snapshots` - Per-timestep fusion weights and fused values

### Domain C — Events (2 tables)
6. `events` - Detected solar events
7. `event_observations` - Per-satellite event linkage

### Domain D — AI outputs (5 tables)
8. `model_runs` - AI model registry
9. `predictions` - Forecasts + consensus
10. `uncertainty_estimates` - UQ intervals
11. `explanations` - XAI artifacts
12. `physics_validation_results` - Physics gate

### Domain E — Decision support and governance (3 tables)
13. `users` - RBAC
14. `recommendations` - DSS outputs
15. `audit_logs` - Trust / governance log

---

## Fusion Algorithm (Module 3) - COMPLETED

### Base Formula
```
wi(t) = α · Ri(t) + β · Qi(t) + γ · Si
xfused(t) = Σi wi(t) · xi(t) / Σi wi(t)
```

### Components
- **Ri(t)** = reliability score (outliers, noise, consistency)
- **Qi(t)** = recency/data-freshness score
- **Si** = spatial relevance (geometry/orbit configuration)
- **Fi(t)** = instrument status flag (hard gating)

### Reliability Score Components
- **Oi(t)** = outlier score (Z-score based cross-satellite deviation)
- **Ni(t)** = noise score (short-term variance in sliding window)
- **Vi(t)** = consistency score (long-term agreement with consensus)

### Physics-Aware Enhancements
- Dynamic pressure consistency checks
- Plasma beta validation (with magnetic data)
- Temporal smoothness penalties

### Documentation
- Complete methodology added to `docs/SRS/06_data_requirements.md` (Section 6.5.6)
- Includes all formulas, parameters, and implementation details

---

## Pipeline Flow

**Strict ordering enforced:**
```
Ingest → Standardize → Quality Flag → Fuse → Recover → Detect 
  → Predict → [UQ + Explain] → Consensus → Physics Validate 
  → Decide → Present
```

**Key constraint**: Physics validation is a hard gate for automated decision support. No recommendations without physics validation.

---

## Data Sources

### Satellites
- Aditya-L1 (ISRO)
- SOHO (ESA/NASA)
- DSCOVR (NASA)
- GOES (NOAA)
- ACE (NASA)
- WIND (NASA)

### Instruments
- SWIS (Solar Wind Ion Spectrometer)
- VELC (Visible Emission Line Coronagraph)
- LASCO (Large Angle and Spectrometric Coronagraph)
- XRS (X-Ray Sensor)
- Various plasma and field instruments

---

## Mermaid Diagrams

All architecture diagrams are in Mermaid format (`.mmd` files):

### Available Diagrams
- `architecture.mmd` - System layer architecture
- `dataflow.mmd` - End-to-end data processing pipeline
- `components.mmd` - Service and component relationships
- `deployment.mmd` - Runtime deployment topology
- `schema_er.mmd` - Database entity relationships
- `storage_architecture.mmd` - Hybrid storage architecture
- `sequence_cme_detected.mmd` - CME detection sequence flow
- `sequence_physics_reject.mmd` - Physics validation rejection flow

### Viewing Options
1. Online: [Mermaid Live Editor](https://mermaid.live/)
2. GitHub/GitLab: Automatically rendered in markdown
3. VS Code: Mermaid preview extension
4. Most markdown viewers support Mermaid natively

**Note**: Mermaid diagrams are widely supported and will be visible in most modern documentation platforms and IDEs.

---

## Documentation Status

### Complete
- ✅ `docs/SRS/05_system_architecture.md` - System architecture
- ✅ `docs/SRS/06_data_requirements.md` - Data requirements + fusion methodology
- ✅ `README.md` - Comprehensive project documentation
- ✅ All 8 Mermaid architecture diagrams

### In Progress
- ⏳ API documentation (available at `/docs` when server runs)
- ⏳ Implementation of backend services
- ⏳ Dashboard development

### Planned
- 📋 Physics validation rules catalog (PHY-01 to PHY-52)
- 📋 Training data documentation
- 📋 Model performance benchmarks
- 📋 User guides for different stakeholders

---

## Key Technical Decisions

### Fusion Parameters
- **α (FUSION_ALPHA)**: 0.5 - Reliability weight
- **β (FUSION_BETA)**: 0.3 - Recency weight
- **γ (FUSION_GAMMA)**: 0.2 - Spatial relevance weight
- **Z_MAX**: 3.0 - Outlier threshold
- **TIME_CONSTANT**: 300 seconds - Recency time constant

### Storage Strategy
- **Hot time-series**: InfluxDB/TimescaleDB (optional) - 90 days retention
- **Cold/archival**: Parquet/CDF on object storage - 2 years retention
- **Relational**: PostgreSQL - Events/predictions 5 years, audit logs 7 years

### Validation Rules
- Physics validation has three levels: PASS, SOFT_FAIL, HARD_FAIL
- HARD_FAIL sets `automation_allowed=false`
- No recommendations without physics validation

---

## Implementation Progress

### Completed
- ✅ Database schema design (15 tables)
- ✅ Fusion algorithm specification
- ✅ System architecture documentation
- ✅ Data requirements documentation
- ✅ Mermaid architecture diagrams
- ✅ Comprehensive README

### Next Steps
- 🔄 Implement SQLAlchemy models for 15 tables
- 🔄 Implement fusion service with algorithm
- 🔄 Create ingestion service for satellite data
- 🔄 Implement physics validation engine
- 🔄 Build API endpoints
- 🔄 Develop dashboard frontend

---

## Configuration Requirements

### Environment Variables
```bash
DATABASE_URL=postgresql://user:password@localhost/helios
OBJECT_STORAGE_PATH=/path/to/storage
TSDB_URL=influxdb://localhost:8086/helios
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=INFO
```

### Dependencies
- Python 3.9+
- PostgreSQL 14+
- Node.js 18+ (for dashboard)
- FastAPI, Uvicorn, SQLAlchemy
- PyTorch/ONNX for AI models
- React, Vite for dashboard

---

## Testing Strategy

### Backend Tests
- Unit tests for each service
- Integration tests for pipeline flow
- Fusion algorithm validation tests
- Physics validation rule tests

### Frontend Tests
- Component tests
- Integration tests
- E2E tests for critical user flows

### Performance Tests
- Database query performance (<100ms for event/prediction queries)
- Fusion computation latency
- API response times

---

## Deployment Strategy

### Environment Tiers
- **Development**: Local laptop with sample data
- **Staging**: Integration testing with historical event replay
- **Production**: Live operations with real-time feeds

### Scaling Approach
- Horizontal ingestion workers per satellite
- Batch timesteps for fusion + detection
- GPU node pool for multi-model inference
- Read replicas for dashboard queries

---

## Acknowledgments

- ISRO Aditya-L1 mission team
- NOAA Space Weather Prediction Center
- ESA Solar and Heliospheric Observatory (SOHO)
- NASA Deep Space Climate Observatory (DSCOVR)

---

## Notes

- This is an active research project
- Fusion algorithms and physics validation rules are continuously refined
- All changes should be documented in this memory file
- Major architectural decisions require update to SRS documents

---

## Change Log

### July 17, 2026
- ✅ Added complete fusion algorithm methodology to SRS (Section 6.5.6)
- ✅ Built comprehensive README with full project documentation
- ✅ Verified all Mermaid diagrams are in place and documented
- ✅ Created this memory.md file for project tracking
- ✅ Updated section numbering in data requirements document

### Earlier Dates
- Initial architecture design (15-table schema)
- System architecture documentation
- Mermaid diagram creation
- Data requirements documentation
