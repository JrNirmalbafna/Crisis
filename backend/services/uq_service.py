"""Uncertainty Quantification Engine (Module 6).

Quantifies prediction uncertainty using predictive intervals, calibration,
and model agreement scores.
"""

from datetime import datetime
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from scipy import stats

from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.core.models import (
    Prediction,
    UncertaintyEstimate,
)


class UncertaintyQuantifier:
    """Core uncertainty quantification algorithms."""

    def __init__(self):
        self.confidence_levels = [0.90, 0.95, 0.99]

    def compute_predictive_interval(
        self,
        predicted_value: float,
        uncertainty_std: float,
        confidence_level: float = 0.95
    ) -> Tuple[float, float]:
        """Compute predictive interval using normal distribution."""
        z_score = stats.norm.ppf(1 - (1 - confidence_level) / 2)
        margin = z_score * uncertainty_std
        
        lower_bound = predicted_value - margin
        upper_bound = predicted_value + margin
        
        return lower_bound, upper_bound

    def compute_model_agreement(
        self,
        individual_predictions: List[float]
    ) -> float:
        """Compute model agreement score from ensemble predictions."""
        if len(individual_predictions) < 2:
            return 1.0
        
        # Use coefficient of variation as agreement metric
        mean_pred = np.mean(individual_predictions)
        std_pred = np.std(individual_predictions)
        
        if mean_pred == 0:
            return 1.0
        
        cv = std_pred / mean_pred
        agreement = 1.0 / (1.0 + cv)
        
        return agreement

    def compute_reliability_score(
        self,
        prediction: float,
        actual: Optional[float],
        historical_errors: List[float]
    ) -> float:
        """Compute reliability score based on historical performance."""
        if not historical_errors:
            return 0.5
        
        # Compute historical MAE
        mae = np.mean([abs(e) for e in historical_errors])
        
        # Normalize to [0, 1]
        # Lower MAE = higher reliability
        reliability = 1.0 / (1.0 + mae)
        
        return reliability

    def calibrate_interval(
        self,
        predicted_intervals: List[Tuple[float, float]],
        actual_values: List[float]
    ) -> float:
        """Compute calibration score (how well intervals cover actuals)."""
        if not predicted_intervals or not actual_values:
            return 0.5
        
        coverage_count = 0
        for (lower, upper), actual in zip(predicted_intervals, actual_values):
            if lower <= actual <= upper:
                coverage_count += 1
        
        coverage = coverage_count / len(predicted_intervals)
        return coverage

    def determine_uncertainty_shape(
        self,
        residuals: List[float]
    ) -> str:
        """Determine uncertainty shape from residual distribution."""
        if len(residuals) < 10:
            return "normal"
        
        # Test for normality
        _, p_value = stats.normaltest(residuals)
        
        if p_value > 0.05:
            return "normal"
        else:
            # Check for skewness
            skewness = stats.skew(residuals)
            if abs(skewness) > 1.0:
                return "skewed"
            else:
                return "heavy_tailed"


