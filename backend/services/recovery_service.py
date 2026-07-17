"""Missing Data Recovery Engine (Module 4).

Recovers missing data using cross-satellite reconstruction and interpolation.
Provides confidence scores for recovered data.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd
from scipy import interpolate

from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.core.models import Satellite, FusionSnapshot


class DataRecovery:
    """Core data recovery algorithms."""

    def __init__(self):
        self.max_gap_duration = timedelta(hours=6)  # Maximum gap to attempt recovery
        self.min_confidence = 0.5  # Minimum confidence for recovered data

    def detect_gaps(
        self,
        data: pd.DataFrame,
        timestamp_col: str = "timestamp"
    ) -> List[Tuple[datetime, datetime]]:
        """Detect gaps in time series data."""
        if data.empty or timestamp_col not in data.columns:
            return []
        
        data = data.sort_values(timestamp_col)
        gaps = []
        
        for i in range(1, len(data)):
            prev_time = data.iloc[i-1][timestamp_col]
            curr_time = data.iloc[i][timestamp_col]
            gap_duration = curr_time - prev_time
            
            if gap_duration > timedelta(minutes=5):  # Gap > 5 minutes
                gaps.append((prev_time, curr_time))
        
        return gaps

    def linear_interpolation(
        self,
        data: pd.DataFrame,
        value_col: str,
        timestamp_col: str = "timestamp"
    ) -> pd.DataFrame:
        """Fill gaps using linear interpolation."""
        if data.empty:
            return data
        
        data = data.copy()
        data = data.sort_values(timestamp_col)
        
        # Set timestamp as index for interpolation
        data_indexed = data.set_index(timestamp_col)
        
        # Interpolate missing values
        data_indexed[value_col] = data_indexed[value_col].interpolate(
            method="linear",
            limit_direction="both"
        )
        
        return data_indexed.reset_index()

    def cross_satellite_reconstruction(
        self,
        target_satellite: str,
        target_parameter: str,
        other_satellite_data: Dict[str, pd.DataFrame],
        fusion_weights: Dict[str, float]
    ) -> pd.DataFrame:
        """Reconstruct missing data using cross-satellite information."""
        
        # Get available data from other satellites
        available_sats = []
        for sat_name, data in other_satellite_data.items():
            if sat_name != target_satellite and not data.empty:
                if target_parameter in data.columns:
                    available_sats.append(sat_name)
        
        if not available_sats:
            return pd.DataFrame()
        
        # Use fusion weights to weight reconstruction
        reconstructed_data = pd.DataFrame()
        
        for sat_name in available_sats:
            sat_data = other_satellite_data[sat_name][["timestamp", target_parameter]].copy()
            weight = fusion_weights.get(sat_name, 1.0 / len(available_sats))
            
            sat_data[target_parameter] = sat_data[target_parameter] * weight
            
            if reconstructed_data.empty:
                reconstructed_data = sat_data
            else:
                # Merge and sum weighted values
                reconstructed_data = pd.concat([
                    reconstructed_data,
                    sat_data
                ]).groupby("timestamp", as_index=False).sum()
        
        return reconstructed_data

    def spline_interpolation(
        self,
        data: pd.DataFrame,
        value_col: str,
        timestamp_col: str = "timestamp"
    ) -> pd.DataFrame:
        """Fill gaps using spline interpolation for smoother recovery."""
        if data.empty or len(data) < 4:
            return data
        
        data = data.copy()
        data = data.sort_values(timestamp_col)
        
        # Convert timestamps to numeric for interpolation
        timestamps_numeric = (data[timestamp_col] - data[timestamp_col].min()).dt.total_seconds()
        
        # Create spline interpolator
        spline = interpolate.CubicSpline(
            timestamps_numeric,
            data[value_col],
            extrapolate=False
        )
        
        # Generate interpolated values for all timestamps
        full_range = np.arange(timestamps_numeric.min(), timestamps_numeric.max(), 60)  # 1-minute intervals
        interpolated_values = spline(full_range)
        
        # Create new dataframe with interpolated values
        reconstructed = pd.DataFrame({
            timestamp_col: data[timestamp_col].min() + pd.to_timedelta(full_range, unit="s"),
            value_col: interpolated_values
        })
        
        return reconstructed

    def compute_recovery_confidence(
        self,
        original_data: pd.DataFrame,
        recovered_data: pd.DataFrame,
        value_col: str,
        timestamp_col: str = "timestamp"
    ) -> float:
        """Compute confidence score for recovered data."""
        
        # Confidence based on:
        # 1. Number of available satellites for cross-reconstruction
        # 2. Gap duration (shorter gaps = higher confidence)
        # 3. Variance in available data (lower variance = higher confidence)
        
        # Placeholder: return fixed confidence
        # In production, compute based on actual factors
        return 0.8


class RecoveryService:
    """Service for missing data recovery."""

    def __init__(self):
        self.recovery = DataRecovery()

    def recover_satellite_data(
        self,
        satellite_name: str,
        parameter_name: str,
        satellite_data: Dict[str, pd.DataFrame],
        fusion_weights: Optional[Dict[str, float]] = None
    ) -> Tuple[pd.DataFrame, float]:
        """Recover missing data for a satellite parameter."""
        
        target_data = satellite_data.get(satellite_name, pd.DataFrame())
        
        if target_data.empty:
            # No data at all, try cross-satellite reconstruction
            if fusion_weights:
                reconstructed = self.recovery.cross_satellite_reconstruction(
                    satellite_name,
                    parameter_name,
                    satellite_data,
                    fusion_weights
                )
                confidence = 0.6 if not reconstructed.empty else 0.0
                return reconstructed, confidence
            else:
                return pd.DataFrame(), 0.0
        
        # Detect gaps
        gaps = self.recovery.detect_gaps(target_data)
        
        if not gaps:
            # No gaps, return original data
            return target_data, 1.0
        
        # Attempt recovery for each gap
        recovered_data = target_data.copy()
        
        for gap_start, gap_end in gaps:
            gap_duration = gap_end - gap_start
            
            if gap_duration > self.recovery.max_gap_duration:
                # Gap too large, skip
                continue
            
            # Try cross-satellite reconstruction first
            if fusion_weights:
                cross_reconstructed = self.recovery.cross_satellite_reconstruction(
                    satellite_name,
                    parameter_name,
                    satellite_data,
                    fusion_weights
                )
                
                if not cross_reconstructed.empty:
                    # Merge cross-reconstructed data
                    recovered_data = pd.concat([
                        recovered_data,
                        cross_reconstructed
                    ]).drop_duplicates(subset="timestamp").sort_values("timestamp")
                    continue
            
            # Fall back to interpolation
            recovered_data = self.recovery.linear_interpolation(
                recovered_data,
                parameter_name
            )
        
        # Compute confidence
        confidence = self.recovery.compute_recovery_confidence(
            target_data,
            recovered_data,
            parameter_name
        )
        
        return recovered_data, confidence

    def recover_all_parameters(
        self,
        satellite_data: Dict[str, pd.DataFrame],
        fusion_weights: Dict[str, Dict[str, float]]
    ) -> Dict[str, Tuple[pd.DataFrame, float]]:
        """Recover missing data for all satellites and parameters."""
        
        results = {}
        
        for satellite_name, data in satellite_data.items():
            if data.empty:
                continue
            
            # Get parameters for this satellite
            parameters = [col for col in data.columns if col != "timestamp"]
            
            for parameter in parameters:
                # Get fusion weights for this parameter
                param_weights = fusion_weights.get(parameter, {})
                
                recovered_data, confidence = self.recover_satellite_data(
                    satellite_name,
                    parameter,
                    satellite_data,
                    param_weights
                )
                
                key = f"{satellite_name}_{parameter}"
                results[key] = (recovered_data, confidence)
        
        return results

    def get_fusion_weights_for_recovery(
        self,
        timestamp: datetime
    ) -> Dict[str, Dict[str, float]]:
        """Get fusion weights from fusion snapshots for recovery."""
        with SessionLocal() as db:
            # Get recent fusion snapshots
            snapshots = db.query(FusionSnapshot).filter(
                FusionSnapshot.timestamp <= timestamp,
                FusionSnapshot.timestamp >= timestamp - timedelta(minutes=10)
            ).all()
            
            weights = {}
            for snapshot in snapshots:
                param_weights = {}
                for sat_id, sat_data in snapshot.weights_json.items():
                    param_weights[sat_id] = sat_data.get("w", 0.0)
                
                weights[snapshot.parameter_name] = param_weights
            
            return weights

    def validate_recovered_data(
        self,
        recovered_data: pd.DataFrame,
        parameter_name: str
    ) -> Dict:
        """Validate recovered data against physical ranges."""
        
        # Define physical ranges for common parameters
        ranges = {
            "bulk_speed_km_s": (250, 3000),
            "density_cm3": (0.1, 100),
            "temperature_K": (1e4, 1e7),
            "Bx_nT": (-30, 30),
            "By_nT": (-30, 30),
            "Bz_nT": (-50, 50),
        }
        
        if parameter_name not in recovered_data.columns:
            return {"status": "parameter_not_found"}
        
        min_val, max_val = ranges.get(parameter_name, (-float("inf"), float("inf")))
        
        # Check for out-of-range values
        out_of_range = recovered_data[
            (recovered_data[parameter_name] < min_val) |
            (recovered_data[parameter_name] > max_val)
        ]
        
        validation = {
            "status": "valid" if out_of_range.empty else "invalid",
            "out_of_range_count": len(out_of_range),
            "total_count": len(recovered_data),
            "min_value": recovered_data[parameter_name].min(),
            "max_value": recovered_data[parameter_name].max(),
        }
        
        return validation

    def store_recovered_data(
        self,
        satellite_name: str,
        parameter_name: str,
        recovered_data: pd.DataFrame,
        confidence: float
    ):
        """Store recovered data (placeholder - would write to object storage)."""
        # TODO: Implement storage to Parquet/CDF
        # Update time_series_meta with recovery metadata
        pass


# Singleton instance
recovery_service = RecoveryService()
