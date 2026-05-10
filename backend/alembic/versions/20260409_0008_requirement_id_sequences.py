"""add project requirement sequences

Revision ID: 20260409_0008
Revises: 20260409_0007
Create Date: 2026-04-09 01:15:00
"""

from __future__ import annotations

import re

from alembic import op
import sqlalchemy as sa


revision = "20260409_0008"
down_revision = "20260409_0007"
branch_labels = None
depends_on = None


TYPE_PREFIX_MAP = {
    "Stakeholder": "SHR",
    "System": "SYS",
    "Subsystem": "SUB",
    "Software": "SWR",
    "Hardware": "HWR",
}


def _matching_sequence(requirement_id: str, prefix: str) -> int | None:
    match = re.fullmatch(rf"{re.escape(prefix)}-(\d+)", requirement_id)
    if match is None:
        return None
    return int(match.group(1))


def upgrade() -> None:
    op.create_table(
        "project_requirement_sequences",
        sa.Column("project_id", sa.String(length=64), nullable=False),
        sa.Column("requirement_type", sa.String(length=64), nullable=False),
        sa.Column("next_value", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("project_id", "requirement_type"),
    )

    bind = op.get_bind()
    metadata = sa.MetaData()
    requirements = sa.Table("requirements", metadata, autoload_with=bind)
    sequences = sa.Table("project_requirement_sequences", metadata, autoload_with=bind)

    rows = list(
        bind.execute(
            sa.select(
                requirements.c.project_id,
                requirements.c.type,
                requirements.c.id,
            )
        ).mappings()
    )

    next_values: dict[tuple[str, str], int] = {}
    for row in rows:
        prefix = TYPE_PREFIX_MAP.get(row["type"])
        if prefix is None:
            continue
        sequence = _matching_sequence(row["id"], prefix)
        if sequence is None:
            continue
        key = (row["project_id"], row["type"])
        next_values[key] = max(next_values.get(key, 0), sequence + 1)

    for (project_id, requirement_type), next_value in next_values.items():
        bind.execute(
            sequences.insert().values(
                project_id=project_id,
                requirement_type=requirement_type,
                next_value=next_value,
            )
        )


def downgrade() -> None:
    op.drop_table("project_requirement_sequences")
