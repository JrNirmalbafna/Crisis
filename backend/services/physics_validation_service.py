"""Physics Validation Engine (Module 9).

Validates predictions against physical plausibility rules (PHY-01 to PHY-52).
Acts as gatekeeper for automated decision support.
"""

from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
import numpy as np
from loguru import logger

from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.core.models import (
    Prediction,
    PhysicsValidationResult,
    Event,
)


class PhysicsRule:
    """Base class for physics validation rules."""

    def __init__(self, rule_id: str, severity: str):
        self.rule_id = rule_id
        self.severity = severity  # "HARD" or "SOFT"

    def check(self, prediction: Prediction, event_data: Dict) -> Optional[Dict]:
        """Check if rule is violated."""
        raise NotImplementedError


class SolarWindSpeedRule(PhysicsRule):
    """PHY-01: Solar wind speed limits."""

    def __init__(self):
        super().__init__("PHY-01", "HARD")
        self.min_speed = 250.0  # km/s
        self.max_speed = 3000.0  # km/s

    def check(self, prediction: Prediction, event_data: Dict) -> Optional[Dict]:
        """Check solar wind speed limits."""
        if prediction.prediction_type == "arrival_time":
            # This is a time prediction, not speed
            return None
        
        # Check if prediction is about speed
        if "speed" in prediction.prediction_type.lower():
            speed = prediction.predicted_value
            if speed < self.min_speed or speed > self.max_speed:
                return {
                    "id": self.rule_id,
                    "severity": self.severity,
                    "parameter": "solar_wind_speed",
                    "observed": speed,
                    "limit": f"{self.min_speed}-{self.max_speed} km/s",
                    "message": f"Solar wind speed {speed} km/s outside physical range",
                }
        return None


class DynamicPressureRule(PhysicsRule):
    """PHY-03: Dynamic pressure limits."""

    def __init__(self):
        super().__init__("PHY-03", "HARD")
        self.min_pressure = 0.1  # nPa
        self.max_pressure = 15.0  # nPa

    def check(self, prediction: Prediction, event_data: Dict) -> Optional[Dict]:
        """Check dynamic pressure limits."""
        if "pressure" in prediction.prediction_type.lower():
            pressure = prediction.predicted_value
            if pressure < self.min_pressure or pressure > self.max_pressure:
                return {
                    "id": self.rule_id,
                    "severity": self.severity,
                    "parameter": "dynamic_pressure",
                    "observed": pressure,
                    "limit": f"{self.min_pressure}-{self.max_pressure} nPa",
                    "message": f"Dynamic pressure {pressure} nPa exceeds plausible range",
                }
        return None


class CMESpeedRule(PhysicsRule):
    """PHY-23: CME speed limits."""

    def __init__(self):
        super().__init__("PHY-23", "HARD")
        self.min_speed = 100.0  # km/s
        self.max_speed = 3000.0  # km/s

    def check(self, prediction: Prediction, event_data: Dict) -> Optional[Dict]:
        """Check CME speed limits."""
        if event_data.get("event_type") == "CME":
            cme_speed = event_data.get("speed_km_s", 0)
            if cme_speed < self.min_speed or cme_speed > self.max_speed:
                return {
                    "id": self.rule_id,
                    "severity": self.severity,
                    "parameter": "cme_speed",
                    "observed": cme_speed,
                    "limit": f"{self.min_speed}-{self.max_speed} km/s",
                    "message": f"CME speed {cme_speed} km/s outside physical range",
                }
        return None


class CMETransitTimeRule(PhysicsRule):
    """PHY-30: CME transit time limits."""

    def __init__(self):
        super().__init__("PHY-30", "HARD")
        self.min_time = 12  # hours
        self.max_time = 120  # hours

    def check(self, prediction: Prediction, event_data: Dict) -> Optional[Dict]:
        """Check CME transit time limits."""
        if (event_data.get("event_type") == "CME" and 
            prediction.prediction_type == "arrival_time"):
            transit_time = prediction.predicted_value
            if transit_time < self.min_time or transit_time > self.max_time:
                return {
                    "id": self.rule_id,
                    "severity": self.severity,
                    "parameter": "transit_time",
                    "observed": transit_time,
                    "limit": f"{self.min_time}-{self.max_time} hours",
                    "message": f"CME transit time {transit_time} hours outside physical range",
                }
        return None


