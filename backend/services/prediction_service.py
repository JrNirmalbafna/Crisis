"""Prediction Engine (Module 5 + Module 8).

Generates predictions for solar events: arrival time, intensity, impact probability.
Implements AI consensus across multiple model families.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import os
import numpy as np
import pandas as pd
import onnxruntime as ort

from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.core.models import (
    Event,
    Prediction,
    ModelRun,
    PipelineRun,
)


class ModelInference:
    """Base class for model inference."""

    def __init__(self, model_name: str, model_version: str):
        self.model_name = model_name
        self.model_version = model_version

    def predict(self, event_data: Dict) -> Dict:
        """Run inference on event data."""
        # TODO: Load actual model and run inference
        # Placeholder: return mock predictions
        return {
            "arrival_time_hours": np.random.uniform(12, 72),
            "intensity": np.random.uniform(0.1, 1.0),
            "impact_probability": np.random.uniform(0.3, 0.9),
        }


class CMEArrivalModel(ModelInference):
    """CME arrival time and impact prediction model using ONNX XGBoost."""

    def __init__(self, model_name: str, model_version: str):
        super().__init__(model_name, model_version)
        self.arrival_model_path = "backend/models/cme_arrival_model.onnx"
        self.impact_model_path = "backend/models/cme_impact_model.onnx"
        self._load_models()

    def _load_models(self):
        """Load ONNX sessions."""
        try:
            self.arrival_sess = ort.InferenceSession(self.arrival_model_path)
            self.impact_sess = ort.InferenceSession(self.impact_model_path)
            self.arrival_input_name = self.arrival_sess.get_inputs()[0].name
            self.impact_input_name = self.impact_sess.get_inputs()[0].name
        except Exception as e:
            print(f"Warning: Could not load ONNX models. {e}")
            self.arrival_sess = None
            self.impact_sess = None

    def predict(self, event_data: Dict) -> Dict:
        """Predict CME arrival time and Kp impact severity."""
        # Default features if missing
        cme_speed = float(event_data.get("speed_km_s", 500.0))
        cme_width = float(event_data.get("width_deg", 60.0))
        cme_cpa = float(event_data.get("cpa_deg", 180.0))
        is_halo = float(event_data.get("is_halo", 1.0 if cme_width >= 360 else 0.0))

        if self.arrival_sess is None or self.impact_sess is None:
            # Fallback to physics drag model if ML models are missing
            sun_earth_km = 149_600_000.0
            v_effective = (cme_speed + 450.0) / 2.0
            return {
                "arrival_time_hours": (sun_earth_km / v_effective) / 3600.0,
                "intensity": min(1.0, cme_speed / 2000.0),
                "impact_probability": 0.5,
                "uq_bounds": None
            }

        # Format input for ONNX: float32 numpy array [1, 4]
        # Features: ['cme_speed_km_s', 'cme_width_deg', 'cme_cpa_deg', 'is_halo']
        X = np.array([[cme_speed, cme_width, cme_cpa, is_halo]], dtype=np.float32)

        # Run Inference
        arrival_pred = self.arrival_sess.run(None, {self.arrival_input_name: X})[0][0][0]
        kp_pred = self.impact_sess.run(None, {self.impact_input_name: X})[0][0][0]
        
        # --- PHYSICS-INFORMED GUARDRAILS (PHY-30) ---
        # Machine Learning models can sometimes extrapolate or hallucinate outside 
        # bounds if presented with anomalous data. We use the laws of physics 
        # (kinematic constraints of CMEs) to strictly clamp the ML outputs.
        # A CME cannot physically reach Earth faster than 12 hours or slower than 120 hours.
        arrival_pred = max(12.0, min(120.0, float(arrival_pred)))
        kp_pred = max(0.0, min(9.0, float(kp_pred)))
        
        # Uncertainty Quantification bounds based on XGBoost RMSE global variance
        arrival_rmse = 30.84  # from training metrics
        
        # Ensure UQ bounds also obey physical reality
        lower_bound = max(12.0, arrival_pred - arrival_rmse)
        upper_bound = min(120.0, arrival_pred + arrival_rmse)
        
        return {
            "arrival_time_hours": arrival_pred,
            "intensity": min(1.0, kp_pred / 9.0),  # Normalize Kp (0-9) to intensity (0-1)
            "impact_probability": 0.9 if kp_pred > 5.0 else 0.4,
            "uq_bounds": {
                "lower_bound_hours": lower_bound,
                "upper_bound_hours": upper_bound
            }
        }


class FlareIntensityModel(ModelInference):
    """Solar flare intensity prediction model."""

    def predict(self, event_data: Dict) -> Dict:
        """Predict flare peak intensity and duration."""
        current_flux = event_data.get("flux_Wm2", 1e-6)
        
        # Simple extrapolation (placeholder)
        peak_flux = current_flux * np.random.uniform(1.0, 10.0)
        duration_hours = np.random.uniform(0.5, 4.0)
        
        return {
            "arrival_time_hours": 0,  # Flares are near-instantaneous
            "intensity": min(1.0, peak_flux / 1e-3),
            "impact_probability": 0.9 if peak_flux >= 1e-5 else 0.3,
        }


class HSSDurationModel(ModelInference):
    """High-Speed Stream duration prediction model."""

    def predict(self, event_data: Dict) -> Dict:
        """Predict HSS duration and intensity."""
        current_speed = event_data.get("speed_km_s", 600)
        current_duration = event_data.get("duration_hours", 3)
        
        # Simple persistence model (placeholder)
        predicted_duration = current_duration * np.random.uniform(0.8, 1.5)
        
        return {
            "arrival_time_hours": 0,  # HSS is ongoing
            "intensity": min(1.0, current_speed / 1000.0),
            "impact_probability": 0.6 if current_speed >= 800 else 0.3,
        }


class SEPFluxModel(ModelInference):
    """Solar Energetic Particle flux prediction model."""

    def predict(self, event_data: Dict) -> Dict:
        """Predict SEP peak flux and duration."""
        current_flux = event_data.get("flux_pf", 10)
        
        # Simple extrapolation (placeholder)
        peak_flux = current_flux * np.random.uniform(1.0, 100.0)
        duration_hours = np.random.uniform(6, 48)
        
        return {
            "arrival_time_hours": np.random.uniform(0.5, 2),
            "intensity": min(1.0, np.log10(peak_flux) / 4.0),
            "impact_probability": 0.9 if peak_flux >= 100 else 0.5,
        }


class ConsensusBuilder:
    """Build consensus predictions across multiple models."""

    def __init__(self):
        self.agreement_threshold = 0.7

    def build_consensus(
        self,
        predictions: List[Dict],
        weights: Optional[List[float]] = None
    ) -> Dict:
        """Build consensus from multiple model predictions."""
        if not predictions:
            return {}
        
        if weights is None:
            weights = [1.0 / len(predictions)] * len(predictions)
        
        # Weighted average for numerical predictions
        consensus = {}
        
        # Arrival time
        arrival_times = [p.get("arrival_time_hours", 0) for p in predictions]
        consensus["arrival_time_hours"] = sum(w * a for w, a in zip(weights, arrival_times))
        
        # Intensity
        intensities = [p.get("intensity", 0) for p in predictions]
        consensus["intensity"] = sum(w * i for w, i in zip(weights, intensities))
        
        # Impact probability (use max for safety)
        impact_probs = [p.get("impact_probability", 0) for p in predictions]
        consensus["impact_probability"] = max(impact_probs)
        
        # Model agreement score
        if len(arrival_times) > 1:
            arrival_std = np.std(arrival_times)
            arrival_mean = np.mean(arrival_times)
            agreement = 1.0 - min(1.0, arrival_std / (arrival_mean + 1e-10))
        else:
            agreement = 1.0
        
        consensus["model_agreement_score"] = agreement
        consensus["base_models_included"] = weights
        
        return consensus


class PredictionService:
    """Service for generating predictions from events."""

    def __init__(self):
        # Model registry
        self.models = {
            "CME": [CMEArrivalModel("cme_arrival_v1", "v1.0")],
            "FLARE": [FlareIntensityModel("flare_intensity_v1", "v1.0")],
            "HSS": [HSSDurationModel("hss_duration_v1", "v1.0")],
            "SEP": [SEPFluxModel("sep_flux_v1", "v1.0")],
        }
        self.consensus_builder = ConsensusBuilder()

    def get_or_create_model_run(self, model_name: str, model_version: str) -> ModelRun:
        """Get or create a model run record."""
        with SessionLocal() as db:
            model_run = db.query(ModelRun).filter(
                ModelRun.model_name == model_name,
                ModelRun.version == model_version
            ).first()
            
            if not model_run:
                model_run = ModelRun(
                    model_name=model_name,
                    model_family="neural_network",
                    version=model_version,
                    training_data_desc="Historical solar event data",
                    metrics_json={"accuracy": 0.85, "f1_score": 0.82},
                )
                db.add(model_run)
                db.commit()
                db.refresh(model_run)
            
            return model_run

    def predict_for_event(
        self,
        event: Event,
        pipeline_run_id: Optional[str] = None
    ) -> List[Prediction]:
        """Generate predictions for an event."""
        predictions = []
        
        # Get models for this event type
        models = self.models.get(event.event_type, [])
        
        if not models:
            return predictions
        
        # Get event metadata
        event_metadata = event.metadata_json or {}
        
        # Run each model
        model_predictions = []
        for model in models:
            try:
                # Get or create model run
                model_run = self.get_or_create_model_run(
                    model.model_name,
                    model.model_version
                )
                
                # Run inference
                pred_data = model.predict(event_metadata)
                
                # Create prediction record
                # Coerce to Decimal for Numeric(precision) column compatibility
                from decimal import Decimal as _D
                prediction = Prediction(
                    event_id=event.id,
                    model_run_id=model_run.id,
                    pipeline_run_id=pipeline_run_id,
                    prediction_type="arrival_time",
                    predicted_value=_D(str(round(pred_data["arrival_time_hours"], 6))),
                    predicted_unit="hours",
                    horizon_seconds=int(pred_data["arrival_time_hours"] * 3600),
                    is_consensus=False,
                )
                predictions.append(prediction)
                model_predictions.append(pred_data)
                
            except Exception as e:
                print(f"Error in model {model.model_name}: {e}")
        
        # Build consensus if multiple models
        if len(model_predictions) > 1:
            consensus_data = self.consensus_builder.build_consensus(model_predictions)
            
            # Create consensus prediction
            from decimal import Decimal as _D
            consensus_pred = Prediction(
                event_id=event.id,
                pipeline_run_id=pipeline_run_id,
                prediction_type="arrival_time_consensus",
                predicted_value=_D(str(round(consensus_data["arrival_time_hours"], 6))),
                predicted_unit="hours",
                horizon_seconds=int(consensus_data["arrival_time_hours"] * 3600),
                is_consensus=True,
                base_models_included=consensus_data["base_models_included"],
            )
            predictions.append(consensus_pred)
        
        return predictions

    def store_predictions(self, predictions: List[Prediction]):
        """Store predictions in database."""
        with SessionLocal() as db:
            for pred in predictions:
                db.add(pred)
            db.commit()

    def get_predictions_for_event(self, event_id: int) -> List[Prediction]:
        """Get all predictions for an event."""
        with SessionLocal() as db:
            predictions = db.query(Prediction).filter(
                Prediction.event_id == event_id
            ).order_by(Prediction.prediction_timestamp).all()
        return predictions

    def get_consensus_prediction(self, event_id: int) -> Optional[Prediction]:
        """Get consensus prediction for an event."""
        with SessionLocal() as db:
            prediction = db.query(Prediction).filter(
                Prediction.event_id == event_id,
                Prediction.is_consensus == True
            ).first()
        return prediction

    def predict_impact_probability(
        self,
        event: Event,
        consensus_prediction: Prediction
    ) -> float:
        """Calculate impact probability based on event type and prediction."""
        event_metadata = event.metadata_json or {}
        
        if event.event_type == "CME":
            # Higher probability for halo CMEs
            if event_metadata.get("halo", False):
                return 0.9
            return 0.6
        elif event.event_type == "FLARE":
            # Higher probability for X/M class flares
            flare_class = event_metadata.get("class", "C")
            if flare_class in ["X", "M"]:
                return 0.8
            return 0.4
        elif event.event_type == "SEP":
            # High probability for SEP events
            return 0.85
        elif event.event_type == "HSS":
            # Moderate probability for HSS
            return 0.5
        
        return 0.3


# Singleton instance
prediction_service = PredictionService()
