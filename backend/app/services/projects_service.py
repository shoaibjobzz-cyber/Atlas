import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.design_parameter import DesignParameter
from app.models.project import Project
from app.models.project_feature import ProjectFeature
from app.models.project_requirement_sequence import ProjectRequirementSequence
from app.models.requirement import Requirement
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectNotFoundError(Exception):
    pass


class ProjectConflictError(Exception):
    pass


def _project_for_owner(project: Project | None, project_id: str, owner_user_id: str | None) -> Project:
    if project is None or (owner_user_id is not None and project.owner_user_id != owner_user_id):
        raise ProjectNotFoundError(f"Project '{project_id}' was not found.")
    return project


def _slugify_project_id(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.strip().lower()).strip("-")
    return normalized[:64] or "project"


def ensure_project_exists(session: Session, project_id: str, owner_user_id: str | None = None) -> Project:
    return _project_for_owner(session.get(Project, project_id), project_id, owner_user_id)


def list_projects(session: Session, owner_user_id: str) -> list[Project]:
    statement = (
        select(Project)
        .where(Project.owner_user_id == owner_user_id)
        .order_by(Project.updated_at.desc(), Project.name.asc())
    )
    return list(session.scalars(statement).all())


def get_project(session: Session, project_id: str, owner_user_id: str) -> Project:
    return ensure_project_exists(session, project_id, owner_user_id)


def create_project(session: Session, payload: ProjectCreate, owner_user_id: str) -> Project:
    if payload.id:
        existing = session.get(Project, payload.id)
        if existing is not None:
            raise ProjectConflictError(f"Project '{payload.id}' already exists.")
        project_id = payload.id
    else:
        base_id = _slugify_project_id(payload.name)
        project_id = base_id
        suffix = 2
        while session.get(Project, project_id) is not None:
            project_id = f"{base_id[:59]}-{suffix}"[:64]
            suffix += 1

    project = Project(
        id=project_id,
        owner_user_id=owner_user_id,
        name=payload.name,
        description=payload.description,
        status=payload.status,
        project_kind=payload.project_kind,
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


def update_project(session: Session, project_id: str, payload: ProjectUpdate, owner_user_id: str) -> Project:
    project = get_project(session, project_id, owner_user_id)
    payload_data = payload.model_dump()
    for field, value in payload_data.items():
        setattr(project, field, value)
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


def delete_project(session: Session, project_id: str, owner_user_id: str) -> None:
    project = get_project(session, project_id, owner_user_id)

    design_parameters = list(
        session.scalars(select(DesignParameter).where(DesignParameter.project_id == project_id)).all()
    )
    for design_parameter in design_parameters:
        session.delete(design_parameter)

    requirements = list(
        session.scalars(select(Requirement).where(Requirement.project_id == project_id)).all()
    )
    for requirement in requirements:
        session.delete(requirement)

    sequences = list(
        session.scalars(
            select(ProjectRequirementSequence).where(ProjectRequirementSequence.project_id == project_id)
        ).all()
    )
    for sequence in sequences:
        session.delete(sequence)

    features = list(
        session.scalars(select(ProjectFeature).where(ProjectFeature.project_id == project_id)).all()
    )
    for feature in features:
        session.delete(feature)

    session.delete(project)
    session.commit()
