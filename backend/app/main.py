from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, scenarios

app = FastAPI(
    title="Tax Treaty Analyzer API",
    version="0.1.0",
    openapi_url="/api/openapi.json",
    docs_url="/api/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(scenarios.router, prefix="/api/scenarios", tags=["scenarios"])


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}

