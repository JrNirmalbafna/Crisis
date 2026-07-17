"""Recommendations API router.

Endpoints for querying stakeholder recommendations.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.models import Recommendation, Event, Prediction

router = APIRouter(prefix="/api/v1/recommendations", tags=["recommendations"])


@router.get("/", response_model=List[dict])
async def get_recommendations(
    stakeholder: Optional[str] = Query(None, description="Filter by stakeholder system"),
    active_only: bool = Query(True, description="Only return currently active recommendations"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of recommendations"),
    db: Session = Depends(get_db)
):
    """Get recommendations, optionally filtered by stakeholder."""
    
    query = db.query(Recommendation)
    
    # Apply filters
    if stakeholder:
        query = query.filter(Recommendation.target_system == stakeholder)
    
    if active_only:
        query = query.filter(
            Recommendation.valid_from <= datetime.utcnow(),
            Recommendation.valid_until >= datetime.utcnow()
        )
    
    # Order by priority and time
    priority_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    
    recommendations = query.order_by(
        Recommendation.valid_from.desc()
    ).limit(limit).all()
    
    # Sort by priority
    recommendations.sort(key=lambda r: priority_order.get(r.action_priority, 3))
    
    result = []
    for rec in recommendations:
        result.append({
            "id": rec.id,
            "event_id": rec.event_id,
            "prediction_id": rec.prediction_id,
            "target_system": rec.target_system,
            "recommended_action": rec.recommended_action,
            "action_priority": rec.action_priority,
            "justification": rec.justification_text,
            "valid_from": rec.valid_from.isoformat(),
            "valid_until": rec.valid_until.isoformat() if rec.valid_until else None,
            "created_at": rec.created_at.isoformat(),
        })
    
    return result


@router.get("/event/{event_id}", response_model=List[dict])
async def get_recommendations_for_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Get all recommendations for a specific event."""
    
    # Check if event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    recommendations = db.query(Recommendation).filter(
        Recommendation.event_id == event_id
    ).order_by(Recommendation.valid_from.desc()).all()
    
    result = []
    for rec in recommendations:
        result.append({
            "id": rec.id,
            "prediction_id": rec.prediction_id,
            "target_system": rec.target_system,
            "recommended_action": rec.recommended_action,
            "action_priority": rec.action_priority,
            "justification": rec.justification_text,
            "valid_from": rec.valid_from.isoformat(),
            "valid_until": rec.valid_until.isoformat() if rec.valid_until else None,
            "created_at": rec.created_at.isoformat(),
        })
    
    return result


@router.get("/stakeholders", response_model=List[str])
async def get_stakeholders(
    db: Session = Depends(get_db)
):
    """Get list of available stakeholder systems."""
    
    stakeholders = db.query(Recommendation.target_system).distinct().all()
    return [s[0] for s in stakeholders]


@router.get("/{recommendation_id}", response_model=dict)
async def get_recommendation(
    recommendation_id: int,
    db: Session = Depends(get_db)
):
    """Get details for a specific recommendation."""
    
    recommendation = db.query(Recommendation).filter(
        Recommendation.id == recommendation_id
    ).first()
    
    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    
    # Get associated event
    event = db.query(Event).filter(Event.id == recommendation.event_id).first()
    
    # Get associated prediction
    prediction = db.query(Prediction).filter(
        Prediction.id == recommendation.prediction_id
    ).first()
    
    return {
        "id": recommendation.id,
        "event_id": recommendation.event_id,
        "prediction_id": recommendation.prediction_id,
        "target_system": recommendation.target_system,
        "recommended_action": recommendation.recommended_action,
        "action_priority": recommendation.action_priority,
        "justification": recommendation.justification_text,
        "valid_from": recommendation.valid_from.isoformat(),
        "valid_until": recommendation.valid_until.isoformat() if recommendation.valid_until else None,
        "created_at": recommendation.created_at.isoformat(),
        "event": {
            "id": event.id,
            "event_type": event.event_type,
            "start_time": event.start_time.isoformat(),
        } if event else None,
        "prediction": {
            "id": prediction.id,
            "predicted_value": float(prediction.predicted_value),
            "predicted_unit": prediction.predicted_unit,
        } if prediction else None,
    }
