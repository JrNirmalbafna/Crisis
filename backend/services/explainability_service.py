"""Explainable AI Engine (Module 7).

Provides model explanations using SHAP values, physics-aligned text,
and natural language summaries.
"""

from datetime import datetime
from typing import Dict, List, Optional
import numpy as np

from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.core.models import (
    Prediction,
    Explanation,
    Event,
)


class SHAPExplainer:
    """SHAP-based model explanation."""

    def __init__(self):
        self.feature_names = [
            "cme_speed",
            "cme_width",
            "solar_wind_speed",
            "imf_bz",
            "density",
            "temperature",
        ]

    def compute_shap_values(
        self,
        prediction: Prediction,
        event_data: Dict
    ) -> Dict[str, float]:
        """Compute SHAP values for prediction."""
        # TODO: Implement actual SHAP computation
        # Placeholder: return mock SHAP values
        shap_values = {
            "cme_speed": np.random.uniform(-0.5, 0.5),
            "cme_width": np.random.uniform(-0.3, 0.3),
            "solar_wind_speed": np.random.uniform(-0.4, 0.4),
            "imf_bz": np.random.uniform(-0.6, 0.6),
            "density": np.random.uniform(-0.2, 0.2),
            "temperature": np.random.uniform(-0.1, 0.1),
        }
        
        # Normalize to sum to prediction value
        total = sum(abs(v) for v in shap_values.values())
        if total > 0:
            shap_values = {k: v / total * prediction.predicted_value for k, v in shap_values.items()}
        
        return shap_values

    def get_feature_importance(self, shap_values: Dict[str, float]) -> Dict[str, float]:
        """Get feature importance from absolute SHAP values."""
        importance = {k: abs(v) for k, v in shap_values.items()}
        total = sum(importance.values())
        if total > 0:
            importance = {k: v / total for k, v in importance.items()}
        return importance


class PhysicsExplainer:
    """Physics-aligned explanation generator."""

    def __init__(self):
        self.physics_rules = {
            "cme_speed": "Higher CME speed reduces Earth transit time",
            "cme_width": "Wider CMEs have higher Earth impact probability",
            "solar_wind_speed": "Fast solar wind indicates coronal hole origin",
            "imf_bz": "Southward IMF Bz enables geomagnetic coupling",
            "density": "Higher density increases dynamic pressure",
            "temperature": "Temperature indicates coronal heating",
        }

    def generate_physics_explanation(
        self,
        event_data: Dict,
        shap_values: Dict[str, float]
    ) -> str:
        """Generate physics-aligned explanation."""
        explanations = []
        
        # Get top contributing features
        sorted_features = sorted(
            shap_values.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )[:3]
        
        for feature, value in sorted_features:
            direction = "increases" if value > 0 else "decreases"
            physics_rule = self.physics_rules.get(feature, "")
            
            if physics_rule:
                explanation = f"{feature} {direction} predicted arrival time. {physics_rule}."
                explanations.append(explanation)
        
        return " ".join(explanations)


class NLExplainer:
    """Natural language explanation generator."""

    def __init__(self):
        self.templates = {
            "CME": "This CME event is predicted to arrive in {arrival:.1f} hours with {confidence:.0%} confidence. Key factors: {factors}.",
            "FLARE": "This solar flare is classified as {flare_class} with peak intensity {intensity:.2e} W/m². {factors}",
            "HSS": "This high-speed stream is expected to persist for {duration:.1f} hours. {factors}",
            "SEP": "This solar energetic particle event may reach {flux:.1f} pfu. {factors}",
        }

    def generate_nl_explanation(
        self,
        event: Event,
        prediction: Prediction,
        feature_importance: Dict[str, float]
    ) -> str:
        """Generate natural language explanation."""
        event_metadata = event.metadata_json or {}
        
        # Get top features
        top_features = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )[:3]
        
        factors = ", ".join([f"{k} ({v:.1%})" for k, v in top_features])
        
        template = self.templates.get(event.event_type, "Prediction: {factors}")
        
        if event.event_type == "CME":
            explanation = template.format(
                arrival=float(prediction.predicted_value),
                confidence=0.85,  # Placeholder
                factors=factors
            )
        elif event.event_type == "FLARE":
            flare_class = event_metadata.get("class", "C")
            explanation = template.format(
                flare_class=flare_class,
                intensity=event_metadata.get("flux_Wm2", 1e-6),
                factors=factors
            )
        elif event.event_type == "HSS":
            explanation = template.format(
                duration=event_metadata.get("duration_hours", 3),
                factors=factors
            )
        elif event.event_type == "SEP":
            explanation = template.format(
                flux=event_metadata.get("peak_flux_pf", 10),
                factors=factors
            )
        else:
            explanation = template.format(factors=factors)
        
        return explanation


