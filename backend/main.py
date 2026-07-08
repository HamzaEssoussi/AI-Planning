from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import wizard, estimation, export, documents, planning
from core.database import Base, engine
import models.domain

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Planning API",
    description="API pour le simulateur de planification de projet",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(wizard.router, prefix="/api/wizard", tags=["Wizard"])
app.include_router(estimation.router, prefix="/api/estimation", tags=["Estimation"])
app.include_router(export.router, prefix="/api/export", tags=["Export"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(planning.router, prefix="/api/planning", tags=["Planning"])

@app.get("/")
async def root():
    return {"status": "ok", "service": "AI Planning", "version": "2.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "AIPlanning"}
