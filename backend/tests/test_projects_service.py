from app.schemas.project import ProjectCreate
from app.services.projects_service import create_project, delete_project, list_projects
from app.services.requirement_id_service import preview_next_requirement_id
from app.services.requirements_service import create_requirement
from app.schemas.requirement import RequirementCreate


def test_create_and_list_projects(session) -> None:
    create_project(
        session,
        ProjectCreate(id=None, name="Brake Controls", description="Project", status="Draft", project_kind="Standard"),
        owner_user_id="user-demo",
    )

    projects = list_projects(session, owner_user_id="user-demo")

    assert len(projects) == 1
    assert projects[0].name == "Brake Controls"
    assert projects[0].id == "brake-controls"
    assert projects[0].project_kind == "Standard"


def test_create_platform_project_persists_project_kind(session) -> None:
    project = create_project(
        session,
        ProjectCreate(
            id="brake-control-platform",
            name="Brake Control Platform",
            description="Platform workspace",
            status="Active",
            project_kind="Platform",
        ),
        owner_user_id="user-demo",
    )

    assert project.project_kind == "Platform"


def test_delete_project_removes_project_scoped_requirements(session) -> None:
    project = create_project(
        session,
        ProjectCreate(id="delete-project", name="Delete Project", description=None, status="Draft", project_kind="Standard"),
        owner_user_id="user-demo",
    )
    create_requirement(
        session,
        payload=RequirementCreate(
            id=None,
            project_id=project.id,
            title="Project requirement",
            text="The system shall maintain pressure at least 6 bar in normal mode.",
            type="System",
            priority="High",
            status="Draft",
            parent_requirement_id=None,
            subsystem="Hydraulics",
            verification_method="Test",
            rationale=None,
            assumptions=None,
        ),
    )

    delete_project(session, project.id, owner_user_id="user-demo")

    assert list_projects(session, owner_user_id="user-demo") == []


def test_recreating_a_project_resets_system_requirement_numbering(session) -> None:
    project = create_project(
        session,
        ProjectCreate(
            id="clean-system-project",
            name="Clean System Project",
            description=None,
            status="Draft",
            project_kind="Standard",
        ),
        owner_user_id="user-demo",
    )
    first_requirement = create_requirement(
        session,
        payload=RequirementCreate(
            id=None,
            project_id=project.id,
            title="First system requirement",
            text="The system shall respond within 100 ms in normal mode.",
            type="System",
            priority="High",
            status="Draft",
            parent_requirement_id=None,
            subsystem="Controls",
            verification_method="Test",
            rationale=None,
            assumptions=None,
        ),
    )

    assert first_requirement.requirement_code == "SYS-001"

    delete_project(session, project.id, owner_user_id="user-demo")

    recreated_project = create_project(
        session,
        ProjectCreate(
            id="clean-system-project",
            name="Clean System Project",
            description=None,
            status="Draft",
            project_kind="Standard",
        ),
        owner_user_id="user-demo",
    )

    assert preview_next_requirement_id(session, recreated_project.id, "System") == "SYS-001"

    recreated_requirement = create_requirement(
        session,
        payload=RequirementCreate(
            id=None,
            project_id=recreated_project.id,
            title="Recreated first system requirement",
            text="The system shall respond within 90 ms in normal mode.",
            type="System",
            priority="High",
            status="Draft",
            parent_requirement_id=None,
            subsystem="Controls",
            verification_method="Test",
            rationale=None,
            assumptions=None,
        ),
    )

    assert recreated_requirement.requirement_code == "SYS-001"
