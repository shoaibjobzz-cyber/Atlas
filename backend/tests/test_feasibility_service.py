from app.services.feasibility_service import assess_requirement_feasibility
from app.services.structured_requirement_service import parse_requirement_text

from .conftest import create_design_parameter, create_requirement


def test_feasibility_service_flags_timing_infeasibility(session) -> None:
    text = "At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms."
    requirement = create_requirement(
        session,
        requirement_id="REQ-TIME-1",
        title="Timing target",
        text=text,
        parsed_requirement=parse_requirement_text("Timing target", text).model_dump(),
        subsystem="Hydraulics",
    )

    create_design_parameter(
        session,
        parameter_id="DP-1",
        name="Valve response budget",
        parameter_name="valve_response_time",
        value="8",
        unit="ms",
        linked_requirements=[requirement],
    )
    create_design_parameter(
        session,
        parameter_id="DP-2",
        name="Controller delay",
        parameter_name="controller_delay",
        value="4",
        unit="ms",
        linked_requirements=[requirement],
    )
    create_design_parameter(
        session,
        parameter_id="DP-3",
        name="Hydraulic build-up estimate",
        parameter_name="hydraulic_build_up_estimate",
        value="12",
        unit="ms",
        linked_requirements=[requirement],
    )

    result = assess_requirement_feasibility(session, requirement.id)

    assert result.assessment_status == "likely_infeasible"
    assert result.computed_values["total_time"] == 24.0
    assert result.computed_values["required_time"] == 10.0


def test_feasibility_service_normalizes_milliseconds_equivalence(session) -> None:
    text = "The system shall respond within 10 milliseconds."
    requirement = create_requirement(
        session,
        requirement_id="REQ-TIME-2",
        title="Response timing",
        text=text,
        parsed_requirement=parse_requirement_text("Response timing", text).model_dump(),
        subsystem="Brake Control",
    )

    create_design_parameter(
        session,
        parameter_id="DP-10",
        name="Controller delay",
        parameter_name="controller_delay",
        value="0.008",
        unit="s",
        linked_requirements=[requirement],
    )
    create_design_parameter(
        session,
        parameter_id="DP-11",
        name="Valve response",
        parameter_name="valve_response_time",
        value="2",
        unit="ms",
        linked_requirements=[requirement],
    )

    result = assess_requirement_feasibility(session, requirement.id)

    assert result.assessment_status == "feasible"
    assert result.computed_values["required_time"] == 10.0
    assert result.computed_values["total_time"] == 10.0


def test_feasibility_service_marks_minimum_capability_as_feasible(session) -> None:
    text = "Brake pressure shall be at least 6 bar in normal mode."
    requirement = create_requirement(
        session,
        requirement_id="REQ-MIN-1",
        title="Minimum pressure",
        text=text,
        parsed_requirement=parse_requirement_text("Minimum pressure", text).model_dump(),
        subsystem="Hydraulics",
    )

    create_design_parameter(
        session,
        parameter_id="DP-4",
        name="Brake pressure capability",
        parameter_name="brake_pressure_capability",
        value="8",
        unit="bar",
        linked_requirements=[requirement],
    )

    result = assess_requirement_feasibility(session, requirement.id)

    assert result.assessment_status == "feasible"
    assert result.computed_values["available_value"] == 8.0
    assert result.computed_values["required_value"] == 6.0


