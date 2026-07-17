# Helios Intelligence

**Trustworthy AI Scientific Decision Support Platform for Space Weather**

Helios Intelligence is a comprehensive AI-powered platform for space weather monitoring, prediction, and decision support. The system ingests multi-satellite data, fuses measurements using physics-aware algorithms, detects solar events, predicts their impact on Earth, and provides stakeholder-specific recommendations with full uncertainty quantification and physics validation.

## 🎯 Core Philosophy

**Machine learning proposes; physics disposes; decision support acts only on validated outputs.**

The system combines:
- **Multi-satellite data fusion** from Aditya-L1, SOHO, DSCOVR, GOES, ACE, WIND
- **AI-powered detection** of CMEs, flares, HSS, SEP events
- **Physics-aware fusion** with reliability-weighted algorithms
- **Uncertainty quantification** with calibrated predictive intervals
- **Explainable AI** with physics-aligned interpretations
- **Physics validation gate** before any operational recommendations
- **Scientific decision support** for satellite operators, power grids, astronauts

## 🏗️ Architecture

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **API Server** | FastAPI | 0.104+ | High-performance REST API with automatic OpenAPI docs |
| | Uvicorn | 0.24+ | ASGI server for FastAPI |
| | WebSockets | - | Real-time dashboard updates |
| **Database** | PostgreSQL | 14+ | Canonical 15-table schema for provenance |
| | SQLAlchemy | 2.0+ | Python ORM and database toolkit |
| | Alembic | 1.12+ | Database migration tool |
| **Time-series Storage** | Parquet | - | Columnar storage for processed data |
| | Apache Arrow | 12+ | In-memory columnar data processing |
| | CDF | - | Common Data Format for raw spacecraft data |
| | InfluxDB | 2.7+ (optional) | Hot time-series database |
| | TimescaleDB | 2.11+ (optional) | PostgreSQL extension for time-series |
| **Object Storage** | MinIO | - (optional) | S3-compatible local object storage |
| | AWS S3 | - (optional) | Cloud object storage |
| **AI/ML** | PyTorch | 2.1+ | Deep learning framework |
| | ONNX | 1.15+ | Model interchange format |
| | ONNX Runtime | 1.16+ | High-performance inference |
| | scikit-learn | 1.3+ | Traditional ML algorithms |
| | XGBoost | 2.0+ | Gradient boosting framework |
| | NumPy | 1.24+ | Numerical computing |
| | Pandas | 2.0+ | Data manipulation |
| | SciPy | 1.11+ | Scientific computing |
| **Explainability** | SHAP | 0.43+ | Model explanations |
| | LIME | - (optional) | Local interpretable explanations |
| **Uncertainty Quantification** | TensorFlow Probability | - (optional) | Probabilistic ML |
| | PyMC | - (optional) | Probabilistic programming |
| **Dashboard** | React | 18+ | Frontend framework |
| | TypeScript | 5+ | Type-safe JavaScript |
| | Vite | 5+ | Build tool and dev server |
| | TailwindCSS | 3+ | Utility-first CSS |
| | shadcn/ui | - (optional) | Reusable UI components |
| | Lucide React | - (optional) | Icon library |
| | Recharts | 2+ | Charting library |
| | D3.js | - (optional) | Advanced visualizations |
| **Task Queue** | Celery | 5.3+ (optional) | Distributed task queue |
| | Redis | 7+ (optional) | Message broker and cache |
| **Monitoring** | Prometheus | - (optional) | Metrics collection |
| | Grafana | - (optional) | Metrics visualization |
| **Testing** | pytest | 7.4+ | Python testing framework |
| | pytest-cov | - (optional) | Code coverage |
| | Jest | 29+ (optional) | JavaScript testing |
| | Playwright | - (optional) | E2E testing |
| **Development** | Python | 3.9+ | Backend language |
| | Node.js | 18+ | Frontend runtime |
| | Docker | 24+ (optional) | Containerization |
| | Docker Compose | 2.21+ (optional) | Multi-container orchestration |
| **Data Processing** | Apache Spark | - (optional) | Large-scale data processing |
| | Dask | - (optional) | Parallel computing in Python |
| **API Documentation** | Swagger/OpenAPI | 3.0 | Auto-generated from FastAPI |
| **Authentication** | JWT | - (optional) | Token-based authentication |
| | OAuth2 | - (optional) | OAuth2 authorization |
| **Logging** | Loguru | - (optional) | Python logging |
| | Structlog | - (optional) | Structured logging |

