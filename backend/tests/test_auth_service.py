from app.services.auth_service import (
    authenticate_user,
    create_user_session,
    delete_user_session,
    ensure_default_user,
    get_user_for_session_token,
    verify_password,
)
from app.services.projects_service import create_project, list_projects
from app.schemas.project import ProjectCreate
from tests.conftest import create_user


def test_default_user_is_seeded_and_password_is_valid(session):
    user = ensure_default_user(session)

    assert user.username == "demo"
    assert verify_password("demo1234", user.password_hash)
    assert authenticate_user(session, "demo", "demo1234").id == user.id


def test_session_token_resolves_and_can_be_deleted(session):
    user = create_user(session, user_id="user-auth", username="auth-user", password_hash=ensure_default_user(session).password_hash)

    token = create_user_session(session, user)

    assert get_user_for_session_token(session, token).id == user.id

    delete_user_session(session, token)

    assert get_user_for_session_token(session, token) is None


def test_project_listing_is_owner_scoped(session):
    create_user(session, user_id="user-a", username="alice")
    create_user(session, user_id="user-b", username="bob")

    create_project(session, ProjectCreate(name="Alice Project"), "user-a")
    create_project(session, ProjectCreate(name="Bob Project"), "user-b")

    alice_projects = list_projects(session, "user-a")
    bob_projects = list_projects(session, "user-b")

    assert len(alice_projects) == 1
    assert len(bob_projects) == 1
    assert alice_projects[0].owner_user_id == "user-a"
    assert bob_projects[0].owner_user_id == "user-b"
