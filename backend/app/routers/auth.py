from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db_session
from app.schemas.auth import AuthSessionResponse, AuthSignInRequest, AuthUserResponse
from app.services.auth_service import (
    authenticate_user,
    clear_auth_cookie,
    create_user_session,
    delete_user_session,
    ensure_default_user,
    get_user_for_session_token,
    set_auth_cookie,
    AuthenticationError,
)


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/sign-in", response_model=AuthSessionResponse)
def post_sign_in(
    payload: AuthSignInRequest,
    response: Response,
    session: Session = Depends(get_db_session),
) -> AuthSessionResponse:
    ensure_default_user(session)
    try:
        user = authenticate_user(session, payload.username, payload.password)
    except AuthenticationError as error:
        from fastapi import HTTPException, status

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(error)) from error
    token = create_user_session(session, user)
    set_auth_cookie(response, token)
    return AuthSessionResponse(user=AuthUserResponse.model_validate(user))


@router.post("/sign-out")
def post_sign_out(
    request: Request,
    response: Response,
    session: Session = Depends(get_db_session),
) -> dict[str, bool]:
    delete_user_session(session, request.cookies.get(settings.auth_cookie_name))
    clear_auth_cookie(response)
    return {"ok": True}


@router.get("/session", response_model=AuthSessionResponse)
def get_session(
    request: Request,
    session: Session = Depends(get_db_session),
) -> AuthSessionResponse:
    from fastapi import HTTPException, status

    ensure_default_user(session)
    user = get_user_for_session_token(session, request.cookies.get(settings.auth_cookie_name))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return AuthSessionResponse(user=AuthUserResponse.model_validate(user))
