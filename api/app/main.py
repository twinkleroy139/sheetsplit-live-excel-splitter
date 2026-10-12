import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from api.app.routes import upload, jobs

app = FastAPI(title="SplitFlow API", version="1.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(upload.router)
app.include_router(jobs.router)

# Health endpoint for uptime monitors
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "splitflow-api"}

# Locate the frontend directory relative to the project root
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # Resolves to project root (SheetSplit/)
FRONTEND_DIR = BASE_DIR / "frontend"

if FRONTEND_DIR.exists():
    # Mount css and js subdirectories
    app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")

    # Serve index.html at root
    @app.get("/", response_class=FileResponse)
    def serve_index():
        return FileResponse(FRONTEND_DIR / "index.html")

    # Serve dashboard.html at /dashboard
    @app.get("/dashboard", response_class=FileResponse)
    def serve_dashboard():
        return FileResponse(FRONTEND_DIR / "dashboard.html")