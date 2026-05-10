import re

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.project_requirement_sequence import ProjectRequirementSequence
from app.models.requirement import Requirement
from app.schemas.requirement import RequirementType


TYPE_PREFIX_MAP: dict[RequirementType, str] = {
    "Stakeholder": "SHR",
    "System": "SYS",
    "Subsystem": "SUB",
    "Software": "SWR",
    "Hardware": "HWR",
}

SEQUENCE_WIDTH = 3
ALLOCATION_RETRY_LIMIT = 3


class RequirementIdGenerationError(Exception):
    pass


def prefix_for_requirement_type(requirement_type: RequirementType) -> str:
    try:
        return TYPE_PREFIX_MAP[requirement_type]
    except KeyError as error:
        raise RequirementIdGenerationError(
            f"Unsupported requirement type '{requirement_type}' for ID generation."
        ) from error


def _matching_sequence(requirement_code: str, prefix: str) -> int | None:
    match = re.fullmatch(rf"{re.escape(prefix)}-(\d+)", requirement_code)
    if match is None:
        return None
    return int(match.group(1))


def _format_requirement_code(prefix: str, sequence: int) -> str:
    return f"{prefix}-{sequence:0{SEQUENCE_WIDTH}d}"


def _next_available_sequence(session: Session, project_id: str, prefix: str, starting_sequence: int) -> int:
    sequence = starting_sequence
    while session.scalar(
        select(Requirement.id).where(
            Requirement.project_id == project_id,
            Requirement.requirement_code == _format_requirement_code(prefix, sequence),
        )
    ):
        sequence += 1
    return sequence


def _highest_existing_sequence(session: Session, project_id: str, requirement_type: RequirementType, prefix: str) -> int:
    statement = select(Requirement.requirement_code).where(
        Requirement.project_id == project_id,
        Requirement.type == requirement_type,
    )
    existing_codes = list(session.scalars(statement).all())
    matching_sequences = [
        sequence
        for requirement_code in existing_codes
        if (sequence := _matching_sequence(requirement_code, prefix)) is not None
    ]
    return max(matching_sequences, default=0)


def preview_next_requirement_id(session: Session, project_id: str, requirement_type: RequirementType) -> str:
    prefix = prefix_for_requirement_type(requirement_type)
    sequence_row = session.get(ProjectRequirementSequence, (project_id, requirement_type))
    baseline_sequence = _highest_existing_sequence(session, project_id, requirement_type, prefix) + 1
    if sequence_row is not None:
        next_sequence = _next_available_sequence(
            session,
            project_id,
            prefix,
            max(sequence_row.next_value, baseline_sequence),
        )
        return _format_requirement_code(prefix, next_sequence)

    next_sequence = _next_available_sequence(
        session,
        project_id,
        prefix,
        baseline_sequence,
    )
    return _format_requirement_code(prefix, next_sequence)


def allocate_requirement_id(session: Session, project_id: str, requirement_type: RequirementType) -> str:
    prefix = prefix_for_requirement_type(requirement_type)

    for _ in range(ALLOCATION_RETRY_LIMIT):
        try:
            with session.begin_nested():
                statement = (
                    select(ProjectRequirementSequence)
                    .where(ProjectRequirementSequence.project_id == project_id)
                    .where(ProjectRequirementSequence.requirement_type == requirement_type)
                    .with_for_update()
                )
                sequence_row = session.scalars(statement).first()
                baseline_sequence = _highest_existing_sequence(session, project_id, requirement_type, prefix) + 1

                if sequence_row is None:
                    next_sequence = _next_available_sequence(
                        session,
                        project_id,
                        prefix,
                        baseline_sequence,
                    )
                    sequence_row = ProjectRequirementSequence(
                        project_id=project_id,
                        requirement_type=requirement_type,
                        next_value=next_sequence + 1,
                    )
                    session.add(sequence_row)
                    session.flush()
                    return _format_requirement_code(prefix, next_sequence)

                starting_sequence = max(sequence_row.next_value, baseline_sequence)
                allocated_value = _next_available_sequence(session, project_id, prefix, starting_sequence)
                sequence_row.next_value = allocated_value + 1
                session.add(sequence_row)
                session.flush()
                return _format_requirement_code(prefix, allocated_value)
        except IntegrityError:
            session.expire_all()

    raise RequirementIdGenerationError(
        f"Unable to allocate a requirement ID for project '{project_id}' and type '{requirement_type}'."
    )
