"""add requirement ownership and soft delete

Revision ID: 20260409_0007
Revises: 20260409_0006
Create Date: 2026-04-09 00:30:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260409_0007"
down_revision = "20260409_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("requirements", sa.Column("created_by_user_id", sa.String(length=64), nullable=True))
    op.add_column("requirements", sa.Column("updated_by_user_id", sa.String(length=64), nullable=True))
    op.add_column("requirements", sa.Column("deleted_by_user_id", sa.String(length=64), nullable=True))
    op.add_column("requirements", sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column(
        "requirements",
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default=sa.false()),
    )

    op.create_index(op.f("ix_requirements_created_by_user_id"), "requirements", ["created_by_user_id"], unique=False)
    op.create_index(op.f("ix_requirements_updated_by_user_id"), "requirements", ["updated_by_user_id"], unique=False)
    op.create_index(op.f("ix_requirements_deleted_by_user_id"), "requirements", ["deleted_by_user_id"], unique=False)

    op.create_foreign_key(None, "requirements", "users", ["created_by_user_id"], ["id"])
    op.create_foreign_key(None, "requirements", "users", ["updated_by_user_id"], ["id"])
    op.create_foreign_key(None, "requirements", "users", ["deleted_by_user_id"], ["id"])

    bind = op.get_bind()
    metadata = sa.MetaData()
    projects = sa.Table("projects", metadata, autoload_with=bind)
    requirements = sa.Table("requirements", metadata, autoload_with=bind)

    rows = list(
        bind.execute(
            sa.select(requirements.c.id, requirements.c.project_id, projects.c.owner_user_id).select_from(
                requirements.join(projects, requirements.c.project_id == projects.c.id)
            )
        ).mappings()
    )
    for row in rows:
        bind.execute(
            requirements.update()
            .where(requirements.c.id == row["id"])
            .values(created_by_user_id=row["owner_user_id"], is_deleted=False)
        )

    op.alter_column("requirements", "created_by_user_id", nullable=False)


def downgrade() -> None:
    op.drop_constraint(op.f("requirements_deleted_by_user_id_fkey"), "requirements", type_="foreignkey")
    op.drop_constraint(op.f("requirements_updated_by_user_id_fkey"), "requirements", type_="foreignkey")
    op.drop_constraint(op.f("requirements_created_by_user_id_fkey"), "requirements", type_="foreignkey")
    op.drop_index(op.f("ix_requirements_deleted_by_user_id"), table_name="requirements")
    op.drop_index(op.f("ix_requirements_updated_by_user_id"), table_name="requirements")
    op.drop_index(op.f("ix_requirements_created_by_user_id"), table_name="requirements")
    op.drop_column("requirements", "is_deleted")
    op.drop_column("requirements", "deleted_at")
    op.drop_column("requirements", "deleted_by_user_id")
    op.drop_column("requirements", "updated_by_user_id")
    op.drop_column("requirements", "created_by_user_id")
