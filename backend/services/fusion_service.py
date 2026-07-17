"""Adaptive AI Fusion Engine (Module 3).

Implements reliability-weighted multi-satellite data fusion using the algorithm
defined in docs/SRS/06_data_requirements.md (Section 6.5.6).
"""

from collections import defaultdict, deque
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from loguru import logger

from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.core.models import Satellite, FusionSnapshot


class FusionEngine:
    """Core fusion algorithm implementation."""

    def __init__(self):
        # Fusion coefficients
        self.alpha = settings.fusion_alpha  # Reliability weight
        self.beta = settings.fusion_beta    # Recency weight
        self.gamma = settings.fusion_gamma  # Spatial relevance weight
        
        # Algorithm parameters
        self.z_max = settings.z_max
        self.time_constant = settings.time_constant
        self.noise_threshold = settings.noise_threshold
        self.consistency_window = settings.consistency_window
        self.delta_r = settings.delta_r

    def compute_outlier_score(
        self, 
        value: float, 
        cross_satellite_mean: float, 
        cross_satellite_std: float
    ) -> float:
        """Compute outlier score Oi(t) using Z-score method."""
        if cross_satellite_std == 0:
            return 0.0
        
        z_score = abs((value - cross_satellite_mean) / cross_satellite_std)
        outlier_score = min(1.0, z_score / self.z_max)
        return outlier_score

    def compute_noise_score(
        self, 
        values: np.ndarray, 
        reference_std: float
    ) -> float:
        """Compute noise score Ni(t) using local variance."""
        if len(values) < 2:
            return 0.0
        
        local_std = np.std(values)
        noise_score = min(1.0, local_std / reference_std)
        return noise_score

    def compute_consistency_score(
        self, 
        values: np.ndarray, 
        consensus_values: np.ndarray
    ) -> float:
        """Compute consistency score Vi(t) using long-term agreement."""
        if len(values) == 0 or len(consensus_values) == 0:
            return 0.0
        
        mean_squared_deviation = np.mean((values - consensus_values) ** 2)
        consensus_variance = np.var(consensus_values)
        
        if consensus_variance == 0:
            return 0.0
        
        consistency_score = mean_squared_deviation / (consensus_variance + 1e-10)
        return min(1.0, consistency_score / 10.0)  # Normalize to [0,1]

    def compute_reliability_score(
        self,
        outlier_score: float,
        noise_score: float,
        consistency_score: float,
        lambda1: float = 0.4,
        lambda2: float = 0.3,
        lambda3: float = 0.3
    ) -> float:
        """Compute reliability score Ri(t)."""
        reliability = 1.0 - (lambda1 * outlier_score + lambda2 * noise_score + lambda3 * consistency_score)
        return max(0.0, min(1.0, reliability))

    def compute_recency_score(self, time_since_last_observation: float) -> float:
        """Compute recency score Qi(t) using exponential decay."""
        if time_since_last_observation < 0:
            return 0.0
        
        recency_score = np.exp(-time_since_last_observation / self.time_constant)
        return recency_score

    def compute_alignment_score(self, satellite_position: Tuple[float, float, float]) -> float:
        """Compute alignment score Ai based on Sun-Earth line geometry."""
        # satellite_position: (x, y, z) in heliocentric coordinates
        # Earth is approximately at (1 AU, 0, 0)
        x, y, z = satellite_position
        
        # Compute angle at Sun between satellite and Earth
        # For simplicity, assume Earth at (1, 0, 0)
        earth_pos = np.array([1.0, 0.0, 0.0])
        sat_pos = np.array([x, y, z])
        
        # Normalize vectors
        earth_norm = earth_pos / np.linalg.norm(earth_pos)
        sat_norm = sat_pos / np.linalg.norm(sat_pos)
        
        # Compute cosine of angle
        cos_theta = np.dot(earth_norm, sat_norm)
        
        # Normalize to [0, 1]
        alignment_score = (cos_theta + 1.0) / 2.0
        return alignment_score

    def compute_geometric_relevance(
        self, 
        satellite_distance: float, 
        earth_distance: float = 1.0
    ) -> float:
        """Compute geometric relevance Gi based on radial distance."""
        distance_diff = abs(satellite_distance - earth_distance)
        geometric_score = np.exp(-distance_diff / self.delta_r)
        return geometric_score

    def compute_spatial_relevance(
        self,
        satellite_position: Tuple[float, float, float],
        satellite_distance: float
    ) -> float:
        """Compute spatial relevance Si."""
        alignment_score = self.compute_alignment_score(satellite_position)
        geometric_score = self.compute_geometric_relevance(satellite_distance)
        
        # Combine with weights (using equal weights for now)
        spatial_score = 0.5 * alignment_score + 0.5 * geometric_score
        return spatial_score

    def compute_fusion_weight(
        self,
        reliability_score: float,
        recency_score: float,
        spatial_relevance: float,
        instrument_status: float = 1.0
    ) -> float:
        """Compute raw fusion weight wi(t)."""
        raw_weight = instrument_status * (
            self.alpha * reliability_score +
            self.beta * recency_score +
            self.gamma * spatial_relevance
        )
        return raw_weight

    def normalize_weights(self, weights: Dict[str, float]) -> Dict[str, float]:
        """Normalize weights to sum to 1."""
        total_weight = sum(weights.values())
        if total_weight == 0:
            return {k: 1.0 / len(weights) for k in weights.keys()}
        
        normalized = {k: v / total_weight for k, v in weights.items()}
        return normalized

    def fuse_parameter(
        self,
        satellite_data: Dict[str, float],
        weights: Dict[str, float]
    ) -> float:
        """Fuse parameter using weighted average."""
        fused_value = sum(weights[sat] * value for sat, value in satellite_data.items())
        return fused_value

    def compute_dynamic_pressure(
        self,
        density: float,
        velocity: float
    ) -> float:
        """Compute dynamic pressure Pd = n * v^2."""
        # Convert to appropriate units (simplified)
        # density in cm^-3, velocity in km/s
        # Result in nPa (approximate)
        dynamic_pressure = density * (velocity ** 2) * 1.67e-6  # Approximate conversion
        return dynamic_pressure

    def compute_plasma_beta(
        self,
        density: float,
        temperature: float,
        magnetic_field: float
    ) -> float:
        """Compute plasma beta β = plasma pressure / magnetic pressure."""
        # Simplified calculation
        # density in cm^-3, temperature in K, magnetic field in nT
        kb = 1.38e-23  # Boltzmann constant
        mu0 = 4 * np.pi * 1e-7  # Permeability of free space
        
        plasma_pressure = density * 1e6 * kb * temperature  # Convert to SI
        magnetic_pressure = (magnetic_field * 1e-9) ** 2 / (2 * mu0)
        
        if magnetic_pressure == 0:
            return float('inf')
        
        beta = plasma_pressure / magnetic_pressure
        return beta


