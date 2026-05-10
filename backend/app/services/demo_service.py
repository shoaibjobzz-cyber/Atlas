from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.design_parameter import DesignParameter
from app.models.project import Project
from app.models.project_feature import ProjectFeature
from app.models.requirement import Requirement
from app.schemas.demo import DemoProjectLoadResponse
from app.services.structured_requirement_service import parse_requirement_text


DEMO_PROJECT_ID = "braking-system"
DEMO_PROJECT_NAME = "Braking System Controls"
DEMO_PROJECT_DESCRIPTION = "Seeded braking-system project used to demonstrate quality checks, parsing, correlation, feasibility, and traceability."

PLATFORM_DEMO_PROJECT_ID = "brake-control-platform"
PLATFORM_DEMO_PROJECT_NAME = "Brake Control Platform"
PLATFORM_DEMO_PROJECT_DESCRIPTION = (
    "Platform-level braking control architecture used to organize multiple braking features."
)


DEMO_REQUIREMENTS = [
    {
        "id": "BRK-STK-001",
        "title": "Predictable brake response",
        "text": "The vehicle shall provide predictable braking response for the driver during normal operation.",
        "type": "Stakeholder",
        "priority": "Critical",
        "status": "In Review",
        "parent_requirement_id": None,
        "subsystem": "Brake Control",
        "verification_method": "Test",
        "rationale": "Driver confidence depends on consistent brake feel and response.",
        "assumptions": "Normal road and vehicle operating conditions apply.",
    },
    {
        "id": "BRK-STK-002",
        "title": "Fast pressure build-up",
        "text": "At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.",
        "type": "Stakeholder",
        "priority": "Critical",
        "status": "In Review",
        "parent_requirement_id": None,
        "subsystem": "Hydraulics",
        "verification_method": "Analysis",
        "rationale": "Brake performance target for early-response evaluation.",
        "assumptions": "Target applies under nominal hydraulic supply conditions.",
    },
    {
        "id": "BRK-SYS-001",
        "title": "Normal-mode minimum pressure",
        "text": "Brake pressure shall be at least 6 bar in normal mode.",
        "type": "System",
        "priority": "High",
        "status": "Approved",
        "parent_requirement_id": None,
        "subsystem": "Hydraulics",
        "verification_method": "Test",
        "rationale": "Minimum line pressure is required for stopping performance.",
        "assumptions": "Normal mode means no active degradation or fault mode.",
    },
    {
        "id": "BRK-SYS-002",
        "title": "Conflicting upper pressure limit",
        "text": "Brake pressure shall be at most 4 bar in normal mode.",
        "type": "System",
        "priority": "High",
        "status": "Draft",
        "parent_requirement_id": None,
        "subsystem": "Hydraulics",
        "verification_method": "Test",
        "rationale": "Legacy placeholder limit retained for review.",
        "assumptions": "Same operating mode as the minimum pressure requirement.",
    },
    {
        "id": "BRK-SYS-003",
        "title": "Response-time limit",
        "text": "The braking system shall limit response time to at most 100 ms in all modes.",
        "type": "System",
        "priority": "High",
        "status": "In Review",
        "parent_requirement_id": None,
        "subsystem": "Brake Control",
        "verification_method": "Analysis",
        "rationale": "Global response-time target for control-path assessment.",
        "assumptions": "All modes includes normal, startup, and degraded modes.",
    },
    {
        "id": "BRK-SYS-004",
        "title": "Conflicting response-time limit",
        "text": "The braking system shall limit response time to at most 250 ms in all modes.",
        "type": "System",
        "priority": "Medium",
        "status": "Draft",
        "parent_requirement_id": None,
        "subsystem": "Brake Control",
        "verification_method": "Analysis",
        "rationale": "Alternative target retained for conflict demonstration.",
        "assumptions": "Applies to the same global response path as SYS-003.",
    },
    {
        "id": "BRK-SUB-001",
        "title": "Valve delay budget",
        "text": "The hydraulic valve subsystem shall respond within 8 ms during normal mode.",
        "type": "Subsystem",
        "priority": "High",
        "status": "Approved",
        "parent_requirement_id": "BRK-STK-002",
        "subsystem": "Hydraulics",
        "verification_method": "Test",
        "rationale": "Valve timing is a main contributor to pressure build-up.",
        "assumptions": "Measured at nominal supply voltage.",
    },
    {
        "id": "BRK-SUB-002",
        "title": "Controller latency",
        "text": "The brake controller shall process a pedal request within 4 ms in normal mode.",
        "type": "Subsystem",
        "priority": "High",
        "status": "Approved",
        "parent_requirement_id": "BRK-STK-002",
        "subsystem": "Brake Control",
        "verification_method": "Analysis",
        "rationale": "Controller delay contributes to end-to-end response.",
        "assumptions": "Processor load remains within design allocation.",
    },
    {
        "id": "BRK-SUB-003",
        "title": "Hydraulic build-up estimate",
        "text": "The hydraulic circuit shall build pressure within 12 ms during normal mode.",
        "type": "Subsystem",
        "priority": "High",
        "status": "Approved",
        "parent_requirement_id": "BRK-STK-002",
        "subsystem": "Hydraulics",
        "verification_method": "Analysis",
        "rationale": "Hydraulic propagation time closes the brake timing budget.",
        "assumptions": "Estimated from current component sizing and line volume.",
    },
    {
        "id": "BRK-SWE-001",
        "title": "Wheel-end monitoring",
        "text": "The software shall monitor wheel-end pressure and log diagnostic deviations during normal and degraded mode.",
        "type": "Software",
        "priority": "Medium",
        "status": "Draft",
        "parent_requirement_id": "BRK-SYS-001",
        "subsystem": "Brake Software",
        "verification_method": "Test",
        "rationale": "Diagnostic logging supports brake-service review.",
        "assumptions": "Wheel-end pressure is available from the sensor interface.",
    },
    {
        "id": "BRK-SWE-002",
        "title": "Weak software wording",
        "text": "The software shall quickly provide user-friendly brake status messages.",
        "type": "Software",
        "priority": "Low",
        "status": "Draft",
        "parent_requirement_id": None,
        "subsystem": "Brake HMI",
        "verification_method": "Inspection",
        "rationale": "Included as a weak wording example for quality checks.",
        "assumptions": "Driver messaging strategy is still under review.",
    },
    {
        "id": "BRK-SWE-003",
        "title": "Weak compound software requirement",
        "text": "The software should robustly detect wheel slip and notify the driver and log the event as needed.",
        "type": "Software",
        "priority": "Medium",
        "status": "Draft",
        "parent_requirement_id": None,
        "subsystem": "Brake Software",
        "verification_method": "Inspection",
        "rationale": "Included as a compound and non-testable example.",
        "assumptions": "Slip thresholds are not yet baselined.",
    },
    {
        "id": "BRK-HWE-001",
        "title": "Operating voltage range",
        "text": "The brake controller hardware shall operate between 9 V and 16 V in normal mode.",
        "type": "Hardware",
        "priority": "High",
        "status": "Approved",
        "parent_requirement_id": None,
        "subsystem": "Brake ECU",
        "verification_method": "Test",
        "rationale": "Voltage operating range defines the hardware power envelope.",
        "assumptions": "Supply transients outside this band are handled separately.",
    },
    {
        "id": "BRK-HWE-002",
        "title": "Conflicting minimum voltage",
        "text": "The brake controller hardware shall operate at least 18 V in normal mode.",
        "type": "Hardware",
        "priority": "Medium",
        "status": "Draft",
        "parent_requirement_id": None,
        "subsystem": "Brake ECU",
        "verification_method": "Test",
        "rationale": "Intentional conflict for deterministic validation demo.",
        "assumptions": "Applies to the same normal operating mode as HWE-001.",
    },
    {
        "id": "BRK-HWE-003",
        "title": "Weak hardware wording",
        "text": "The hardware shall be efficient and robust during startup.",
        "type": "Hardware",
        "priority": "Low",
        "status": "Draft",
        "parent_requirement_id": None,
        "subsystem": "Brake ECU",
        "verification_method": "Inspection",
        "rationale": "Included as a weak requirement example.",
        "assumptions": "Startup behavior still needs measurable targets.",
    },
]