class FlareFluxRule(PhysicsRule):
    """PHY-33: X-ray flux limits."""

    def __init__(self):
        super().__init__("PHY-33", "HARD")
        self.min_flux = 1e-9  # W/m²
        self.max_flux = 1e-2  # W/m²

    def check(self, prediction: Prediction, event_data: Dict) -> Optional[Dict]:
        """Check X-ray flux limits."""
        if event_data.get("event_type") == "FLARE":
            flux = event_data.get("flux_Wm2", 0)
            if flux < self.min_flux or flux > self.max_flux:
                return {
                    "id": self.rule_id,
                    "severity": self.severity,
                    "parameter": "xray_flux",
                    "observed": flux,
                    "limit": f"{self.min_flux}-{self.max_flux} W/m²",
                    "message": f"X-ray flux {flux} W/m² outside physical range",
                }
        return None


class IMFBzRule(PhysicsRule):
    """PHY-14: IMF Bz component limits."""

    def __init__(self):
        super().__init__("PHY-14", "HARD")
        self.min_bz = -50.0  # nT
        self.max_bz = 50.0  # nT

    def check(self, prediction: Prediction, event_data: Dict) -> Optional[Dict]:
        """Check IMF Bz limits."""
        bz = event_data.get("Bz_nT")
        if bz is not None:
            if bz < self.min_bz or bz > self.max_bz:
                return {
                    "id": self.rule_id,
                    "severity": self.severity,
                    "parameter": "IMF_Bz",
                    "observed": bz,
                    "limit": f"{self.min_bz}-{self.max_bz} nT",
                    "message": f"IMF Bz {bz} nT outside physical range",
                }
        return None


class SolarWindDensityRule(PhysicsRule):
    """PHY-02: Solar wind density limits."""

    def __init__(self):
        super().__init__("PHY-02", "HARD")
        self.min_density = 0.1   # cm^-3 (interplanetary minimum)
        self.max_density = 100.0  # cm^-3 (extreme CME sheath)

    def check(self, prediction: Prediction, event_data: Dict) -> Optional[Dict]:
        """Check solar wind density limits."""
        density = event_data.get("density_cm3")
        if density is not None:
            if density < self.min_density or density > self.max_density:
                return {
                    "id": self.rule_id,
                    "severity": self.severity,
                    "parameter": "solar_wind_density",
                    "observed": density,
                    "limit": f"{self.min_density}-{self.max_density} cm^-3",
                    "message": f"Solar wind density {density} cm^-3 outside physical range",
                }
        return None


class SolarWindTemperatureRule(PhysicsRule):
    """PHY-04: Solar wind proton temperature limits."""

    def __init__(self):
        super().__init__("PHY-04", "SOFT")
        self.min_temp = 1e3    # K  (cold dense CME core)
        self.max_temp = 1e7   # K  (hot tenuous solar wind)

    def check(self, prediction: Prediction, event_data: Dict) -> Optional[Dict]:
        """Check solar wind proton temperature."""
        temp = event_data.get("temperature_K")
        if temp is not None:
            if temp < self.min_temp or temp > self.max_temp:
                return {
                    "id": self.rule_id,
                    "severity": self.severity,
                    "parameter": "proton_temperature",
                    "observed": temp,
                    "limit": f"{self.min_temp:.0e}-{self.max_temp:.0e} K",
                    "message": f"Proton temperature {temp:.2e} K outside physical range",
                }
        return None


class AlfvenMachNumberRule(PhysicsRule):
    """PHY-10: Alfvén Mach number consistency.

    Solar wind Alfvén Mach number Ma = v_sw / v_Alfven should be >> 1
    (super-Alfvénic). Values < 1 indicate bow shock collapse.
    """

    def __init__(self):
        super().__init__("PHY-10", "SOFT")
        self.min_ma = 2.0   # Sub-Alfvénic threshold
        self.max_ma = 30.0  # Extreme super-Alfvénic

    def check(self, prediction: Prediction, event_data: Dict) -> Optional[Dict]:
        """Check Alfvén Mach number consistency."""
        speed = event_data.get("bulk_speed_km_s")
        density = event_data.get("density_cm3")
        b_total = event_data.get("|B|_nT", event_data.get("magnetic_field_nT"))

        if speed and density and b_total and b_total > 0:
            # v_Alfven = B / sqrt(mu0 * rho) — simplified in SI
            mu0 = 4 * np.pi * 1e-7
            rho = density * 1e6 * 1.67e-27  # proton mass density in kg/m³
            b_si = b_total * 1e-9  # nT → T
            v_alfven = b_si / np.sqrt(mu0 * rho) / 1e3  # → km/s

            if v_alfven > 0:
                ma = speed / v_alfven
                if ma < self.min_ma or ma > self.max_ma:
                    return {
                        "id": self.rule_id,
                        "severity": self.severity,
                        "parameter": "alfven_mach_number",
                        "observed": round(ma, 2),
                        "limit": f"{self.min_ma}-{self.max_ma}",
                        "message": f"Alfvén Mach number {ma:.2f} anomalous",
                    }
        return None


