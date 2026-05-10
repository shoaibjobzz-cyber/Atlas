from app.services.project_views_service import (
    get_change_impact_review,
    get_project_report_summary,
    get_traceability_health_score,
    get_traceability_broken_chain_analysis,
    get_traceability_critical_path_analysis,
    get_traceability_impact_analysis,
    get_project_validation_summary,
    get_traceability_graph,
    get_traceability_matrix,
)
from app.services.projects_service import create_project
from app.schemas.project import ProjectCreate
from tests.conftest import create_design_parameter, create_requirement


def test_blank_project_views_return_empty_project_scoped_summaries(session) -> None:
    project = create_project(
        session,
        ProjectCreate(
            id="clean-slate",
            name="Clean Slate",
            description="Blank project",
            status="Draft",
        ),
        owner_user_id="user-demo",
    )

    validation = get_project_validation_summary(session, project.id)
    report = get_project_report_summary(session, project.id)
    graph = get_traceability_graph(session, project.id)
    matrix = get_traceability_matrix(session, project.id)

    assert validation.total_requirements == 0
    assert validation.requirements == []
    assert validation.requirements_with_quality_warnings == 0
    assert validation.requirements_with_conflicts == 0
    assert validation.parsing_requirements_with_gaps == 0
    assert report.total_requirements == 0
    assert report.total_warnings == 0
    assert report.conflict_count == 0
    assert report.generated_summary.generated == 0
    assert report.generated_summary.manual == 0
    assert graph.project_id == project.id
    assert graph.nodes == []
    assert graph.edges == []
    assert matrix.project_id == project.id
    assert matrix.rows == []
    health = get_traceability_health_score(session, project.id)
    assert health.score == 0
    assert health.total_requirements == 0


def test_traceability_graph_analysis_returns_project_scoped_intelligence(session) -> None:
    project = create_project(
        session,
        ProjectCreate(
            id="graph-analysis",
            name="Graph Analysis",
            description="Graph analysis project",
            status="Draft",
        ),
        owner_user_id="user-demo",
    )

    parent = create_requirement(
        session,
        requirement_id="req_parent",
        requirement_code="SYS-001",
        project_id=project.id,
        title="Vehicle shall manage braking",
        text="The vehicle shall manage braking torque across the system during all normal operating conditions.",
        subsystem="Controls",
    )
    child = create_requirement(
        session,
        requirement_id="req_child",
        requirement_code="SYS-002",
        project_id=project.id,
        title="Controller shall compute torque demand",
        text="The controller shall compute braking torque demand using vehicle state and pedal inputs during braking events.",
        subsystem="Controls",
    )
    grandchild = create_requirement(
        session,
        requirement_id="req_grandchild",
        requirement_code="SWR-001",
        project_id=project.id,
        title="Software shall validate torque command",
        text="The software shall validate the torque command before sending output to the actuator path.",
        requirement_type="Software",
        subsystem="Software",
    )
    supported = create_requirement(
        session,
        requirement_id="req_supported",
        requirement_code="HWR-001",
        project_id=project.id,
        title="Actuator shall deliver commanded torque",
        text="The actuator shall deliver commanded torque when commanded by the braking controller.",
        requirement_type="Hardware",
        subsystem="Actuation",
    )
    orphan = create_requirement(
        session,
        requirement_id="req_orphan",
        requirement_code="SWR-002",
        project_id=project.id,
        title="Draft software requirement shall be completed",
        text="The draft software requirement shall be completed with traceable evidence before release.",
        requirement_type="Software",
        subsystem="Software",
    )

    child.parent_requirement_id = parent.id
    child.hierarchy = f"{parent.requirement_code}.1"
    grandchild.parent_requirement_id = child.id
    grandchild.hierarchy = f"{child.hierarchy}.1"
    supported.parent_requirement_id = grandchild.id
    supported.hierarchy = f"{grandchild.hierarchy}.1"
    orphan.generation_metadata = {
        "generation_source": "ai",
        "generation_provider": "mock",
        "generated_from_requirement_id": None,
        "is_generated_draft": True,
    }
    session.add_all([child, grandchild, supported, orphan])
    session.commit()

    create_design_parameter(
        session,
        parameter_id="dp_actuator",
        project_id=project.id,
        name="Brake actuator torque",
        parameter_name="max_torque",
        value="1200",
        unit="Nm",
        linked_requirements=[supported],
        subsystem="Actuation",
    )

    parent_impact = get_traceability_impact_analysis(session, project.id, parent.id, direction="both")
    assert parent_impact.selected_requirement_id == parent.id
    assert parent_impact.primary_node_ids == [child.id]
    assert grandchild.id in parent_impact.secondary_node_ids
    assert supported.id in parent_impact.secondary_node_ids

    impact = get_traceability_impact_analysis(session, project.id, child.id, direction="both")
    assert impact.selected_requirement_id == child.id
    assert parent.id in impact.primary_node_ids
    assert grandchild.id in impact.primary_node_ids
    assert supported.id in impact.secondary_node_ids

    grandchild_impact = get_traceability_impact_analysis(session, project.id, grandchild.id, direction="both")
    assert grandchild_impact.selected_requirement_id == grandchild.id
    assert child.id in grandchild_impact.primary_node_ids
    assert supported.id in grandchild_impact.primary_node_ids
    assert parent.id in grandchild_impact.secondary_node_ids

    assert parent_impact.primary_node_ids != impact.primary_node_ids
    assert grandchild_impact.primary_node_ids != impact.primary_node_ids
    assert grandchild_impact.primary_node_ids != parent_impact.primary_node_ids

    broken = get_traceability_broken_chain_analysis(session, project.id, mode="all")
    assert orphan.id in broken.primary_node_ids
    assert supported.id not in broken.primary_node_ids

    critical_path = get_traceability_critical_path_analysis(session, project.id)
    assert critical_path.primary_node_ids[:3] == [parent.id, child.id, grandchild.id]
    assert critical_path.affected_requirement_count >= 3

    health = get_traceability_health_score(session, project.id)
    assert health.total_requirements == 5
    assert 0 <= health.score <= 100
    assert health.evidence_gap_count >= 1


