from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.project import Project
from app.models.project_feature import ProjectFeature
from app.models.requirement import Requirement
from app.models.requirement_section import RequirementSection
from app.schemas.requirement import RequirementCreate, RequirementGenerationMetadata, RequirementUpdate
from app.services.requirement_hierarchy_service import generate_requirement_hierarchy
from app.services.projects_service import ensure_project_exists
from app.services.requirement_id_service import allocate_requirement_id
from app.services.structured_requirement_service import parse_requirement_text


class RequirementNotFoundError(Exception):
    pass


class RequirementConflictError(Exception):
    pass


class RequirementDeletedError(Exception):
    pass


def _default_actor_user_id(project: Project, owner_user_id: str | None) -> str:
    return owner_user_id or project.owner_user_id


def _base_requirement_statement():
    return select(Requirement).options(
        selectinload(Requirement.created_by_user),
        selectinload(Requirement.updated_by_user),
        selectinload(Requirement.deleted_by_user),
    )


def _ensure_parsed_requirement(requirement: Requirement) -> Requirement:
    if not requirement.parsed_requirement:
        requirement.parsed_requirement = parse_requirement_text(requirement.title, requirement.text).model_dump()
    return requirement


def _infer_legacy_generation_metadata(requirement: Requirement) -> dict[str, str | bool | None]:
    if requirement.rationale and requirement.rationale.startswith("AI-generated draft content."):
        return RequirementGenerationMetadata(
            generation_source="ai",
            generation_provider="mock",
            generated_from_requirement_id=requirement.parent_requirement_id,
            is_generated_draft=True,
        ).model_dump()
    return RequirementGenerationMetadata(
        generation_source="manual",
        generation_provider=None,
        generated_from_requirement_id=None,
        is_generated_draft=False,
    ).model_dump()


def _ensure_generation_metadata(requirement: Requirement) -> Requirement:
    if not requirement.generation_metadata:
        requirement.generation_metadata = _infer_legacy_generation_metadata(requirement)
    return requirement


def _ensure_requirement_ready(requirement: Requirement) -> Requirement:
    return _ensure_generation_metadata(_ensure_parsed_requirement(requirement))


def _generate_internal_requirement_id() -> str:
    return f"req_{uuid4().hex}"


def _validate_section_assignment(session: Session, project_id: str, section_id: str | None) -> str | None:
    if not section_id:
        return None
    section = session.get(RequirementSection, section_id)
    if section is None or section.project_id != project_id:
        raise RequirementConflictError(f"Requirement section '{section_id}' was not found in this project.")
    return section_id


def _validate_feature_assignment(session: Session, project_id: str, feature_id: str | None) -> str | None:
    if not feature_id:
        return None
    feature = session.get(ProjectFeature, feature_id)
    if feature is None or feature.project_id != project_id:
        raise RequirementConflictError(f"Project feature '{feature_id}' was not found in this project.")
    return feature_id


def list_requirements(
    session: Session,
    project_id: str,
    owner_user_id: str | None = None,
    *,
    include_deleted: bool = False,
) -> list[Requirement]:
    ensure_project_exists(session, project_id, owner_user_id)
    statement = _base_requirement_statement().where(Requirement.project_id == project_id)
    if not include_deleted:
        statement = statement.where(Requirement.is_deleted.is_(False))
    statement = statement.order_by(Requirement.created_at.desc())
    requirements = list(session.scalars(statement).all())
    return [_ensure_requirement_ready(requirement) for requirement in requirements]


def get_requirement(session: Session, requirement_id: str, owner_user_id: str | None = None) -> Requirement:
    statement = _base_requirement_statement().where(Requirement.id == requirement_id)
    requirement = session.scalars(statement).first()
    if requirement is None:
        raise RequirementNotFoundError(f"Requirement '{requirement_id}' was not found.")
    ensure_project_exists(session, requirement.project_id, owner_user_id)
    return _ensure_requirement_ready(requirement)


