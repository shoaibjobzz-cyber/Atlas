from __future__ import annotations

from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.design_parameter import DesignParameter
from app.models.dfmea_entry import DfmeaEntry
from app.models.requirement import Requirement
from app.schemas.dfmea import (
    DfmeaEntryCreate,
    DfmeaEntryResponse,
    DfmeaEntryUpdate,
    DfmeaFilterResponse,
    DfmeaRiskReference,
    DfmeaSuggestionResponse,
)
from app.schemas.quality import RequirementQualityCheckRequest
from app.services.correlation_service import get_requirement_correlations
from app.services.design_parameters_service import list_design_parameters_for_requirement
from app.services.feasibility_service import assess_requirement_with_design_parameters
from app.services.projects_service import ensure_project_exists
from app.services.quality_service import evaluate_requirement_quality
from app.services.requirements_service import get_requirement, list_requirements


class DfmeaEntryNotFoundError(Exception):
    pass


class DfmeaEntryConflictError(Exception):
    pass


def _base_statement():
    return select(DfmeaEntry).options(
        selectinload(DfmeaEntry.requirement),
        selectinload(DfmeaEntry.created_by_user),
        selectinload(DfmeaEntry.updated_by_user),
    )


def _generate_dfmea_id() -> str:
    return f"dfmea_{uuid4().hex}"


def _requirement_by_id(session: Session, requirement_ids: list[str]) -> dict[str, Requirement]:
    if not requirement_ids:
        return {}
    statement = (
        select(Requirement)
        .where(Requirement.id.in_(requirement_ids))
        .where(Requirement.is_deleted.is_(False))
    )
    requirements = list(session.scalars(statement).all())
    return {requirement.id: requirement for requirement in requirements}


def _to_response(session: Session, entry: DfmeaEntry) -> DfmeaEntryResponse:
    related_by_id = _requirement_by_id(session, entry.related_requirement_ids or [])
    return DfmeaEntryResponse(
        id=entry.id,
        project_id=entry.project_id,
        requirement_id=entry.requirement_id,
        function=entry.function,
        failure_mode=entry.failure_mode,
        failure_effect=entry.failure_effect,
        potential_cause=entry.potential_cause,
        current_prevention_controls=entry.current_prevention_controls,
        current_detection_controls=entry.current_detection_controls,
        severity=entry.severity,
        occurrence=entry.occurrence,
        detection=entry.detection,
        recommended_action=entry.recommended_action,
        owner=entry.owner,
        status=entry.status,
        related_requirement_ids=entry.related_requirement_ids or [],
        requirement=entry.requirement,
        related_requirements=[related_by_id[requirement_id] for requirement_id in entry.related_requirement_ids or [] if requirement_id in related_by_id],
        created_by_user_id=entry.created_by_user_id,
        updated_by_user_id=entry.updated_by_user_id,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )


def list_dfmea_entries(
    session: Session,
    project_id: str,
    owner_user_id: str | None = None,
) -> list[DfmeaEntryResponse]:
    ensure_project_exists(session, project_id, owner_user_id)
    entries = list(
        session.scalars(
            _base_statement()
            .where(DfmeaEntry.project_id == project_id)
            .order_by(DfmeaEntry.updated_at.desc())
        ).all()
    )
    return [_to_response(session, entry) for entry in entries]


def get_dfmea_entry(
    session: Session,
    dfmea_entry_id: str,
    owner_user_id: str | None = None,
) -> DfmeaEntryResponse:
    entry = session.scalars(_base_statement().where(DfmeaEntry.id == dfmea_entry_id)).first()
    if entry is None:
        raise DfmeaEntryNotFoundError(f"DFMEA entry '{dfmea_entry_id}' was not found.")
    ensure_project_exists(session, entry.project_id, owner_user_id)
    return _to_response(session, entry)


def list_dfmea_entries_for_requirement(
    session: Session,
    requirement_id: str,
    owner_user_id: str | None = None,
) -> list[DfmeaEntryResponse]:
    requirement = get_requirement(session, requirement_id, owner_user_id)
    entries = list(
        session.scalars(
            _base_statement()
            .where(DfmeaEntry.requirement_id == requirement.id)
            .order_by(DfmeaEntry.updated_at.desc())
        ).all()
    )
    return [_to_response(session, entry) for entry in entries]