class FusionService:
    """Service for performing multi-satellite data fusion."""

    # Rolling window length for noise score (number of recent observations)
    NOISE_WINDOW_SIZE = 20

    def __init__(self):
        self.engine = FusionEngine()
        self.reference_noise_levels = {
            'bulk_speed_km_s': 50.0,
            'density_cm3': 2.0,
            'temperature_K': 1e5,
            'Bx_nT': 2.0,
            'By_nT': 2.0,
            'Bz_nT': 2.0,
        }
        # Per-satellite, per-parameter sliding window for noise score computation
        # key: (satellite_id, parameter_name) → deque of recent values
        self._obs_history: Dict[Tuple[str, str], deque] = defaultdict(
            lambda: deque(maxlen=self.NOISE_WINDOW_SIZE)
        )

    def fuse_solar_wind_parameter(
        self,
        parameter_name: str,
        satellite_data: Dict[str, float],
        satellite_metadata: Dict[str, Dict],
        timestamp: datetime
    ) -> Tuple[float, Dict[str, Dict]]:
        """Fuse a single solar wind parameter across satellites."""
        
        # Compute cross-satellite statistics
        values = np.array(list(satellite_data.values()))
        cross_mean = np.mean(values)
        cross_std = np.std(values)

        # Compute scores for each satellite
        weights = {}
        scores = {}

        for satellite_id, value in satellite_data.items():
            metadata = satellite_metadata.get(satellite_id, {})

            # Outlier score
            outlier_score = self.engine.compute_outlier_score(value, cross_mean, cross_std)

            # Noise score — uses rolling window of recent observations for this
            # satellite-parameter pair, NOT just the current single value.
            history_key = (satellite_id, parameter_name)
            self._obs_history[history_key].append(value)
            history_array = np.array(self._obs_history[history_key])
            noise_score = self.engine.compute_noise_score(
                history_array,
                self.reference_noise_levels.get(parameter_name, 1.0)
            )

            # Consistency score (simplified - using deviation from mean)
            consistency_score = self.engine.compute_consistency_score(
                np.array([value]),
                np.array([cross_mean])
            )

            # Reliability score
            reliability_score = self.engine.compute_reliability_score(
                outlier_score, noise_score, consistency_score
            )

            # Recency score
            last_obs_time = metadata.get('last_observation_time', timestamp)
            if hasattr(last_obs_time, "tzinfo") and last_obs_time.tzinfo:
                last_obs_time = last_obs_time.replace(tzinfo=None)
            if hasattr(timestamp, "tzinfo") and timestamp.tzinfo:
                timestamp = timestamp.replace(tzinfo=None)
            
            time_since_obs = (timestamp - last_obs_time).total_seconds()
            recency_score = self.engine.compute_recency_score(time_since_obs)

            # Spatial relevance
            position = metadata.get('position', (1.0, 0.0, 0.0))
            distance = metadata.get('distance', 1.0)
            spatial_score = self.engine.compute_spatial_relevance(position, distance)

            # Instrument status
            instrument_status = metadata.get('instrument_status', 1.0)

            # Fusion weight
            weight = self.engine.compute_fusion_weight(
                reliability_score, recency_score, spatial_score, instrument_status
            )

            weights[satellite_id] = weight
            scores[satellite_id] = {
                'w': weight,
                'R': reliability_score,
                'Q': recency_score,
                'S': spatial_score,
                'F': instrument_status,
                'O': outlier_score,
                'N': noise_score,
                'V': consistency_score,
            }

        # Normalize weights
        normalized_weights = self.engine.normalize_weights(weights)
        
        # Update scores with normalized weights
        for sat_id in scores:
            scores[sat_id]['w'] = normalized_weights[sat_id]
        
        # Fuse parameter
        fused_value = self.engine.fuse_parameter(satellite_data, normalized_weights)
        
        return fused_value, scores

    def create_fusion_snapshot(
        self,
        timestamp: datetime,
        parameter_name: str,
        fused_value: float,
        weights: Dict[str, Dict]
    ) -> FusionSnapshot:
        """Create a fusion snapshot record."""
        snapshot = FusionSnapshot(
            timestamp=timestamp,
            parameter_name=parameter_name,
            fused_value=fused_value,
            weights_json=weights,
        )
        return snapshot

    def store_fusion_snapshot(self, snapshot: FusionSnapshot):
        """Store fusion snapshot in database."""
        with SessionLocal() as db:
            db.add(snapshot)
            db.commit()

    def perform_fusion(
        self,
        timestamp: datetime,
        all_satellite_data: Dict[str, Dict[str, float]],
        satellite_metadata: Dict[str, Dict]
    ) -> Dict[str, Tuple[float, Dict[str, Dict]]]:
        """Perform fusion for all parameters."""
        results = {}
        
        # Get all unique parameters across satellites
        all_parameters = set()
        for sat_data in all_satellite_data.values():
            all_parameters.update(sat_data.keys())
        
        # Fuse each parameter
        for parameter in all_parameters:
            # Collect data for this parameter across satellites
            parameter_data = {}
            for satellite_id, sat_data in all_satellite_data.items():
                if parameter in sat_data:
                    parameter_data[satellite_id] = sat_data[parameter]
            
            if len(parameter_data) > 0:
                fused_value, scores = self.fuse_solar_wind_parameter(
                    parameter, parameter_data, satellite_metadata, timestamp
                )
                results[parameter] = (fused_value, scores)
                
                # Store snapshot
                snapshot = self.create_fusion_snapshot(
                    timestamp, parameter, fused_value, scores
                )
                self.store_fusion_snapshot(snapshot)
        
        return results

    def get_fusion_history(
        self,
        parameter_name: str,
        start_time: datetime,
        end_time: datetime
    ) -> List[FusionSnapshot]:
        """Get fusion history for a parameter."""
        with SessionLocal() as db:
            snapshots = db.query(FusionSnapshot).filter(
                FusionSnapshot.parameter_name == parameter_name,
                FusionSnapshot.timestamp >= start_time,
                FusionSnapshot.timestamp <= end_time
            ).order_by(FusionSnapshot.timestamp).all()
        return snapshots


# Singleton instance
fusion_service = FusionService()
