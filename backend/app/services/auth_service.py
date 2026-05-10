from __future__ import annotations

import base64
import hashlib
import hmac
from datetime import datetime, timedelta, timezone
from secrets import token_hex, token_urlsafe

from fastapi import Depends, HTTPException, Request, Response, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db_session
from app.models.auth_session import AuthSession
from app.models.user import User


class AuthenticationError(Exception):
    pass


class AuthorizationError(Exception):
    pass


def _password_hash(password: str, *, salt: str | None = None) -> str:
    password_salt = salt or token_hex(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        password_salt.encode("utf-8"),
        150_000,
    )
    encoded = base64.b64encode(derived).decode("ascii")
    return f"pbkdf2_sha256$150000${password_salt}${encoded}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, iterations, salt, encoded = stored_hash.split("$", 3)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    derived = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        int(iterations),
    )
    return hmac.compare_digest(base64.b64encode(derived).decode("ascii"), encoded)


def ensure_default_user(session: Session) -> User:
    existing = session.scalars(select(User).where(User.username == settings.auth_default_username)).first()
    if existing is not None:
        return existing

    user = User(
        id="user-demo",
        username=settings.auth_default_username,
        display_name=settings.auth_default_display_name,
        password_hash=_password_hash(settings.auth_default_password),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def authenticate_user(session: Session, username: str, password: str) -> User:
    user = session.scalars(select(User).where(User.username == username.strip())).first()
    if user is None or not verify_password(password, user.password_hash):
        raise AuthenticationError("Invalid username or password.")
    return user


def _hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_user_session(session: Session, user: User) -> str:
    token = token_urlsafe(32)
    auth_session = AuthSession(
        id=f"sess-{token_hex(12)}",
        user_id=user.id,
        session_token_hash=_hash_session_token(token),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=settings.auth_session_hours),
    )
    session.add(auth_session)
    session.commit()
    return token


def _prune_expired_sessions(session: Session) -> None:
    session.execute(delete(AuthSession).where(AuthSession.expires_at < datetime.now(timezone.utc)))
    session.commit()


def get_user_for_session_token(session: Session, token: str | None) -> User | None:
    if not token:
        return None
    _prune_expired_sessions(session)
    statement = (
        select(AuthSession)
        .join(AuthSession.user)
        .where(AuthSession.session_token_hash == _hash_session_token(token))
    )
    auth_session = session.scalars(statement).first()
    if auth_session is None:
        return None
    return auth_session.user


def delete_user_session(session: Session, token: str | None) -> None:
    if not token:
        return
    session.execute(delete(AuthSession).where(AuthSession.session_token_hash == _hash_session_token(token)))
    session.commit()


def set_auth_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        samesite=settings.auth_cookie_samesite,
        secure=settings.auth_cookie_secure,
        max_age=settings.auth_session_hours * 3600,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(settings.auth_cookie_name, path="/")


def require_current_user(
    request: Request,
    session: Session = Depends(get_db_session),
) -> User:
    user = get_user_for_session_token(session, request.cookies.get(settings.auth_cookie_name))
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    return user
