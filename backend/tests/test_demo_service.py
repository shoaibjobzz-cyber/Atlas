from sqlalchemy import select

from app.models.project import Project
from app.models.project_feature import ProjectFeature
from app.models.requirement import Requirement
from app.services.demo_service import load_brake_control_platform_demo


def test_load_brake_control_platform_demo_seeds_platform_features_and_requirements(session) -> None:
    response = load_brake_control_platform_demo(session, "user-demo")

    project = session.get(Project, response.project_id)
    features = list(
        session.scalars(
            select(ProjectFeature).where(ProjectFeature.project_id == response.project_id).order_by(ProjectFeature.order_index.asc())
        ).all()
    )
    requirements = list(session.scalars(select(Requirement).where(Requirement.project_id == response.project_id)).all())

    assert project is not None
    assert project.project_kind == "Platform"
    assert response.project_name == "Brake Control Platform"
    assert [feature.name for feature in features] == [
        "ABS",
        "ESC",
        "Traction Control",
        "Hill Hold",
        "Diagnostics",
    ]
    assert len(requirements) == 10
    assert all(requirement.feature_id for requirement in requirements)
