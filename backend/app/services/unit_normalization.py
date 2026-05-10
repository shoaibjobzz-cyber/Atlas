from __future__ import annotations

import re
from dataclasses import dataclass


DEG_C = "\u00b0C"


@dataclass(frozen=True, slots=True)
class UnitDefinition:
    canonical_symbol: str
    dimension: str
    base_unit: str
    to_base_factor: float
    aliases: tuple[str, ...]


UNIT_DEFINITIONS: tuple[UnitDefinition, ...] = (
    UnitDefinition("ms", "time", "s", 0.001, ("millisecond", "milliseconds", "msec", "ms")),
    UnitDefinition("s", "time", "s", 1.0, ("second", "seconds", "sec", "s")),
    UnitDefinition("min", "time", "s", 60.0, ("minute", "minutes", "min")),
    UnitDefinition("h", "time", "s", 3600.0, ("hour", "hours", "hr", "hrs", "h")),
    UnitDefinition("mV", "voltage", "V", 0.001, ("millivolt", "millivolts", "mv")),
    UnitDefinition("V", "voltage", "V", 1.0, ("volt", "volts", "v", "voltage in volt", "voltage in volts")),
    UnitDefinition("Pa", "pressure", "Pa", 1.0, ("pascal", "pascals", "pa")),
    UnitDefinition("kPa", "pressure", "Pa", 1000.0, ("kilopascal", "kilopascals", "kpa")),
    UnitDefinition("mbar", "pressure", "Pa", 100.0, ("millibar", "millibars", "mbar")),
    UnitDefinition("bar", "pressure", "Pa", 100000.0, ("bar", "bars")),
    UnitDefinition("cm", "length", "m", 0.01, ("centimeter", "centimeters", "cm")),
    UnitDefinition("mm", "length", "m", 0.001, ("millimeter", "millimeters", "mm")),
    UnitDefinition("m", "length", "m", 1.0, ("meter", "meters", "m")),
    UnitDefinition("km", "length", "m", 1000.0, ("kilometer", "kilometers", "km")),
    UnitDefinition("mg", "mass", "g", 0.001, ("milligram", "milligrams", "mg")),
    UnitDefinition("g", "mass", "g", 1.0, ("gram", "grams", "g")),
    UnitDefinition("kg", "mass", "g", 1000.0, ("kilogram", "kilograms", "kg")),
    UnitDefinition("m/s", "speed", "m/s", 1.0, ("meter per second", "meters per second", "m/s")),
    UnitDefinition("km/h", "speed", "m/s", 1000.0 / 3600.0, ("kilometer per hour", "kilometers per hour", "km/h")),
    UnitDefinition("N", "force", "N", 1.0, ("newton", "newtons", "n")),
    UnitDefinition("kN", "force", "N", 1000.0, ("kilonewton", "kilonewtons", "kn")),
    UnitDefinition("Nm", "torque", "Nm", 1.0, ("newton meter", "newton meters", "newton-metre", "newton-metres", "nm")),
    UnitDefinition("%", "percent", "%", 1.0, ("percent", "percentage", "pct", "%")),
    UnitDefinition(DEG_C, "temperature", DEG_C, 1.0, ("degree celsius", "degrees celsius", "celsius", "deg c", "degc", "\u00b0c")),
    UnitDefinition("K", "temperature", "K", 1.0, ("kelvin", "k")),
    UnitDefinition("A", "current", "A", 1.0, ("amp", "amps", "ampere", "amperes", "a")),
    UnitDefinition("mA", "current", "A", 0.001, ("milliamp", "milliamps", "milliampere", "milliamperes", "ma")),
    UnitDefinition("W", "power", "W", 1.0, ("watt", "watts", "w")),
    UnitDefinition("kW", "power", "W", 1000.0, ("kilowatt", "kilowatts", "kw")),
    UnitDefinition("mW", "power", "W", 0.001, ("milliwatt", "milliwatts", "mw")),
    UnitDefinition("Hz", "frequency", "Hz", 1.0, ("hertz", "hz")),
    UnitDefinition("kHz", "frequency", "Hz", 1000.0, ("kilohertz", "khz")),
    UnitDefinition("MHz", "frequency", "Hz", 1000000.0, ("megahertz", "mhz")),
    UnitDefinition("GHz", "frequency", "Hz", 1000000000.0, ("gigahertz", "ghz")),
    UnitDefinition("psi", "pressure", "Pa", 6894.757293168, ("psi",)),
    UnitDefinition("MPa", "pressure", "Pa", 1000000.0, ("megapascal", "megapascals", "mpa")),
    UnitDefinition("kV", "voltage", "V", 1000.0, ("kilovolt", "kilovolts", "kv")),
)

