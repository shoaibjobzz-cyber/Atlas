from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.requirement import Requirement


class RequirementHierarchyError(Exception):
    pass


def hierarchy_depth(hierarchy: str) -> int:
    return hierarchy.count(".")


def _top_level_hierarchy(requirement_id: str) -> str:
    return requirement_id


def _existing_child_hierarchies(session: Session, project_id: str, parent_requirement_id: str) -> list[str]:
    statement = select(Requirement.hierarchy).where(
        Requirement.project_id == project_id,
        Requirement.parent_requirement_id == parent_requirement_id,
    )
    return [hierarchy for hierarchy in session.scalars(statement).all() if hierarchy]


def _next_child_suffix(parent_hierarchy: str, existing_child_hierarchies: list[str]) -> int:
    next_suffix = 1
    prefix = f"{parent_hierarchy}."
    for hierarchy in existing_child_hierarchies:
        if not hierarchy.startswith(prefix):
            continue
        suffix = hierarchy.removeprefix(prefix)
        if "." in suffix:
            continue
        if suffix.isdigit():
            next_suffix = max(next_suffix, int(suffix) + 1)
    return next_suffix


def generate_requirement_hierarchy(
    session: Session,
    *,
    project_id: str,
    requirement_id: str,
    requirement_code: str,
    parent_requirement_id: str | None,
) -> str:
    if not parent_requirement_id:
        return _top_level_hierarchy(requirement_code)

    parent_requirement = session.get(Requirement, parent_requirement_id)
    if parent_requirement is None or parent_requirement.project_id != project_id:
        raise RequirementHierarchyError(
            f"Parent requirement '{parent_requirement_id}' was not found in project '{project_id}'."
        )

    parent_hierarchy = parent_requirement.hierarchy or parent_requirement.requirement_code
    next_suffix = _next_child_suffix(
        parent_hierarchy,
        _existing_child_hierarchies(session, project_id, parent_requirement_id),
    )
    return f"{parent_hierarchy}.{next_suffix}"


def preview_child_hierarchies(
    session: Session,
    *,
    project_id: str,
    parent_requirement_id: str,
    count: int,
) -> list[str]:
    if count <= 0:
        return []

    parent_requirement = session.get(Requirement, parent_requirement_id)
    if parent_requirement is None or parent_requirement.project_id != project_id:
        raise RequirementHierarchyError(
            f"Parent requirement '{parent_requirement_id}' was not found in project '{project_id}'."
        )

    parent_hierarchy = parent_requirement.hierarchy or parent_requirement.requirement_code
    next_suffix = _next_child_suffix(
        parent_hierarchy,
        _existing_child_hierarchies(session, project_id, parent_requirement_id),
    )
    return [f"{parent_hierarchy}.{index}" for index in range(next_suffix, next_suffix + count)]