DEMO_DESIGN_PARAMETERS = [
    {
        "id": "BRK-DD-001",
        "name": "Valve response budget",
        "subsystem": "Hydraulics",
        "parameter_name": "valve_response_time",
        "value": "8",
        "unit": "ms",
        "source_document": "Brake Architecture Timing Budget",
        "revision": "A",
        "notes": "Nominal valve response contribution.",
        "requirement_ids": ["BRK-STK-002", "BRK-SUB-001", "BRK-SYS-003"],
    },
    {
        "id": "BRK-DD-002",
        "name": "Controller delay budget",
        "subsystem": "Brake Control",
        "parameter_name": "controller_delay",
        "value": "4",
        "unit": "ms",
        "source_document": "Brake Architecture Timing Budget",
        "revision": "A",
        "notes": "Signal processing contribution.",
        "requirement_ids": ["BRK-STK-002", "BRK-SUB-002", "BRK-SYS-003"],
    },
    {
        "id": "BRK-DD-003",
        "name": "Hydraulic build-up estimate",
        "subsystem": "Hydraulics",
        "parameter_name": "hydraulic_build_up_estimate",
        "value": "12",
        "unit": "ms",
        "source_document": "Hydraulic Simulation Note",
        "revision": "B",
        "notes": "Estimated line build-up contribution.",
        "requirement_ids": ["BRK-STK-002", "BRK-SUB-003", "BRK-SYS-003"],
    },
    {
        "id": "BRK-DD-004",
        "name": "Brake pressure capability",
        "subsystem": "Hydraulics",
        "parameter_name": "brake_pressure_capability",
        "value": "8",
        "unit": "bar",
        "source_document": "Hydraulic Capability Sheet",
        "revision": "A",
        "notes": "Current achievable pressure capability.",
        "requirement_ids": ["BRK-SYS-001", "BRK-SYS-002"],
    },
    {
        "id": "BRK-DD-005",
        "name": "Operating voltage capability",
        "subsystem": "Brake ECU",
        "parameter_name": "operating_voltage",
        "value": "12",
        "unit": "V",
        "source_document": "ECU Power Budget",
        "revision": "C",
        "notes": "Nominal controller supply voltage.",
        "requirement_ids": ["BRK-HWE-001", "BRK-HWE-002"],
    },
    {
        "id": "BRK-DD-006",
        "name": "Pressure sensor response",
        "subsystem": "Brake Software",
        "parameter_name": "pressure_sensor_latency",
        "value": "15",
        "unit": "ms",
        "source_document": "Sensor Interface Note",
        "revision": "A",
        "notes": "Included for additional timing traceability.",
        "requirement_ids": ["BRK-SYS-004", "BRK-SWE-001"],
    },
]

