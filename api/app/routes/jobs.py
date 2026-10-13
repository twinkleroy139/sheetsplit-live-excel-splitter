from fastapi import APIRouter, HTTPException, BackgroundTasks, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Any
import uuid
import os
import shutil
import zipfile
from api.app.splitter.writer import split_spreadsheet

router = APIRouter(prefix="/jobs", tags=["Jobs"])

class SplitJobRequest(BaseModel):
    fileId: str
    filePath: str
    fileName: str
    mode: str          # "pieces", "rows", or "column"
    modeValue: Any     # int or column string
    outputFormat: str  # "csv", "xlsx", "tsv", "json"

JOBS_DB = {}

def process_split_background(job_id: str, file_path: str, mode: str, mode_value: Any, output_format: str):
    output_dir = os.path.abspath(os.path.join("temp_outputs", job_id))
    try:
        split_spreadsheet(
            file_path=file_path,
            output_dir=output_dir,
            mode=mode,
            mode_value=mode_value,
            output_format=output_format
        )
        if job_id in JOBS_DB:
            JOBS_DB[job_id]["status"] = "completed"
    except Exception as e:
        if job_id in JOBS_DB:
            JOBS_DB[job_id]["status"] = "failed"
            JOBS_DB[job_id]["error"] = str(e)

@router.post("")
def create_split_job(payload: SplitJobRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    
    job_data = {
        "jobId": job_id,
        "filePath": payload.filePath,
        "fileName": payload.fileName,
        "mode": payload.mode,
        "modeValue": payload.modeValue,
        "outputFormat": payload.outputFormat,
        "status": "processing"
    }
    
    JOBS_DB[job_id] = job_data
    
    background_tasks.add_task(
        process_split_background,
        job_id=job_id,
        file_path=payload.filePath,
        mode=payload.mode,
        mode_value=payload.modeValue,
        output_format=payload.outputFormat
    )
        
    return {
        "jobId": job_id,
        "status": "processing",
        "message": "Job successfully started in background."
    }

@router.get("")
def list_jobs():
    return list(JOBS_DB.values())

@router.get("/{job_id}")
def get_job_status(job_id: str):
    if job_id not in JOBS_DB:
        raise HTTPException(status_code=404, detail="Job not found.")
    return JOBS_DB[job_id]

@router.get("/{job_id}/outputs")
def get_job_outputs(job_id: str):
    output_dir = os.path.abspath(os.path.join("temp_outputs", job_id))
    if not os.path.exists(output_dir):
        return {"jobId": job_id, "files": []}
        
    files = []
    for filename in sorted(os.listdir(output_dir)):
        if filename.endswith(".zip"):
            continue
        file_path = os.path.join(output_dir, filename)
        if os.path.isfile(file_path):
            files.append({
                "name": filename,
                "sizeBytes": os.path.getsize(file_path),
                "downloadUrl": f"/jobs/{job_id}/download/{filename}"
            })
            
    return {"jobId": job_id, "files": files}

@router.get("/{job_id}/download/{filename}")
def download_output_file(job_id: str, filename: str):
    file_path = os.path.abspath(os.path.join("temp_outputs", job_id, filename))
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found.")
    return FileResponse(file_path, filename=filename, media_type="application/octet-stream")

@router.get("/{job_id}/download-zip")
def download_all_as_zip(job_id: str):
    output_dir = os.path.abspath(os.path.join("temp_outputs", job_id))
    if not os.path.exists(output_dir):
        raise HTTPException(status_code=404, detail="Job output directory not found.")
    
    zip_filename = f"splitflow_{job_id[:8]}_all.zip"
    zip_path = os.path.join(output_dir, zip_filename)
    
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for filename in sorted(os.listdir(output_dir)):
            if filename == zip_filename:
                continue
            file_path = os.path.join(output_dir, filename)
            if os.path.isfile(file_path):
                zip_file.write(file_path, arcname=filename)
                
    return FileResponse(
        zip_path,
        filename=zip_filename,
        media_type="application/zip"
    )

@router.delete("/{job_id}")
def delete_single_job(job_id: str):
    """Deletes output files and cached metadata for a specific job."""
    output_dir = os.path.abspath(os.path.join("temp_outputs", job_id))
    deleted = False
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
        deleted = True
    if job_id in JOBS_DB:
        del JOBS_DB[job_id]
        deleted = True
    return {"status": "success", "jobId": job_id, "deleted": deleted}

@router.delete("/cleanup")
def manual_cleanup():
    deleted_counts = {"uploads_removed": 0, "outputs_removed": 0}
    upload_dir = os.path.abspath("temp_uploads")
    output_dir = os.path.abspath("temp_outputs")
    
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