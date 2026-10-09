from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
import uuid
import json
from api.app.services.queue import enqueue_job

router = APIRouter(prefix="/jobs", tags=["Jobs"])

class SplitJobRequest(BaseModel):
    fileId: str
    filePath: str
    fileName: str
    mode: str          # "pieces" or "rows"
    modeValue: int     # e.g. 4 (pieces) or 50000 (rows)
    outputFormat: str  # "csv" or "xlsx"

JOBS_DB = {} # Temporary in-memory store for MVP job status before Firebase integration

@router.post("")
def create_split_job(payload: SplitJobRequest):
    job_id = str(uuid.uuid4())
    
    job_data = {
        "jobId": job_id,
        "filePath": payload.filePath,
        "fileName": payload.fileName,
        "mode": payload.mode,
        "modeValue": payload.modeValue,
        "outputFormat": payload.outputFormat,
        "status": "queued"
    }
    
    # Store locally for tracking
    JOBS_DB[job_id] = job_data
    
    try:
        # Push to Redis queue for background worker
        enqueue_job(job_data)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to push job to queue: {str(e)}"
        )
        
    return {
        "jobId": job_id,
        "status": "queued",
        "message": "Job successfully created and queued for processing."
    }

@router.get("/{job_id}")
def get_job_status(job_id: str):
    if job_id not in JOBS_DB:
        raise HTTPException(status_code=404, detail="Job not found.")
    return JOBS_DB[job_id]