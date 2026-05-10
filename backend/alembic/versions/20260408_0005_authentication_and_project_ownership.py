"""Add authentication and project ownership.

Revision ID: 20260408_0005
Revises: 20260408_0004
Create Date: 2026-04-08 21:20:00
"""

from collections.abc import Sequence
import base64
import hashlib

import sqlalchemy as sa
from alembic import op


revision: str = "20260408_0005"
down_revision: str | None = "20260408_0004"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def _password_hash(password: str) -> str:
    salt = "local-demo-auth"
    iterations = 150_000
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    encoded = base64.b64encode(derived).decode("ascii")
    return f"pbkdf2_sha256${iterations}${salt}${encoded}"


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("username", sa.String(length=64), nullable=False),
        sa.Column("display_name", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "auth_sessions",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.String(length=64), nullable=False),
        sa.Column("session_token_hash", sa.String(length=128), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_auth_sessions_session_token_hash"), "auth_sessions", ["session_token_hash"], unique=True)
    op.create_index(op.f("ix_auth_sessions_user_id"), "auth_sessions", ["user_id"], unique=False)

    op.add_column("projects", sa.Column("owner_user_id", sa.String(length=64), nullable=True))
    op.create_index(op.f("ix_projects_owner_user_id"), "projects", ["owner_user_id"], unique=False)
    op.create_foreign_key(None, "projects", "users", ["owner_user_id"], ["id"], ondelete="CASCADE")

    demo_user_table = sa.table(
        "users",
        sa.column("id", sa.String),
        sa.column("username", sa.String),
        sa.column("display_name", sa.String),
        sa.column("password_hash", sa.String),
    )
    op.bulk_insert(
        demo_user_table,
        [
            {
                "id": "user-demo",
                "username": "demo",
                "display_name": "Demo Engineer",
                "password_hash": _password_hash("demo1234"),
            }
        ],
    )

    op.execute("UPDATE projects SET owner_user_id = 'user-demo' WHERE owner_user_id IS NULL")
    op.alter_column("projects", "owner_user_id", existing_type=sa.String(length=64), nullable=False)


def downgrade() -> None:
    op.drop_constraint(op.f("projects_owner_user_id_fkey"), "projects", type_="foreignkey")
    op.drop_index(op.f("ix_projects_owner_user_id"), table_name="projects")
    op.drop_column("projects", "owner_user_id")
    op.drop_index(op.f("ix_auth_sessions_user_id"), table_name="auth_sessions")
    op.drop_index(op.f("ix_auth_sessions_session_token_hash"), table_name="auth_sessions")
    op.drop_table("auth_sessions")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_table("users")
