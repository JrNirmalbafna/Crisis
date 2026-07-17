"""Predictions API router.

Endpoints for querying predictions and consensus data.
"""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.models import Prediction, Event, UncertaintyEstimate, Explanation, PhysicsValidationResult

router = APIRouter(prefix="/api/v1/predictions", tags=["predictions"])


@router.get("/event/{event_id}", response_model=List[dict])
async def get_predictions_for_event(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Get all predictions for a specific event."""
    
    # Check if event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    predictions = db.query(Prediction).filter(
        Prediction.event_id == event_id
    ).order_by(Prediction.prediction_timestamp).all()
    
    result = []
    for pred in predictions:
        # Get uncertainty estimate
        uq = db.query(UncertaintyEstimate).filter(
            UncertaintyEstimate.prediction_id == pred.id
        ).first()
        
        # Get explanation
        explanation = db.query(Explanation).filter(
            Explanation.prediction_id == pred.id
        ).first()
        
        # Get physics validation
        physics = db.query(PhysicsValidationResult).filter(
            PhysicsValidationResult.prediction_id == pred.id
        ).first()
        
        result.append({
            "id": pred.id,
            "prediction_type": pred.prediction_type,
            "predicted_value": float(pred.predicted_value),
            "predicted_unit": pred.predicted_unit,
            "prediction_timestamp": pred.prediction_timestamp.isoformat(),
            "horizon_seconds": pred.horizon_seconds,
            "is_consensus": pred.is_consensus,
            "base_models_included": pred.base_models_included,
            "model_run_id": pred.model_run_id,
            "uncertainty": {
                "lower_bound": float(uq.lower_bound) if uq and uq.lower_bound else None,
                "upper_bound": float(uq.upper_bound) if uq and uq.upper_bound else None,
                "confidence_level": float(uq.confidence_level) if uq and uq.confidence_level else None,
                "reliability_score": float(uq.reliability_score) if uq and uq.reliability_score else None,
                "model_agreement_score": float(uq.model_agreement_score) if uq and uq.model_agreement_score else None,
            } if uq else None,
            "explanation": {
                "physics_explanation": explanation.physics_explanation if explanation else None,
                "nl_explanation": explanation.nl_explanation if explanation else None,
                "importance": explanation.importance_json if explanation else None,
            } if explanation else None,
            "physics_validation": {
                "status": physics.validation_status if physics else None,
                "confidence_multiplier": float(physics.confidence_multiplier) if physics else None,
                "automation_allowed": physics.automation_allowed if physics else None,
                "violated_rules": physics.violated_rules if physics else None,
            } if physics else None,
        })
    
    return result


@router.get("/{prediction_id}", response_model=dict)
async def get_prediction(
    prediction_id: int,
    db: Session = Depends(get_db)
):
    """Get detailed information for a specific prediction."""
    
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    # Get associated event
    event = db.query(Event).filter(Event.id == prediction.event_id).first()
    
    # Get uncertainty estimate
    uq = db.query(UncertaintyEstimate).filter(
        UncertaintyEstimate.prediction_id == prediction_id
    ).first()
    
    # Get explanation
    explanation = db.query(Explanation).filter(
        Explanation.prediction_id == prediction_id
    ).first()
    
    # Get physics validation
    physics = db.query(PhysicsValidationResult).filter(
        PhysicsValidationResult.prediction_id == prediction_id
    ).first()
    
    return {
        "id": prediction.id,
        "event_id": prediction.event_id,
        "event_type": event.event_type if event else None,
        "prediction_type": prediction.prediction_type,
        "predicted_value": float(prediction.predicted_value),
        "predicted_unit": prediction.predicted_unit,
        "prediction_timestamp": prediction.prediction_timestamp.isoformat(),
        "horizon_seconds": prediction.horizon_seconds,
        "is_consensus": prediction.is_consensus,
        "base_models_included": prediction.base_models_included,
        "model_run_id": prediction.model_run_id,
        "pipeline_run_id": str(prediction.pipeline_run_id) if prediction.pipeline_run_id else None,
        "uncertainty": {
            "id": uq.id if uq else None,
            "lower_bound": float(uq.lower_bound) if uq and uq.lower_bound else None,
            "upper_bound": float(uq.upper_bound) if uq and uq.upper_bound else None,
            "bound_unit": uq.bound_unit if uq else None,
            "confidence_level": float(uq.confidence_level) if uq and uq.confidence_level else None,
            "reliability_score": float(uq.reliability_score) if uq and uq.reliability_score else None,
            "model_agreement_score": float(uq.model_agreement_score) if uq and uq.model_agreement_score else None,
            "uncertainty_shape": uq.uncertainty_shape if uq else None,
            "details": uq.details_json if uq else None,
        } if uq else None,
        "explanation": {
            "id": explanation.id if explanation else None,
            "explanation_type": explanation.explanation_type if explanation else None,
            "physics_explanation": explanation.physics_explanation if explanation else None,
            "nl_explanation": explanation.nl_explanation if explanation else None,
            "importance": explanation.importance_json if explanation else None,
            "visualization_ref": explanation.visualization_ref if explanation else None,
        } if explanation else None,
        "physics_validation": {
            "id": physics.id if physics else None,
            "validation_status": physics.validation_status if physics else None,
            "violated_rules": physics.violated_rules if physics else None,
            "confidence_multiplier": float(physics.confidence_multiplier) if physics else None,
            "automation_allowed": physics.automation_allowed if physics else None,
            "checked_at": physics.checked_at.isoformat() if physics and physics.checked_at else None,
            "comments": physics.comments if physics else None,
        } if physics else None,
    }


@router.get("/consensus/event/{event_id}", response_model=dict)
async def get_consensus_prediction(
    event_id: int,
    db: Session = Depends(get_db)
):
    """Get consensus prediction for an event."""
    
    # Check if event exists
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    # Get consensus prediction
    consensus = db.query(Prediction).filter(
        Prediction.event_id == event_id,
        Prediction.is_consensus == True
    ).first()
    
    if not consensus:
        raise HTTPException(status_code=404, detail="Consensus prediction not found")
    
    # Get all individual predictions for comparison
    individual_predictions = db.query(Prediction).filter(
        Prediction.event_id == event_id,
        Prediction.is_consensus == False
    ).all()
    
    # Get uncertainty and validation
    uq = db.query(UncertaintyEstimate).filter(
        UncertaintyEstimate.prediction_id == consensus.id
    ).first()
    
    physics = db.query(PhysicsValidationResult).filter(
        PhysicsValidationResult.prediction_id == consensus.id
    ).first()
    
    return {
        "consensus": {
            "id": consensus.id,
            "predicted_value": float(consensus.predicted_value),
            "predicted_unit": consensus.predicted_unit,
            "prediction_timestamp": consensus.prediction_timestamp.isoformat(),
            "base_models_included": consensus.base_models_included,
        },
        "individual_predictions": [
            {
                "id": pred.id,
                "predicted_value": float(pred.predicted_value),
                "model_run_id": pred.model_run_id,
            }
            for pred in individual_predictions
        ],
        "uncertainty": {
            "lower_bound": float(uq.lower_bound) if uq and uq.lower_bound else None,
            "upper_bound": float(uq.upper_bound) if uq and uq.upper_bound else None,
            "confidence_level": float(uq.confidence_level) if uq and uq.confidence_level else None,
            "model_agreement_score": float(uq.model_agreement_score) if uq and uq.model_agreement_score else None,
        } if uq else None,
        "physics_validation": {
            "status": physics.validation_status if physics else None,
            "confidence_multiplier": float(physics.confidence_multiplier) if physics else None,
            "automation_allowed": physics.automation_allowed if physics else None,
        } if physics else None,
    }
