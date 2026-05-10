"""separate internal requirement identity from visible requirement code

Revision ID: 20260410_0009
Revises: 20260409_0008
Create Date: 2026-04-10 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column


# revision identifiers, used by Alembic.
revision = "20260410_0009"
down_revision = "20260409_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("requirements", sa.Column("requirement_code", sa.String(length=64), nullable=True))
    op.execute("UPDATE requirements SET requirement_code = id WHERE requirement_code IS NULL")
    op.alter_column("requirements", "requirement_code", existing_type=sa.String(length=64), nullable=False)
    op.create_index("ix_requirements_requirement_code", "requirements", ["requirement_code"], unique=False)
    op.create_unique_constraint(
        "uq_requirements_project_requirement_code",
        "requirements",
        ["project_id", "requirement_code"],
    )
    connection = op.get_bind()
    requirements = connection.execute(
        sa.text("SELECT project_id, type, requirement_code FROM requirements")
    ).fetchall()
    next_values: dict[tuple[str, str], int] = {}
    for project_id, requirement_type, requirement_code in requirements:
        if not requirement_code or "-" not in requirement_code:
            continue
        prefix, _, suffix = requirement_code.partition("-")
        if not suffix.isdigit():
            continue
        next_values[(project_id, requirement_type)] = max(
            next_values.get((project_id, requirement_type), 1),
            int(suffix) + 1,
        )

    sequences = table(
        "project_requirement_sequences",
        column("project_id", sa.String()),
        column("requirement_type", sa.String()),
        column("next_value", sa.Integer()),
    )
    connection.execute(sa.text("DELETE FROM project_requirement_sequences"))
    for (project_id, requirement_type), next_value in next_values.items():
        connection.execute(
            sequences.insert().values(
                project_id=project_id,
                requirement_type=requirement_type,
                next_value=next_value,
            )
        )


def downgrade() -> None:
    op.drop_constraint("uq_requirements_project_requirement_code", "requirements", type_="unique")
    op.drop_index("ix_requirements_requirement_code", table_name="requirements")
    op.drop_column("requirements", "requirement_code")
