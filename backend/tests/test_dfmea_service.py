from app.schemas.dfmea import DfmeaEntryCreate
from app.services.dfmea_service import create_dfmea_entry, get_dfmea_suggestion, list_dfmea_entries_for_requirement
from tests.conftest import create_design_parameter, create_project, create_requirement


def test_dfmea_suggestion_uses_requirement_traceability_quality_and_feasibility(session) -> None:
    create_project(session, project_id="dfmea-project")
    parent = create_requirement(
        session,
        project_id="dfmea-project",
        requirement_id="req-parent",
        requirement_code="SYS-001",
        title="System shall manage brake torque",
        text="The system shall manage brake torque requests within 10 ms during braking mode.",
        subsystem="Controls",
        parsed_requirement={
            "actor": "system",
            "action": "manage",
            "object": "brake torque requests",
            "parameter": "response time",
            "operator": "within",
            "value": "10",
            "unit": "ms",
            "timing": "within 10 ms",
            "condition": "during braking mode",
            "scope": "brake torque requests",
        },
    )
    child = create_requirement(
        session,
        project_id="dfmea-project",
        requirement_id="req-child",
        requirement_code="SWE-001",
        title="Software shall deliver torque command quickly",
        text="The software shall quickly deliver the torque command on the CAN signal.",
        requirement_type="Software",
        subsystem="Software",
    )
    child.parent_requirement_id = parent.id
    child.hierarchy = "SYS-001.1"
    session.add(child)
    session.commit()

    create_design_parameter(
        session,
        parameter_id="dp-time",
        project_id="dfmea-project",
        name="Torque command latency",
        parameter_name="command_latency",
        value="8",
        unit="ms",
        linked_requirements=[parent],
        subsystem="Controls",
    )

    suggestion = get_dfmea_suggestion(session, parent.id)

    assert suggestion.function_candidate == parent.text
    assert suggestion.failure_effect_candidates
    assert suggestion.potential_cause_candidates
    assert suggestion.current_detection_controls_candidate is not None
    assert suggestion.severity_suggestion >= 5
    assert suggestion.related_impacted_requirements


def test_dfmea_entry_create_and_list_for_requirement_computes_rpn(session) -> None:
    create_project(session, project_id="dfmea-project")
    requirement = create_requirement(
        session,
        project_id="dfmea-project",
        requirement_id="req-dfmea",
        requirement_code="SYS-010",
        title="Brake ECU shall arbitrate wheel torque",
        text="The brake ECU shall arbitrate wheel torque requests.",
        subsystem="Controls",
    )

    created = create_dfmea_entry(
        session,
        DfmeaEntryCreate(
            project_id="dfmea-project",
            requirement_id=requirement.id,
            function=requirement.text,
            failure_mode="Torque arbitration unavailable",
            failure_effect="Loss of coordinated braking torque",
            potential_cause="CAN message missing",
            current_prevention_controls="Interface review",
            current_detection_controls="Integration test",
            severity=8,
            occurrence=4,
            detection=3,
            recommended_action="Add bus timeout handling",
            owner="Systems",
            status="Open",
            related_requirement_ids=[],
        ),
    )

    assert created.rpn == 96

    linked = list_dfmea_entries_for_requirement(session, requirement.id)
    assert len(linked) == 1
    assert linked[0].failure_mode == "Torque arbitration unavailable"
    assert linked[0].rpn == 96