def test_feasibility_service_normalizes_voltage_and_temperature_units(session) -> None:
    voltage_text = "Operating voltage shall be at most 48 volts."
    voltage_requirement = create_requirement(
        session,
        requirement_id="REQ-VOLT-1",
        title="Operating voltage",
        text=voltage_text,
        parsed_requirement=parse_requirement_text("Operating voltage", voltage_text).model_dump(),
        subsystem="Controls",
    )
    create_design_parameter(
        session,
        parameter_id="DP-12",
        name="Operating voltage",
        parameter_name="operating_voltage",
        value="48",
        unit="V",
        linked_requirements=[voltage_requirement],
    )

    temp_text = "Fluid temperature shall be at most 90 degrees Celsius."
    temp_requirement = create_requirement(
        session,
        requirement_id="REQ-TEMP-1",
        title="Fluid temperature",
        text=temp_text,
        parsed_requirement=parse_requirement_text("Fluid temperature", temp_text).model_dump(),
        subsystem="Thermal",
    )
    create_design_parameter(
        session,
        parameter_id="DP-13",
        name="Fluid temperature",
        parameter_name="fluid_temperature_limit",
        value="90",
        unit="\u00b0C",
        linked_requirements=[temp_requirement],
    )

    voltage_result = assess_requirement_feasibility(session, voltage_requirement.id)
    temp_result = assess_requirement_feasibility(session, temp_requirement.id)

    assert voltage_result.assessment_status == "feasible"
    assert voltage_result.computed_values["unit"] == "V"
    assert temp_requirement.parsed_requirement["unit"] == "\u00b0C"
    assert temp_result.computed_values["unit"] == "\u00b0C"


def test_feasibility_service_converts_voltage_and_length_units(session) -> None:
    voltage_text = "Operating voltage shall be at most 48 volts."
    voltage_requirement = create_requirement(
        session,
        requirement_id="REQ-VOLT-2",
        title="Operating voltage",
        text=voltage_text,
        parsed_requirement=parse_requirement_text("Operating voltage", voltage_text).model_dump(),
        subsystem="Controls",
    )
    create_design_parameter(
        session,
        parameter_id="DP-20",
        name="Operating voltage",
        parameter_name="operating_voltage",
        value="48000",
        unit="mV",
        linked_requirements=[voltage_requirement],
    )

    length_text = "Pedal travel shall be at least 500 millimeters."
    length_requirement = create_requirement(
        session,
        requirement_id="REQ-LEN-1",
        title="Pedal travel",
        text=length_text,
        parsed_requirement=parse_requirement_text("Pedal travel", length_text).model_dump(),
        subsystem="Mechanics",
    )
    create_design_parameter(
        session,
        parameter_id="DP-21",
        name="Pedal travel",
        parameter_name="pedal_travel",
        value="0.5",
        unit="m",
        linked_requirements=[length_requirement],
    )

    voltage_result = assess_requirement_feasibility(session, voltage_requirement.id)
    length_result = assess_requirement_feasibility(session, length_requirement.id)

    assert voltage_result.assessment_status == "feasible"
    assert voltage_result.computed_values["available_value"] == 48.0
    assert length_result.assessment_status == "feasible"
    assert length_result.computed_values["available_value"] == 500.0


def test_feasibility_service_converts_current_units(session) -> None:
    current_text = "Motor current shall be at most 1000 mA."
    current_requirement = create_requirement(
        session,
        requirement_id="REQ-CUR-1",
        title="Motor current",
        text=current_text,
        parsed_requirement=parse_requirement_text("Motor current", current_text).model_dump(),
        subsystem="Powertrain",
    )
    create_design_parameter(
        session,
        parameter_id="DP-30",
        name="Motor current draw",
        parameter_name="motor_current",
        value="1",
        unit="A",
        linked_requirements=[current_requirement],
    )

    result = assess_requirement_feasibility(session, current_requirement.id)

    assert result.assessment_status == "feasible"
    assert result.computed_values["available_value"] == 1000.0
    assert result.computed_values["unit"] == "mA"


def test_feasibility_service_normalizes_percent_unit_in_parser(session) -> None:
    result = parse_requirement_text(
        "Brake input",
        "The controller shall react within 10 ms at 50 percent pedal input.",
    )

    assert result.unit == "ms"


def test_feasibility_service_returns_insufficient_data_without_linked_evidence(session) -> None:
    text = "The system shall respond within 100 ms."
    requirement = create_requirement(
        session,
        requirement_id="REQ-NODATA-1",
        title="Response time",
        text=text,
        parsed_requirement=parse_requirement_text("Response time", text).model_dump(),
        subsystem="Brake Control",
    )

    result = assess_requirement_feasibility(session, requirement.id)

    assert result.assessment_status == "insufficient_data"
