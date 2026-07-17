"""Pipeline API router.

Endpoints for querying pipeline runs and triggering pipeline execution.
"""

from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.core.database import get_db
from backend.core.models import PipelineRun
from backend.services.pipeline_orchestrator import pipeline_orchestrator

router = APIRouter(prefix="/api/v1/pipeline", tags=["pipeline"])


class PipelineTriggerRequest(BaseModel):
    """Request model for triggering pipeline."""
    trigger_type: str = "scheduled"
    start_time: datetime
    end_time: datetime


@router.get("/runs", response_model=List[dict])
async def get_pipeline_runs(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get recent pipeline runs."""
    
    runs = db.query(PipelineRun).order_by(
        PipelineRun.started_at.desc()
    ).limit(limit).all()
    
    result = []
    for run in runs:
        result.append({
            "id": str(run.id),
            "trigger_type": run.trigger_type,
            "status": run.status,
            "started_at": run.started_at.isoformat(),
            "completed_at": run.completed_at.isoformat() if run.completed_at else None,
            "input_data_hash": run.input_data_hash,
            "config_version": run.config_version,
        })
    
    return result


@router.get("/run/{pipeline_run_id}", response_model=dict)
async def get_pipeline_run(
    pipeline_run_id: str,
    db: Session = Depends(get_db)
):
    """Get details for a specific pipeline run."""
    
    run = db.query(PipelineRun).filter(
        PipelineRun.id == pipeline_run_id
    ).first()
    
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run not found")
    
    return {
        "id": str(run.id),
        "trigger_type": run.trigger_type,
        "status": run.status,
        "started_at": run.started_at.isoformat(),
        "completed_at": run.completed_at.isoformat() if run.completed_at else None,
        "input_data_hash": run.input_data_hash,
        "config_version": run.config_version,
    }


@router.post("/trigger", response_model=dict)
async def trigger_pipeline(
    request: PipelineTriggerRequest,
    background_tasks: BackgroundTasks
):
    """Trigger a pipeline run.

    The pipeline runs as a background task. Use GET /pipeline/run/{id}
    to poll status using the returned pipeline_run_id.
    """

    # run_pipeline() is async, but BackgroundTasks runs in a thread pool.
    # asyncio.run() is the correct bridge here because BackgroundTasks
    # callbacks are NOT run inside the FastAPI event loop — they run in
    # a separate thread, so creating a new event loop is correct and safe.
    def run_pipeline_task():
        import asyncio
        try:
            result = asyncio.run(pipeline_orchestrator.run_pipeline(
                start_time=request.start_time,
                end_time=request.end_time,
                trigger_type=request.trigger_type,
            ))
            return result
        except Exception as e:
            return {"status": "failed", "error": str(e)}

    background_tasks.add_task(run_pipeline_task)

    return {
        "status": "triggered",
        "message": "Pipeline execution started in background",
        "trigger_type": request.trigger_type,
        "start_time": request.start_time.isoformat(),
        "end_time": request.end_time.isoformat(),
    }
