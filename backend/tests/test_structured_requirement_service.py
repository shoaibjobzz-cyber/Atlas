from app.services.structured_requirement_service import parse_requirement_text


def test_parser_extracts_measurable_requirement_fields() -> None:
    result = parse_requirement_text(
        "Brake pressure target",
        "Brake pressure shall be at least 6 bar in normal mode.",
    )

    assert result.actor == "Brake pressure"
    assert result.operator == "at least"
    assert result.value == "6"
    assert result.unit == "bar"
    assert result.scope == "Brake pressure"


def test_parser_normalizes_equivalent_engineering_units() -> None:
    milliseconds = parse_requirement_text(
        "Response time",
        "The system shall respond within 10 milliseconds.",
    )
    volts = parse_requirement_text(
        "Operating voltage",
        "The controller shall operate at 48 volts.",
    )
    temperature = parse_requirement_text(
        "Temperature limit",
        "The heater shall remain below 90 degrees Celsius during brew mode.",
    )
    percentage = parse_requirement_text(
        "Pedal input",
        "The brake controller shall react at 50 percent pedal input.",
    )

    assert milliseconds.unit == "ms"
    assert volts.unit == "V"
    assert temperature.unit == "\u00b0C"
    assert percentage.unit == "%"