def create_dfmea_entry(
    session: Session,
    payload: DfmeaEntryCreate,
    owner_user_id: str | None = None,
) -> DfmeaEntryResponse:
    requirement = get_requirement(session, payload.requirement_id, owner_user_id)
    ensure_project_exists(session, payload.project_id, owner_user_id)
    if requirement.project_id != payload.project_id:
        raise DfmeaEntryConflictError("The linked requirement must belong to the same project as the DFMEA entry.")

    entry_id = payload.id or _generate_dfmea_id()
    while session.get(DfmeaEntry, entry_id) is not None:
        entry_id = _generate_dfmea_id()

    entry = DfmeaEntry(
        id=entry_id,
        project_id=payload.project_id,
        requirement_id=payload.requirement_id,
        function=payload.function,
        failure_mode=payload.failure_mode,
        failure_effect=payload.failure_effect,
        potential_cause=payload.potential_cause,
        current_prevention_controls=payload.current_prevention_controls,
        current_detection_controls=payload.current_detection_controls,
        severity=payload.severity,
        occurrence=payload.occurrence,
        detection=payload.detection,
        recommended_action=payload.recommended_action,
        owner=payload.owner,
        status=payload.status,
        related_requirement_ids=payload.related_requirement_ids,
        created_by_user_id=owner_user_id or requirement.created_by_user_id,
        updated_by_user_id=None,
    )
    session.add(entry)
    session.commit()
    return get_dfmea_entry(session, entry.id, owner_user_id)


def update_dfmea_entry(
    session: Session,
    dfmea_entry_id: str,
    payload: DfmeaEntryUpdate,
    owner_user_id: str | None = None,
) -> DfmeaEntryResponse:
    entry = session.scalars(_base_statement().where(DfmeaEntry.id == dfmea_entry_id)).first()
    if entry is None:
        raise DfmeaEntryNotFoundError(f"DFMEA entry '{dfmea_entry_id}' was not found.")
    requirement = get_requirement(session, payload.requirement_id, owner_user_id)
    ensure_project_exists(session, payload.project_id, owner_user_id)
    if requirement.project_id != payload.project_id:
        raise DfmeaEntryConflictError("The linked requirement must belong to the same project as the DFMEA entry.")
    if entry.project_id != payload.project_id:
        raise DfmeaEntryConflictError("DFMEA entries cannot be moved across projects.")

    for field, value in payload.model_dump().items():
        setattr(entry, field, value)
    entry.updated_by_user_id = owner_user_id or requirement.created_by_user_id
    session.add(entry)
    session.commit()
    return get_dfmea_entry(session, entry.id, owner_user_id)


def delete_dfmea_entry(
    session: Session,
    dfmea_entry_id: str,
    owner_user_id: str | None = None,
) -> None:
    entry = session.scalars(_base_statement().where(DfmeaEntry.id == dfmea_entry_id)).first()
    if entry is None:
        raise DfmeaEntryNotFoundError(f"DFMEA entry '{dfmea_entry_id}' was not found.")
    ensure_project_exists(session, entry.project_id, owner_user_id)
    session.delete(entry)
    session.commit()


def get_dfmea_filters(
    session: Session,
    project_id: str,
    owner_user_id: str | None = None,
) -> DfmeaFilterResponse:
    ensure_project_exists(session, project_id, owner_user_id)
    requirements = list_requirements(session, project_id, owner_user_id)
    entries = list_dfmea_entries(session, project_id, owner_user_id)
    return DfmeaFilterResponse(
        project_id=project_id,
        statuses=sorted({entry.status for entry in entries}),
        subsystems=sorted({requirement.subsystem for requirement in requirements if requirement.subsystem}),
        requirement_types=sorted({requirement.type for requirement in requirements}),
    )


