"""SQLAlchemy models — full 15-table target architecture.

Canonical DDL: ops/deployment/sql/schema_full.sql
ER diagram: docs/diagrams/schema_er.mmd
"""

from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Integer,
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
    JSON,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.core.database import Base


class Satellite(Base):
    __tablename__ = "satellites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    agency: Mapped[Optional[str]] = mapped_column(String(64))
    orbit_type: Mapped[Optional[str]] = mapped_column(String(32))
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    instruments: Mapped[list[Instrument]] = relationship(back_populates="satellite")
    event_observations: Mapped[list[EventObservation]] = relationship(back_populates="satellite")


class Instrument(Base):
    __tablename__ = "instruments"
    __table_args__ = (UniqueConstraint("satellite_id", "name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    satellite_id: Mapped[int] = mapped_column(ForeignKey("satellites.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    type: Mapped[Optional[str]] = mapped_column(String(64))
    description: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(32), default="operational", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    satellite: Mapped[Satellite] = relationship(back_populates="instruments")
    time_series_meta: Mapped[list[TimeSeriesMeta]] = relationship(back_populates="instrument")
    event_observations: Mapped[list[EventObservation]] = relationship(back_populates="instrument")


class TimeSeriesMeta(Base):
    __tablename__ = "time_series_meta"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    instrument_id: Mapped[int] = mapped_column(ForeignKey("instruments.id", ondelete="CASCADE"))
    parameter_name: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_type: Mapped[str] = mapped_column(String(32), nullable=False)
    storage_location: Mapped[str] = mapped_column(Text, nullable=False)
    time_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    time_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    resolution_sec: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    instrument: Mapped[Instrument] = relationship(back_populates="time_series_meta")
    event_observations: Mapped[list[EventObservation]] = relationship(back_populates="time_series_meta")


class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    trigger_type: Mapped[str] = mapped_column(String(32), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(String(32), default="running", nullable=False)
    input_data_hash: Mapped[Optional[str]] = mapped_column(String(128))
    config_version: Mapped[Optional[str]] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    events: Mapped[list[Event]] = relationship(back_populates="pipeline_run")
    predictions: Mapped[list[Prediction]] = relationship(back_populates="pipeline_run")


class FusionSnapshot(Base):
    __tablename__ = "fusion_snapshots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    parameter_name: Mapped[str] = mapped_column(String(64), nullable=False)
    fused_value: Mapped[Optional[Decimal]] = mapped_column(Numeric)
    weights_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pipeline_run_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("pipeline_runs.id", ondelete="SET NULL")
    )
    event_type: Mapped[str] = mapped_column(String(32), nullable=False)
    detection_source: Mapped[str] = mapped_column(String(32), default="AI", nullable=False)
    external_catalog_id: Mapped[Optional[str]] = mapped_column(String(128))
    start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    peak_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    detection_confidence: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    status: Mapped[str] = mapped_column(String(32), default="pending_validation", nullable=False)
    metadata_json: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    pipeline_run: Mapped[Optional[PipelineRun]] = relationship(back_populates="events")
    observations: Mapped[list[EventObservation]] = relationship(back_populates="event")
    predictions: Mapped[list[Prediction]] = relationship(back_populates="event")
    recommendations: Mapped[list[Recommendation]] = relationship(back_populates="event")
    audit_logs: Mapped[list[AuditLog]] = relationship(back_populates="event")


class EventObservation(Base):
    __tablename__ = "event_observations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"))
    satellite_id: Mapped[int] = mapped_column(ForeignKey("satellites.id"))
    instrument_id: Mapped[Optional[int]] = mapped_column(ForeignKey("instruments.id"))
    time_series_meta_id: Mapped[Optional[int]] = mapped_column(ForeignKey("time_series_meta.id"))
    observed_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    observed_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    quality_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    comments: Mapped[Optional[str]] = mapped_column(Text)

    event: Mapped[Event] = relationship(back_populates="observations")
    satellite: Mapped[Satellite] = relationship(back_populates="event_observations")
    instrument: Mapped[Optional[Instrument]] = relationship(back_populates="event_observations")
    time_series_meta: Mapped[Optional[TimeSeriesMeta]] = relationship(back_populates="event_observations")


class ModelRun(Base):
    __tablename__ = "model_runs"
    __table_args__ = (UniqueConstraint("model_name", "version"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    model_name: Mapped[str] = mapped_column(String(128), nullable=False)
    model_family: Mapped[str] = mapped_column(String(64), nullable=False)
    version: Mapped[str] = mapped_column(String(32), nullable=False)
    training_data_desc: Mapped[Optional[str]] = mapped_column(Text)
    training_start: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    training_end: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    metrics_json: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    predictions: Mapped[list[Prediction]] = relationship(back_populates="model_run")


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"))
    model_run_id: Mapped[Optional[int]] = mapped_column(ForeignKey("model_runs.id", ondelete="SET NULL"))
    pipeline_run_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("pipeline_runs.id", ondelete="SET NULL")
    )
    prediction_type: Mapped[str] = mapped_column(String(64), nullable=False)
    predicted_value: Mapped[Decimal] = mapped_column(Numeric, nullable=False)
    predicted_unit: Mapped[str] = mapped_column(String(64), nullable=False)
    prediction_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    horizon_seconds: Mapped[Optional[int]] = mapped_column(Integer)
    is_consensus: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    base_models_included: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    event: Mapped[Event] = relationship(back_populates="predictions")
    model_run: Mapped[Optional[ModelRun]] = relationship(back_populates="predictions")
    pipeline_run: Mapped[Optional[PipelineRun]] = relationship(back_populates="predictions")
    uncertainty: Mapped[Optional[UncertaintyEstimate]] = relationship(
        back_populates="prediction", uselist=False
    )
    explanations: Mapped[list[Explanation]] = relationship(back_populates="prediction")
    physics_validation: Mapped[Optional[PhysicsValidationResult]] = relationship(
        back_populates="prediction", uselist=False
    )
    recommendations: Mapped[list[Recommendation]] = relationship(back_populates="prediction")
    audit_logs: Mapped[list[AuditLog]] = relationship(back_populates="prediction")


class UncertaintyEstimate(Base):
    __tablename__ = "uncertainty_estimates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    prediction_id: Mapped[int] = mapped_column(
        ForeignKey("predictions.id", ondelete="CASCADE"), unique=True
    )
    lower_bound: Mapped[Optional[Decimal]] = mapped_column(Numeric)
    upper_bound: Mapped[Optional[Decimal]] = mapped_column(Numeric)
    bound_unit: Mapped[Optional[str]] = mapped_column(String(64))
    confidence_level: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    reliability_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    model_agreement_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 4))
    uncertainty_shape: Mapped[Optional[str]] = mapped_column(String(32))
    details_json: Mapped[Optional[dict]] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    prediction: Mapped[Prediction] = relationship(back_populates="uncertainty")