PLATFORM_DEMO_FEATURES = [
    {
        "id": "feature-abs",
        "name": "ABS",
        "kind": "Feature",
        "description": "Anti-lock braking feature for preventing wheel lock.",
        "order_index": 0,
    },
    {
        "id": "feature-esc",
        "name": "ESC",
        "kind": "Feature",
        "description": "Electronic stability control feature.",
        "order_index": 1,
    },
    {
        "id": "feature-traction-control",
        "name": "Traction Control",
        "kind": "Feature",
        "description": "Wheel torque/slip management during acceleration.",
        "order_index": 2,
    },
    {
        "id": "feature-hill-hold",
        "name": "Hill Hold",
        "kind": "Feature",
        "description": "Holds vehicle on incline during launch.",
        "order_index": 3,
    },
    {
        "id": "feature-diagnostics",
        "name": "Diagnostics",
        "kind": "Feature",
        "description": "Fault detection, degraded mode, and warning behavior.",
        "order_index": 4,
    },
]

PLATFORM_DEMO_REQUIREMENTS = [
    {
        "id": "BCP-ABS-001",
        "title": "Wheel slip detection",
        "text": "The braking platform shall detect wheel slip during panic braking.",
        "type": "System",
        "priority": "High",
        "status": "Draft",
        "feature_id": "feature-abs",
        "subsystem": "ABS",
        "verification_method": "Test",
    },
    {
        "id": "BCP-ABS-002",
        "title": "Brake pressure modulation",
        "text": "The braking platform shall modulate brake pressure to prevent wheel lock.",
        "type": "System",
        "priority": "High",
        "status": "Draft",
        "feature_id": "feature-abs",
        "subsystem": "ABS",
        "verification_method": "Analysis",
    },
    {
        "id": "BCP-ESC-001",
        "title": "Lateral instability detection",
        "text": "The braking platform shall detect lateral instability using vehicle dynamics signals.",
        "type": "System",
        "priority": "High",
        "status": "Draft",
        "feature_id": "feature-esc",
        "subsystem": "ESC",
        "verification_method": "Analysis",
    },
    {
        "id": "BCP-ESC-002",
        "title": "Corrective braking torque request",
        "text": "The braking platform shall request corrective braking torque during instability events.",
        "type": "System",
        "priority": "High",
        "status": "Draft",
        "feature_id": "feature-esc",
        "subsystem": "ESC",
        "verification_method": "Test",
    },
    {
        "id": "BCP-TCS-001",
        "title": "Driven-wheel slip detection",
        "text": "The braking platform shall detect excessive driven-wheel slip during acceleration.",
        "type": "System",
        "priority": "High",
        "status": "Draft",
        "feature_id": "feature-traction-control",
        "subsystem": "Traction Control",
        "verification_method": "Analysis",
    },
    {
        "id": "BCP-TCS-002",
        "title": "Brake intervention request",
        "text": "The braking platform shall request brake intervention to reduce wheel slip.",
        "type": "System",
        "priority": "High",
        "status": "Draft",
        "feature_id": "feature-traction-control",
        "subsystem": "Traction Control",
        "verification_method": "Test",
    },
    {
        "id": "BCP-HHL-001",
        "title": "Hill-start pressure hold",
        "text": "The braking platform shall maintain brake pressure during hill-start conditions.",
        "type": "System",
        "priority": "Medium",
        "status": "Draft",
        "feature_id": "feature-hill-hold",
        "subsystem": "Hill Hold",
        "verification_method": "Test",
    },
    {
        "id": "BCP-HHL-002",
        "title": "Launch intent release",
        "text": "The braking platform shall release brake pressure when launch intent is detected.",
        "type": "System",
        "priority": "Medium",
        "status": "Draft",
        "feature_id": "feature-hill-hold",
        "subsystem": "Hill Hold",
        "verification_method": "Analysis",
    },
    {
        "id": "BCP-DIA-001",
        "title": "Wheel-speed sensor fault detection",
        "text": "The braking platform shall detect wheel-speed sensor faults.",
        "type": "System",
        "priority": "High",
        "status": "Draft",
        "feature_id": "feature-diagnostics",
        "subsystem": "Diagnostics",
        "verification_method": "Analysis",
    },
    {
        "id": "BCP-DIA-002",
        "title": "Degraded braking warning",
        "text": "The braking platform shall provide a driver warning when braking control is degraded.",
        "type": "System",
        "priority": "High",
        "status": "Draft",
        "feature_id": "feature-diagnostics",
        "subsystem": "Diagnostics",
        "verification_method": "Test",
    },
]


