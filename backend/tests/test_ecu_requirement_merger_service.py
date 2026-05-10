from app.schemas.ecu_merger import (
    EcuRequirementMergerAnalyzeRequest,
    EcuRequirementMergerSaveCandidate,
    EcuRequirementMergerSaveRequest,
)
from app.models.requirement import Requirement
from app.services.ecu_requirement_merger_service import (
    analyze_ecu_requirement_merge,
    save_merged_requirement_candidates,
)
from app.services.requirement_generation_provider import generation_metadata
from tests.conftest import create_design_parameter, create_project, create_requirement


def test_ecu_requirement_merger_groups_related_requirements_and_preserves_traceability(session) -> None:
    create_requirement(
        session,
        requirement_id="req-1",
        requirement_code="ECU-SYS-001",
        title="Torque coordinator shall arbitrate brake torque",
        text="The controller shall arbitrate brake torque requests on the CAN signal within 10 ms during normal mode.",
        subsystem="Braking",
        parsed_requirement={
            "actor": "controller",
            "action": "arbitrate",
            "object": "brake torque requests",
            "parameter": "torque",
            "operator": "within",
            "value": "10",
            "unit": "ms",
            "timing": "within 10 ms",
            "condition": "during normal mode",
            "scope": "brake torque requests",
        },
    )
    create_requirement(
        session,
        requirement_id="req-2",
        requirement_code="ECU-SYS-002",
        title="Central timing shall manage brake torque request",
        text="The subsystem shall manage brake torque requests on the CAN bus within 12 ms during normal mode.",
        subsystem="Powertrain",
        parsed_requirement={
            "actor": "subsystem",
            "action": "manage",
            "object": "brake torque requests",
            "parameter": "torque",
            "operator": "within",
            "value": "12",
            "unit": "ms",
            "timing": "within 12 ms",
            "condition": "during normal mode",
            "scope": "brake torque requests",
        },
    )
    create_requirement(
        session,
        requirement_id="req-3",
        requirement_code="ECU-SWE-003",
        title="Security control shall authenticate torque message",
        text="The software shall authenticate the torque CAN message before actuator delivery.",
        requirement_type="Software",
        subsystem="Cybersecurity",
        parsed_requirement={
            "actor": "software",
            "action": "authenticate",
            "object": "torque CAN message",
            "parameter": "torque",
            "operator": None,
            "value": None,
            "unit": None,
            "timing": None,
            "condition": None,
            "scope": "torque CAN message",
        },
    )

    create_design_parameter(
        session,
        parameter_id="dp-1",
        name="Torque arbitration latency",
        parameter_name="latency_limit",
        value="10",
        unit="ms",
        linked_requirements=[],
        subsystem="Braking",
    )
    parameter = create_design_parameter(
        session,
        parameter_id="dp-2",
        name="Brake torque message signal",
        parameter_name="torque_signal",
        value="CAN_TORQUE_REQ",
        unit=None,
        linked_requirements=[],
        subsystem="Networking",
    )
    req_1 = session.get(Requirement, "req-1")
    req_2 = session.get(Requirement, "req-2")
    req_3 = session.get(Requirement, "req-3")
    parameter.linked_requirements = [req_1, req_2, req_3]
    session.add(parameter)
    session.commit()

    response = analyze_ecu_requirement_merge(
        session,
        EcuRequirementMergerAnalyzeRequest(
            project_id="demo-project",
            requirement_ids=["req-1", "req-2", "req-3"],
        ),
    )

    assert response.selected_requirement_count == 3
    assert len(response.candidates) == 1

    candidate = response.candidates[0]
    assert set(candidate.source_requirement_codes) == {"ECU-SYS-001", "ECU-SYS-002", "ECU-SWE-003"}
    assert candidate.generation_metadata.merge_strategy == "deterministic-centralized-ecu-merger-v1"
    assert set(candidate.generation_metadata.merged_from_requirement_ids) == {"req-1", "req-2", "req-3"}
    assert candidate.shared_signals_or_interfaces
    assert candidate.timing_constraints
    assert candidate.recommended_fix_actions
    assert candidate.affected_design_parameters
    assert len(candidate.traceability) == 3


def test_ecu_requirement_merger_save_creates_draft_requirement_with_traceability_metadata(session) -> None:
    create_project(session, project_id="demo-project")
    metadata = generation_metadata(
        generation_source="manual",
        generation_provider=None,
        generated_from_requirement_id=None,
        is_generated_draft=True,
    )
    metadata.merged_from_requirement_ids = ["REQ-A", "REQ-B"]
    metadata.merged_from_requirement_codes = ["SRC-001", "SRC-002"]
    metadata.merged_from_subsystems = ["Braking", "Powertrain"]
    metadata.merge_strategy = "deterministic-centralized-ecu-merger-v1"

    response = save_merged_requirement_candidates(
        session,
        EcuRequirementMergerSaveRequest(
            project_id="demo-project",
            candidates=[
                EcuRequirementMergerSaveCandidate(
                    temp_id="candidate-1",
                    title="Centralized ECU coordination for torque",
                    text="The centralized ECU shall coordinate torque behavior across braking and powertrain requirements.",
                    type="System",
                    priority="High",
                    rationale="Merge related torque requirements into a centralized ECU requirement.",
                    parent_requirement_id=None,
                    subsystem="Centralized ECU",
                    verification_method="Analysis",
                    assumptions="The centralized ECU owns torque arbitration.",
                    generation_metadata=metadata,
                )
            ],
        ),
    )

    assert len(response.saved_requirements) == 1
    saved = response.saved_requirements[0]
    assert saved.subsystem == "Centralized ECU"
    assert saved.generation_metadata is not None
    assert saved.generation_metadata.merge_strategy == "deterministic-centralized-ecu-merger-v1"
    assert saved.generation_metadata.merged_from_requirement_codes == ["SRC-001", "SRC-002"]
