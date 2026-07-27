"""Events API router.

Endpoints for querying solar events.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.models import Event, EventObservation, Prediction

router = APIRouter(prefix="/api/v1/events", tags=["events"])


@router.get("/", response_model=List[dict])
async def get_events(
    hours: int = Query(24, ge=1, le=8760, description="Hours to look back"),
    event_type: Optional[str] = Query(None, description="Filter by event type (CME, FLARE, HSS, SEP)"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of events"),
    db: Session = Depends(get_db)
):
    """Get recent solar events."""
    
    # Build query
    query = db.query(Event).filter(
        Event.start_time >= datetime.utcnow() - timedelta(hours=hours)
    )
    
    # Apply filters
    if event_type:
        query = query.filter(Event.event_type == event_type.upper())
    
    if status:
        query = query.filter(Event.status == status)
    
    # Order and limit
    events = query.order_by(Event.start_time.desc()).limit(limit).all()
    
    # Format response
    result = []
    for event in events:
        result.append({
            "id": event.id,
            "event_type": event.event_type,
            "detection_source": event.detection_source,
            "external_catalog_id": event.external_catalog_id,
            "start_time": event.start_time.isoformat(),
            "peak_time": event.peak_time.isoformat() if event.peak_time else None,
            "end_time": event.end_time.isoformat() if event.end_time else None,
            "detection_confidence": float(event.detection_confidence) if event.detection_confidence else None,
            "status": event.status,
            "metadata": event.metadata_json,
            "pipeline_run_id": str(event.pipeline_run_id) if event.pipeline_run_id else None,
        })
    
    return result


@router.get("/{event_id}", response_model=dict)
async def get_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Get details for a specific event."""
    
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get event observations
    observations = db.query(EventObservation).filter(
        EventObservation.event_id == event_id
    ).all()
    
    # Get predictions
    predictions = db.query(Prediction).filter(
        Prediction.event_id == event_id
    ).all()
    
    # Format observations
    obs_data = []
    for obs in observations:
        obs_data.append({
            "id": obs.id,
            "satellite_id": obs.satellite_id,
            "instrument_id": obs.instrument_id,
            "observed_start": obs.observed_start.isoformat() if obs.observed_start else None,
            "observed_end": obs.observed_end.isoformat() if obs.observed_end else None,
            "quality_score": float(obs.quality_score) if obs.quality_score else None,
            "comments": obs.comments,
        })
    
    # Format predictions
    pred_data = []
    for pred in predictions:
        pred_data.append({
            "id": pred.id,
            "prediction_type": pred.prediction_type,
            "predicted_value": float(pred.predicted_value),
            "predicted_unit": pred.predicted_unit,
            "prediction_timestamp": pred.prediction_timestamp.isoformat(),
            "horizon_seconds": pred.horizon_seconds,
            "is_consensus": pred.is_consensus,
        })
    
    return {
        "id": event.id,
        "event_type": event.event_type,
        "detection_source": event.detection_source,
        "external_catalog_id": event.external_catalog_id,
        "start_time": event.start_time.isoformat(),
        "peak_time": event.peak_time.isoformat() if event.peak_time else None,
        "end_time": event.end_time.isoformat() if event.end_time else None,
        "detection_confidence": float(event.detection_confidence) if event.detection_confidence else None,
        "status": event.status,
        "metadata": event.metadata_json,
        "pipeline_run_id": str(event.pipeline_run_id) if event.pipeline_run_id else None,
        "observations": obs_data,
        "predictions": pred_data,
    }


@router.get("/{event_id}/observations", response_model=List[dict])
async def get_event_observations(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Get satellite observations for an event."""
    
    event = db.query(Event).filter(Event.id == event_id).first()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    observations = db.query(EventObservation).filter(
        EventObservation.event_id == event_id
    ).all()
    
    result = []
    for obs in observations:
        result.append({
            "id": obs.id,
            "satellite_id": obs.satellite_id,
            "instrument_id": obs.instrument_id,
            "observed_start": obs.observed_start.isoformat() if obs.observed_start else None,
            "observed_end": obs.observed_end.isoformat() if obs.observed_end else None,
            "quality_score": float(obs.quality_score) if obs.quality_score else None,
            "comments": obs.comments,
        })
    
    return result
