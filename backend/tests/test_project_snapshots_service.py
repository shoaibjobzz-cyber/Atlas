from app.schemas.project_snapshots import CreateProjectSnapshotRequest
from app.services.project_snapshots_service import (
    compare_project_snapshot,
    create_project_snapshot,
    get_project_snapshot,
    list_project_snapshots,
)
from app.services.project_views_service import get_project_validation_summary
from tests.conftest import create_design_parameter, create_project, create_requirement


def test_create_and_list_project_validation_snapshots(session):
    create_project(session, project_id="braking-system", name="Braking System")
    create_requirement(
        session,
        requirement_id="BRK-SYS-001",
        project_id="braking-system",
        title="Brake response timing",
        text="The braking system shall respond within 10 milliseconds during service braking.",
        parsed_requirement={
            "actor": "braking system",
            "action": "respond",
            "object": "service braking request",
            "parameter": "response time",
            "operator": "within",
            "value": "10",
            "unit": "ms",
            "timing": "during service braking",
            "condition": "under normal conditions",
            "scope": "vehicle level",
        },
    )

    snapshot = create_project_snapshot(
        session,
        "braking-system",
        CreateProjectSnapshotRequest(snapshot_type="validation"),
    )

    snapshots = list_project_snapshots(session, "braking-system", "validation")

    assert len(snapshots) == 1
    assert snapshots[0].id == snapshot.id
    assert snapshots[0].snapshot_type == "validation"
    assert snapshots[0].name.startswith("Validation Snapshot ")
    assert snapshot.payload["total_requirements"] == 1


def test_compare_validation_snapshot_returns_numeric_deltas(session):
    create_project(session, project_id="braking-system", name="Braking System")
    create_requirement(
        session,
        requirement_id="BRK-SYS-001",
        project_id="braking-system",
        title="Brake response timing",
        text="The braking system shall respond quickly.",
    )

    snapshot = create_project_snapshot(
        session,
        "braking-system",
        CreateProjectSnapshotRequest(snapshot_type="validation", name="Initial validation baseline"),
    )

    create_requirement(
        session,
        requirement_id="BRK-SYS-002",
        project_id="braking-system",
        title="Brake pressure",
        text="The braking system shall provide at least 6 bar line pressure.",
        parsed_requirement={
            "actor": "braking system",
            "action": "provide",
            "object": "line pressure",
            "parameter": "line pressure",
            "operator": "at least",
            "value": "6",
            "unit": "bar",
            "timing": None,
            "condition": None,
            "scope": "hydraulic circuit",
        },
    )
    create_design_parameter(
        session,
        parameter_id="DP-001",
        project_id="braking-system",
        name="Hydraulic pressure",
        parameter_name="line pressure",
        value="500",
        unit="kPa",
    )

    comparison = compare_project_snapshot(session, "braking-system", snapshot.id)

    assert comparison.snapshot.id == snapshot.id
    assert comparison.snapshot_type == "validation"
    assert comparison.deltas["total_requirements"].current == 2.0
    assert comparison.deltas["total_requirements"].snapshot == 1.0
    assert comparison.deltas["total_requirements"].delta == 1.0


def test_report_snapshot_is_project_scoped_and_stores_payload(session):
    create_project(session, project_id="braking-system", name="Braking System")
    create_project(session, project_id="coffee-machine", name="Coffee Machine")
    create_requirement(
        session,
        requirement_id="BRK-SYS-001",
        project_id="braking-system",
        title="Brake response timing",
        text="The braking system shall respond within 10 milliseconds during service braking.",
    )
    create_requirement(
        session,
        requirement_id="COF-SYS-001",
        project_id="coffee-machine",
        title="Coffee dispense timing",
        text="The coffee machine shall dispense coffee within 5 seconds of start.",
    )

    report_snapshot = create_project_snapshot(
        session,
        "braking-system",
        CreateProjectSnapshotRequest(snapshot_type="report", name="Brake release baseline"),
    )

    fetched = get_project_snapshot(session, "braking-system", report_snapshot.id)
    validation_summary = get_project_validation_summary(session, "braking-system")
    snapshots = list_project_snapshots(session, "coffee-machine")

    assert fetched.name == "Brake release baseline"
    assert fetched.payload["total_requirements"] == validation_summary.total_requirements
    assert fetched.snapshot_type == "report"
    assert snapshots == []
