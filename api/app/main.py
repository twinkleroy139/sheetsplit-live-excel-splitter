import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from api.app.routes import upload, jobs, admin

app = FastAPI(title="SheetSplit API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(jobs.router)
app.include_router(admin.router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "splitflow-api"}

@app.get("/api/config")
def get_firebase_config():
    """Serves Firebase client configuration dynamically from environment variables."""
    return {
        "apiKey": os.getenv("FIREBASE_API_KEY", ""),
        "authDomain": os.getenv("FIREBASE_AUTH_DOMAIN", ""),
        "projectId": os.getenv("FIREBASE_PROJECT_ID", ""),
        "storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", ""),
        "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID", ""),
        "appId": os.getenv("FIREBASE_APP_ID", "")
    }

BASE_DIR = Path(__file__).resolve().parent.parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

if FRONTEND_DIR.exists():
    app.mount("/css", StaticFiles(directory=str(FRONTEND_DIR / "css")), name="css")
    app.mount("/js", StaticFiles(directory=str(FRONTEND_DIR / "js")), name="js")

    @app.get("/", response_class=FileResponse)
    @app.get("/index.html", response_class=FileResponse)
    def serve_index():
        return FileResponse(FRONTEND_DIR / "index.html")

    @app.get("/dashboard", response_class=FileResponse)
    @app.get("/dashboard.html", response_class=FileResponse)
    def serve_dashboard():
        return FileResponse(FRONTEND_DIR / "dashboard.html")

    @app.get("/workspace", response_class=FileResponse)
    @app.get("/workspace.html", response_class=FileResponse)
    def serve_workspace():
        return FileResponse(FRONTEND_DIR / "workspace.html")

    @app.get("/share/{token}", response_class=FileResponse)
    @app.get("/share.html", response_class=FileResponse)
    def serve_share(token: str = None):
        return FileResponse(FRONTEND_DIR / "share.html")

    @app.get("/admin", response_class=FileResponse)
    @app.get("/admin.html", response_class=FileResponse)
    def serve_admin():
        return FileResponse(FRONTEND_DIR / "admin.html")