class ExplainabilityService:
    """Service for generating model explanations."""

    def __init__(self):
        self.shap_explainer = SHAPExplainer()
        self.physics_explainer = PhysicsExplainer()
        self.nl_explainer = NLExplainer()

    def explain_prediction(
        self,
        prediction: Prediction,
        event: Optional[Event] = None
    ) -> Explanation:
        """Generate explanation for a prediction."""
        
        # Get event if not provided
        if event is None:
            with SessionLocal() as db:
                event = db.query(Event).filter(Event.id == prediction.event_id).first()
        
        if event is None:
            raise ValueError("Event not found for prediction")
        
        event_data = event.metadata_json or {}
        
        # Compute SHAP values
        shap_values = self.shap_explainer.compute_shap_values(prediction, event_data)
        
        # Get feature importance
        feature_importance = self.shap_explainer.get_feature_importance(shap_values)
        
        # Generate physics explanation
        physics_explanation = self.physics_explainer.generate_physics_explanation(
            event_data,
            shap_values
        )
        
        # Generate natural language explanation
        nl_explanation = self.nl_explainer.generate_nl_explanation(
            event,
            prediction,
            feature_importance
        )
        
        # Create explanation record
        explanation = Explanation(
            prediction_id=prediction.id,
            explanation_type="shap",
            importance_json=feature_importance,
            physics_explanation=physics_explanation,
            nl_explanation=nl_explanation,
            visualization_ref=f"/api/v1/explanations/{prediction.id}/visualization",
        )
        
        return explanation

    def store_explanation(self, explanation: Explanation):
        """Store explanation in database."""
        with SessionLocal() as db:
            db.add(explanation)
            db.commit()

    def get_explanation_for_prediction(
        self,
        prediction_id: int
    ) -> Optional[Explanation]:
        """Get explanation for a prediction."""
        with SessionLocal() as db:
            explanation = db.query(Explanation).filter(
                Explanation.prediction_id == prediction_id
            ).first()
        return explanation

    def batch_explain_predictions(
        self,
        predictions: List[Prediction]
    ) -> List[Explanation]:
        """Generate explanations for multiple predictions."""
        explanations = []
        
        for prediction in predictions:
            try:
                explanation = self.explain_prediction(prediction)
                explanations.append(explanation)
            except Exception as e:
                print(f"Error explaining prediction {prediction.id}: {e}")
        
        return explanations

    def generate_comparison_explanation(
        self,
        predictions: List[Prediction],
        event: Event
    ) -> str:
        """Generate explanation comparing multiple model predictions."""
        if len(predictions) < 2:
            return "Single prediction - no comparison available."
        
        values = [p.predicted_value for p in predictions]
        mean_val = np.mean(values)
        std_val = np.std(values)
        
        comparison = f"Model ensemble shows mean prediction of {mean_val:.2f} {predictions[0].predicted_unit} "
        comparison += f"with standard deviation of {std_val:.2f}. "
        
        if std_val / mean_val > 0.2:
            comparison += "High model disagreement indicates high uncertainty."
        else:
            comparison += "Models are in good agreement."
        
        return comparison


# Singleton instance
explainability_service = ExplainabilityService()
