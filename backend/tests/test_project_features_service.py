from app.schemas.project_feature import ProjectFeatureCreate
from app.schemas.requirement import RequirementCreate
from app.services.project_features_service import (
    create_project_feature,
    delete_project_feature,
    list_project_features,
)
from app.services.requirements_service import create_requirement, get_requirement
from tests.conftest import create_project


def test_platform_project_can_create_and_list_features(session) -> None:
    create_project(
        session,
        project_id="brake-platform",
        name="Brake Platform",
        project_kind="Platform",
    )

    feature = create_project_feature(
        session,
        ProjectFeatureCreate(
            project_id="brake-platform",
            parent_feature_id=None,
            name="ABS",
            kind="Feature",
            description="Anti-lock braking",
            order_index=0,
        ),
        owner_user_id="user-demo",
    )

    features = list_project_features(session, "brake-platform", owner_user_id="user-demo")

    assert len(features) == 1
    assert features[0].id == feature.id
    assert features[0].name == "ABS"


def test_deleting_feature_clears_requirement_assignment(session) -> None:
    create_project(
        session,
        project_id="brake-platform",
        name="Brake Platform",
        project_kind="Platform",
    )
    feature = create_project_feature(
        session,
        ProjectFeatureCreate(
            project_id="brake-platform",
            parent_feature_id=None,
            name="ESC",
            kind="Feature",
            description=None,
            order_index=0,
        ),
        owner_user_id="user-demo",
    )
    requirement = create_requirement(
        session,
        RequirementCreate(
            project_id="brake-platform",
            title="Yaw control",
            text="The platform shall control yaw within 150 milliseconds during ESC intervention.",
            type="System",
            priority="High",
            status="Draft",
            parent_requirement_id=None,
            feature_id=feature.id,
            section_id=None,
            subsystem="Controls",
            verification_method="Test",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
        owner_user_id="user-demo",
    )

    delete_project_feature(session, feature.id, owner_user_id="user-demo")
    reloaded = get_requirement(session, requirement.id, owner_user_id="user-demo")

    assert reloaded.feature_id is None
