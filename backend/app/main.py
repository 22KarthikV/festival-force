from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import documents, training, progress, passport, dashboard, organizations

app = FastAPI(
    title="FestivalForce API",
    description="AI-powered onboarding & training platform for festival hospitality workers",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)
app.include_router(training.router)
app.include_router(progress.router)
app.include_router(passport.router)
app.include_router(dashboard.router)
app.include_router(organizations.router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "FestivalForce API"}


@app.get("/")
async def root():
    return {
        "service": "FestivalForce API",
        "docs": "/docs",
        "health": "/health",
    }
