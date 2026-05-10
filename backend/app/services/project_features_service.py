from uuid import uuid4

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.project_feature import ProjectFeature
from app.models.requirement import Requirement
from app.schemas.project_feature import ProjectFeatureCreate, ProjectFeatureUpdate
from app.services.projects_service import ensure_project_exists


class ProjectFeatureNotFoundError(Exception):
    pass


class ProjectFeatureConflictError(Exception):
    pass


def _generate_internal_feature_id() -> str:
    return f"feature_{uuid4().hex}"


def _ensure_platform_project(project: Project) -> None:
    if project.project_kind != "Platform":
        raise ProjectFeatureConflictError(
            f"Project '{project.id}' is not a platform project and cannot host feature hierarchy."
        )


def _validate_parent_feature(
    session: Session,
    project_id: str,
    parent_feature_id: str | None,
) -> str | None:
    if not parent_feature_id:
        return None
    feature = session.get(ProjectFeature, parent_feature_id)
    if feature is None or feature.project_id != project_id:
        raise ProjectFeatureConflictError(
            f"Parent feature '{parent_feature_id}' was not found in this project."
        )
    return parent_feature_id


def list_project_features(
    session: Session,
    project_id: str,
    owner_user_id: str | None = None,
) -> list[ProjectFeature]:
    project = ensure_project_exists(session, project_id, owner_user_id)
    _ensure_platform_project(project)
    statement = (
      select(ProjectFeature)
      .where(ProjectFeature.project_id == project_id)
      .order_by(ProjectFeature.order_index.asc(), ProjectFeature.created_at.asc())
    )
    return list(session.scalars(statement).all())


def get_project_feature(
    session: Session,
    feature_id: str,
    owner_user_id: str | None = None,
) -> ProjectFeature:
    feature = session.get(ProjectFeature, feature_id)
    if feature is None:
        raise ProjectFeatureNotFoundError(f"Project feature '{feature_id}' was not found.")
    project = ensure_project_exists(session, feature.project_id, owner_user_id)
    _ensure_platform_project(project)
    return feature


def create_project_feature(
    session: Session,
    payload: ProjectFeatureCreate,
    owner_user_id: str | None = None,
) -> ProjectFeature:
    project = ensure_project_exists(session, payload.project_id, owner_user_id)
    _ensure_platform_project(project)
    internal_feature_id = payload.id or _generate_internal_feature_id()
    while session.get(ProjectFeature, internal_feature_id) is not None:
        internal_feature_id = _generate_internal_feature_id()

    feature = ProjectFeature(
        id=internal_feature_id,
        project_id=payload.project_id,
        parent_feature_id=_validate_parent_feature(session, payload.project_id, payload.parent_feature_id),
        name=payload.name,
        kind=payload.kind,
        description=payload.description,
        order_index=payload.order_index,
    )
    session.add(feature)
    session.commit()
    return get_project_feature(session, feature.id, owner_user_id)


def update_project_feature(
    session: Session,
    feature_id: str,
    payload: ProjectFeatureUpdate,
    owner_user_id: str | None = None,
) -> ProjectFeature:
    feature = get_project_feature(session, feature_id, owner_user_id)
    project = ensure_project_exists(session, payload.project_id, owner_user_id)
    _ensure_platform_project(project)
    if feature.project_id != payload.project_id:
        raise ProjectFeatureConflictError(
            f"Project feature '{feature_id}' belongs to project '{feature.project_id}' and cannot be moved."
        )

    feature.parent_feature_id = _validate_parent_feature(session, payload.project_id, payload.parent_feature_id)
    feature.name = payload.name
    feature.kind = payload.kind
    feature.description = payload.description
    feature.order_index = payload.order_index
    session.add(feature)
    session.commit()
    return get_project_feature(session, feature_id, owner_user_id)


def delete_project_feature(
    session: Session,
    feature_id: str,
    owner_user_id: str | None = None,
) -> None:
    feature = get_project_feature(session, feature_id, owner_user_id)
    session.execute(
        update(Requirement).where(Requirement.feature_id == feature.id).values(feature_id=None)
    )
    session.execute(
        update(ProjectFeature)
        .where(ProjectFeature.parent_feature_id == feature.id)
        .values(parent_feature_id=None)
    )
    session.delete(feature)
    session.commit()
