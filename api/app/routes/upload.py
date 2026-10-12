from fastapi import APIRouter, UploadFile, File, HTTPException, status
import os
import shutil
import uuid
from api.app.splitter.reader import read_file_preview
from api.app.config import PLAN_LIMITS

router = APIRouter(prefix="/upload", tags=["Upload"])

UPLOAD_DIR = os.path.abspath("temp_uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/init")
async def upload_init(file: UploadFile = File(...), plan: str = "guest"):
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.csv', '.xlsx', '.xls']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only .csv, .xlsx, and .xls are supported."
        )
    
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        max_size = PLAN_LIMITS.get(plan, PLAN_LIMITS["guest"])["max_file_size_mb"]
        
        if file_size_mb > max_size:
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size exceeds plan limit of {max_size} MB."
            )
            
        preview_data = read_file_preview(file_path, nrows=20)
        
        return {
            "fileId": file_id,
            "fileName": file.filename,
            "filePath": file_path,
            "fileSizeMb": round(file_size_mb, 2),
            **preview_data
        }
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error reading file preview: {str(e)}"
        )