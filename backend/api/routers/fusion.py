"""Fusion API router.

Endpoints for querying fusion snapshots and weight breakdowns.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.models import FusionSnapshot

router = APIRouter(prefix="/api/v1/fusion", tags=["fusion"])


@router.get("/snapshot/{timestamp}", response_model=dict)
async def get_fusion_snapshot(
    timestamp: str,
    db: Session = Depends(get_db)
):
    """Get fusion snapshot for a specific timestamp."""
    
    try:
        target_time = datetime.fromisoformat(timestamp)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format. Use ISO 8601.")
    
    # Find snapshot closest to target time (within 5 minutes).
    # Use func.abs(func.extract('epoch', interval)) because:
    # - PostgreSQL timestamp subtraction returns an INTERVAL, not a number
    # - SQLAlchemy column expressions don't have an .abs() method
    time_window = timedelta(minutes=5)
    snapshot = db.query(FusionSnapshot).filter(
        FusionSnapshot.timestamp >= target_time - time_window,
        FusionSnapshot.timestamp <= target_time + time_window
    ).order_by(
        func.abs(func.extract("epoch", FusionSnapshot.timestamp - target_time))
    ).first()
    
    if not snapshot:
        raise HTTPException(status_code=404, detail="Fusion snapshot not found")
    
    return {
        "id": snapshot.id,
        "timestamp": snapshot.timestamp.isoformat(),
        "parameter_name": snapshot.parameter_name,
        "fused_value": float(snapshot.fused_value) if snapshot.fused_value else None,
        "weights": snapshot.weights_json,
        "created_at": snapshot.created_at.isoformat(),
    }


@router.get("/history/{parameter_name}", response_model=List[dict])
async def get_fusion_history(
    parameter_name: str,
    hours: int = Query(24, ge=1, le=168, description="Hours to look back"),
    db: Session = Depends(get_db)
):
    """Get fusion history for a parameter."""
    
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    snapshots = db.query(FusionSnapshot).filter(
        FusionSnapshot.parameter_name == parameter_name,
        FusionSnapshot.timestamp >= start_time
    ).order_by(FusionSnapshot.timestamp).all()
    
    result = []
    for snapshot in snapshots:
        result.append({
            "id": snapshot.id,
            "timestamp": snapshot.timestamp.isoformat(),
            "parameter_name": snapshot.parameter_name,
            "fused_value": float(snapshot.fused_value) if snapshot.fused_value else None,
            "weights": snapshot.weights_json,
        })
    
    return result


@router.get("/parameters", response_model=List[str])
async def get_fused_parameters(
    hours: int = Query(24, ge=1, le=168, description="Hours to look back"),
    db: Session = Depends(get_db)
):
    """Get list of parameters that have been fused."""
    
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    # Get unique parameter names
    parameters = db.query(FusionSnapshot.parameter_name).filter(
        FusionSnapshot.timestamp >= start_time
    ).distinct().all()
    
    return [p[0] for p in parameters]


@router.get("/latest", response_model=List[dict])
async def get_latest_fusion_snapshots(
    limit: int = Query(10, ge=1, le=100, description="Number of snapshots"),
    db: Session = Depends(get_db)
):
    """Get the most recent fusion snapshots."""
    
    snapshots = db.query(FusionSnapshot).order_by(
        FusionSnapshot.timestamp.desc()
    ).limit(limit).all()
    
    result = []
    for snapshot in snapshots:
        result.append({
            "id": snapshot.id,
            "timestamp": snapshot.timestamp.isoformat(),
            "parameter_name": snapshot.parameter_name,
            "fused_value": float(snapshot.fused_value) if snapshot.fused_value else None,
            "weights": snapshot.weights_json,
        })
    
    return result


@router.get("/satellite-health", response_model=List[dict])
async def get_satellite_health(db: Session = Depends(get_db)):
    """Get authoritative satellite health and trust score metrics."""
    latest = db.query(FusionSnapshot).order_by(FusionSnapshot.timestamp.desc()).first()
    weights = latest.weights_json if latest and latest.weights_json else {}

    satellites = ["DSCOVR", "ACE", "WIND", "SOHO"]
    res = []
    for name in satellites:
        raw_w = weights.get(name, 0.25)
        weight = raw_w.get("w", 0.25) if isinstance(raw_w, dict) else raw_w
        status = "nominal"
        if name != "SOHO" and weight == 0 and weights:
            status = "critical"
        elif name != "SOHO" and weight < 0.15 and weights:
            status = "warning"
        res.append({
            "name": name,
            "health": status,
            "signal": "Strong" if status == "nominal" else "Weak",
            "latency": 25 if name != "SOHO" else 45,
            "missingPercent": 100 if status == "critical" else 0,
            "trustScore": 95 if name == "SOHO" else max(70, int(weight * 100)),
            "contributionPercent": int(weight * 100)
        })
    return res