### System Layers

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

## 📊 Database Schema

The system uses a **15-table PostgreSQL schema** for full provenance:

| # | Table | Domain | Purpose |
|---|-------|--------|---------|
| 1 | `satellites` | Spacecraft metadata | Spacecraft registry (Aditya-L1, SOHO, DSCOVR, GOES, ACE, WIND) |
| 2 | `instruments` | Instrument registry | Per-satellite instruments (SWIS, VELC, LASCO, XRS, etc.) |
| 3 | `time_series_meta` | Pointers to bulk TS data | References to Parquet/CDF/TSDB storage |
| 4 | `pipeline_runs` | Pipeline traceability | End-to-end inference pass tracking |
| 5 | `fusion_snapshots` | Fusion audit | Per-timestep fusion weights and fused values |
| 6 | `events` | Events | Detected solar events (CME, flare, HSS, SEP, CIR) |
| 7 | `event_observations` | Event linkage | Per-satellite event observations with quality scores |
| 8 | `model_runs` | AI model registry | Model versions and training metrics |
| 9 | `predictions` | Forecasts | Per-event arrival, intensity, impact forecasts |
| 10 | `uncertainty_estimates` | UQ intervals | Predictive intervals, calibration, model agreement |
| 11 | `explanations` | XAI artifacts | SHAP values, physics-aligned text, NL summaries |
| 12 | `physics_validation_results` | Physics gate | PASS/SOFT_FAIL/HARD_FAIL validation status |
| 13 | `users` | RBAC | Role-based access control (scientist, operator, admin) |
| 14 | `recommendations` | DSS outputs | Stakeholder-specific recommendations |
| 15 | `audit_logs` | Trust log | Immutable append-only audit trail |

## 🔬 Key Algorithms

### Multi-Satellite Fusion (Module 3)

The system uses a reliability-weighted fusion formula:

```
wi(t) = α · Ri(t) + β · Qi(t) + γ · Si
xfused(t) = Σi wi(t) · xi(t) / Σi wi(t)
```

Where:
- **Ri(t)** = reliability score (based on outliers, noise, consistency)
- **Qi(t)** = recency/data-freshness score
- **Si** = spatial relevance (geometry/orbit configuration)
- **Fi(t)** = instrument status flag (hard gating)

**Reliability components:**
- **Outlier score Oi(t)**: Z-score based cross-satellite deviation
- **Noise score Ni(t)**: Short-term variance in sliding window
- **Consistency score Vi(t)**: Long-term agreement with consensus

**Physics-aware enhancements:**
- Dynamic pressure consistency checks
- Plasma beta validation (with magnetic data)
- Temporal smoothness penalties

See `docs/SRS/06_data_requirements.md` for complete fusion methodology.

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- PostgreSQL 14+
- Node.js 18+ (for dashboard)

### Database Setup

```bash
# Create database
createdb helios

# Apply canonical schema
psql -d helios -f ops/deployment/sql/schema_full.sql
```

### Backend Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and other settings

# Run migrations (if using Alembic)
alembic upgrade head