def _reset_project_contents(session: Session, project_id: str) -> None:
    existing_design_parameters = list(
        session.scalars(select(DesignParameter).where(DesignParameter.project_id == project_id)).all()
    )
    for design_parameter in existing_design_parameters:
        session.delete(design_parameter)

    existing_requirements = list(
        session.scalars(select(Requirement).where(Requirement.project_id == project_id)).all()
    )
    for requirement in existing_requirements:
        session.delete(requirement)

    existing_features = list(
        session.scalars(select(ProjectFeature).where(ProjectFeature.project_id == project_id)).all()
    )
    for feature in existing_features:
        session.delete(feature)

    session.flush()


def load_braking_system_demo(session: Session, owner_user_id: str) -> DemoProjectLoadResponse:
    project = session.get(Project, DEMO_PROJECT_ID)
    if project is None:
        project = Project(
            id=DEMO_PROJECT_ID,
            owner_user_id=owner_user_id,
            name=DEMO_PROJECT_NAME,
            description=DEMO_PROJECT_DESCRIPTION,
            status="In Review",
        )
        session.add(project)
    else:
        if project.owner_user_id != owner_user_id:
            project.owner_user_id = owner_user_id
        project.name = DEMO_PROJECT_NAME
        project.description = DEMO_PROJECT_DESCRIPTION
        project.status = "In Review"
        project.project_kind = "Standard"

    _reset_project_contents(session, DEMO_PROJECT_ID)

    requirement_lookup: dict[str, Requirement] = {}
    for item in DEMO_REQUIREMENTS:
        requirement = Requirement(
            id=item["id"],
            requirement_code=item["id"],
            project_id=DEMO_PROJECT_ID,
            title=item["title"],
            text=item["text"],
            type=item["type"],
            priority=item["priority"],
            status=item["status"],
            parent_requirement_id=item["parent_requirement_id"],
            subsystem=item["subsystem"],
            verification_method=item["verification_method"],
            rationale=item["rationale"],
            assumptions=item["assumptions"],
            parsed_requirement=parse_requirement_text(item["title"], item["text"]).model_dump(),
            generation_metadata=None,
            hierarchy=item["id"],
            created_by_user_id=owner_user_id,
            updated_by_user_id=None,
            deleted_by_user_id=None,
            deleted_at=None,
            is_deleted=False,
        )
        session.add(requirement)
        requirement_lookup[requirement.id] = requirement

    session.flush()

    for item in DEMO_DESIGN_PARAMETERS:
        design_parameter = DesignParameter(
            id=item["id"],
            project_id=DEMO_PROJECT_ID,
            name=item["name"],
            subsystem=item["subsystem"],
            parameter_name=item["parameter_name"],
            value=item["value"],
            unit=item["unit"],
            source_document=item["source_document"],
            revision=item["revision"],
            notes=item["notes"],
        )
        design_parameter.linked_requirements = [requirement_lookup[requirement_id] for requirement_id in item["requirement_ids"]]
        session.add(design_parameter)

    session.commit()

    return DemoProjectLoadResponse(
        project_id=DEMO_PROJECT_ID,
        project_name=DEMO_PROJECT_NAME,
        requirements_loaded=len(DEMO_REQUIREMENTS),
        design_parameters_loaded=len(DEMO_DESIGN_PARAMETERS),
    )


