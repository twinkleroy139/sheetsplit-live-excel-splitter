import os
import json
import sys
import time

# Ensure root directory is in python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from splitter.modes import split_by_pieces, split_by_rows, split_by_column

QUEUE_FILE = "temp_queue.json"
OUTPUT_DIR = "temp_outputs"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def run_worker():
    print("[*] SplitFlow Local Worker started. Listening for jobs from file queue...")
    while True:
        try:
            if not os.path.exists(QUEUE_FILE):
                time.sleep(2)
                continue
                
            with open(QUEUE_FILE, "r") as f:
                try:
                    jobs = json.load(f)
                except Exception:
                    jobs = []
                    
            if not jobs:
                time.sleep(2)
                continue
                
            job = jobs.pop(0)
            
            with open(QUEUE_FILE, "w") as f:
                json.dump(jobs, f, indent=2)
                
            job_id = job["jobId"]
            print(f"\n[x] Processing Job {job_id} ({job['fileName']})")
            
            input_path = job["filePath"]
            mode = job["mode"]
            mode_value = job["modeValue"]
            output_format = job["outputFormat"]
            remove_dup = job.get("removeDuplicates", False)
            
            job_output_dir = os.path.join(OUTPUT_DIR, job_id)
            os.makedirs(job_output_dir, exist_ok=True)
            
            if mode == "pieces":
                outputs = split_by_pieces(input_path, int(mode_value), job_output_dir, output_format, remove_dup)
            elif mode == "rows":
                outputs = split_by_rows(input_path, int(mode_value), job_output_dir, output_format, remove_dup)
            elif mode == "column":
                outputs = split_by_column(input_path, str(mode_value), job_output_dir, output_format, remove_dup)
            else:
                print(f"[!] Unknown split mode: {mode}")
                continue
                
            print(f"[✓] Job {job_id} completed successfully. Created {len(outputs)} pieces in '{job_output_dir}'")
            
        except Exception as e:
            print(f"[!] Error processing job: {str(e)}")
            time.sleep(2)

if __name__ == "__main__":
    run_worker()