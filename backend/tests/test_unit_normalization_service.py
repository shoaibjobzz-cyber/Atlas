from app.services.unit_normalization import comparable_values, convert_value, normalize_engineering_unit


def test_normalize_engineering_units_to_canonical_forms() -> None:
    assert normalize_engineering_unit("milliseconds") == "ms"
    assert normalize_engineering_unit("ms") == "ms"
    assert normalize_engineering_unit("hours") == "h"
    assert normalize_engineering_unit("volts") == "V"
    assert normalize_engineering_unit("voltage in volts") == "V"
    assert normalize_engineering_unit("bars") == "bar"
    assert normalize_engineering_unit("centimeters") == "cm"
    assert normalize_engineering_unit("kilometers") == "km"
    assert normalize_engineering_unit("kilograms") == "kg"
    assert normalize_engineering_unit("kilometer per hour") == "km/h"
    assert normalize_engineering_unit("newtons") == "N"
    assert normalize_engineering_unit("newton meters") == "Nm"
    assert normalize_engineering_unit("degrees Celsius") == "\u00b0C"
    assert normalize_engineering_unit("percent") == "%"


def test_convert_compatible_units_to_shared_base_values() -> None:
    assert convert_value(10.0, "ms", "s") == 0.01
    assert convert_value(1000.0, "milliseconds", "s") == 1.0
    assert convert_value(48.0, "volts", "mV") == 48000.0
    assert convert_value(1.0, "bar", "kPa") == 100.0
    assert convert_value(500.0, "millimeters", "m") == 0.5
    assert convert_value(1000.0, "mA", "A") == 1.0
    assert convert_value(1.0, "kW", "W") == 1000.0
    assert convert_value(1.0, "MPa", "bar") == 10.0
    assert convert_value(100.0, "cm", "m") == 1.0
    assert convert_value(1000.0, "m", "km") == 1.0
    assert convert_value(1000.0, "g", "kg") == 1.0
    assert convert_value(1.0, "kN", "N") == 1000.0
    assert convert_value(1000.0, "Hz", "kHz") == 1.0
    assert convert_value(36.0, "km/h", "m/s") == 10.0


def test_comparable_values_reject_incompatible_dimensions() -> None:
    assert comparable_values(6.0, "bar", 600.0, "kPa") == (600000.0, 600000.0, "Pa")
    assert comparable_values(10.0, "ms", 10.0, "V") is None
