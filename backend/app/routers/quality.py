from fastapi import APIRouter

from app.schemas.quality import RequirementQualityCheckRequest, RequirementQualitySummary
from app.services.quality_service import evaluate_requirement_quality


router = APIRouter(prefix="/quality", tags=["quality"])


@router.post("/requirement-check", response_model=RequirementQualitySummary)
def post_requirement_quality_check(payload: RequirementQualityCheckRequest) -> RequirementQualitySummary:
    return evaluate_requirement_quality(payload)
