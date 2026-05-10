from fastapi import APIRouter

from app.schemas.health import HealthResponse


router = APIRouter(tags=["health"])


@router.get("/")
def root() -> dict[str, str]:
    return {
        "name": "Requirements Intelligence Platform API",
        "status": "ok",
        "health": "/health",
        "docs": "/docs",
    }


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="requirements-intelligence-platform")
