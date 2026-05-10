import re

from app.schemas.structured_requirement import StructuredRequirementFields
from app.services.unit_normalization import ENGINEERING_UNIT_PATTERN, normalize_engineering_unit


OPERATOR_PATTERNS = (
    ("<=", "<="),
    (">=", ">="),
    ("<", "<"),
    (">", ">"),
    ("=", "="),
    ("at least", "at least"),
    ("at most", "at most"),
    ("less than", "less than"),
    ("greater than", "greater than"),
    ("no more than", "no more than"),
    ("no less than", "no less than"),
    ("within", "within"),
    ("under", "under"),
    ("over", "over"),
    ("equal to", "equal to"),
)
ACTION_VERBS = (
    "detect",
    "measure",
    "heat",
    "cool",
    "dispense",
    "store",
    "transmit",
    "receive",
    "display",
    "control",
    "monitor",
    "limit",
    "maintain",
    "prevent",
    "allow",
    "record",
    "calculate",
    "generate",
    "open",
    "close",
    "start",
    "stop",
    "read",
    "write",
    "log",
    "report",
    "provide",
    "operate",
    "support",
)


def _normalize_spacing(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _extract_condition(text: str) -> str | None:
    match = re.search(r"\b(if|when|while|during|unless)\b(.+?)(?:,|$)", text, re.IGNORECASE)
    if match:
        return _normalize_spacing(match.group(0))
    return None


def _extract_timing(text: str) -> str | None:
    match = re.search(
        r"\b(within|before|after|during|for)\b\s+([^.]+?)(?:,|\.|$)",
        text,
        re.IGNORECASE,
    )
    if match:
        return _normalize_spacing(match.group(0))
    return None


def _extract_numeric(text: str) -> tuple[str | None, str | None, str | None]:
    operator = None
    for pattern, normalized in OPERATOR_PATTERNS:
        if pattern in {"<=", ">=", "<", ">", "="}:
            if pattern in text:
                operator = normalized
                break
        elif re.search(rf"\b{re.escape(pattern)}\b", text, re.IGNORECASE):
            operator = normalized
            break

    value_match = re.search(r"\b(\d+(?:\.\d+)?)\b", text)
    if not value_match:
        return operator, None, None

    value = value_match.group(1)
    unit_match = re.search(
        rf"{re.escape(value)}\s*({ENGINEERING_UNIT_PATTERN})",
        text,
        re.IGNORECASE,
    )
    unit = normalize_engineering_unit(unit_match.group(1)) if unit_match else None
    return operator, value, unit


def _extract_parameter(text: str, value: str | None) -> str | None:
    if not value:
        return None

    prefix = text[: text.lower().find(value.lower())]
    tokens = re.findall(r"[A-Za-z0-9_-]+", prefix)
    if not tokens:
        return None
    return _normalize_spacing(" ".join(tokens[-3:]))


def _extract_actor_scope_and_clause(text: str) -> tuple[str | None, str | None, str]:
    match = re.search(r"^(.*?)(?:\bshall\b|\bmust\b|\bshould\b)\s+(.*)$", text, re.IGNORECASE)
    if match:
        actor = _normalize_spacing(match.group(1).strip(" ,"))
        clause = _normalize_spacing(match.group(2))
        return actor or None, actor or None, clause
    return None, None, text


def _extract_action_and_object(clause: str) -> tuple[str | None, str | None]:
    tokens = clause.split()
    if not tokens:
        return None, None

    action_index = 0
    for index, token in enumerate(tokens):
        clean = re.sub(r"[^A-Za-z-]", "", token).lower()
        if clean in ACTION_VERBS or clean.endswith("e") or clean.endswith("ate") or clean.endswith("fy"):
            action_index = index
            break

    action = re.sub(r"[^A-Za-z-]", "", tokens[action_index]) or None
    remaining = tokens[action_index + 1 :]
    if not remaining:
        return action, None

    object_tokens: list[str] = []
    for token in remaining:
        clean = token.strip(",.")
        if clean.lower() in {"if", "when", "while", "during", "within", "before", "after", "for"}:
            break
        if re.match(r"\d", clean):
            break
        object_tokens.append(clean)

    requirement_object = _normalize_spacing(" ".join(object_tokens)) if object_tokens else None
    return action, requirement_object


def parse_requirement_text(title: str, text: str) -> StructuredRequirementFields:
    source = _normalize_spacing(text or title)
    actor, scope, clause = _extract_actor_scope_and_clause(source)
    condition = _extract_condition(source)
    timing = _extract_timing(source)
    operator, value, unit = _extract_numeric(source)
    parameter = _extract_parameter(source, value)
    action, requirement_object = _extract_action_and_object(clause)

    return StructuredRequirementFields(
        actor=actor,
        action=action,
        object=requirement_object,
        parameter=parameter,
        operator=operator,
        value=value,
        unit=unit,
        timing=timing,
        condition=condition,
        scope=scope,
    )
