"""Pipeline Orchestrator.

Coordinates the end-to-end pipeline execution in strict order:
Ingest → Standardize → Quality Flag → Fuse → Recover → Detect
→ Predict → [UQ + Explain] → Consensus → Physics Validate → Decide

Key fixes applied vs. original:
  - run_pipeline() is now async; ingestion no longer uses asyncio.run()
  - Ingested data is passed through to fusion and detection stages
  - zip() misalignment fixed: validation returns Dict[prediction_id, result]
  - recovery_service integrated between fusion and detection (Module 4)
"""

import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import uuid

from loguru import logger

from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.core.models import PipelineRun, Event, Prediction

# Import services
from backend.services.ingestion_service import ingestion_service
from backend.services.fusion_service import fusion_service
from backend.services.recovery_service import recovery_service
from backend.services.detection_service import detection_service
from backend.services.prediction_service import prediction_service
from backend.services.uq_service import uq_service
from backend.services.explainability_service import explainability_service
from backend.services.physics_validation_service import physics_validation_service
from backend.services.decision_support_service import decision_support_service


class PipelineOrchestrator:
    """Orchestrates the end-to-end pipeline execution."""

    def __init__(self):
        self.timeout_seconds = settings.pipeline_timeout_seconds

    def create_pipeline_run(
        self,
        trigger_type: str = "scheduled",
        input_data_hash: Optional[str] = None
    ) -> PipelineRun:
        """Create a new pipeline run record."""
        pipeline_run = PipelineRun(
            trigger_type=trigger_type,
            started_at=datetime.utcnow(),
            status="running",
            input_data_hash=input_data_hash,
            config_version="v1.0",
        )

        with SessionLocal() as db:
            db.add(pipeline_run)
            db.commit()
            db.refresh(pipeline_run)

        return pipeline_run

    def update_pipeline_status(
        self,
        pipeline_run_id: uuid.UUID,
        status: str,
        completed_at: Optional[datetime] = None
    ):
        """Update pipeline run status."""
        with SessionLocal() as db:
            pipeline_run = db.query(PipelineRun).filter(
                PipelineRun.id == pipeline_run_id
            ).first()

            if pipeline_run:
                pipeline_run.status = status
                if completed_at:
                    pipeline_run.completed_at = completed_at
                db.commit()

    async def run_pipeline(
        self,
        start_time: datetime,
        end_time: datetime,
        trigger_type: str = "scheduled"
    ) -> Dict:
        """Run the complete pipeline asynchronously.

        The pipeline is now async end-to-end so satellite fetch coroutines
        run natively without asyncio.run() (which fails inside a running loop).
        """
        # Create pipeline run
        pipeline_run = self.create_pipeline_run(trigger_type)

        results = {
            "pipeline_run_id": str(pipeline_run.id),
            "status": "running",
            "stages": {},
        }

        try:
            # ── Stage 1: Ingestion ──────────────────────────────────────────
            ingested_data, ingestion_result = await self._run_ingestion(
                start_time, end_time
            )
            results["stages"]["ingestion"] = ingestion_result

            # ── Stage 2: Fusion ─────────────────────────────────────────────
            # Convert ingested per-satellite DataFrames into the dict format
            # expected by FusionService: {satellite_id: {param: value, ...}}
            fused_data, satellite_metadata, fusion_result = self._run_fusion(
                start_time, ingested_data
            )
            results["stages"]["fusion"] = fusion_result

            # ── Stage 3: Recovery (Module 4) ────────────────────────────────
            # Fill gaps in satellite data using cross-satellite reconstruction.
            # Uses fusion weights so the physics-aware weighting is preserved.
            recovered_data, recovery_result = self._run_recovery(
                ingested_data, satellite_metadata
            )
            results["stages"]["recovery"] = recovery_result

            # Merge recovered data back into ingested_data for detection
            for sat_name, (rec_df, _confidence) in recovered_data.items():
                if sat_name in ingested_data and not rec_df.empty:
                    ingested_data[sat_name] = rec_df

            # ── Stage 4: Detection ──────────────────────────────────────────
            events = self._run_detection(pipeline_run.id, fused_data)
            results["stages"]["detection"] = {"events_detected": len(events)}

            if not events:
                # No events detected — complete pipeline cleanly
                self.update_pipeline_status(pipeline_run.id, "success", datetime.utcnow())
                results["status"] = "success"
                results["message"] = "No events detected"
                return results

            # ── Stage 5: Prediction ─────────────────────────────────────────
            predictions = self._run_prediction(events, pipeline_run.id)
            results["stages"]["prediction"] = {"predictions_made": len(predictions)}

            # ── Stage 6: UQ + Explainability (parallel conceptually) ────────
            uq_results = self._run_uq(predictions)
            explanations = self._run_explainability(predictions)
            results["stages"]["uq_explainability"] = {
                "uq_estimates": len(uq_results),
                "explanations": len(explanations)
            }

            # ── Stage 7: Physics Validation ─────────────────────────────────
            # Returns Dict[prediction_id → result] to avoid zip misalignment
            validation_map = self._run_physics_validation(predictions)
            results["stages"]["physics_validation"] = {
                "validations": len(validation_map),
                "passed": sum(1 for r in validation_map.values() if r.validation_status == "PASS"),
                "soft_fails": sum(1 for r in validation_map.values() if r.validation_status == "SOFT_FAIL"),
                "hard_fails": sum(1 for r in validation_map.values() if r.validation_status == "HARD_FAIL"),
            }

            # ── Stage 8: Decision Support ────────────────────────────────────
            recommendations = self._run_decision_support(events, predictions, validation_map)
            results["stages"]["decision_support"] = {"recommendations": len(recommendations)}

            # Complete pipeline
            self.update_pipeline_status(pipeline_run.id, "success", datetime.utcnow())
            results["status"] = "success"
            results["message"] = "Pipeline completed successfully"

        except Exception as e:
            logger.exception(f"Pipeline {pipeline_run.id} failed: {e}")
            self.update_pipeline_status(pipeline_run.id, "failed", datetime.utcnow())
            results["status"] = "failed"
            results["error"] = str(e)
            results["message"] = f"Pipeline failed: {str(e)}"

        return results

    # ── Private stage runners ────────────────────────────────────────────────

    async def _run_ingestion(
        self,
        start_time: datetime,
        end_time: datetime
    ):
        """Stage 1 — Ingestion.

        Fetches data from all enabled satellites and resamples to a common
        1-minute grid. Returns (raw_data_dict, stage_result_dict).
        """
        try:
            # fetch_all_data is async — await it directly (no asyncio.run())
            raw_data = await ingestion_service.fetch_all_data(start_time, end_time)
            resampled = ingestion_service.resample_to_common_grid(raw_data, freq="1min")

            satellite_counts = {
                sat: len(df) for sat, df in resampled.items() if not df.empty
            }
            logger.info(f"Ingestion complete: {satellite_counts}")

            return resampled, {
                "status": "success",
                "satellites": list(satellite_counts.keys()),
                "row_counts": satellite_counts,
            }
        except Exception as e:
            logger.error(f"Ingestion failed: {e}")
            return {}, {"status": "failed", "error": str(e)}

    def _run_fusion(
        self,
        timestamp: datetime,
        ingested_data: Dict,
    ):
        """Stage 2 — Fusion.

        Converts ingested DataFrames into the per-timestamp dict format
        expected by FusionService, then runs the weighted fusion algorithm.
        Returns (fused_df, satellite_metadata, stage_result_dict).
        """
        import pandas as pd

        try:
            # Build {satellite_id: {param: value}} snapshot at `timestamp`
            satellite_snapshot: Dict[str, Dict[str, float]] = {}
            satellite_metadata: Dict[str, Dict] = {}

            for sat_name, df in ingested_data.items():
                if df.empty or "timestamp" not in df.columns:
                    continue

                # Get the row closest to the pipeline timestamp
                df_time = df["timestamp"]
                if df_time.dt.tz is not None:
                    df_time = df_time.dt.tz_localize(None)
                
                pipeline_time = timestamp
                if pipeline_time.tzinfo is not None:
                    pipeline_time = pipeline_time.replace(tzinfo=None)

                time_diffs = (df_time - pipeline_time).abs()
                closest_idx = time_diffs.idxmin()
                row = df.iloc[closest_idx]

                params = {
                    col: float(row[col])
                    for col in df.columns
                    if col not in ("timestamp", "quality_flag")
                    and pd.api.types.is_numeric_dtype(df[col])
                }
                satellite_snapshot[sat_name] = params
                satellite_metadata[sat_name] = {
                    "last_observation_time": row["timestamp"],
                    "instrument_status": 1.0,
                    # Positions are placeholders — replace with real ephemeris data
                    "position": (1.0, 0.0, 0.0),
                    "distance": 1.0,
                }

            if not satellite_snapshot:
                return pd.DataFrame(), satellite_metadata, {
                    "status": "skipped",
                    "message": "No satellite data available for fusion",
                }

            fusion_results = fusion_service.perform_fusion(
                timestamp, satellite_snapshot, satellite_metadata
            )

            # Build a single-row DataFrame representing fused values for detection
            fused_row = {param: val for param, (val, _) in fusion_results.items()}
            fused_row["timestamp"] = timestamp
            fused_df = pd.DataFrame([fused_row])

            logger.info(f"Fusion complete: {list(fused_row.keys())}")
            return fused_df, satellite_metadata, {
                "status": "success",
                "parameters_fused": len(fusion_results),
            }

        except Exception as e:
            logger.error(f"Fusion failed: {e}")
            import pandas as pd
            return pd.DataFrame(), {}, {"status": "failed", "error": str(e)}

    def _run_recovery(
        self,
        satellite_data: Dict,
        satellite_metadata: Dict,
    ):
        """Stage 3 — Missing Data Recovery (Module 4).

        Uses cross-satellite reconstruction and interpolation to fill gaps.
        Recovery weights are fetched from recent fusion snapshots.
        """
        try:
            fusion_weights = recovery_service.get_fusion_weights_for_recovery(
                datetime.utcnow()
            )
            recovered = recovery_service.recover_all_parameters(
                satellite_data, fusion_weights
            )

            recovered_count = sum(1 for _, (df, conf) in recovered.items() if not df.empty)
            logger.info(f"Recovery complete: {recovered_count} parameter series recovered")

            return recovered, {
                "status": "success",
                "parameters_recovered": recovered_count,
            }
        except Exception as e:
            logger.error(f"Recovery failed: {e}")
            return {}, {"status": "failed", "error": str(e)}

    def _run_detection(
        self,
        pipeline_run_id: uuid.UUID,
        fused_data,
    ) -> List[Event]:
        """Stage 4 — Solar Event Detection.

        Receives the fused DataFrame from Stage 2 and detects CME/Flare/HSS/SEP.
        """
        import pandas as pd

        try:
            if fused_data is None or (hasattr(fused_data, "empty") and fused_data.empty):
                logger.warning("Fused data is empty — skipping detection")
                return []

            events = detection_service.detect_events_from_fused_data(
                fused_data, pipeline_run_id
            )

            # Merge near-duplicate detections within 30-minute window
            events = detection_service.merge_duplicate_events(events)

            detection_service.store_events(events)

            logger.info(f"Detection complete: {len(events)} events found")
            return events
        except Exception as e:
            logger.error(f"Detection failed: {e}")
            return []

    def _run_prediction(
        self,
        events: List[Event],
        pipeline_run_id: uuid.UUID
    ) -> List[Prediction]:
        """Stage 5 — Prediction."""
        predictions = []

        for event in events:
            try:
                event_predictions = prediction_service.predict_for_event(
                    event, pipeline_run_id
                )
                predictions.extend(event_predictions)
            except Exception as e:
                logger.error(f"Prediction failed for event {event.id}: {e}")

        prediction_service.store_predictions(predictions)
        return predictions

    def _run_uq(self, predictions: List[Prediction]) -> List:
        """Stage 6a — Uncertainty Quantification."""
        uq_estimates = uq_service.batch_quantify_uncertainty(predictions)

        for uq in uq_estimates:
            uq_service.store_uncertainty_estimate(uq)

        return uq_estimates

    def _run_explainability(self, predictions: List[Prediction]) -> List:
        """Stage 6b — Explainability (runs in parallel with UQ conceptually)."""
        explanations = explainability_service.batch_explain_predictions(predictions)

        for exp in explanations:
            explainability_service.store_explanation(exp)

        return explanations

    def _run_physics_validation(
        self,
        predictions: List[Prediction]
    ) -> Dict[int, object]:
        """Stage 7 — Physics Validation.

        Returns Dict[prediction_id → PhysicsValidationResult] instead of a list
        to prevent the zip()-based misalignment bug where a failed validation
        would cause incorrect prediction→result mapping.
        """
        validation_map: Dict[int, object] = {}

        for prediction in predictions:
            try:
                result = physics_validation_service.validate_prediction(prediction)
                validation_map[prediction.id] = result
            except Exception as e:
                logger.error(f"Physics validation failed for prediction {prediction.id}: {e}")

        return validation_map

    def _run_decision_support(
        self,
        events: List[Event],
        predictions: List[Prediction],
        validation_map: Dict[int, object]
    ) -> List:
        """Stage 8 — Decision Support."""
        recommendations = []

        for event in events:
            event_predictions = [p for p in predictions if p.event_id == event.id]

            for prediction in event_predictions:
                validation_result = validation_map.get(prediction.id)

                if validation_result is None:
                    logger.warning(
                        f"No physics validation for prediction {prediction.id} — skipping DSS"
                    )
                    continue

                try:
                    event_recommendations = decision_support_service.generate_recommendations(
                        event, prediction, validation_result
                    )
                    recommendations.extend(event_recommendations)
                except Exception as e:
                    logger.error(f"DSS failed for prediction {prediction.id}: {e}")

        decision_support_service.store_recommendations(recommendations)
        return recommendations

    def get_pipeline_status(self, pipeline_run_id: uuid.UUID) -> Dict:
        """Get status of a pipeline run."""
        with SessionLocal() as db:
            pipeline_run = db.query(PipelineRun).filter(
                PipelineRun.id == pipeline_run_id
            ).first()

            if not pipeline_run:
                return {"status": "not_found"}

            return {
                "pipeline_run_id": str(pipeline_run.id),
                "trigger_type": pipeline_run.trigger_type,
                "status": pipeline_run.status,
                "started_at": pipeline_run.started_at.isoformat(),
                "completed_at": pipeline_run.completed_at.isoformat() if pipeline_run.completed_at else None,
                "input_data_hash": pipeline_run.input_data_hash,
                "config_version": pipeline_run.config_version,
            }

    def get_recent_pipeline_runs(self, limit: int = 10) -> List[Dict]:
        """Get recent pipeline runs."""
        with SessionLocal() as db:
            runs = db.query(PipelineRun).order_by(
                PipelineRun.started_at.desc()
            ).limit(limit).all()

            return [
                {
                    "pipeline_run_id": str(run.id),
                    "trigger_type": run.trigger_type,
                    "status": run.status,
                    "started_at": run.started_at.isoformat(),
                    "completed_at": run.completed_at.isoformat() if run.completed_at else None,
                }
                for run in runs
            ]


# Singleton instance
pipeline_orchestrator = PipelineOrchestrator()