UNIT_BY_CANONICAL = {definition.canonical_symbol: definition for definition in UNIT_DEFINITIONS}
ALIAS_TO_CANONICAL = {
    alias: definition.canonical_symbol
    for definition in UNIT_DEFINITIONS
    for alias in definition.aliases
}
UNIT_FAMILIES: dict[str, set[str]] = {}
for definition in UNIT_DEFINITIONS:
    UNIT_FAMILIES.setdefault(definition.dimension, set()).add(definition.canonical_symbol)

_CONTEXT_TOKENS = {
    "in",
    "unit",
    "units",
    "of",
    "value",
    "values",
    "voltage",
    "pressure",
    "temperature",
    "time",
    "timing",
    "response",
    "operating",
    "length",
    "distance",
    "current",
    "power",
    "force",
    "torque",
    "mass",
    "speed",
    "frequency",
}


def _clean_unit_text(value: str | None) -> str:
    if not value:
        return ""
    cleaned = value.strip().replace("\u00a0", " ")
    cleaned = re.sub(r"[_-]+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip().lower()
    return cleaned


def _alias_regex(alias: str) -> str:
    return r"\s+".join(re.escape(part) for part in alias.split())


def engineering_unit_pattern() -> str:
    aliases = sorted(ALIAS_TO_CANONICAL, key=len, reverse=True)
    return "|".join(_alias_regex(alias) for alias in aliases)


ENGINEERING_UNIT_PATTERN = engineering_unit_pattern()


def normalize_engineering_unit(unit: str | None) -> str | None:
    cleaned = _clean_unit_text(unit)
    if not cleaned:
        return None

    canonical = ALIAS_TO_CANONICAL.get(cleaned)
    if canonical:
        return canonical

    for alias, resolved_canonical in ALIAS_TO_CANONICAL.items():
        if re.search(rf"(?<![a-z0-9]){_alias_regex(alias)}(?![a-z0-9])", cleaned):
            remainder = re.sub(
                rf"(?<![a-z0-9]){_alias_regex(alias)}(?![a-z0-9])",
                "",
                cleaned,
            ).strip()
            if not remainder:
                return resolved_canonical
            remainder_tokens = set(re.findall(r"[a-z0-9\u00b0%]+", remainder))
            if remainder_tokens.issubset(_CONTEXT_TOKENS):
                return resolved_canonical

    return cleaned or None


def unit_definition(unit: str | None) -> UnitDefinition | None:
    canonical = normalize_engineering_unit(unit)
    if not canonical:
        return None
    return UNIT_BY_CANONICAL.get(canonical)


def unit_family(unit: str | None) -> str | None:
    definition = unit_definition(unit)
    return definition.dimension if definition else None


def same_unit_family(left: str | None, right: str | None) -> bool:
    left_definition = unit_definition(left)
    right_definition = unit_definition(right)
    if not left_definition or not right_definition:
        return normalize_engineering_unit(left) == normalize_engineering_unit(right) or not left or not right
    return left_definition.dimension == right_definition.dimension


def convert_to_base_unit(value: float | None, unit: str | None) -> tuple[float, str, str] | None:
    if value is None:
        return None
    definition = unit_definition(unit)
    if definition is None:
        return None
    return value * definition.to_base_factor, definition.base_unit, definition.dimension


def convert_value(value: float | None, from_unit: str | None, to_unit: str | None) -> float | None:
    if value is None:
        return None
    from_definition = unit_definition(from_unit)
    to_definition = unit_definition(to_unit)
    if from_definition is None or to_definition is None:
        return None
    if from_definition.dimension != to_definition.dimension:
        return None
    base_value = value * from_definition.to_base_factor
    return base_value / to_definition.to_base_factor


def comparable_values(
    left_value: float | None,
    left_unit: str | None,
    right_value: float | None,
    right_unit: str | None,
) -> tuple[float, float, str] | None:
    left_base = convert_to_base_unit(left_value, left_unit)
    right_base = convert_to_base_unit(right_value, right_unit)
    if left_base is None or right_base is None:
        return None
    if left_base[2] != right_base[2]:
        return None
    return left_base[0], right_base[0], left_base[1]
