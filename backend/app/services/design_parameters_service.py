from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.design_parameter import DesignParameter
from app.models.requirement import Requirement
from app.schemas.design_parameter import DesignParameterCreate, DesignParameterUpdate
from app.services.projects_service import ensure_project_exists


class DesignParameterNotFoundError(Exception):
    pass


class DesignParameterConflictError(Exception):
    pass


class DesignParameterLinkError(Exception):
    pass


def _load_requirements(session: Session, project_id: str, requirement_ids: list[str]) -> list[Requirement]:
    if not requirement_ids:
        return []

    statement = select(Requirement).where(Requirement.id.in_(requirement_ids)).where(Requirement.is_deleted.is_(False))
    requirements = list(session.scalars(statement).all())
    found_ids = {requirement.id for requirement in requirements}
    missing_ids = [requirement_id for requirement_id in requirement_ids if requirement_id not in found_ids]
    if missing_ids:
        raise DesignParameterLinkError(
            f"Linked requirements not found: {', '.join(missing_ids)}."
        )
    cross_project_ids = [requirement.id for requirement in requirements if requirement.project_id != project_id]
    if cross_project_ids:
        raise DesignParameterLinkError(
            f"Linked requirements must belong to project '{project_id}': {', '.join(cross_project_ids)}."
        )
    return requirements


def list_design_parameters(
    session: Session,
    project_id: str,
    subsystem: str | None = None,
    owner_user_id: str | None = None,
) -> list[DesignParameter]:
    ensure_project_exists(session, project_id, owner_user_id)
    statement = select(DesignParameter).options(selectinload(DesignParameter.linked_requirements)).order_by(
        DesignParameter.name.asc()
    )
    statement = statement.where(DesignParameter.project_id == project_id)
    if subsystem:
        statement = statement.where(DesignParameter.subsystem == subsystem)
    return list(session.scalars(statement).all())


def get_design_parameter(
    session: Session,
    design_parameter_id: str,
    owner_user_id: str | None = None,
) -> DesignParameter:
    statement = (
        select(DesignParameter)
        .options(selectinload(DesignParameter.linked_requirements))
        .where(DesignParameter.id == design_parameter_id)
    )
    design_parameter = session.scalars(statement).first()
    if design_parameter is None:
        raise DesignParameterNotFoundError(f"Design parameter '{design_parameter_id}' was not found.")
    ensure_project_exists(session, design_parameter.project_id, owner_user_id)
    return design_parameter


def create_design_parameter(
    session: Session,
    payload: DesignParameterCreate,
    owner_user_id: str | None = None,
) -> DesignParameter:
    ensure_project_exists(session, payload.project_id, owner_user_id)
    existing = session.get(DesignParameter, payload.id)
    if existing is not None:
        if not existing.project_id:
            linked_requirements = _load_requirements(session, payload.project_id, payload.requirement_ids)
            payload_data = payload.model_dump(exclude={"requirement_ids"})
            for field, value in payload_data.items():
                setattr(existing, field, value)
            existing.linked_requirements = linked_requirements
            session.add(existing)
            session.commit()
            return get_design_parameter(session, existing.id)

        if existing.project_id != payload.project_id:
            raise DesignParameterConflictError(
                f"Design parameter '{payload.id}' already exists in project '{existing.project_id}'."
            )

        raise DesignParameterConflictError(
            f"Design parameter '{payload.id}' already exists in this project."
        )

    linked_requirements = _load_requirements(session, payload.project_id, payload.requirement_ids)
    payload_data = payload.model_dump(exclude={"requirement_ids"})
    design_parameter = DesignParameter(**payload_data)
    design_parameter.linked_requirements = linked_requirements
    session.add(design_parameter)
    session.commit()
    return get_design_parameter(session, design_parameter.id)


def update_design_parameter(
    session: Session,
    design_parameter_id: str,
    payload: DesignParameterUpdate,
    owner_user_id: str | None = None,
) -> DesignParameter:
    design_parameter = get_design_parameter(session, design_parameter_id, owner_user_id)
    ensure_project_exists(session, payload.project_id, owner_user_id)
    if design_parameter.project_id != payload.project_id:
        raise DesignParameterLinkError(
            f"Design parameter '{design_parameter_id}' belongs to project '{design_parameter.project_id}' and cannot be moved."
        )
    linked_requirements = _load_requirements(session, payload.project_id, payload.requirement_ids)
    payload_data = payload.model_dump(exclude={"requirement_ids"})
    for field, value in payload_data.items():
        setattr(design_parameter, field, value)
    design_parameter.linked_requirements = linked_requirements
    session.add(design_parameter)
    session.commit()
    return get_design_parameter(session, design_parameter_id)


def delete_design_parameter(
    session: Session,
    design_parameter_id: str,
    owner_user_id: str | None = None,
) -> None:
    design_parameter = get_design_parameter(session, design_parameter_id, owner_user_id)
    session.delete(design_parameter)
    session.commit()


def list_design_parameters_for_requirement(
    session: Session,
    requirement_id: str,
    owner_user_id: str | None = None,
) -> list[DesignParameter]:
    requirement = session.get(Requirement, requirement_id)
    if requirement is None:
        raise DesignParameterLinkError(f"Requirement '{requirement_id}' was not found.")
    ensure_project_exists(session, requirement.project_id, owner_user_id)

    statement = (
        select(DesignParameter)
        .join(DesignParameter.linked_requirements)
        .where(Requirement.id == requirement_id)
        .where(DesignParameter.project_id == requirement.project_id)
        .order_by(DesignParameter.name.asc())
    )
    return list(session.scalars(statement).all())
