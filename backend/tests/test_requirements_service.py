from app.schemas.requirement import RequirementCreate, RequirementUpdate
from app.services.requirements_service import (
    RequirementDeletedError,
    create_requirement,
    delete_requirement,
    get_requirement,
    list_requirements,
    update_requirement,
)
from tests.conftest import (
    create_project,
    create_project_feature,
    create_requirement as seed_requirement,
    create_requirement_section,
)


def test_create_requirement_sets_creator_metadata(session):
    create_project(session, project_id="braking-system", owner_user_id="user-demo")

    created = create_requirement(
        session,
        RequirementCreate(
            project_id="braking-system",
            title="System response time",
            text="The braking system shall respond within 10 milliseconds during service braking.",
            type="System",
            priority="High",
            status="Draft",
            parent_requirement_id=None,
            section_id=None,
            subsystem="Braking",
            verification_method="Analysis",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
        owner_user_id="user-demo",
    )

    assert created.created_by_user_id == "user-demo"
    assert created.created_by_username == "demo"
    assert created.updated_by_user_id is None
    assert created.is_deleted is False


def test_update_requirement_sets_updated_by_metadata(session):
    create_project(session, project_id="braking-system", owner_user_id="user-demo")
    requirement = seed_requirement(
        session,
        requirement_id="SYS-001",
        project_id="braking-system",
        title="Brake pressure",
        text="The braking system shall maintain 6 bar during service braking.",
        created_by_user_id="user-demo",
    )

    updated = update_requirement(
        session,
        requirement.id,
        RequirementUpdate(
            project_id="braking-system",
            title="Brake pressure",
            text="The braking system shall maintain at least 6 bar during service braking.",
            type="System",
            priority="High",
            status="In Review",
            parent_requirement_id=None,
            section_id=None,
            subsystem=None,
            verification_method="Analysis",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
        owner_user_id="user-demo",
    )

    assert updated.updated_by_user_id == "user-demo"
    assert updated.updated_by_username == "demo"


def test_delete_requirement_soft_deletes_and_preserves_record(session):
    create_project(session, project_id="braking-system", owner_user_id="user-demo")
    requirement = seed_requirement(
        session,
        requirement_id="SYS-001",
        project_id="braking-system",
        title="Voltage limit",
        text="Operating voltage shall be at most 48 volts.",
    )

    delete_requirement(session, requirement.id, owner_user_id="user-demo")

    deleted = get_requirement(session, requirement.id, owner_user_id="user-demo")
    assert deleted.is_deleted is True
    assert deleted.deleted_by_user_id == "user-demo"
    assert deleted.deleted_by_username == "demo"
    assert deleted.deleted_at is not None


def test_list_requirements_hides_deleted_by_default_and_can_include_them(session):
    create_project(session, project_id="braking-system", owner_user_id="user-demo")
    active_requirement = seed_requirement(
        session,
        requirement_id="SYS-001",
        project_id="braking-system",
        title="Active requirement",
        text="The braking system shall respond within 10 ms.",
    )
    deleted_requirement = seed_requirement(
        session,
        requirement_id="SYS-002",
        project_id="braking-system",
        title="Deleted requirement",
        text="Operating voltage shall be at most 48 volts.",
        is_deleted=True,
        deleted_by_user_id="user-demo",
    )

    visible = list_requirements(session, "braking-system", "user-demo")
    visible_ids = {requirement.id for requirement in visible}
    assert active_requirement.id in visible_ids
    assert deleted_requirement.id not in visible_ids

    with_deleted = list_requirements(session, "braking-system", "user-demo", include_deleted=True)
    with_deleted_ids = {requirement.id for requirement in with_deleted}
    assert active_requirement.id in with_deleted_ids
    assert deleted_requirement.id in with_deleted_ids


def test_deleted_requirement_cannot_be_updated(session):
    create_project(session, project_id="braking-system", owner_user_id="user-demo")
    requirement = seed_requirement(
        session,
        requirement_id="SYS-001",
        project_id="braking-system",
        title="Deleted requirement",
        text="The braking system shall respond within 10 ms.",
        is_deleted=True,
        deleted_by_user_id="user-demo",
    )

    try:
        update_requirement(
            session,
            requirement.id,
            RequirementUpdate(
                project_id="braking-system",
                title="Deleted requirement",
                text="The braking system shall respond within 20 ms.",
                type="System",
                priority="High",
                status="Draft",
                parent_requirement_id=None,
                section_id=None,
                subsystem=None,
                verification_method="Analysis",
                rationale=None,
                assumptions=None,
                generation_metadata=None,
            ),
            owner_user_id="user-demo",
        )
    except RequirementDeletedError:
        pass
    else:
        raise AssertionError("Deleted requirements should be read-only.")


def test_create_requirement_accepts_section_assignment(session):
    create_project(session, project_id="braking-system", owner_user_id="user-demo")
    section = create_requirement_section(
        session,
        section_id="section-diagnostics",
        project_id="braking-system",
        title="Diagnostics",
    )

    created = create_requirement(
        session,
        RequirementCreate(
            project_id="braking-system",
            title="Diagnostic reporting",
            text="The braking system shall report diagnostic faults within 100 milliseconds.",
            type="System",
            priority="Medium",
            status="Draft",
            parent_requirement_id=None,
            section_id=section.id,
            subsystem="Diagnostics",
            verification_method="Test",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
        owner_user_id="user-demo",
    )

    assert created.section_id == section.id


def test_update_requirement_preserves_section_when_payload_omits_it(session):
    create_project(session, project_id="braking-system", owner_user_id="user-demo")
    section = create_requirement_section(
        session,
        section_id="section-slip",
        project_id="braking-system",
        title="Wheel slip",
    )
    requirement = seed_requirement(
        session,
        requirement_id="SYS-010",
        project_id="braking-system",
        title="Slip control",
        text="The braking system shall control slip during service braking.",
        section_id=section.id,
    )

    updated = update_requirement(
        session,
        requirement.id,
        RequirementUpdate(
            project_id="braking-system",
            title="Slip control",
            text="The braking system shall control wheel slip during service braking.",
            type="System",
            priority="High",
            status="In Review",
            parent_requirement_id=None,
            subsystem=None,
            verification_method="Analysis",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
        owner_user_id="user-demo",
    )

    assert updated.section_id == section.id


def test_create_requirement_accepts_feature_assignment(session):
    create_project(
        session,
        project_id="brake-platform",
        owner_user_id="user-demo",
        project_kind="Platform",
    )
    feature = create_project_feature(
        session,
        feature_id="feature-abs",
        project_id="brake-platform",
        name="ABS",
    )

    created = create_requirement(
        session,
        RequirementCreate(
            project_id="brake-platform",
            title="Wheel slip detection",
            text="The platform shall detect wheel slip within 20 milliseconds during ABS operation.",
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

    assert created.feature_id == feature.id
