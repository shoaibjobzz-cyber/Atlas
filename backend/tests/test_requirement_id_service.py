from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.requirement import Requirement
from app.models.user import User
from app.schemas.generation import RequirementGenerationSaveCandidate, RequirementGenerationSaveRequest
from app.schemas.requirement import RequirementCreate, RequirementGenerationMetadata
from app.services.requirement_generation_service import save_generated_candidates
from app.services.requirement_hierarchy_service import preview_child_hierarchies
from app.services.requirement_id_service import allocate_requirement_id, preview_next_requirement_id
from app.services.requirements_service import create_requirement


def _create_project(session: Session, project_id: str) -> None:
    if session.get(User, "user-demo") is None:
        session.add(
            User(
                id="user-demo",
                username="demo",
                display_name="Demo Engineer",
                password_hash="test-hash",
            )
        )
        session.commit()

    if session.get(Project, project_id) is None:
        session.add(
            Project(
                id=project_id,
                owner_user_id="user-demo",
                name=project_id.replace("-", " ").title(),
                description="Test project",
                status="Draft",
            )
        )
        session.commit()


def _seed_requirement(
    session: Session,
    *,
    requirement_id: str,
    requirement_code: str | None = None,
    project_id: str,
    title: str,
    text: str,
    requirement_type: str,
    parent_requirement_id: str | None = None,
    hierarchy: str | None = None,
) -> None:
    _create_project(session, project_id)
    session.add(
        Requirement(
            id=requirement_id,
            requirement_code=requirement_code or requirement_id,
            project_id=project_id,
            title=title,
            text=text,
            type=requirement_type,
            priority="High",
            status="Draft",
            parent_requirement_id=parent_requirement_id,
            hierarchy=hierarchy,
            subsystem=None,
            verification_method="Analysis",
            rationale=None,
            assumptions=None,
            parsed_requirement=None,
            generation_metadata=None,
            created_by_user_id="user-demo",
            updated_by_user_id=None,
            deleted_by_user_id=None,
            deleted_at=None,
            is_deleted=False,
        )
    )
    session.commit()


def test_allocate_requirement_id_uses_project_and_type_sequence(session) -> None:
    _create_project(session, "braking-system")
    _seed_requirement(
        session,
        requirement_id="SYS-001",
        project_id="braking-system",
        title="Existing system requirement",
        text="The braking system shall respond within 10 milliseconds during service braking.",
        requirement_type="System",
    )
    _seed_requirement(
        session,
        requirement_id="SWR-001",
        project_id="braking-system",
        title="Existing software requirement",
        text="The software shall log brake pressure values every 10 milliseconds.",
        requirement_type="Software",
    )

    assert allocate_requirement_id(session, "braking-system", "System") == "SYS-002"
    assert allocate_requirement_id(session, "braking-system", "Software") == "SWR-002"


