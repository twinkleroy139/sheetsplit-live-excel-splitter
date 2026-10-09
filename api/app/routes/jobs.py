from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Any
import uuid
import json
from api.app.services.queue import enqueue_job
import shutil
import os

router = APIRouter(prefix="/jobs", tags=["Jobs"])

class SplitJobRequest(BaseModel):
    fileId: str
    filePath: str
    fileName: str
    mode: str          # "pieces", "rows", or "column"
    modeValue: Any     # Can be int (for pieces/rows) or str (for column name)
    outputFormat: str  # "csv" or "xlsx"

JOBS_DB = {}

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
    
    JOBS_DB[job_id] = job_data
    
    try:
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

@router.get("")
def list_jobs():
    """Returns recent job history."""
    return list(JOBS_DB.values())

@router.get("/{job_id}")
def get_job_status(job_id: str):
    if job_id not in JOBS_DB:
        raise HTTPException(status_code=404, detail="Job not found.")
    return JOBS_DB[job_id]






@router.delete("/cleanup")
def manual_cleanup():
    """Manually clears all temporary upload and output folders."""
    deleted_counts = {"uploads_removed": 0, "outputs_removed": 0}
    
    upload_dir = "temp_uploads"
    output_dir = "temp_outputs"
    
    if os.path.exists(upload_dir):
        for filename in os.listdir(upload_dir):
            file_path = os.path.join(upload_dir, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
                deleted_counts["uploads_removed"] += 1
                
    if os.path.exists(output_dir):
        for item in os.listdir(output_dir):
            item_path = os.path.join(output_dir, item)
            if os.path.isdir(item_path):
                shutil.rmtree(item_path)
                deleted_counts["outputs_removed"] += 1
                
    return {
        "status": "success",
        "message": "Temporary files and output folders cleaned successfully.",
        "details": deleted_counts
    }