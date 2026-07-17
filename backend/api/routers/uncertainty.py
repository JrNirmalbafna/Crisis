"""Uncertainty API router.

Endpoints for querying uncertainty estimates.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.models import UncertaintyEstimate, Prediction

router = APIRouter(prefix="/api/v1/uncertainty", tags=["uncertainty"])


@router.get("/prediction/{prediction_id}", response_model=dict)
async def get_uncertainty_for_prediction(
    prediction_id: int,
    db: Session = Depends(get_db)
):
    """Get uncertainty estimate for a specific prediction."""
    
    # Check if prediction exists
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    # Get uncertainty estimate
    uq = db.query(UncertaintyEstimate).filter(
        UncertaintyEstimate.prediction_id == prediction_id
    ).first()
    
    if not uq:
        raise HTTPException(status_code=404, detail="Uncertainty estimate not found")
    
    return {
        "id": uq.id,
        "prediction_id": uq.prediction_id,
        "lower_bound": float(uq.lower_bound) if uq.lower_bound else None,
        "upper_bound": float(uq.upper_bound) if uq.upper_bound else None,
        "bound_unit": uq.bound_unit,
        "confidence_level": float(uq.confidence_level) if uq.confidence_level else None,
        "reliability_score": float(uq.reliability_score) if uq.reliability_score else None,
        "model_agreement_score": float(uq.model_agreement_score) if uq.model_agreement_score else None,
        "uncertainty_shape": uq.uncertainty_shape,
        "details": uq.details_json,
        "created_at": uq.created_at.isoformat(),
    }
