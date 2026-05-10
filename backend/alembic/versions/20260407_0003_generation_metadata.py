"""add generation metadata to requirements

Revision ID: 20260407_0003
Revises: 20260407_0002
Create Date: 2026-04-07 19:15:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260407_0003"
down_revision: Union[str, None] = "20260407_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    requirement_columns = {column["name"] for column in inspector.get_columns("requirements")}
    if "generation_metadata" not in requirement_columns:
        op.add_column("requirements", sa.Column("generation_metadata", sa.JSON(), nullable=True))

    generated_rows = bind.execute(
        sa.text(
            """
            SELECT id, parent_requirement_id, rationale
            FROM requirements
            WHERE generation_metadata IS NULL
              AND rationale IS NOT NULL
              AND rationale LIKE 'AI-generated draft content.%'
            """
        )
    ).mappings()

    update_statement = sa.text(
        """
        UPDATE requirements
        SET generation_metadata = :generation_metadata
        WHERE id = :requirement_id
        """
    ).bindparams(sa.bindparam("generation_metadata", type_=sa.JSON()))

    for row in generated_rows:
        metadata = {
            "generation_source": "ai",
            "generation_provider": "mock",
            "generated_from_requirement_id": row["parent_requirement_id"],
            "is_generated_draft": True,
        }
        bind.execute(
            update_statement,
            {
                "requirement_id": row["id"],
                "generation_metadata": metadata,
            },
        )


def downgrade() -> None:
    op.drop_column("requirements", "generation_metadata")