class KpIndexRule(PhysicsRule):
    """PHY-15: Predicted Kp index limits.

    Kp is the global geomagnetic activity index (0-9 scale).
    Values > 9 are physically impossible.
    """

    def __init__(self):
        super().__init__("PHY-15", "HARD")

    def check(self, prediction: Prediction, event_data: Dict) -> Optional[Dict]:
        """Check Kp index range."""
        if "kp" in prediction.prediction_type.lower():
            kp = float(prediction.predicted_value)
            if kp < 0 or kp > 9:
                return {
                    "id": self.rule_id,
                    "severity": self.severity,
                    "parameter": "kp_index",
                    "observed": kp,
                    "limit": "0-9",
                    "message": f"Predicted Kp index {kp} outside valid range (0-9)",
                }
        return None


class DstStormRule(PhysicsRule):
    """PHY-17: Predicted Dst index (geomagnetic storm intensity) limits.

    Dst < -2500 nT has never been observed. Values below that are
    physically impossible and indicate model error.
    """

    def __init__(self):
        super().__init__("PHY-17", "HARD")
        self.min_dst = -2500.0  # nT — absolute historical minimum
        self.max_dst = 50.0     # nT — slightly positive allowed

    def check(self, prediction: Prediction, event_data: Dict) -> Optional[Dict]:
        """Check Dst storm index limits."""
        if "dst" in prediction.prediction_type.lower():
            dst = float(prediction.predicted_value)
            if dst < self.min_dst or dst > self.max_dst:
                return {
                    "id": self.rule_id,
                    "severity": self.severity,
                    "parameter": "dst_index",
                    "observed": dst,
                    "limit": f"{self.min_dst}-{self.max_dst} nT",
                    "message": f"Predicted Dst {dst} nT outside physical range",
                }
        return None


class SEPEnergyThresholdRule(PhysicsRule):
    """PHY-25: SEP >10 MeV proton flux threshold consistency.

    NOAA defines a radiation storm when >10 MeV proton flux exceeds
    10 pfu. Predictions below 0 are physically impossible.
    """

    def __init__(self):
        super().__init__("PHY-25", "HARD")

    def check(self, prediction: Prediction, event_data: Dict) -> Optional[Dict]:
        """Check SEP proton flux sign and magnitude."""
        if event_data.get("event_type") == "SEP":
            flux = event_data.get("peak_flux_pf", 0)
            if flux < 0:
                return {
                    "id": self.rule_id,
                    "severity": self.severity,
                    "parameter": "sep_proton_flux",
                    "observed": flux,
                    "limit": ">= 0 pfu",
                    "message": f"SEP proton flux {flux} pfu is negative (physically impossible)",
                }
        return None


