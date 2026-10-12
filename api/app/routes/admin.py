import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import Optional
from api.app.services.auth import require_admin
from api.app.routes.jobs import JOBS_DB

router = APIRouter(prefix="/admin", tags=["Admin"])

# In-memory storage for global announcement and blocked entities
ANNOUNCEMENT_STATE = {
    "active": False,
    "message": "",
    "type": "info"  # "info", "warning", "discount"
}

BLOCKED_USERS = set()

class AnnouncementRequest(BaseModel):
    active: bool
    message: str
    type: Optional[str] = "info"

class BlockUserRequest(BaseModel):
    uid: str
    blocked: bool

@router.get("/metrics")
def get_system_metrics(admin: dict = Depends(require_admin)):
    upload_dir = os.path.abspath("temp_uploads")
    output_dir = os.path.abspath("temp_outputs")

    def get_dir_size(path):
        total = 0
        if os.path.exists(path):
            for dirpath, _, filenames in os.walk(path):
                for f in filenames:
                    fp = os.path.join(dirpath, f)
                    if os.path.exists(fp):
                        total += os.path.getsize(fp)
        return round(total / (1024 * 1024), 2)

    total_jobs = len(JOBS_DB)
    completed_jobs = sum(1 for j in JOBS_DB.values() if j.get("status") == "completed")
    failed_jobs = sum(1 for j in JOBS_DB.values() if j.get("status") == "failed")

    return {
        "status": "success",
        "adminEmail": admin.get("email"),
        "totalJobs": total_jobs,
        "completedJobs": completed_jobs,
        "failedJobs": failed_jobs,
        "uploadStorageMb": get_dir_size(upload_dir),
        "outputStorageMb": get_dir_size(output_dir),
        "recentJobs": list(JOBS_DB.values())[-50:]
    }

@router.post("/cleanup")
def force_storage_cleanup(admin: dict = Depends(require_admin)):
    upload_dir = os.path.abspath("temp_uploads")
    output_dir = os.path.abspath("temp_outputs")
    deleted = {"uploads_removed": 0, "outputs_removed": 0}

    if os.path.exists(upload_dir):
        for f in os.listdir(upload_dir):
            fp = os.path.join(upload_dir, f)
            if os.path.isfile(fp):
                os.remove(fp)
                deleted["uploads_removed"] += 1

    if os.path.exists(output_dir):
        for item in os.listdir(output_dir):
            ip = os.path.join(output_dir, item)
            if os.path.isdir(ip):
                shutil.rmtree(ip)
                deleted["outputs_removed"] += 1

    return {"status": "success", "deleted": deleted}

@router.get("/announcement")
def get_announcement():
    """Public endpoint for users to read active announcements."""
    return ANNOUNCEMENT_STATE

@router.post("/announcement")
def update_announcement(payload: AnnouncementRequest, admin: dict = Depends(require_admin)):
    global ANNOUNCEMENT_STATE
    ANNOUNCEMENT_STATE["active"] = payload.active
    ANNOUNCEMENT_STATE["message"] = payload.message.strip()
    ANNOUNCEMENT_STATE["type"] = payload.type or "info"
    return {"status": "success", "announcement": ANNOUNCEMENT_STATE}

@router.post("/block-user")
def toggle_user_block(payload: BlockUserRequest, admin: dict = Depends(require_admin)):
    if payload.blocked:
        BLOCKED_USERS.add(payload.uid)
    else:
        BLOCKED_USERS.discard(payload.uid)
    return {"status": "success", "uid": payload.uid, "blocked": payload.blocked}