class Explanation(Base):
    __tablename__ = "explanations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    prediction_id: Mapped[int] = mapped_column(ForeignKey("predictions.id", ondelete="CASCADE"))
    explanation_type: Mapped[str] = mapped_column(String(64), nullable=False)
    importance_json: Mapped[Optional[dict]] = mapped_column(JSON)
    physics_explanation: Mapped[Optional[str]] = mapped_column(Text)
    nl_explanation: Mapped[Optional[str]] = mapped_column(Text)
    visualization_ref: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    prediction: Mapped[Prediction] = relationship(back_populates="explanations")


class PhysicsValidationResult(Base):
    __tablename__ = "physics_validation_results"
    __table_args__ = (
        CheckConstraint(
            "validation_status IN ('PASS', 'SOFT_FAIL', 'HARD_FAIL')",
            name="ck_physics_validation_status",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    prediction_id: Mapped[int] = mapped_column(
        ForeignKey("predictions.id", ondelete="CASCADE"), unique=True
    )
    validation_status: Mapped[str] = mapped_column(String(16), nullable=False)
    violated_rules: Mapped[Optional[dict]] = mapped_column(JSON)
    confidence_multiplier: Mapped[Decimal] = mapped_column(Numeric(5, 4), default=Decimal("1.0"))
    automation_allowed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    comments: Mapped[Optional[str]] = mapped_column(Text)

    prediction: Mapped[Prediction] = relationship(back_populates="physics_validation")


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(32), default="scientist", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    audit_logs: Mapped[list[AuditLog]] = relationship(back_populates="user")


class Recommendation(Base):
    __tablename__ = "recommendations"
    __table_args__ = (
        CheckConstraint(
            "action_priority IN ('low', 'medium', 'high', 'critical')",
            name="ck_recommendation_priority",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id", ondelete="CASCADE"))
    prediction_id: Mapped[int] = mapped_column(ForeignKey("predictions.id", ondelete="CASCADE"))
    target_system: Mapped[str] = mapped_column(String(64), nullable=False)
    recommended_action: Mapped[str] = mapped_column(String(128), nullable=False)
    action_priority: Mapped[str] = mapped_column(String(16), nullable=False)
    justification_text: Mapped[Optional[str]] = mapped_column(Text)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    valid_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    event: Mapped[Event] = relationship(back_populates="recommendations")
    prediction: Mapped[Prediction] = relationship(back_populates="recommendations")
    audit_logs: Mapped[list[AuditLog]] = relationship(back_populates="recommendation")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    event_id: Mapped[Optional[int]] = mapped_column(ForeignKey("events.id", ondelete="SET NULL"))
    prediction_id: Mapped[Optional[int]] = mapped_column(ForeignKey("predictions.id", ondelete="SET NULL"))
    recommendation_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("recommendations.id", ondelete="SET NULL")
    )
    action_type: Mapped[str] = mapped_column(String(64), nullable=False)
    action_details: Mapped[Optional[dict]] = mapped_column(JSON)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped[Optional[User]] = relationship(back_populates="audit_logs")
    event: Mapped[Optional[Event]] = relationship(back_populates="audit_logs")
    prediction: Mapped[Optional[Prediction]] = relationship(back_populates="audit_logs")
    recommendation: Mapped[Optional[Recommendation]] = relationship(back_populates="audit_logs")


# ---------------------------------------------------------------------------
# Performance indexes — mirrors high-query paths in API routers
# ---------------------------------------------------------------------------

# Events: most queries filter by start_time (time window) + event_type
Index("idx_events_start_time", Event.start_time)
Index("idx_events_type_time", Event.event_type, Event.start_time)
Index("idx_events_status", Event.status)

# FusionSnapshots: hot time-series scans by parameter + timestamp
Index("idx_fusion_snapshots_ts", FusionSnapshot.timestamp)
Index("idx_fusion_snapshots_param_ts", FusionSnapshot.parameter_name, FusionSnapshot.timestamp)

# Predictions: consensus lookup is a critical hot path
Index(
    "idx_predictions_consensus",
    Prediction.event_id,
    postgresql_where=Prediction.is_consensus.is_(True),
)
Index("idx_predictions_event_ts", Prediction.event_id, Prediction.prediction_timestamp)

# Recommendations: active recommendation queries filter by time window
Index(
    "idx_recommendations_active",
    Recommendation.valid_from,
    Recommendation.valid_until,
)
Index("idx_recommendations_stakeholder", Recommendation.target_system)

# AuditLog: governance queries by event + action type
Index("idx_audit_logs_event", AuditLog.event_id)
Index("idx_audit_logs_timestamp", AuditLog.timestamp)
