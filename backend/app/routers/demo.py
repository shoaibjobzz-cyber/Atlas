from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.db import get_db_session
from app.models.user import User
from app.schemas.demo import DemoProjectLoadResponse
from app.services.auth_service import require_current_user
from app.services.demo_service import load_brake_control_platform_demo, load_braking_system_demo


router = APIRouter(prefix="/demo", tags=["demo"])


@router.post("/load-braking-project", response_model=DemoProjectLoadResponse)
def post_load_braking_project(
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> DemoProjectLoadResponse:
    return load_braking_system_demo(session, current_user.id)


@router.post("/load-brake-platform-project", response_model=DemoProjectLoadResponse)
def post_load_brake_platform_project(
    session: Session = Depends(get_db_session),
    current_user: User = Depends(require_current_user),
) -> DemoProjectLoadResponse:
    return load_brake_control_platform_demo(session, current_user.id)
