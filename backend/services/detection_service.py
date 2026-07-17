"""Solar Event Detection Engine (Module 1).

Detects and classifies solar events: CME, Flare, HSS, SEP.
Uses AI models with sequence labeling and threshold-based detection.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

from backend.core.config import settings
from backend.core.database import SessionLocal
from backend.core.models import (
    Event,
    EventObservation,
    Satellite,
    Instrument,
    TimeSeriesMeta,
    PipelineRun,
)


class EventDetector:
    """Core event detection algorithm."""

    def __init__(self):
        # Detection thresholds (configurable)
        self.cme_speed_threshold = 400.0  # km/s
        self.cme_width_threshold = 30.0  # degrees
        self.flare_flux_threshold = 1e-6  # W/m² (C-class)
        self.hss_speed_threshold = 600.0  # km/s
        self.hss_duration_threshold = 3 * 3600  # 3 hours in seconds
        self.sep_flux_threshold = 10.0  # pfu (proton flux units)
        self.sep_duration_threshold = 10 * 60  # 10 minutes in seconds

    def detect_cme(
        self,
        cme_speed: float,
        cme_width: float,
        timestamp: datetime
    ) -> Optional[Dict]:
        """Detect CME event from coronagraph data."""
        if cme_speed >= self.cme_speed_threshold and cme_width >= self.cme_width_threshold:
            return {
                "event_type": "CME",
                "confidence": min(1.0, (cme_speed / 2000.0) * (cme_width / 360.0)),
                "metadata": {
                    "speed_km_s": cme_speed,
                    "width_deg": cme_width,
                    "halo": cme_width >= 120.0,
                },
            }
        return None

    def detect_flare(
        self,
        xray_flux: float,
        timestamp: datetime
    ) -> Optional[Dict]:
        """Detect solar flare from X-ray flux."""
        if xray_flux >= self.flare_flux_threshold:
            # Classify flare
            if xray_flux >= 1e-4:
                flare_class = "X"
            elif xray_flux >= 1e-5:
                flare_class = "M"
            elif xray_flux >= 1e-6:
                flare_class = "C"
            elif xray_flux >= 1e-7:
                flare_class = "B"
            else:
                flare_class = "A"
            
            return {
                "event_type": "FLARE",
                "confidence": min(1.0, xray_flux / 1e-3),
                "metadata": {
                    "flux_Wm2": xray_flux,
                    "class": flare_class,
                },
            }
        return None

    def detect_hss(
        self,
        solar_wind_speed: pd.Series,
        timestamps: pd.Series
    ) -> Optional[Dict]:
        """Detect High-Speed Stream from sustained solar wind speed."""
        if len(solar_wind_speed) < 10:
            return None
        
        # Check for sustained high speed
        high_speed_mask = solar_wind_speed >= self.hss_speed_threshold
        consecutive_high = 0
        max_consecutive = 0
        
        for is_high in high_speed_mask:
            if is_high:
                consecutive_high += 1
                max_consecutive = max(max_consecutive, consecutive_high)
            else:
                consecutive_high = 0
        
        if max_consecutive >= (self.hss_duration_threshold / 60):  # Convert to minutes
            start_idx = solar_wind_speed[solar_wind_speed >= self.hss_speed_threshold].index[0]
            return {
                "event_type": "HSS",
                "confidence": min(1.0, max_consecutive / (6 * 60)),  # Normalize by 6 hours
                "metadata": {
                    "peak_speed_km_s": solar_wind_speed.max(),
                    "duration_hours": max_consecutive / 60,
                    "start_time": timestamps.iloc[start_idx],
                },
            }
        return None

    def detect_sep(
        self,
        proton_flux: pd.Series,
        timestamps: pd.Series
    ) -> Optional[Dict]:
        """Detect Solar Energetic Particle event from proton flux."""
        if len(proton_flux) < 5:
            return None
        
        # Check for sustained high proton flux
        high_flux_mask = proton_flux >= self.sep_flux_threshold
        consecutive_high = 0
        max_consecutive = 0
        
        for is_high in high_flux_mask:
            if is_high:
                consecutive_high += 1
                max_consecutive = max(max_consecutive, consecutive_high)
            else:
                consecutive_high = 0
        
        if max_consecutive >= (self.sep_duration_threshold / 60):  # Convert to minutes
            start_idx = proton_flux[proton_flux >= self.sep_flux_threshold].index[0]
            return {
                "event_type": "SEP",
                "confidence": min(1.0, max_consecutive / (30 * 60)),  # Normalize by 30 minutes
                "metadata": {
                    "peak_flux_pf": proton_flux.max(),
                    "duration_minutes": max_consecutive,
                    "start_time": timestamps.iloc[start_idx],
                },
            }
        return None


class DetectionService:
    """Service for detecting solar events from fused data."""

    def __init__(self):
        self.detector = EventDetector()

    def detect_events_from_fused_data(
        self,
        fused_data: pd.DataFrame,
        pipeline_run_id: Optional[str] = None
    ) -> List[Event]:
        """Detect events from fused multi-satellite data."""
        events = []
        
        # Detect CME from coronagraph data
        if 'cme_speed_km_s' in fused_data.columns and 'cme_width_deg' in fused_data.columns:
            for idx, row in fused_data.iterrows():
                cme_event = self.detector.detect_cme(
                    row['cme_speed_km_s'],
                    row['cme_width_deg'],
                    row['timestamp']
                )
                if cme_event:
                    event = self._create_event(
                        cme_event,
                        row['timestamp'],
                        pipeline_run_id
                    )
                    events.append(event)
        
        # Detect flares from X-ray flux
        if 'xray_flux_Wm2' in fused_data.columns:
            for idx, row in fused_data.iterrows():
                flare_event = self.detector.detect_flare(
                    row['xray_flux_Wm2'],
                    row['timestamp']
                )
                if flare_event:
                    event = self._create_event(
                        flare_event,
                        row['timestamp'],
                        pipeline_run_id
                    )
                    events.append(event)
        
        # Detect HSS from solar wind speed
        if 'bulk_speed_km_s' in fused_data.columns:
            hss_event = self.detector.detect_hss(
                fused_data['bulk_speed_km_s'],
                fused_data['timestamp']
            )
            if hss_event:
                event = self._create_event(
                    hss_event,
                    hss_event['metadata']['start_time'],
                    pipeline_run_id
                )
                events.append(event)
        
        # Detect SEP from proton flux
        if 'proton_flux_pf' in fused_data.columns:
            sep_event = self.detector.detect_sep(
                fused_data['proton_flux_pf'],
                fused_data['timestamp']
            )
            if sep_event:
                event = self._create_event(
                    sep_event,
                    sep_event['metadata']['start_time'],
                    pipeline_run_id
                )
                events.append(event)
        
        return events

    def _create_event(
        self,
        event_data: Dict,
        timestamp: datetime,
        pipeline_run_id: Optional[str]
    ) -> Event:
        """Create Event object from detection data."""
        event = Event(
            pipeline_run_id=pipeline_run_id,
            event_type=event_data['event_type'],
            detection_source="AI",
            start_time=timestamp,
            peak_time=timestamp,  # Will be updated if duration available
            detection_confidence=event_data['confidence'],
            status="pending_validation",
            metadata_json=event_data.get('metadata', {}),
        )
        return event

    def store_events(self, events: List[Event]):
        """Store detected events in database."""
        with SessionLocal() as db:
            for event in events:
                db.add(event)
            db.commit()

    def create_event_observations(
        self,
        event: Event,
        satellite_data: Dict[str, pd.DataFrame],
        satellite_metadata: Dict[str, Dict]
    ):
        """Create event observations for each satellite."""
        with SessionLocal() as db:
            for satellite_name, data in satellite_data.items():
                if not data.empty:
                    # Find observation window around event time
                    event_time = event.start_time
                    window_start = event_time - timedelta(hours=1)
                    window_end = event_time + timedelta(hours=1)
                    
                    # Filter data in window
                    mask = (data['timestamp'] >= window_start) & (data['timestamp'] <= window_end)
                    window_data = data[mask]
                    
                    if not window_data.empty:
                        # Get satellite ID
                        satellite = db.query(Satellite).filter(
                            Satellite.name == satellite_name
                        ).first()
                        
                        if satellite:
                            obs = EventObservation(
                                event_id=event.id,
                                satellite_id=satellite.id,
                                observed_start=window_data['timestamp'].min(),
                                observed_end=window_data['timestamp'].max(),
                                quality_score=0.9,  # TODO: Compute from quality flags
                                comments=f"Data points: {len(window_data)}",
                            )
                            db.add(obs)
            
            db.commit()

    def get_recent_events(
        self,
        hours: int = 24,
        event_type: Optional[str] = None
    ) -> List[Event]:
        """Get recent events from database."""
        with SessionLocal() as db:
            query = db.query(Event).filter(
                Event.start_time >= datetime.utcnow() - timedelta(hours=hours)
            )
            
            if event_type:
                query = query.filter(Event.event_type == event_type)
            
            events = query.order_by(Event.start_time.desc()).all()
        return events

    def merge_duplicate_events(
        self,
        events: List[Event],
        time_window_minutes: int = 30
    ) -> List[Event]:
        """Merge events that are likely duplicates (close in time and type)."""
        if not events:
            return []
        
        # Sort by start time
        events.sort(key=lambda e: e.start_time)
        
        merged = []
        current = events[0]
        
        for event in events[1:]:
            time_diff = (event.start_time - current.start_time).total_seconds() / 60
            
            if (time_diff < time_window_minutes and 
                event.event_type == current.event_type):
                # Merge - keep the one with higher confidence
                if event.detection_confidence > current.detection_confidence:
                    current = event
            else:
                merged.append(current)
                current = event
        
        merged.append(current)
        return merged


# Singleton instance
detection_service = DetectionService()
