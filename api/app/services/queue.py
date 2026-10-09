import os
import json

QUEUE_FILE = "temp_queue.json"

def enqueue_job(job_data: dict):
    """Pushes a job dictionary onto the local file queue."""
    jobs = []
    if os.path.exists(QUEUE_FILE):
        try:
            with open(QUEUE_FILE, "r") as f:
                jobs = json.load(f)
        except Exception:
            jobs = []
            
    jobs.append(job_data)
    
    with open(QUEUE_FILE, "w") as f:
        json.dump(jobs, f, indent=2)