def test_change_impact_review_returns_explainable_direct_and_indirect_results(session) -> None:
    project = create_project(
        session,
        ProjectCreate(
            id="change-review",
            name="Change Review",
            description="Change impact review project",
            status="Draft",
        ),
        owner_user_id="user-demo",
    )

    parent = create_requirement(
        session,
        requirement_id="req_parent_cr",
        requirement_code="BRK-SYS-001",
        project_id=project.id,
        title="Brake system shall manage torque",
        text="The brake system shall manage braking torque across the vehicle under normal conditions.",
        subsystem="Controls",
        parsed_requirement={"parameter": "torque", "value": "1200", "unit": "Nm"},
    )
    child = create_requirement(
        session,
        requirement_id="req_child_cr",
        requirement_code="BRK-SYS-002",
        project_id=project.id,
        title="Controller shall compute torque demand",
        text="The controller shall compute torque demand using pedal input and speed state.",
        subsystem="Controls",
        parsed_requirement={"parameter": "torque", "value": "1200", "unit": "Nm"},
    )
    dependent = create_requirement(
        session,
        requirement_id="req_dependent_cr",
        requirement_code="BRK-SWE-001",
        project_id=project.id,
        title="Software shall validate torque command",
        text="The software shall validate the computed brake command before sending it to the actuator path.",
        requirement_type="Software",
        subsystem="Software",
    )
    unrelated = create_requirement(
        session,
        requirement_id="req_unrelated_cr",
        requirement_code="BRK-HWE-001",
        project_id=project.id,
        title="Housing shall resist corrosion",
        text="The housing shall resist corrosion in wet environments.",
        requirement_type="Hardware",
        subsystem="Mechanical",
    )

    child.parent_requirement_id = parent.id
    child.hierarchy = f"{parent.requirement_code}.1"
    dependent.parent_requirement_id = child.id
    dependent.hierarchy = f"{child.hierarchy}.1"
    session.add_all([child, dependent, unrelated])
    session.commit()

    create_design_parameter(
        session,
        parameter_id="dp_torque_limit",
        project_id=project.id,
        name="Brake torque limit",
        parameter_name="max_torque",
        value="1200",
        unit="Nm",
        linked_requirements=[parent, child],
        subsystem="Controls",
    )

    review = get_change_impact_review(
        session,
        project.id,
        "Increase brake torque limit to 1300 Nm for the controls subsystem.",
    )

    direct_codes = [item.requirement.requirement_code for item in review.direct_matches]
    indirect_codes = [item.requirement.requirement_code for item in review.indirect_impacts]
    likely_edit_codes = [item.requirement.requirement_code for item in review.likely_requirements_needing_edits]

    assert "BRK-SYS-001" in direct_codes
    assert "BRK-SYS-002" in direct_codes
    assert "BRK-SWE-001" in direct_codes or "BRK-SWE-001" in indirect_codes
    assert "BRK-HWE-001" not in direct_codes
    assert any("matched keyword/value/unit" in item.reason for item in review.direct_matches)
    assert any(parameter.parameter_name == "max_torque" for parameter in review.affected_design_parameters)
    assert "BRK-SYS-001" in likely_edit_codes or "BRK-SYS-002" in likely_edit_codes
    assert review.recommended_actions
