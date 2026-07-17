-- Helios Intelligence — Full PostgreSQL Schema
-- Hybrid storage: time-series in Parquet/CDF/TSDB; provenance in Postgres.
-- Requires: PostgreSQL 14+ with pgcrypto (gen_random_uuid).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Reference / metadata
-- ---------------------------------------------------------------------------

CREATE TABLE satellites (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(128) NOT NULL UNIQUE,
    agency          VARCHAR(64),
    orbit_type      VARCHAR(32),   -- L1, GEO, LEO, halo, etc.
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE instruments (
    id              SERIAL PRIMARY KEY,
    satellite_id    INT NOT NULL REFERENCES satellites(id) ON DELETE CASCADE,
    name            VARCHAR(128) NOT NULL,
    type            VARCHAR(64),   -- particle, coronagraph, xray, magnetometer
    description     TEXT,
    status          VARCHAR(32) NOT NULL DEFAULT 'operational',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (satellite_id, name)
);

CREATE TABLE time_series_meta (
    id                  SERIAL PRIMARY KEY,
    instrument_id       INT NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
    parameter_name      VARCHAR(64) NOT NULL,
    storage_type        VARCHAR(32) NOT NULL,  -- parquet, cdf, tsdb
    storage_location    TEXT NOT NULL,
    time_start          TIMESTAMPTZ,
    time_end            TIMESTAMPTZ,
    resolution_sec      INT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Pipeline traceability
-- ---------------------------------------------------------------------------

CREATE TABLE pipeline_runs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_type        VARCHAR(32) NOT NULL,  -- scheduled, new_data, manual
    started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at        TIMESTAMPTZ,
    status              VARCHAR(32) NOT NULL DEFAULT 'running',
    input_data_hash     VARCHAR(128),
    config_version      VARCHAR(64),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Fusion audit (Module 3)
-- ---------------------------------------------------------------------------

CREATE TABLE fusion_snapshots (
    id                  BIGSERIAL PRIMARY KEY,
    timestamp           TIMESTAMPTZ NOT NULL,
    parameter_name      VARCHAR(64) NOT NULL,
    fused_value         NUMERIC,
    weights_json        JSONB NOT NULL,  -- {sat_id: {w, R, Q, S, F, O, N, V}}
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Events (Module 1)
-- ---------------------------------------------------------------------------

CREATE TABLE events (
    id                      BIGSERIAL PRIMARY KEY,
    pipeline_run_id         UUID REFERENCES pipeline_runs(id) ON DELETE SET NULL,
    event_type              VARCHAR(32) NOT NULL,
    detection_source        VARCHAR(32) NOT NULL DEFAULT 'AI',
    external_catalog_id     VARCHAR(128),
    start_time              TIMESTAMPTZ NOT NULL,
    peak_time               TIMESTAMPTZ,
    end_time                TIMESTAMPTZ,
    detection_confidence    NUMERIC(5,4) CHECK (detection_confidence BETWEEN 0 AND 1),
    status                  VARCHAR(32) NOT NULL DEFAULT 'pending_validation',
    metadata_json           JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE event_observations (
    id                      SERIAL PRIMARY KEY,
    event_id                BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    satellite_id            INT NOT NULL REFERENCES satellites(id),
    instrument_id           INT REFERENCES instruments(id),
    time_series_meta_id     INT REFERENCES time_series_meta(id),
    observed_start          TIMESTAMPTZ,
    observed_end            TIMESTAMPTZ,
    quality_score           NUMERIC(5,4) CHECK (quality_score BETWEEN 0 AND 1),
    comments                TEXT
);

-- ---------------------------------------------------------------------------
-- AI models & predictions (Modules 5, 8)
-- ---------------------------------------------------------------------------

CREATE TABLE model_runs (
    id                      SERIAL PRIMARY KEY,
    model_name              VARCHAR(128) NOT NULL,
    model_family            VARCHAR(64) NOT NULL,
    version                 VARCHAR(32) NOT NULL,
    training_data_desc      TEXT,
    training_start          TIMESTAMPTZ,
    training_end            TIMESTAMPTZ,
    metrics_json            JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (model_name, version)
);

CREATE TABLE predictions (
    id                      BIGSERIAL PRIMARY KEY,
    event_id                BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    model_run_id            INT REFERENCES model_runs(id) ON DELETE SET NULL,
    pipeline_run_id         UUID REFERENCES pipeline_runs(id) ON DELETE SET NULL,
    prediction_type         VARCHAR(64) NOT NULL,
    predicted_value         NUMERIC NOT NULL,
    predicted_unit          VARCHAR(64) NOT NULL,
    prediction_timestamp    TIMESTAMPTZ NOT NULL DEFAULT now(),
    horizon_seconds         INT,
    is_consensus            BOOLEAN NOT NULL DEFAULT FALSE,
    base_models_included    JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- UQ, explainability, physics gate (Modules 6, 7, 9)
-- ---------------------------------------------------------------------------

CREATE TABLE uncertainty_estimates (
    id                      BIGSERIAL PRIMARY KEY,
    prediction_id           BIGINT NOT NULL UNIQUE REFERENCES predictions(id) ON DELETE CASCADE,
    lower_bound             NUMERIC,
    upper_bound             NUMERIC,
    bound_unit              VARCHAR(64),
    confidence_level        NUMERIC(5,4) CHECK (confidence_level BETWEEN 0 AND 1),
    reliability_score       NUMERIC(5,4) CHECK (reliability_score BETWEEN 0 AND 1),
    model_agreement_score   NUMERIC(5,4) CHECK (model_agreement_score BETWEEN 0 AND 1),
    uncertainty_shape       VARCHAR(32),
    details_json            JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE explanations (
    id                      BIGSERIAL PRIMARY KEY,
    prediction_id           BIGINT NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    explanation_type        VARCHAR(64) NOT NULL,
    importance_json         JSONB,
    physics_explanation     TEXT,
    nl_explanation          TEXT,
    visualization_ref       TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE physics_validation_results (
    id                      BIGSERIAL PRIMARY KEY,
    prediction_id           BIGINT NOT NULL UNIQUE REFERENCES predictions(id) ON DELETE CASCADE,
    validation_status         VARCHAR(16) NOT NULL CHECK (validation_status IN ('PASS', 'SOFT_FAIL', 'HARD_FAIL')),
    violated_rules            JSONB,  -- [{id, severity, observed, limit, message}]
    confidence_multiplier     NUMERIC(5,4) NOT NULL DEFAULT 1.0 CHECK (confidence_multiplier BETWEEN 0 AND 1),
    automation_allowed        BOOLEAN NOT NULL DEFAULT TRUE,
    checked_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
    comments                  TEXT
);

-- ---------------------------------------------------------------------------
-- Decision support & audit (Modules 10, 11)
-- ---------------------------------------------------------------------------

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(128) NOT NULL UNIQUE,
    role            VARCHAR(32) NOT NULL DEFAULT 'scientist',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recommendations (
    id                      BIGSERIAL PRIMARY KEY,
    event_id                BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    prediction_id           BIGINT NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
    target_system           VARCHAR(64) NOT NULL,
    recommended_action      VARCHAR(128) NOT NULL,
    action_priority         VARCHAR(16) NOT NULL CHECK (action_priority IN ('low', 'medium', 'high', 'critical')),
    justification_text      TEXT,
    valid_from              TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id                      BIGSERIAL PRIMARY KEY,
    user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
    event_id                BIGINT REFERENCES events(id) ON DELETE SET NULL,
    prediction_id           BIGINT REFERENCES predictions(id) ON DELETE SET NULL,
    recommendation_id       BIGINT REFERENCES recommendations(id) ON DELETE SET NULL,
    action_type             VARCHAR(64) NOT NULL,
    action_details          JSONB,
    timestamp               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_events_time_type ON events (start_time DESC, event_type);
CREATE INDEX idx_events_pipeline ON events (pipeline_run_id);
CREATE INDEX idx_event_obs_event ON event_observations (event_id);

CREATE INDEX idx_predictions_event ON predictions (event_id, prediction_type);
CREATE INDEX idx_predictions_consensus ON predictions (event_id) WHERE is_consensus = TRUE;
CREATE INDEX idx_predictions_pipeline ON predictions (pipeline_run_id);

CREATE INDEX idx_fusion_snapshots_ts ON fusion_snapshots (timestamp DESC, parameter_name);
CREATE INDEX idx_recommendations_event ON recommendations (event_id, valid_from DESC);
CREATE INDEX idx_audit_logs_event_ts ON audit_logs (event_id, timestamp DESC);
CREATE INDEX idx_time_series_meta_param ON time_series_meta (parameter_name, time_start DESC);

-- ---------------------------------------------------------------------------
-- Seed reference data (optional)
-- ---------------------------------------------------------------------------

INSERT INTO satellites (name, agency, orbit_type, description) VALUES
    ('Aditya-L1', 'ISRO', 'L1', 'Indian solar observatory at Sun-Earth L1'),
    ('DSCOVR', 'NOAA/NASA', 'L1', 'Deep Space Climate Observatory'),
    ('SOHO', 'ESA/NASA', 'L1', 'Solar and Heliospheric Observatory'),
    ('GOES-16', 'NOAA/NASA', 'GEO', 'Geostationary Operational Environmental Satellite'),
    ('ACE', 'NASA', 'L1', 'Advanced Composition Explorer'),
    ('WIND', 'NASA', 'L1', 'Solar wind monitor')
ON CONFLICT (name) DO NOTHING;
