from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.models.user import User
from app.schemas.feasibility import RequirementFeasibilityAssessment
from app.services.auth_service import require_current_user
from app.services.feasibility_service import assess_requirement_feasibility
from app.services.requirements_service import RequirementNotFoundError


router = APIRouter(prefix="/feasibility", tags=["feasibility"])


@router.get("/requirements/{requirement_id}", response_model=RequirementFeasibilityAssessment)
def get_requirement_feasibility(
    requirement_id: str,
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> RequirementFeasibilityAssessment:
    try:
        return assess_requirement_feasibility(session, requirement_id, current_user.id)
    except RequirementNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
