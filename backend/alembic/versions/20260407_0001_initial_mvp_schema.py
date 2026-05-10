"""initial mvp schema

Revision ID: 20260407_0001
Revises: None
Create Date: 2026-04-07 10:05:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260407_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    if "requirements" not in tables:
        op.create_table(
            "requirements",
            sa.Column("id", sa.String(length=64), nullable=False),
            sa.Column("project_id", sa.String(length=64), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("text", sa.Text(), nullable=False),
            sa.Column("type", sa.String(length=64), nullable=False),
            sa.Column("priority", sa.String(length=32), nullable=False),
            sa.Column("status", sa.String(length=32), nullable=False),
            sa.Column("parent_requirement_id", sa.String(length=64), nullable=True),
            sa.Column("subsystem", sa.String(length=128), nullable=True),
            sa.Column("verification_method", sa.String(length=64), nullable=True),
            sa.Column("rationale", sa.Text(), nullable=True),
            sa.Column("assumptions", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["parent_requirement_id"], ["requirements.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        tables.add("requirements")

    requirement_indexes = {index["name"] for index in inspector.get_indexes("requirements")}
    requirements_project_index = op.f("ix_requirements_project_id")
    if requirements_project_index not in requirement_indexes:
        op.create_index(requirements_project_index, "requirements", ["project_id"], unique=False)

    if "design_parameters" not in tables:
        op.create_table(
            "design_parameters",
            sa.Column("id", sa.String(length=64), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("subsystem", sa.String(length=128), nullable=True),
            sa.Column("parameter_name", sa.String(length=255), nullable=False),
            sa.Column("value", sa.String(length=128), nullable=False),
            sa.Column("unit", sa.String(length=64), nullable=True),
            sa.Column("source_document", sa.String(length=255), nullable=True),
            sa.Column("revision", sa.String(length=64), nullable=True),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.PrimaryKeyConstraint("id"),
        )
        tables.add("design_parameters")

    if "requirement_design_parameter_links" not in tables:
        op.create_table(
            "requirement_design_parameter_links",
            sa.Column("requirement_id", sa.String(length=64), nullable=False),
            sa.Column("design_parameter_id", sa.String(length=64), nullable=False),
            sa.ForeignKeyConstraint(["design_parameter_id"], ["design_parameters.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["requirement_id"], ["requirements.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("requirement_id", "design_parameter_id"),
        )


def downgrade() -> None:
    op.drop_table("requirement_design_parameter_links")
    op.drop_table("design_parameters")
    op.drop_index(op.f("ix_requirements_project_id"), table_name="requirements")
    op.drop_table("requirements")