def get_dfmea_suggestion(
    session: Session,
    requirement_id: str,
    owner_user_id: str | None = None,
) -> DfmeaSuggestionResponse:
    requirement = get_requirement(session, requirement_id, owner_user_id)
    linked_parameters = list_design_parameters_for_requirement(session, requirement_id, owner_user_id)
    quality = evaluate_requirement_quality(
        RequirementQualityCheckRequest(
            title=requirement.title,
            text=requirement.text,
            type=requirement.type,
        )
    )
    correlations = get_requirement_correlations(session, requirement_id)
    feasibility = assess_requirement_with_design_parameters(requirement, linked_parameters)

    project_requirements = list_requirements(session, requirement.project_id, owner_user_id)
    requirement_by_id = {item.id: item for item in project_requirements}
    parent = requirement_by_id.get(requirement.parent_requirement_id or "")
    children = [item for item in project_requirements if item.parent_requirement_id == requirement.id]

    effect_candidates: list[str] = []
    if children:
        effect_candidates.extend(
            [f"Could propagate into downstream requirement {child.requirement_code}: {child.title}." for child in children[:3]]
        )
    effect_candidates.extend(
        [f"Related impact on {item.requirement.requirement_code}: {item.reason}" for item in correlations.related_requirements[:2] if item.requirement]
    )
    if not effect_candidates:
        effect_candidates.append("Could degrade the intended system behavior if the requirement is not met.")

    cause_candidates: list[str] = []
    if parent is not None:
        cause_candidates.append(f"Upstream allocation from {parent.requirement_code}: {parent.title}.")
    cause_candidates.extend(
        [f"Potential conflicting constraint from {item.requirement.requirement_code}: {item.reason}" for item in correlations.potential_conflicts[:2] if item.requirement]
    )
    if quality.warnings:
        cause_candidates.extend(
            [f"Requirement quality issue: {warning.title}." for warning in quality.warnings[:2]]
        )
    if not cause_candidates:
        cause_candidates.append("Implementation or interface mismatch could cause the function to fail.")

    prevention_controls = []
    if linked_parameters:
        prevention_controls.append("Linked design parameters provide preventive design evidence for this requirement.")
    if quality.warnings:
        prevention_controls.append("Resolve deterministic requirement quality warnings before release.")
    prevention_controls_text = " ".join(prevention_controls) or "No preventive control suggestion available from current project data."

    detection_controls = []
    if requirement.verification_method:
        detection_controls.append(f"Use the requirement verification method: {requirement.verification_method}.")
    if feasibility.evidence_used:
        detection_controls.append("Review linked feasibility evidence and parameter values during validation.")
    detection_controls_text = " ".join(detection_controls) or "Add a verification activity that can detect the failure mode early."

    severity = 7 if requirement.priority in {"High", "Critical"} else 5 if requirement.priority == "Medium" else 3
    if correlations.potential_conflicts:
        severity = min(10, severity + 1)

    occurrence = 6 if quality.warnings else 4
    if feasibility.assessment_status == "likely_infeasible":
        occurrence = min(10, occurrence + 2)
    elif feasibility.assessment_status == "warning":
        occurrence = min(10, occurrence + 1)

    detection = 5 if requirement.verification_method else 7
    if feasibility.evidence_used:
        detection = max(2, detection - 1)

    warnings = [warning.title for warning in quality.warnings]
    if feasibility.assessment_status != "feasible":
        warnings.append(feasibility.explanation)

    related_impacted_requirements: list[DfmeaRiskReference] = []
    for child in children[:3]:
        related_impacted_requirements.append(
            DfmeaRiskReference(
                requirement_id=child.id,
                requirement_code=child.requirement_code,
                title=child.title,
                reason="Downstream child requirement may inherit the failure effect.",
            )
        )
    for item in correlations.related_requirements[:2]:
        if item.requirement is None:
            continue
        related_impacted_requirements.append(
            DfmeaRiskReference(
                requirement_id=item.requirement.id,
                requirement_code=item.requirement.requirement_code,
                title=item.requirement.title,
                reason=item.reason,
            )
        )

    return DfmeaSuggestionResponse(
        project_id=requirement.project_id,
        requirement=requirement,
        function_candidate=requirement.text,
        failure_effect_candidates=effect_candidates,
        potential_cause_candidates=cause_candidates,
        current_prevention_controls_candidate=prevention_controls_text,
        current_detection_controls_candidate=detection_controls_text,
        severity_suggestion=severity,
        occurrence_suggestion=occurrence,
        detection_suggestion=detection,
        recommended_action_candidate="Review the linked requirement wording, downstream allocations, and validation evidence before approval.",
        warnings=warnings,
        related_impacted_requirements=related_impacted_requirements,
    )
