"""Scientific Decision Support Engine (Module 10).

Generates stakeholder-specific recommendations based on validated predictions.
Implements mappings from docs/SRS/08_decision_support_mappings.md.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
import numpy as np

from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.core.models import (
    Event,
    Prediction,
    Recommendation,
    PhysicsValidationResult,
    AuditLog,
    User,
)


class StakeholderMapper:
    """Maps events to stakeholder-specific actions."""

    def __init__(self):
        # Thresholds from decision support mappings
        self.thresholds = {
            "satellite_ops": {
                "solar_wind_speed_warning": 600,
                "solar_wind_speed_critical": 800,
                "dynamic_pressure_warning": 5,
                "dynamic_pressure_critical": 10,
                "imf_bz_warning": -10,
                "imf_bz_critical": -20,
            },
            "power_grid": {
                "kp_warning": 5,
                "kp_critical": 7,
                "dst_warning": -50,
                "dst_critical": -100,
                "gic_warning": 5,
                "gic_critical": 20,
            },
            "astronauts": {
                "radiation_dose_warning": 0.1,
                "radiation_dose_critical": 0.5,
                "sep_flux_warning": 10,
                "sep_flux_critical": 100,
                "flare_class_critical": "M5",
            },
            "ground_station": {
                "ionospheric_disturbance_warning": 20,
                "ionospheric_disturbance_critical": 50,
                "scintillation_warning": 0.5,
                "scintillation_critical": 0.8,
                "communication_outage_warning": 20,
                "communication_outage_critical": 50,
            },
        }

    def get_action_for_satellite_ops(
        self,
        event: Event,
        prediction: Prediction,
        physics_result: PhysicsValidationResult
    ) -> Dict:
        """Get action for satellite operators."""
        event_metadata = event.metadata_json or {}
        
        # Check CME impact
        if event.event_type == "CME":
            cme_speed = event_metadata.get("speed_km_s", 0)
            if cme_speed >= 800:
                return {
                    "action": "Initiate safe mode, secure external instruments",
                    "priority": "high",
                    "justification": f"CME impact with speed {cme_speed} km/s expected",
                }
            elif cme_speed >= 600:
                return {
                    "action": "Increase monitoring, prepare for drag",
                    "priority": "medium",
                    "justification": f"Elevated solar wind speed {cme_speed} km/s",
                }
        
        # Check radiation storm
        if event.event_type == "SEP":
            sep_flux = event_metadata.get("peak_flux_pf", 0)
            if sep_flux >= 100:
                return {
                    "action": "Safe mode, crew protection",
                    "priority": "critical",
                    "justification": f"High radiation flux {sep_flux} pfu",
                }
        
        return {
            "action": "Monitor orbital parameters",
            "priority": "low",
            "justification": "Routine monitoring",
        }

    def get_action_for_power_grid(
        self,
        event: Event,
        prediction: Prediction,
        physics_result: PhysicsValidationResult
    ) -> Dict:
        """Get action for power grid operators."""
        event_metadata = event.metadata_json or {}
        
        # Check geomagnetic storm
        if event.event_type == "CME":
            cme_speed = event_metadata.get("speed_km_s", 0)
            if cme_speed >= 1000:
                return {
                    "action": "Activate GIC monitoring, prepare load shedding",
                    "priority": "high",
                    "justification": f"Potential severe geomagnetic storm from CME speed {cme_speed} km/s",
                }
        
        # Check SEP event
        if event.event_type == "SEP":
            return {
                "action": "Monitor satellite communication links",
                "priority": "low",
                "justification": "SEP event may affect communications",
            }
        
        return {
            "action": "Continue normal operations",
            "priority": "low",
            "justification": "No significant grid impact expected",
        }

    def get_action_for_astronauts(
        self,
        event: Event,
        prediction: Prediction,
        physics_result: PhysicsValidationResult
    ) -> Dict:
        """Get action for astronauts/space stations."""
        event_metadata = event.metadata_json or {}
        
        # Check radiation storm
        if event.event_type == "SEP":
            sep_flux = event_metadata.get("peak_flux_pf", 0)
            if sep_flux >= 100:
                return {
                    "action": "Immediate shelter, suspend all external activities",
                    "priority": "critical",
                    "justification": f"Radiation storm with flux {sep_flux} pfu",
                }
            elif sep_flux >= 10:
                return {
                    "action": "EVA cancellation, crew shelter",
                    "priority": "high",
                    "justification": f"Elevated radiation flux {sep_flux} pfu",
                }
        
        # Check X-class flare
        if event.event_type == "FLARE":
            flare_class = event_metadata.get("class", "C")
            if flare_class in ["X", "M"]:
                return {
                    "action": "EVA cancellation, increase radiation monitoring",
                    "priority": "high",
                    "justification": f"{flare_class}-class solar flare detected",
                }
        
        return {
            "action": "Continue normal operations",
            "priority": "low",
            "justification": "Radiation levels within normal range",
        }

    def get_action_for_ground_station(
        self,
        event: Event,
        prediction: Prediction,
        physics_result: PhysicsValidationResult
    ) -> Dict:
        """Get action for ground stations."""
        event_metadata = event.metadata_json or {}
        
        # Check ionospheric disturbance
        if event.event_type == "CME":
            cme_speed = event_metadata.get("speed_km_s", 0)
            if cme_speed >= 800:
                return {
                    "action": "Adjust frequencies, increase power",
                    "priority": "medium",
                    "justification": f"Ionospheric disturbance expected from CME speed {cme_speed} km/s",
                }
        
        return {
            "action": "Monitor signal quality",
            "priority": "low",
            "justification": "Normal ionospheric conditions",
        }

    def get_action_for_scientist_review(
        self,
        event: Event,
        prediction: Prediction,
        physics_result: PhysicsValidationResult
    ) -> Dict:
        """Get action for scientific review."""
        
        # Check physics validation status
        if physics_result.validation_status == "SOFT_FAIL":
            return {
                "action": "Review violated physics rules",
                "priority": "medium",
                "justification": f"Physics validation soft fail: {physics_result.comments}",
            }
        elif physics_result.validation_status == "HARD_FAIL":
            return {
                "action": "Investigate physical impossibility",
                "priority": "high",
                "justification": f"Physics validation hard fail: {physics_result.comments}",
            }
        
        # Check model disagreement
        if prediction.base_models_included:
            agreement = physics_result.confidence_multiplier
            if agreement < 0.7:
                return {
                    "action": "Review model performance and recalibrate",
                    "priority": "low",
                    "justification": f"Low model agreement (confidence: {agreement:.2f})",
                }
        
        return {
            "action": "Review event for scientific interest",
            "priority": "low",
            "justification": "Routine scientific review",
        }


class DecisionSupportService:
    """Service for generating stakeholder recommendations."""

    def __init__(self):
        self.mapper = StakeholderMapper()
        self.stakeholders = settings.dss_stakeholders.split(",")

    def generate_recommendations(
        self,
        event: Event,
        prediction: Prediction,
        physics_result: PhysicsValidationResult
    ) -> List[Recommendation]:
        """Generate recommendations for all stakeholders."""
        
        # Check if automation is allowed
        if not physics_result.automation_allowed:
            # Only generate advisory recommendations
            return self._generate_advisory_recommendations(event, prediction, physics_result)
        
        recommendations = []
        
        for stakeholder in self.stakeholders:
            try:
                action_data = self._get_action_for_stakeholder(
                    stakeholder, event, prediction, physics_result
                )
                
                # Calculate effective priority based on confidence multiplier
                effective_priority = self._calculate_effective_priority(
                    action_data["priority"],
                    physics_result.confidence_multiplier
                )
                
                # Calculate validity period
                valid_from = datetime.utcnow()
                valid_until = self._calculate_validity(effective_priority)
                
                # Create recommendation
                recommendation = Recommendation(
                    event_id=event.id,
                    prediction_id=prediction.id,
                    target_system=stakeholder,
                    recommended_action=action_data["action"],
                    action_priority=effective_priority,
                    justification_text=self._format_justification(
                        action_data["justification"],
                        physics_result
                    ),
                    valid_from=valid_from,
                    valid_until=valid_until,
                )
                
                recommendations.append(recommendation)
                
            except Exception as e:
                print(f"Error generating recommendation for {stakeholder}: {e}")
        
        return recommendations

    def _get_action_for_stakeholder(
        self,
        stakeholder: str,
        event: Event,
        prediction: Prediction,
        physics_result: PhysicsValidationResult
    ) -> Dict:
        """Get action for specific stakeholder."""
        
        if stakeholder == "satellite_ops":
            return self.mapper.get_action_for_satellite_ops(event, prediction, physics_result)
        elif stakeholder == "power_grid":
            return self.mapper.get_action_for_power_grid(event, prediction, physics_result)
        elif stakeholder == "astronauts":
            return self.mapper.get_action_for_astronauts(event, prediction, physics_result)
        elif stakeholder == "ground_station":
            return self.mapper.get_action_for_ground_station(event, prediction, physics_result)
        elif stakeholder == "scientist_review":
            return self.mapper.get_action_for_scientist_review(event, prediction, physics_result)
        else:
            return {
                "action": "Monitor situation",
                "priority": "LOW",
                "justification": "Default monitoring action",
            }

    def _calculate_effective_priority(
        self,
        base_priority: str,
        confidence_multiplier: float
    ) -> str:
        """Calculate effective priority based on confidence multiplier.

        Uses lowercase values throughout to match the DB CheckConstraint:
          action_priority IN ('low', 'medium', 'high', 'critical')
        """
        # DB CheckConstraint requires lowercase
        priority_order = ["critical", "high", "medium", "low"]

        # Normalize input to lowercase (defensive)
        base_priority_lower = base_priority.lower()

        # Find base priority index
        try:
            base_index = priority_order.index(base_priority_lower)
        except ValueError:
            base_index = 3  # Default to 'low'

        # Coerce confidence_multiplier to float (may be Decimal after DB round-trip)
        cm = float(confidence_multiplier)

        # Adjust based on confidence — downgrade 1 level if confidence is low
        if cm < 0.5:
            adjusted_index = min(base_index + 1, 3)
        elif cm < 0.7:
            adjusted_index = min(base_index + 1, 3)
        else:
            adjusted_index = base_index

        return priority_order[adjusted_index]

    def _calculate_validity(self, priority: str) -> datetime:
        """Calculate recommendation validity period based on priority."""
        validity_map = {
            "CRITICAL": timedelta(hours=2),
            "HIGH": timedelta(hours=6),
            "MEDIUM": timedelta(hours=24),
            "LOW": timedelta(hours=72),
        }
        return datetime.utcnow() + validity_map.get(priority, timedelta(hours=24))

    def _format_justification(
        self,
        base_justification: str,
        physics_result: PhysicsValidationResult
    ) -> str:
        """Format justification with physics validation info."""
        justification = base_justification
        justification += f"\nPhysics validation: {physics_result.validation_status}"
        justification += f" (confidence: {physics_result.confidence_multiplier:.2f})"
        
        if physics_result.validation_status != "PASS":
            justification += f"\nComments: {physics_result.comments}"
        
        return justification

    def _generate_advisory_recommendations(
        self,
        event: Event,
        prediction: Prediction,
        physics_result: PhysicsValidationResult
    ) -> List[Recommendation]:
        """Generate advisory-only recommendations when automation blocked."""
        
        # Only generate for scientist_review
        action_data = self.mapper.get_action_for_scientist_review(
            event, prediction, physics_result
        )
        
        recommendation = Recommendation(
            event_id=event.id,
            prediction_id=prediction.id,
            target_system="scientist_review",
            recommended_action=action_data["action"],
            action_priority="HIGH",
            justification_text=f"ADVISORY ONLY: {action_data['justification']}. "
                            f"Automation blocked due to {physics_result.validation_status}",
            valid_from=datetime.utcnow(),
            valid_until=datetime.utcnow() + timedelta(hours=24),
        )
        
        return [recommendation]

    def store_recommendations(self, recommendations: List[Recommendation]):
        """Store recommendations in database."""
        with SessionLocal() as db:
            for rec in recommendations:
                db.add(rec)
            db.commit()

    def get_recommendations_for_event(self, event_id: int) -> List[Recommendation]:
        """Get recommendations for an event."""
        with SessionLocal() as db:
            recommendations = db.query(Recommendation).filter(
                Recommendation.event_id == event_id
            ).order_by(Recommendation.valid_from.desc()).all()
        return recommendations

    def get_active_recommendations(
        self,
        stakeholder: Optional[str] = None
    ) -> List[Recommendation]:
        """Get currently active recommendations."""
        with SessionLocal() as db:
            query = db.query(Recommendation).filter(
                Recommendation.valid_from <= datetime.utcnow(),
                Recommendation.valid_until >= datetime.utcnow()
            )
            
            if stakeholder:
                query = query.filter(Recommendation.target_system == stakeholder)
            
            recommendations = query.order_by(
                Recommendation.action_priority.desc(),
                Recommendation.valid_from.desc()
            ).all()
        
        return recommendations

    def create_audit_log(
        self,
        recommendation: Recommendation,
        user_id: Optional[str] = None,
        action_type: str = "generated"
    ):
        """Create audit log for recommendation."""
        with SessionLocal() as db:
            audit_log = AuditLog(
                user_id=user_id,
                event_id=recommendation.event_id,
                prediction_id=recommendation.prediction_id,
                recommendation_id=recommendation.id,
                action_type=action_type,
                action_details={
                    "target_system": recommendation.target_system,
                    "action": recommendation.recommended_action,
                    "priority": recommendation.action_priority,
                },
            )
            db.add(audit_log)
            db.commit()


# Singleton instance
decision_support_service = DecisionSupportService()