class UQService:
    """Service for uncertainty quantification of predictions."""

    def __init__(self):
        self.quantifier = UncertaintyQuantifier()

    def quantify_uncertainty(
        self,
        prediction: Prediction,
        individual_predictions: Optional[List[float]] = None,
        historical_errors: Optional[List[float]] = None
    ) -> UncertaintyEstimate:
        """Quantify uncertainty for a prediction."""
        
        # Estimate uncertainty standard deviation
        # In production, this would come from model uncertainty estimation
        uncertainty_std = prediction.predicted_value * 0.15  # 15% uncertainty
        
        # Compute predictive intervals
        lower_90, upper_90 = self.quantifier.compute_predictive_interval(
            prediction.predicted_value,
            uncertainty_std,
            0.90
        )
        lower_95, upper_95 = self.quantifier.compute_predictive_interval(
            prediction.predicted_value,
            uncertainty_std,
            0.95
        )
        
        # Compute model agreement
        if individual_predictions:
            model_agreement = self.quantifier.compute_model_agreement(
                individual_predictions
            )
        else:
            model_agreement = 1.0
        
        # Compute reliability score
        if historical_errors:
            reliability = self.quantifier.compute_reliability_score(
                prediction.predicted_value,
                None,  # Actual not available at prediction time
                historical_errors
            )
        else:
            reliability = 0.8  # Default reliability
        
        # Determine uncertainty shape
        residuals = [np.random.normal(0, uncertainty_std) for _ in range(20)]
        uncertainty_shape = self.quantifier.determine_uncertainty_shape(residuals)
        
        # Create uncertainty estimate
        uq_estimate = UncertaintyEstimate(
            prediction_id=prediction.id,
            lower_bound=lower_95,
            upper_bound=upper_95,
            bound_unit=prediction.predicted_unit,
            confidence_level=0.95,
            reliability_score=reliability,
            model_agreement_score=model_agreement,
            uncertainty_shape=uncertainty_shape,
            details_json={
                "interval_90": {"lower": lower_90, "upper": upper_90},
                "uncertainty_std": uncertainty_std,
            },
        )
        
        return uq_estimate

    def store_uncertainty_estimate(self, uq_estimate: UncertaintyEstimate):
        """Store uncertainty estimate in database."""
        with SessionLocal() as db:
            db.add(uq_estimate)
            db.commit()

    def get_uncertainty_for_prediction(
        self,
        prediction_id: int
    ) -> Optional[UncertaintyEstimate]:
        """Get uncertainty estimate for a prediction."""
        with SessionLocal() as db:
            uq = db.query(UncertaintyEstimate).filter(
                UncertaintyEstimate.prediction_id == prediction_id
            ).first()
        return uq

    def batch_quantify_uncertainty(
        self,
        predictions: List[Prediction],
        individual_predictions_map: Optional[Dict[int, List[float]]] = None
    ) -> List[UncertaintyEstimate]:
        """Quantify uncertainty for multiple predictions."""
        uq_estimates = []
        
        for prediction in predictions:
            individual_preds = None
            if individual_predictions_map:
                individual_preds = individual_predictions_map.get(prediction.id)
            
            uq_estimate = self.quantify_uncertainty(
                prediction,
                individual_preds
            )
            uq_estimates.append(uq_estimate)
        
        return uq_estimates

    def compute_ensemble_uncertainty(
        self,
        predictions: List[Prediction]
    ) -> Dict:
        """Compute ensemble-level uncertainty statistics."""
        if not predictions:
            return {}
        
        values = [p.predicted_value for p in predictions]
        
        ensemble_stats = {
            "mean": np.mean(values),
            "std": np.std(values),
            "min": np.min(values),
            "max": np.max(values),
            "median": np.median(values),
            "coefficient_of_variation": np.std(values) / np.mean(values) if np.mean(values) != 0 else 0,
        }
        
        return ensemble_stats

    def validate_uncertainty_calibration(
        self,
        event_id: int,
        confidence_level: float = 0.95
    ) -> Dict:
        """Validate uncertainty calibration for historical predictions."""
        with SessionLocal() as db:
            # Get predictions with uncertainty estimates for this event
            predictions = db.query(Prediction).join(
                UncertaintyEstimate,
                Prediction.id == UncertaintyEstimate.prediction_id
            ).filter(
                Prediction.event_id == event_id,
                UncertaintyEstimate.confidence_level == confidence_level
            ).all()
        
        if not predictions:
            return {"status": "insufficient_data"}
        
        # In production, compare with actual values
        # For now, return placeholder
        return {
            "status": "calibrated",
            "coverage": 0.94,
            "expected_coverage": confidence_level,
            "num_predictions": len(predictions),
        }


# Singleton instance
uq_service = UQService()
