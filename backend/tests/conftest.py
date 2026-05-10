import sys
from collections.abc import Generator
from pathlib import Path

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.db import Base
from app.models.design_parameter import DesignParameter
from app.models.dfmea_entry import DfmeaEntry
from app.models.auth_session import AuthSession
from app.models.project import Project
from app.models.project_feature import ProjectFeature
from app.models.project_requirement_sequence import ProjectRequirementSequence
from app.models.project_snapshot import ProjectSnapshot
from app.models.requirement import Requirement
from app.models.requirement_section import RequirementSection
from app.models.user import User


@pytest.fixture()
def session() -> Generator[Session, None, None]:
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    testing_session_local = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    db = testing_session_local()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(engine)


def create_user(
    session: Session,
    *,
    user_id: str = "user-demo",
    username: str = "demo",
    display_name: str = "Demo Engineer",
    password_hash: str = "test-hash",
) -> User:
    existing = session.get(User, user_id)
    if existing is not None:
        return existing

    user = User(
        id=user_id,
        username=username,
        display_name=display_name,
        password_hash=password_hash,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def create_requirement(
    session: Session,
    *,
    requirement_id: str,
    requirement_code: str | None = None,
    project_id: str = "demo-project",
    title: str,
    text: str,
    requirement_type: str = "System",
    priority: str = "High",
    status: str = "Draft",
    subsystem: str | None = None,
    section_id: str | None = None,
    feature_id: str | None = None,
    parsed_requirement: dict[str, str | None] | None = None,
    created_by_user_id: str = "user-demo",
    updated_by_user_id: str | None = None,
    deleted_by_user_id: str | None = None,
    is_deleted: bool = False,
) -> Requirement:
    if session.get(Project, project_id) is None:
        create_project(session, project_id=project_id, name=project_id.replace("-", " ").title(), owner_user_id=created_by_user_id)
    create_user(session, user_id=created_by_user_id)
    if updated_by_user_id:
        create_user(session, user_id=updated_by_user_id, username=updated_by_user_id)
    if deleted_by_user_id:
        create_user(session, user_id=deleted_by_user_id, username=deleted_by_user_id)

    requirement = Requirement(
        id=requirement_id,
        requirement_code=requirement_code or requirement_id,
        project_id=project_id,
        title=title,
        text=text,
        type=requirement_type,
        priority=priority,
        status=status,
        parent_requirement_id=None,
        hierarchy=requirement_id,
        feature_id=feature_id,
        section_id=section_id,
        subsystem=subsystem,
        verification_method="Analysis",
        rationale=None,
        assumptions=None,
        parsed_requirement=parsed_requirement,
        generation_metadata=None,
        created_by_user_id=created_by_user_id,
        updated_by_user_id=updated_by_user_id,
        deleted_by_user_id=deleted_by_user_id,
        is_deleted=is_deleted,
    )
    session.add(requirement)
    session.commit()
    session.refresh(requirement)
    return requirement


def create_requirement_section(
    session: Session,
    *,
    section_id: str,
    project_id: str = "demo-project",
    title: str,
    kind: str = "Header",
    parent_section_id: str | None = None,
    description: str | None = None,
    order_index: int = 0,
) -> RequirementSection:
    if session.get(Project, project_id) is None:
        create_project(session, project_id=project_id, name=project_id.replace("-", " ").title())

    section = RequirementSection(
        id=section_id,
        project_id=project_id,
        parent_section_id=parent_section_id,
        title=title,
        description=description,
        kind=kind,
        order_index=order_index,
    )
    session.add(section)
    session.commit()
    session.refresh(section)
    return section


def create_project(
    session: Session,
    *,
    project_id: str = "demo-project",
    owner_user_id: str = "user-demo",
    name: str = "Demo Project",
    description: str | None = "Test project",
    status: str = "Draft",
    project_kind: str = "Standard",
) -> Project:
    create_user(session, user_id=owner_user_id)
    project = Project(
        id=project_id,
        owner_user_id=owner_user_id,
        name=name,
        description=description,
        status=status,
        project_kind=project_kind,
    )
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


def create_project_feature(
    session: Session,
    *,
    feature_id: str,
    project_id: str = "demo-project",
    name: str,
    kind: str = "Feature",
    parent_feature_id: str | None = None,
    description: str | None = None,
    order_index: int = 0,
) -> ProjectFeature:
    project = session.get(Project, project_id)
    if project is None:
        project = create_project(
            session,
            project_id=project_id,
            name=project_id.replace("-", " ").title(),
            project_kind="Platform",
        )
    elif project.project_kind != "Platform":
        project.project_kind = "Platform"
        session.add(project)
        session.commit()

    feature = ProjectFeature(
        id=feature_id,
        project_id=project_id,
        parent_feature_id=parent_feature_id,
        name=name,
        kind=kind,
        description=description,
        order_index=order_index,
    )
    session.add(feature)
    session.commit()
    session.refresh(feature)
    return feature


def create_design_parameter(
    session: Session,
    *,
    parameter_id: str,
    project_id: str = "demo-project",
    name: str,
    parameter_name: str,
    value: str,
    unit: str | None,
    linked_requirements: list[Requirement] | None = None,
    subsystem: str | None = None,
) -> DesignParameter:
    if session.get(Project, project_id) is None:
        create_project(session, project_id=project_id, name=project_id.replace("-", " ").title())

    parameter = DesignParameter(
        id=parameter_id,
        project_id=project_id,
        name=name,
        subsystem=subsystem,
        parameter_name=parameter_name,
        value=value,
        unit=unit,
        source_document="Test Source",
        revision="A",
        notes=None,
    )
    parameter.linked_requirements = linked_requirements or []
    session.add(parameter)
    session.commit()
    session.refresh(parameter)
    return parameter