def load_brake_control_platform_demo(session: Session, owner_user_id: str) -> DemoProjectLoadResponse:
    project = session.get(Project, PLATFORM_DEMO_PROJECT_ID)
    if project is None:
        project = Project(
            id=PLATFORM_DEMO_PROJECT_ID,
            owner_user_id=owner_user_id,
            name=PLATFORM_DEMO_PROJECT_NAME,
            description=PLATFORM_DEMO_PROJECT_DESCRIPTION,
            status="In Review",
            project_kind="Platform",
        )
        session.add(project)
    else:
        if project.owner_user_id != owner_user_id:
            project.owner_user_id = owner_user_id
        project.name = PLATFORM_DEMO_PROJECT_NAME
        project.description = PLATFORM_DEMO_PROJECT_DESCRIPTION
        project.status = "In Review"
        project.project_kind = "Platform"

    _reset_project_contents(session, PLATFORM_DEMO_PROJECT_ID)

    for feature_item in PLATFORM_DEMO_FEATURES:
        session.add(
            ProjectFeature(
                id=feature_item["id"],
                project_id=PLATFORM_DEMO_PROJECT_ID,
                parent_feature_id=None,
                name=feature_item["name"],
                kind=feature_item["kind"],
                description=feature_item["description"],
                order_index=feature_item["order_index"],
            )
        )

    session.flush()

    for item in PLATFORM_DEMO_REQUIREMENTS:
        session.add(
            Requirement(
                id=item["id"],
                requirement_code=item["id"],
                project_id=PLATFORM_DEMO_PROJECT_ID,
                title=item["title"],
                text=item["text"],
                type=item["type"],
                priority=item["priority"],
                status=item["status"],
                parent_requirement_id=None,
                feature_id=item["feature_id"],
                subsystem=item["subsystem"],
                verification_method=item["verification_method"],
                rationale=f"Seeded requirement for the {item['subsystem']} feature workspace.",
                assumptions="Platform feature baseline for hierarchy verification.",
                parsed_requirement=parse_requirement_text(item["title"], item["text"]).model_dump(),
                generation_metadata=None,
                hierarchy=item["id"],
                created_by_user_id=owner_user_id,
                updated_by_user_id=None,
                deleted_by_user_id=None,
                deleted_at=None,
                is_deleted=False,
            )
        )

    session.commit()

    return DemoProjectLoadResponse(
        project_id=PLATFORM_DEMO_PROJECT_ID,
        project_name=PLATFORM_DEMO_PROJECT_NAME,
        requirements_loaded=len(PLATFORM_DEMO_REQUIREMENTS),
        design_parameters_loaded=0,
    )
