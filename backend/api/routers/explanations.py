"""Explanations API router.

Endpoints for querying model explanations.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.models import Explanation, Prediction

router = APIRouter(prefix="/api/v1/explanations", tags=["explanations"])


@router.get("/prediction/{prediction_id}", response_model=dict)
async def get_explanation_for_prediction(
    prediction_id: int,
    db: Session = Depends(get_db)
):
    """Get explanation for a specific prediction."""
    
    # Check if prediction exists
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")
    
    # Get explanation
    explanation = db.query(Explanation).filter(
        Explanation.prediction_id == prediction_id
    ).first()
    
    if not explanation:
        raise HTTPException(status_code=404, detail="Explanation not found")
    
    return {
        "id": explanation.id,
        "prediction_id": explanation.prediction_id,
        "explanation_type": explanation.explanation_type,
        "importance": explanation.importance_json,
        "physics_explanation": explanation.physics_explanation,
        "nl_explanation": explanation.nl_explanation,
        "visualization_ref": explanation.visualization_ref,
        "created_at": explanation.created_at.isoformat(),
    }
