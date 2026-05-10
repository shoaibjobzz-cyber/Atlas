"""add requirement hierarchy

Revision ID: 20260409_0006
Revises: 20260408_0005
Create Date: 2026-04-09 00:00:00
"""

from __future__ import annotations

from collections import defaultdict

from alembic import op
import sqlalchemy as sa


revision = "20260409_0006"
down_revision = "20260408_0005"
branch_labels = None
depends_on = None


requirements_table = sa.table(
    "requirements",
    sa.column("id", sa.String(length=64)),
    sa.column("project_id", sa.String(length=64)),
    sa.column("parent_requirement_id", sa.String(length=64)),
    sa.column("hierarchy", sa.String(length=128)),
    sa.column("created_at", sa.DateTime(timezone=True)),
)


def upgrade() -> None:
    op.add_column("requirements", sa.Column("hierarchy", sa.String(length=128), nullable=True))
    op.create_index(op.f("ix_requirements_hierarchy"), "requirements", ["hierarchy"], unique=False)

    bind = op.get_bind()
    metadata = sa.MetaData()
    requirements = sa.Table("requirements", metadata, autoload_with=bind)

    rows = list(
        bind.execute(
            sa.select(
                requirements.c.id,
                requirements.c.project_id,
                requirements.c.parent_requirement_id,
                requirements.c.created_at,
            ).order_by(requirements.c.project_id, requirements.c.created_at, requirements.c.id)
        ).mappings()
    )

    rows_by_id = {row["id"]: row for row in rows}
    children_by_parent: dict[str, list[dict]] = defaultdict(list)
    top_level_by_project: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        parent_requirement_id = row["parent_requirement_id"]
        if parent_requirement_id:
            children_by_parent[parent_requirement_id].append(row)
        else:
            top_level_by_project[row["project_id"]].append(row)

    assigned_hierarchies: dict[str, str] = {}

    def assign_descendants(parent_row: dict, parent_hierarchy: str) -> None:
        children = children_by_parent.get(parent_row["id"], [])
        for index, child_row in enumerate(children, start=1):
            child_hierarchy = f"{parent_hierarchy}.{index}"
            assigned_hierarchies[child_row["id"]] = child_hierarchy
            assign_descendants(child_row, child_hierarchy)

    for project_rows in top_level_by_project.values():
        for row in project_rows:
            hierarchy = row["id"]
            assigned_hierarchies[row["id"]] = hierarchy
            assign_descendants(row, hierarchy)

    unresolved_children = [
        row for row in rows if row["parent_requirement_id"] and row["id"] not in assigned_hierarchies
    ]
    for row in unresolved_children:
        parent_row = rows_by_id.get(row["parent_requirement_id"])
        if parent_row is None:
            assigned_hierarchies[row["id"]] = row["id"]
            continue
        parent_hierarchy = assigned_hierarchies.get(parent_row["id"], parent_row["id"])
        sibling_rows = children_by_parent.get(parent_row["id"], [])
        sibling_index = next(
            (index for index, sibling_row in enumerate(sibling_rows, start=1) if sibling_row["id"] == row["id"]),
            1,
        )
        assigned_hierarchies[row["id"]] = f"{parent_hierarchy}.{sibling_index}"

    for requirement_id, hierarchy in assigned_hierarchies.items():
        bind.execute(
            requirements.update().where(requirements.c.id == requirement_id).values(hierarchy=hierarchy)
        )

    op.create_unique_constraint(
        "uq_requirements_project_hierarchy",
        "requirements",
        ["project_id", "hierarchy"],
    )


def downgrade() -> None:
    op.drop_constraint("uq_requirements_project_hierarchy", "requirements", type_="unique")
    op.drop_index(op.f("ix_requirements_hierarchy"), table_name="requirements")
    op.drop_column("requirements", "hierarchy")
