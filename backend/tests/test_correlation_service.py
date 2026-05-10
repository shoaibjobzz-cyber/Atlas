from app.services.correlation_service import get_requirement_correlations

from .conftest import create_requirement


def test_correlation_service_detects_conflicting_bounds(session) -> None:
    target_text = "Brake pressure shall be at least 6 bar in normal mode."
    other_text = "Brake pressure shall be at most 4 bar in normal mode."

    create_requirement(
        session,
        requirement_id="REQ-1",
        title="Minimum pressure",
        text=target_text,
        subsystem="Hydraulics",
        parsed_requirement={
            "actor": "Brake pressure",
            "action": "be",
            "object": None,
            "parameter": "pressure",
            "operator": "at least",
            "value": "6",
            "unit": "bar",
            "timing": None,
            "condition": "during normal mode",
            "scope": "Brake pressure",
        },
    )
    create_requirement(
        session,
        requirement_id="REQ-2",
        title="Maximum pressure",
        text=other_text,
        subsystem="Hydraulics",
        parsed_requirement={
            "actor": "Brake pressure",
            "action": "be",
            "object": None,
            "parameter": "pressure",
            "operator": "at most",
            "value": "4",
            "unit": "bar",
            "timing": None,
            "condition": "during normal mode",
            "scope": "Brake pressure",
        },
    )

    result = get_requirement_correlations(session, "REQ-1")

    assert any(item.requirement and item.requirement.requirement_code == "REQ-2" for item in result.related_requirements)
    assert any(item.requirement and item.requirement.requirement_code == "REQ-2" for item in result.potential_conflicts)


def test_correlation_service_treats_unit_variants_as_equivalent(session) -> None:
    create_requirement(
        session,
        requirement_id="REQ-10",
        title="Nominal voltage",
        text="Supply voltage shall be at least 48 volts in normal mode.",
        subsystem="Controls",
        parsed_requirement={
            "actor": "Supply voltage",
            "action": "be",
            "object": None,
            "parameter": "voltage",
            "operator": "at least",
            "value": "48",
            "unit": "volts",
            "timing": None,
            "condition": "during normal mode",
            "scope": "Supply voltage",
        },
    )
    create_requirement(
        session,
        requirement_id="REQ-11",
        title="Conflicting voltage bound",
        text="Supply voltage shall be at most 24 V in normal mode.",
        subsystem="Controls",
        parsed_requirement={
            "actor": "Supply voltage",
            "action": "be",
            "object": None,
            "parameter": "voltage",
            "operator": "at most",
            "value": "24",
            "unit": "V",
            "timing": None,
            "condition": "during normal mode",
            "scope": "Supply voltage",
        },
    )

    result = get_requirement_correlations(session, "REQ-10")

    assert any(item.requirement and item.requirement.requirement_code == "REQ-11" for item in result.related_requirements)
    assert any(item.requirement and item.requirement.requirement_code == "REQ-11" for item in result.potential_conflicts)


def test_correlation_service_compares_pressure_values_across_compatible_units(session) -> None:
    create_requirement(
        session,
        requirement_id="REQ-20",
        title="Pressure floor",
        text="Brake pressure shall be at least 6 bar in normal mode.",
        subsystem="Hydraulics",
        parsed_requirement={
            "actor": "Brake pressure",
            "action": "be",
            "object": None,
            "parameter": "pressure",
            "operator": "at least",
            "value": "6",
            "unit": "bar",
            "timing": None,
            "condition": "during normal mode",
            "scope": "Brake pressure",
        },
    )
    create_requirement(
        session,
        requirement_id="REQ-21",
        title="Pressure cap",
        text="Brake pressure shall be at most 500 kPa in normal mode.",
        subsystem="Hydraulics",
        parsed_requirement={
            "actor": "Brake pressure",
            "action": "be",
            "object": None,
            "parameter": "pressure",
            "operator": "at most",
            "value": "500",
            "unit": "kPa",
            "timing": None,
            "condition": "during normal mode",
            "scope": "Brake pressure",
        },
    )

    result = get_requirement_correlations(session, "REQ-20")

    assert any(item.requirement and item.requirement.requirement_code == "REQ-21" for item in result.related_requirements)
    assert any(item.requirement and item.requirement.requirement_code == "REQ-21" for item in result.potential_conflicts)


def test_correlation_service_does_not_compare_incompatible_dimensions(session) -> None:
    create_requirement(
        session,
        requirement_id="REQ-30",
        title="Timing bound",
        text="The system shall respond within 10 ms.",
        subsystem="Controls",
        parsed_requirement={
            "actor": "The system",
            "action": "respond",
            "object": None,
            "parameter": "response time",
            "operator": "within",
            "value": "10",
            "unit": "ms",
            "timing": None,
            "condition": None,
            "scope": "The system",
        },
    )
    create_requirement(
        session,
        requirement_id="REQ-31",
        title="Voltage bound",
        text="Supply voltage shall be at most 10 V.",
        subsystem="Controls",
        parsed_requirement={
            "actor": "Supply voltage",
            "action": "be",
            "object": None,
            "parameter": "voltage",
            "operator": "at most",
            "value": "10",
            "unit": "V",
            "timing": None,
            "condition": None,
            "scope": "Supply voltage",
        },
    )

    result = get_requirement_correlations(session, "REQ-30")

    assert not any(item.requirement and item.requirement.requirement_code == "REQ-31" for item in result.potential_conflicts)


def test_correlation_service_compares_speed_values_across_new_units(session) -> None:
    create_requirement(
        session,
        requirement_id="REQ-40",
        title="Vehicle speed floor",
        text="Vehicle speed shall be at least 36 km/h during cruise mode.",
        subsystem="Controls",
        parsed_requirement={
            "actor": "Vehicle speed",
            "action": "be",
            "object": None,
            "parameter": "speed",
            "operator": "at least",
            "value": "36",
            "unit": "km/h",
            "timing": None,
            "condition": "during cruise mode",
            "scope": "Vehicle speed",
        },
    )
    create_requirement(
        session,
        requirement_id="REQ-41",
        title="Vehicle speed cap",
        text="Vehicle speed shall be at most 9 m/s during cruise mode.",
        subsystem="Controls",
        parsed_requirement={
            "actor": "Vehicle speed",
            "action": "be",
            "object": None,
            "parameter": "speed",
            "operator": "at most",
            "value": "9",
            "unit": "m/s",
            "timing": None,
            "condition": "during cruise mode",
            "scope": "Vehicle speed",
        },
    )

    result = get_requirement_correlations(session, "REQ-40")

    assert any(item.requirement and item.requirement.requirement_code == "REQ-41" for item in result.related_requirements)
    assert any(item.requirement and item.requirement.requirement_code == "REQ-41" for item in result.potential_conflicts)
