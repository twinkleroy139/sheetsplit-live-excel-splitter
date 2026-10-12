import os
from fastapi import APIRouter, Depends, HTTPException
from api.app.services.auth import require_admin
from api.app.routes.jobs import JOBS_DB

router = APIRouter(prefix="/admin", tags=["Admin"])

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
        "recentJobs": list(JOBS_DB.values())[-20:]
    }