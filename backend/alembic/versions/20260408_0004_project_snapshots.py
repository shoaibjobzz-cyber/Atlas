"""Add project snapshots.

Revision ID: 20260408_0004
Revises: 20260407_0003
Create Date: 2026-04-08 11:30:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "20260408_0004"
down_revision: str | None = "20260407_0003"
branch_labels: Sequence[str] | None = None
depends_on: Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "project_snapshots",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("project_id", sa.String(length=255), nullable=False),
        sa.Column("snapshot_type", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_by", sa.String(length=128), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_project_snapshots_project_id"), "project_snapshots", ["project_id"], unique=False)
    op.create_index(
        op.f("ix_project_snapshots_snapshot_type"),
        "project_snapshots",
        ["snapshot_type"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_project_snapshots_snapshot_type"), table_name="project_snapshots")
    op.drop_index(op.f("ix_project_snapshots_project_id"), table_name="project_snapshots")
    op.drop_table("project_snapshots")