# Start API server
uvicorn backend.api.main:app --reload
```

### Dashboard Setup

```bash
cd dashboard
npm install
npm run dev
```

## 📁 Repository Structure

```
helios-intelligence/
├── docs/
│   ├── SRS/
│   │   ├── 05_system_architecture.md    # System architecture
│   │   └── 06_data_requirements.md      # Data requirements + fusion methodology
│   └── diagrams/
│       ├── architecture.mmd              # Logical architecture diagram
│       ├── dataflow.mmd                  # End-to-end dataflow
│       ├── components.mmd                # Component architecture
│       ├── deployment.mmd                # Deployment topology
│       ├── sequence_cme_detected.mmd     # CME detection sequence
│       ├── sequence_physics_reject.mmd   # Physics rejection sequence
│       ├── schema_er.mmd                 # 15-table ER diagram
│       └── storage_architecture.mmd      # Hybrid storage view
├── data/
│   ├── raw/          # Spacecraft CDF, API dumps
│   ├── processed/    # Normalized Parquet
│   └── catalogs/     # CME, flare, SEP event lists
├── backend/
│   ├── api/
│   │   ├── main.py
│   │   └── routers/                      # API endpoints
│   ├── services/                         # Business logic (one per module)
│   │   ├── ingestion_service.py
│   │   ├── fusion_service.py
│   │   ├── detection_service.py
│   │   ├── prediction_service.py
│   │   ├── uq_service.py
│   │   ├── explainability_service.py
│   │   ├── physics_validation_service.py
│   │   ├── decision_support_service.py
│   │   └── pipeline_orchestrator.py
│   └── core/
│       ├── config.py
│       ├── database.py
│       └── models.py                     # SQLAlchemy models
├── ai/
│   ├── models/                           # Trained model artifacts
│   ├── training/                         # Training scripts
│   └── inference/                        # Inference engines
├── dashboard/
│   └── src/                              # React frontend
└── ops/
    └── deployment/
        ├── sql/
        │   └── schema_full.sql           # Canonical DDL
        └── docker/                       # Docker configurations
```

## 🔄 Pipeline Flow

```
Ingest → Standardize → Quality Flag → Fuse → Recover → Detect
  → Predict → [UQ + Explain] → Consensus → Physics Validate
  → Decide → Present
```

**Strict ordering enforced:**
- Detection → Prediction → [UQ + EXP] → CONSENSUS → PHYSICS VALIDATION → DSS
- Physics validation is a **hard gate** for automated decision support
- No recommendations without physics validation

## 📈 Mermaid Diagrams

All architecture diagrams are in Mermaid format (`.mmd` files). To view them:

1. **Online**: Copy content to [Mermaid Live Editor](https://mermaid.live/)
2. **GitHub/GitLab**: Automatically rendered in markdown files
3. **VS Code**: Install Mermaid preview extension
4. **Documentation**: Most markdown viewers support Mermaid natively

**Available diagrams:**
- `architecture.mmd` - System layer architecture
- `dataflow.mmd` - End-to-end data processing pipeline
- `components.mmd` - Service and component relationships
- `deployment.mmd` - Runtime deployment topology
- `schema_er.mmd` - Database entity relationships
- `storage_architecture.mmd` - Hybrid storage architecture
- `sequence_cme_detected.mmd` - CME detection sequence flow
- `sequence_physics_reject.mmd` - Physics validation rejection flow

## 🔧 Configuration

### Environment Variables

```bash
DATABASE_URL=postgresql://user:password@localhost/helios
OBJECT_STORAGE_PATH=/path/to/storage
TSDB_URL=influxdb://localhost:8086/helios
API_HOST=0.0.0.0
API_PORT=8000
LOG_LEVEL=INFO
```

### Fusion Parameters

Configure in `backend/core/config.py`:

```python
FUSION_ALPHA = 0.5  # Reliability weight
FUSION_BETA = 0.3   # Recency weight
FUSION_GAMMA = 0.2  # Spatial relevance weight
Z_MAX = 3.0         # Outlier threshold
TIME_CONSTANT = 300 # Recency time constant (seconds)
```

## 📚 Documentation

- **System Architecture**: `docs/SRS/05_system_architecture.md`
- **Data Requirements**: `docs/SRS/06_data_requirements.md`
- **Fusion Methodology**: See Section 6.5.6 in data requirements
- **API Documentation**: Available at `/docs` when running the API server

## 🧪 Testing

```bash
# Run backend tests
pytest backend/tests/

# Run with coverage
pytest --cov=backend backend/tests/

# Run dashboard tests
cd dashboard
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

[Specify your license here]

## 🙏 Acknowledgments

- ISRO Aditya-L1 mission team
- NOAA Space Weather Prediction Center
- ESA Solar and Heliospheric Observatory (SOHO)
- NASA Deep Space Climate Observatory (DSCOVR)

## 📞 Contact

For questions and support:
- Open an issue on GitHub
- Contact: [your contact information]

---

**Note**: This is an active research project. The fusion algorithms and physics validation rules are continuously being refined based on operational feedback and scientific validation.