def test_create_requirement_assigns_generated_id_and_ignores_client_supplied_id(session) -> None:
    _create_project(session, "braking-system")

    created = create_requirement(
        session,
        RequirementCreate(
            id="AI-RANDOM-999",
            project_id="braking-system",
            title="System timing",
            text="The braking system shall respond within 10 milliseconds during service braking.",
            type="System",
            priority="High",
            status="Draft",
            parent_requirement_id=None,
            subsystem="Braking",
            verification_method="Test",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
    )

    assert created.requirement_code == "SYS-001"
    assert created.id.startswith("req_")
    assert created.hierarchy == "SYS-001"


def test_allocate_requirement_id_ignores_legacy_non_matching_ids(session) -> None:
    _create_project(session, "braking-system")
    _seed_requirement(
        session,
        requirement_id="BRK-STK-001",
        project_id="braking-system",
        title="Legacy requirement",
        text="The braking system shall provide visible status feedback to the driver.",
        requirement_type="Stakeholder",
    )

    assert allocate_requirement_id(session, "braking-system", "Stakeholder") == "SHR-001"


def test_preview_next_requirement_id_does_not_consume_sequence(session) -> None:
    _create_project(session, "braking-system")

    assert preview_next_requirement_id(session, "braking-system", "System") == "SYS-001"
    assert preview_next_requirement_id(session, "braking-system", "System") == "SYS-001"
    assert allocate_requirement_id(session, "braking-system", "System") == "SYS-001"
    assert preview_next_requirement_id(session, "braking-system", "System") == "SYS-002"


def test_deleted_requirements_still_count_toward_sequence_continuity(session) -> None:
    _create_project(session, "braking-system")
    _seed_requirement(
        session,
        requirement_id="SYS-001",
        project_id="braking-system",
        title="Deleted system requirement",
        text="The braking system shall respond within 10 milliseconds during service braking.",
        requirement_type="System",
    )
    requirement = session.get(Requirement, "SYS-001")
    assert requirement is not None
    requirement.is_deleted = True
    session.add(requirement)
    session.commit()

    assert allocate_requirement_id(session, "braking-system", "System") == "SYS-002"


def test_save_generated_candidates_assigns_backend_ids(session) -> None:
    _create_project(session, "braking-system")
    generation_metadata = RequirementGenerationMetadata(
        generation_source="ai",
        generation_provider="mock",
        generated_from_requirement_id=None,
        is_generated_draft=True,
    )

    response = save_generated_candidates(
        session,
        RequirementGenerationSaveRequest(
            project_id="braking-system",
            candidates=[
                RequirementGenerationSaveCandidate(
                    temp_id="draft-1",
                    title="Brake timing",
                    text="The braking system shall respond within 10 milliseconds during service braking.",
                    type="System",
                    priority="High",
                    rationale="Improved measurable wording.",
                    parent_requirement_id=None,
                    subsystem="Braking",
                    verification_method="Test",
                    assumptions=None,
                    generation_metadata=generation_metadata,
                ),
                RequirementGenerationSaveCandidate(
                    temp_id="draft-2",
                    title="Brake software timing",
                    text="The software shall log brake pressure values every 10 milliseconds.",
                    type="Software",
                    priority="Medium",
                    rationale="Generated child requirement.",
                    parent_requirement_id=None,
                    subsystem="Software",
                    verification_method="Analysis",
                    assumptions=None,
                    generation_metadata=generation_metadata,
                ),
            ],
        ),
    )

    saved_ids = [requirement.requirement_code for requirement in response.saved_requirements]

    assert saved_ids == ["SYS-001", "SWR-001"]
    assert [requirement.hierarchy for requirement in response.saved_requirements] == ["SYS-001", "SWR-001"]


def test_create_requirement_assigns_child_hierarchy(session) -> None:
    _create_project(session, "braking-system")
    parent = create_requirement(
        session,
        RequirementCreate(
            project_id="braking-system",
            title="Brake response",
            text="The braking system shall respond within 10 milliseconds during service braking.",
            type="System",
            priority="High",
            status="Draft",
            parent_requirement_id=None,
            subsystem="Braking",
            verification_method="Test",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
    )

    child_one = create_requirement(
        session,
        RequirementCreate(
            project_id="braking-system",
            title="Brake response sensor path",
            text="The subsystem shall measure pedal input within 2 milliseconds during service braking.",
            type="Subsystem",
            priority="High",
            status="Draft",
            parent_requirement_id=parent.id,
            subsystem="Braking",
            verification_method="Test",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
    )
    child_two = create_requirement(
        session,
        RequirementCreate(
            project_id="braking-system",
            title="Brake response actuator path",
            text="The subsystem shall actuate hydraulic pressure within 8 milliseconds during service braking.",
            type="Subsystem",
            priority="High",
            status="Draft",
            parent_requirement_id=parent.id,
            subsystem="Braking",
            verification_method="Test",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
    )

    assert parent.hierarchy == "SYS-001"
    assert child_one.hierarchy == "SYS-001.1"
    assert child_two.hierarchy == "SYS-001.2"


def test_create_requirement_supports_multilevel_hierarchy(session) -> None:
    _create_project(session, "braking-system")
    parent = create_requirement(
        session,
        RequirementCreate(
            project_id="braking-system",
            title="Brake response",
            text="The braking system shall respond within 10 milliseconds during service braking.",
            type="System",
            priority="High",
            status="Draft",
            parent_requirement_id=None,
            subsystem="Braking",
            verification_method="Test",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
    )
    child = create_requirement(
        session,
        RequirementCreate(
            project_id="braking-system",
            title="Brake response sensor path",
            text="The subsystem shall measure pedal input within 2 milliseconds during service braking.",
            type="Subsystem",
            priority="High",
            status="Draft",
            parent_requirement_id=parent.id,
            subsystem="Braking",
            verification_method="Test",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
    )
    grandchild = create_requirement(
        session,
        RequirementCreate(
            project_id="braking-system",
            title="Brake response sensor sampling",
            text="The software shall sample pedal sensor input every 1 millisecond during service braking.",
            type="Software",
            priority="Medium",
            status="Draft",
            parent_requirement_id=child.id,
            subsystem="Software",
            verification_method="Analysis",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
    )

    assert child.hierarchy == "SYS-001.1"
    assert grandchild.hierarchy == "SYS-001.1.1"


def test_preview_child_hierarchies_uses_parent_hierarchy(session) -> None:
    _create_project(session, "braking-system")
    _seed_requirement(
        session,
        requirement_id="SYS-001",
        project_id="braking-system",
        title="Parent",
        text="The system shall maintain brake pressure within 10 milliseconds during service braking.",
        requirement_type="System",
        hierarchy="SYS-001",
    )
    _seed_requirement(
        session,
        requirement_id="SUB-001",
        project_id="braking-system",
        title="Existing child",
        text="The subsystem shall measure brake pressure within 2 milliseconds.",
        requirement_type="Subsystem",
        parent_requirement_id="SYS-001",
        hierarchy="SYS-001.1",
    )

    assert preview_child_hierarchies(
        session,
        project_id="braking-system",
        parent_requirement_id="SYS-001",
        count=2,
    ) == ["SYS-001.2", "SYS-001.3"]


def test_save_generated_candidates_assigns_child_hierarchies(session) -> None:
    _create_project(session, "braking-system")
    parent = create_requirement(
        session,
        RequirementCreate(
            project_id="braking-system",
            title="Brake response",
            text="The braking system shall respond within 10 milliseconds during service braking.",
            type="System",
            priority="High",
            status="Draft",
            parent_requirement_id=None,
            subsystem="Braking",
            verification_method="Test",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
    )
    generation_metadata = RequirementGenerationMetadata(
        generation_source="ai",
        generation_provider="mock",
        generated_from_requirement_id=parent.id,
        is_generated_draft=True,
    )

    response = save_generated_candidates(
        session,
        RequirementGenerationSaveRequest(
            project_id="braking-system",
            candidates=[
                RequirementGenerationSaveCandidate(
                    temp_id="draft-1",
                    title="Pedal input path",
                    text="The subsystem shall measure pedal input within 2 milliseconds during service braking.",
                    type="Subsystem",
                    priority="High",
                    rationale="Generated child requirement.",
                    parent_requirement_id=parent.id,
                    subsystem="Braking",
                    verification_method="Test",
                    assumptions=None,
                    generation_metadata=generation_metadata,
                ),
                RequirementGenerationSaveCandidate(
                    temp_id="draft-2",
                    title="Actuation path",
                    text="The subsystem shall actuate hydraulic pressure within 8 milliseconds during service braking.",
                    type="Subsystem",
                    priority="High",
                    rationale="Generated child requirement.",
                    parent_requirement_id=parent.id,
                    subsystem="Braking",
                    verification_method="Test",
                    assumptions=None,
                    generation_metadata=generation_metadata,
                ),
            ],
        ),
    )

    assert [requirement.hierarchy for requirement in response.saved_requirements] == ["SYS-001.1", "SYS-001.2"]


def test_requirement_codes_are_project_scoped_even_when_visible_codes_match(session) -> None:
    _create_project(session, "project-a")
    _create_project(session, "project-b")

    first = create_requirement(
        session,
        RequirementCreate(
            project_id="project-a",
            title="System timing A",
            text="The braking system shall respond within 10 milliseconds during service braking.",
            type="System",
            priority="High",
            status="Draft",
            parent_requirement_id=None,
            subsystem="Braking",
            verification_method="Test",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
    )
    second = create_requirement(
        session,
        RequirementCreate(
            project_id="project-b",
            title="System timing B",
            text="The braking system shall respond within 10 milliseconds during service braking.",
            type="System",
            priority="High",
            status="Draft",
            parent_requirement_id=None,
            subsystem="Braking",
            verification_method="Test",
            rationale=None,
            assumptions=None,
            generation_metadata=None,
        ),
    )

    assert first.requirement_code == "SYS-001"
    assert second.requirement_code == "SYS-001"
    assert first.id != second.id
