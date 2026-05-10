from uuid import uuid4

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.requirement import Requirement
from app.models.requirement_section import RequirementSection
from app.schemas.requirement_section import (
    RequirementSectionCreate,
    RequirementSectionUpdate,
)
from app.services.projects_service import ensure_project_exists


class RequirementSectionNotFoundError(Exception):
    pass


class RequirementSectionConflictError(Exception):
    pass


def _generate_internal_section_id() -> str:
    return f"section_{uuid4().hex}"


def _validate_parent_section(
    session: Session,
    project_id: str,
    kind: str,
    parent_section_id: str | None,
) -> str | None:
    if kind == "Header":
        return None
    if not parent_section_id:
        raise RequirementSectionConflictError("Subheaders must be assigned to a parent header.")

    parent_section = session.get(RequirementSection, parent_section_id)
    if parent_section is None or parent_section.project_id != project_id:
        raise RequirementSectionConflictError(
            f"Parent section '{parent_section_id}' was not found in this project."
        )
    if parent_section.kind != "Header":
        raise RequirementSectionConflictError("Subheaders may only be nested under headers.")
    return parent_section_id


def list_requirement_sections(
    session: Session,
    project_id: str,
    owner_user_id: str | None = None,
) -> list[RequirementSection]:
    ensure_project_exists(session, project_id, owner_user_id)
    statement = (
        select(RequirementSection)
        .where(RequirementSection.project_id == project_id)
        .order_by(RequirementSection.order_index.asc(), RequirementSection.created_at.asc())
    )
    return list(session.scalars(statement).all())


def get_requirement_section(
    session: Session,
    section_id: str,
    owner_user_id: str | None = None,
) -> RequirementSection:
    section = session.get(RequirementSection, section_id)
    if section is None:
        raise RequirementSectionNotFoundError(f"Requirement section '{section_id}' was not found.")
    ensure_project_exists(session, section.project_id, owner_user_id)
    return section


def create_requirement_section(
    session: Session,
    payload: RequirementSectionCreate,
    owner_user_id: str | None = None,
) -> RequirementSection:
    ensure_project_exists(session, payload.project_id, owner_user_id)
    internal_section_id = payload.id or _generate_internal_section_id()
    while session.get(RequirementSection, internal_section_id) is not None:
        internal_section_id = _generate_internal_section_id()

    section = RequirementSection(
        id=internal_section_id,
        project_id=payload.project_id,
        parent_section_id=_validate_parent_section(
            session, payload.project_id, payload.kind, payload.parent_section_id
        ),
        title=payload.title,
        description=payload.description,
        kind=payload.kind,
        order_index=payload.order_index,
    )
    session.add(section)
    session.commit()
    return get_requirement_section(session, section.id, owner_user_id)


def update_requirement_section(
    session: Session,
    section_id: str,
    payload: RequirementSectionUpdate,
    owner_user_id: str | None = None,
) -> RequirementSection:
    section = get_requirement_section(session, section_id, owner_user_id)
    ensure_project_exists(session, payload.project_id, owner_user_id)
    if section.project_id != payload.project_id:
        raise RequirementSectionConflictError(
            f"Requirement section '{section_id}' belongs to project '{section.project_id}' and cannot be moved."
        )

    section.parent_section_id = _validate_parent_section(
        session, payload.project_id, payload.kind, payload.parent_section_id
    )
    section.title = payload.title
    section.description = payload.description
    section.kind = payload.kind
    section.order_index = payload.order_index
    session.add(section)
    session.commit()
    return get_requirement_section(session, section_id, owner_user_id)


def delete_requirement_section(
    session: Session,
    section_id: str,
    owner_user_id: str | None = None,
) -> None:
    section = get_requirement_section(session, section_id, owner_user_id)
    session.execute(
        update(Requirement).where(Requirement.section_id == section.id).values(section_id=None)
    )
    session.execute(
        update(RequirementSection)
        .where(RequirementSection.parent_section_id == section.id)
        .values(parent_section_id=None)
    )
    session.delete(section)
    session.commit()