def create_requirement(session: Session, payload: RequirementCreate, owner_user_id: str | None = None) -> Requirement:
    project = ensure_project_exists(session, payload.project_id, owner_user_id)
    internal_requirement_id = _generate_internal_requirement_id()
    while session.get(Requirement, internal_requirement_id) is not None:
        internal_requirement_id = _generate_internal_requirement_id()
    requirement_code = allocate_requirement_id(session, payload.project_id, payload.type)

    payload_data = payload.model_dump()
    payload_data["id"] = internal_requirement_id
    payload_data["requirement_code"] = requirement_code
    payload_data["hierarchy"] = generate_requirement_hierarchy(
        session,
        project_id=payload.project_id,
        requirement_id=internal_requirement_id,
        requirement_code=requirement_code,
        parent_requirement_id=payload.parent_requirement_id,
    )
    payload_data["parsed_requirement"] = parse_requirement_text(payload.title, payload.text).model_dump()
    payload_data["feature_id"] = _validate_feature_assignment(session, payload.project_id, payload.feature_id)
    payload_data["section_id"] = _validate_section_assignment(session, payload.project_id, payload.section_id)
    payload_data["created_by_user_id"] = _default_actor_user_id(project, owner_user_id)
    payload_data["updated_by_user_id"] = None
    payload_data["deleted_by_user_id"] = None
    payload_data["deleted_at"] = None
    payload_data["is_deleted"] = False
    if payload.generation_metadata is None:
        payload_data["generation_metadata"] = RequirementGenerationMetadata(
            generation_source="manual",
            generation_provider=None,
            generated_from_requirement_id=None,
            is_generated_draft=False,
        ).model_dump()
    else:
        payload_data["generation_metadata"] = payload.generation_metadata.model_dump()
    requirement = Requirement(**payload_data)
    session.add(requirement)
    session.commit()
    return get_requirement(session, requirement.id, owner_user_id)


def update_requirement(
    session: Session,
    requirement_id: str,
    payload: RequirementUpdate,
    owner_user_id: str | None = None,
) -> Requirement:
    requirement = get_requirement(session, requirement_id, owner_user_id)
    project = ensure_project_exists(session, payload.project_id, owner_user_id)
    if requirement.project_id != payload.project_id:
        raise RequirementConflictError(
            f"Requirement '{requirement_id}' belongs to project '{requirement.project_id}' and cannot be moved."
        )
    if requirement.is_deleted:
        raise RequirementDeletedError(f"Requirement '{requirement_id}' has been deleted and is read-only.")
    payload_data = payload.model_dump()
    payload_data["parsed_requirement"] = parse_requirement_text(payload.title, payload.text).model_dump()
    if "feature_id" in payload.model_fields_set:
        payload_data["feature_id"] = _validate_feature_assignment(session, payload.project_id, payload.feature_id)
    else:
        payload_data.pop("feature_id", None)
    if "section_id" in payload.model_fields_set:
        payload_data["section_id"] = _validate_section_assignment(session, payload.project_id, payload.section_id)
    else:
        payload_data.pop("section_id", None)
    payload_data["updated_by_user_id"] = _default_actor_user_id(project, owner_user_id)
    if payload.generation_metadata is None:
        payload_data["generation_metadata"] = requirement.generation_metadata or _infer_legacy_generation_metadata(
            requirement
        )
    else:
        payload_data["generation_metadata"] = payload.generation_metadata.model_dump()
    for field, value in payload_data.items():
        setattr(requirement, field, value)
    session.add(requirement)
    session.commit()
    return get_requirement(session, requirement_id, owner_user_id)


def delete_requirement(session: Session, requirement_id: str, owner_user_id: str | None = None) -> None:
    requirement = get_requirement(session, requirement_id, owner_user_id)
    if requirement.is_deleted:
        raise RequirementDeletedError(f"Requirement '{requirement_id}' has already been deleted.")
    project = ensure_project_exists(session, requirement.project_id, owner_user_id)
    actor_user_id = _default_actor_user_id(project, owner_user_id)
    requirement.is_deleted = True
    requirement.deleted_by_user_id = actor_user_id
    requirement.deleted_at = datetime.now(timezone.utc)
    requirement.updated_by_user_id = actor_user_id
    session.add(requirement)
    session.commit()