class PhysicsValidator:
    """Physics validation engine."""

    def __init__(self):
        self.rules = [
            SolarWindSpeedRule(),     # PHY-01
            SolarWindDensityRule(),   # PHY-02
            DynamicPressureRule(),    # PHY-03
            SolarWindTemperatureRule(),  # PHY-04
            AlfvenMachNumberRule(),   # PHY-10
            IMFBzRule(),              # PHY-14
            KpIndexRule(),            # PHY-15
            DstStormRule(),           # PHY-17
            CMESpeedRule(),           # PHY-23
            SEPEnergyThresholdRule(), # PHY-25
            CMETransitTimeRule(),     # PHY-30
            FlareFluxRule(),          # PHY-33
            # PHY-02 through PHY-52 partially implemented — extend as needed
        ]
        self.confidence_multiplier_min = settings.physics_confidence_multiplier_min

    def validate_prediction(
        self,
        prediction: Prediction,
        event: Optional[Event] = None
    ) -> PhysicsValidationResult:
        """Validate a prediction against physics rules."""
        
        # Get event if not provided
        if event is None:
            with SessionLocal() as db:
                event = db.query(Event).filter(Event.id == prediction.event_id).first()
        
        event_data = event.metadata_json if event else {}
        
        # Check all rules
        violations = []
        hard_fail_count = 0
        soft_fail_count = 0
        
        for rule in self.rules:
            violation = rule.check(prediction, event_data)
            if violation:
                violations.append(violation)
                if rule.severity == "HARD":
                    hard_fail_count += 1
                else:
                    soft_fail_count += 1
        
        # Determine validation status
        if hard_fail_count > 0:
            validation_status = "HARD_FAIL"
            automation_allowed = False
        elif soft_fail_count > 0:
            validation_status = "SOFT_FAIL"
            automation_allowed = True
        else:
            validation_status = "PASS"
            automation_allowed = True
        
        # Compute confidence multiplier
        confidence_multiplier = self.compute_confidence_multiplier(
            hard_fail_count, soft_fail_count
        )
        
        # Create validation result
        validation_result = PhysicsValidationResult(
            prediction_id=prediction.id,
            validation_status=validation_status,
            violated_rules={"violations": violations},
            confidence_multiplier=confidence_multiplier,
            automation_allowed=automation_allowed,
            comments=f"{hard_fail_count} hard fails, {soft_fail_count} soft fails",
        )
        
        return validation_result

    def compute_confidence_multiplier(
        self,
        hard_fail_count: int,
        soft_fail_count: int
    ) -> float:
        """Compute confidence multiplier based on violations."""
        if hard_fail_count > 0:
            return 0.0
        
        if soft_fail_count == 0:
            return 1.0
        
        # Reduce confidence for soft fails
        multiplier = 1.0 - (0.1 * soft_fail_count)
        return max(self.confidence_multiplier_min, multiplier)

    def validate_batch(
        self,
        predictions: List[Prediction]
    ) -> List[PhysicsValidationResult]:
        """Validate multiple predictions."""
        results = []

        for prediction in predictions:
            try:
                result = self.validate_prediction(prediction)
                results.append(result)
            except Exception as e:
                logger.error(f"Error validating prediction {prediction.id}: {e}")

        return results


class PhysicsValidationService:
    """Service for physics validation of predictions."""

    def __init__(self):
        self.validator = PhysicsValidator()

    def validate_prediction(
        self,
        prediction: Prediction,
        event: Optional[Event] = None
    ) -> PhysicsValidationResult:
        """Validate a prediction and store result."""
        result = self.validator.validate_prediction(prediction, event)
        self.store_validation_result(result)
        return result

    def store_validation_result(self, result: PhysicsValidationResult):
        """Store validation result in database."""
        with SessionLocal() as db:
            db.add(result)
            db.commit()

    def get_validation_for_prediction(
        self,
        prediction_id: int
    ) -> Optional[PhysicsValidationResult]:
        """Get validation result for a prediction."""
        with SessionLocal() as db:
            result = db.query(PhysicsValidationResult).filter(
                PhysicsValidationResult.prediction_id == prediction_id
            ).first()
        return result

    def batch_validate_predictions(
        self,
        predictions: List[Prediction]
    ) -> List[PhysicsValidationResult]:
        """Validate multiple predictions and store results."""
        results = self.validator.validate_batch(predictions)
        
        for result in results:
            self.store_validation_result(result)
        
        return results

    def get_validation_summary(
        self,
        event_id: int
    ) -> Dict:
        """Get validation summary for an event."""
        with SessionLocal() as db:
            results = db.query(PhysicsValidationResult).join(
                Prediction,
                PhysicsValidationResult.prediction_id == Prediction.id
            ).filter(
                Prediction.event_id == event_id
            ).all()
        
        if not results:
            return {"status": "no_validations"}
        
        summary = {
            "total_validations": len(results),
            "pass_count": sum(1 for r in results if r.validation_status == "PASS"),
            "soft_fail_count": sum(1 for r in results if r.validation_status == "SOFT_FAIL"),
            "hard_fail_count": sum(1 for r in results if r.validation_status == "HARD_FAIL"),
            "automation_allowed": all(r.automation_allowed for r in results),
            # float() coercion needed: confidence_multiplier is Decimal after DB round-trip
            # np.mean() raises TypeError on list[Decimal] without this conversion
            "average_confidence_multiplier": float(
                np.mean([float(r.confidence_multiplier) for r in results])
            ),
        }
        
        return summary

    def is_automation_allowed(self, prediction_id: int) -> bool:
        """Check if automation is allowed for a prediction."""
        result = self.get_validation_for_prediction(prediction_id)
        if result is None:
            return False
        return result.automation_allowed


# Singleton instance
physics_validation_service = PhysicsValidationService()
