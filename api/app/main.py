from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.app.routes import upload, jobs

app = FastAPI(title="SplitFlow API", version="1.0.0")

# Configure CORS so browser requests from localhost / 127.0.0.1 or custom domains are allowed
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,  # Set to False when using wildcard "*" to adhere to Fetch/CORS specs
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(jobs.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "SplitFlow API",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "splitflow-api"}