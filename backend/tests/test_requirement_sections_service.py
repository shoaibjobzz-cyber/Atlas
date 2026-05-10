from app.schemas.requirement_section import RequirementSectionCreate, RequirementSectionUpdate
from app.services.requirement_sections_service import (
    create_requirement_section,
    delete_requirement_section,
    list_requirement_sections,
    update_requirement_section,
)
from tests.conftest import (
    create_project,
    create_requirement as seed_requirement,
    create_requirement_section as seed_section,
)


def test_list_requirement_sections_returns_project_sections_in_order(session):
    create_project(session, project_id="braking-system", owner_user_id="user-demo")
    seed_section(
        session,
        section_id="section-b",
        project_id="braking-system",
        title="Diagnostics",
        order_index=2,
    )
    seed_section(
        session,
        section_id="section-a",
        project_id="braking-system",
        title="Braking Control",
        order_index=1,
    )

    sections = list_requirement_sections(session, "braking-system", "user-demo")

    assert [section.id for section in sections] == ["section-a", "section-b"]


def test_create_requirement_section_supports_subheaders(session):
    create_project(session, project_id="braking-system", owner_user_id="user-demo")
    header = seed_section(
        session,
        section_id="header-1",
        project_id="braking-system",
        title="Braking Control Requirements",
        kind="Header",
    )

    created = create_requirement_section(
        session,
        RequirementSectionCreate(
            project_id="braking-system",
            parent_section_id=header.id,
            title="Wheel Slip Detection",
            description="Slip sensing and threshold behavior.",
            kind="Subheader",
            order_index=1,
        ),
        owner_user_id="user-demo",
    )

    assert created.parent_section_id == header.id
    assert created.kind == "Subheader"


def test_update_requirement_section_edits_metadata(session):
    create_project(session, project_id="braking-system", owner_user_id="user-demo")
    section = seed_section(
        session,
        section_id="header-1",
        project_id="braking-system",
        title="Diagnostics",
        kind="Header",
        order_index=1,
    )

    updated = update_requirement_section(
        session,
        section.id,
        RequirementSectionUpdate(
            project_id="braking-system",
            parent_section_id=None,
            title="Diagnostics Requirements",
            description="Service and fault reporting.",
            kind="Header",
            order_index=3,
        ),
        owner_user_id="user-demo",
    )

    assert updated.title == "Diagnostics Requirements"
    assert updated.order_index == 3


def test_delete_requirement_section_unassigns_requirement_rows(session):
    create_project(session, project_id="braking-system", owner_user_id="user-demo")
    section = seed_section(
        session,
        section_id="header-1",
        project_id="braking-system",
        title="Diagnostics",
        kind="Header",
    )
    requirement = seed_requirement(
        session,
        requirement_id="SYS-200",
        project_id="braking-system",
        title="Fault response",
        text="The braking system shall report faults within 100 milliseconds.",
        section_id=section.id,
    )

    delete_requirement_section(session, section.id, "user-demo")

    assert requirement.section_id is None
