"""add project persistence and parsed requirement

Revision ID: 20260407_0002
Revises: 20260407_0001
Create Date: 2026-04-07 10:12:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "20260407_0002"
down_revision: Union[str, None] = "20260407_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = set(inspector.get_table_names())

    requirement_columns = {column["name"] for column in inspector.get_columns("requirements")}
    if "parsed_requirement" not in requirement_columns:
        op.add_column("requirements", sa.Column("parsed_requirement", sa.JSON(), nullable=True))

    design_parameter_columns = {column["name"] for column in inspector.get_columns("design_parameters")}
    if "project_id" not in design_parameter_columns:
        op.add_column("design_parameters", sa.Column("project_id", sa.String(length=64), nullable=True))

    design_parameter_indexes = {index["name"] for index in inspector.get_indexes("design_parameters")}
    design_parameter_project_index = op.f("ix_design_parameters_project_id")
    if design_parameter_project_index not in design_parameter_indexes:
        op.create_index(design_parameter_project_index, "design_parameters", ["project_id"], unique=False)

    if "projects" not in tables:
        op.create_table(
            "projects",
            sa.Column("id", sa.String(length=64), nullable=False),
            sa.Column("name", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("status", sa.String(length=32), server_default="Draft", nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )

    op.execute(
        """
        INSERT INTO projects (id, name, description, status)
        SELECT DISTINCT project_id,
               INITCAP(REPLACE(project_id, '-', ' ')),
               'Backfilled during project migration.',
               'Draft'
        FROM requirements
        WHERE project_id IS NOT NULL
          AND project_id NOT IN (SELECT id FROM projects)
        """
    )

    op.execute(
        """
        UPDATE design_parameters dp
        SET project_id = sub.project_id
        FROM (
            SELECT rdp.design_parameter_id AS design_parameter_id, MIN(r.project_id) AS project_id
            FROM requirement_design_parameter_links rdp
            JOIN requirements r ON r.id = rdp.requirement_id
            GROUP BY rdp.design_parameter_id
        ) AS sub
        WHERE dp.id = sub.design_parameter_id
          AND dp.project_id IS NULL
        """
    )

    op.execute(
        """
        INSERT INTO projects (id, name, description, status)
        SELECT DISTINCT project_id,
               INITCAP(REPLACE(project_id, '-', ' ')),
               'Backfilled from design parameter records.',
               'Draft'
        FROM design_parameters
        WHERE project_id IS NOT NULL
          AND project_id NOT IN (SELECT id FROM projects)
        """
    )

    op.execute(
        """
        UPDATE design_parameters
        SET project_id = 'legacy-project'
        WHERE project_id IS NULL
        """
    )

    op.execute(
        """
        INSERT INTO projects (id, name, description, status)
        SELECT 'legacy-project', 'Legacy Project', 'Fallback project for historical design parameter rows.', 'Draft'
        WHERE NOT EXISTS (SELECT 1 FROM projects WHERE id = 'legacy-project')
        """
    )

    design_parameter_columns = {column["name"] for column in inspector.get_columns("design_parameters")}
    if "project_id" in design_parameter_columns:
        op.alter_column("design_parameters", "project_id", nullable=False)

    requirement_foreign_keys = {foreign_key["name"] for foreign_key in inspector.get_foreign_keys("requirements")}
    if "fk_requirements_project_id_projects" not in requirement_foreign_keys:
        op.create_foreign_key(
            "fk_requirements_project_id_projects",
            "requirements",
            "projects",
            ["project_id"],
            ["id"],
        )

    design_parameter_foreign_keys = {
        foreign_key["name"] for foreign_key in inspector.get_foreign_keys("design_parameters")
    }
    if "fk_design_parameters_project_id_projects" not in design_parameter_foreign_keys:
        op.create_foreign_key(
            "fk_design_parameters_project_id_projects",
            "design_parameters",
            "projects",
            ["project_id"],
            ["id"],
        )


def downgrade() -> None:
    op.drop_constraint("fk_design_parameters_project_id_projects", "design_parameters", type_="foreignkey")
    op.drop_constraint("fk_requirements_project_id_projects", "requirements", type_="foreignkey")
    op.drop_table("projects")
    op.drop_index(op.f("ix_design_parameters_project_id"), table_name="design_parameters")
    op.drop_column("design_parameters", "project_id")
    op.drop_column("requirements", "parsed_requirement")
