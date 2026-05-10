from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.project_snapshot import ProjectSnapshot
from app.schemas.project_snapshots import (
    CreateProjectSnapshotRequest,
    ProjectSnapshotComparisonResponse,
    ProjectSnapshotDetailResponse,
    ProjectSnapshotSummaryResponse,
    SnapshotComparisonDelta,
)
from app.services.project_views_service import get_project_report_summary, get_project_validation_summary
from app.services.projects_service import ensure_project_exists


class ProjectSnapshotNotFoundError(Exception):
    pass


def _snapshot_id(snapshot_type: str) -> str:
    return f"{snapshot_type[:3]}-{uuid4().hex[:12]}"


def _default_snapshot_name(snapshot_type: str) -> str:
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    return f"{snapshot_type.title()} Snapshot {timestamp}"


def _snapshot_payload(session: Session, project_id: str, snapshot_type: str) -> dict:
    if snapshot_type == "validation":
        return get_project_validation_summary(session, project_id).model_dump(mode="json")
    if snapshot_type == "report":
        return get_project_report_summary(session, project_id).model_dump(mode="json")
    raise ValueError(f"Unsupported snapshot type '{snapshot_type}'.")


def create_project_snapshot(
    session: Session,
    project_id: str,
    payload: CreateProjectSnapshotRequest,
    *,
    owner_user_id: str | None = None,
    created_by: str | None = None,
) -> ProjectSnapshotDetailResponse:
    ensure_project_exists(session, project_id, owner_user_id)
    snapshot = ProjectSnapshot(
        id=_snapshot_id(payload.snapshot_type),
        project_id=project_id,
        snapshot_type=payload.snapshot_type,
        name=(payload.name or "").strip() or _default_snapshot_name(payload.snapshot_type),
        notes=payload.notes,
        created_by=created_by or payload.created_by,
        payload=_snapshot_payload(session, project_id, payload.snapshot_type),
    )
    session.add(snapshot)
    session.commit()
    session.refresh(snapshot)
    return ProjectSnapshotDetailResponse.model_validate(snapshot)


def list_project_snapshots(
    session: Session,
    project_id: str,
    snapshot_type: str | None = None,
    *,
    owner_user_id: str | None = None,
) -> list[ProjectSnapshotSummaryResponse]:
    ensure_project_exists(session, project_id, owner_user_id)
    statement = select(ProjectSnapshot).where(ProjectSnapshot.project_id == project_id)
    if snapshot_type:
        statement = statement.where(ProjectSnapshot.snapshot_type == snapshot_type)
    statement = statement.order_by(ProjectSnapshot.created_at.desc())
    return [ProjectSnapshotSummaryResponse.model_validate(snapshot) for snapshot in session.scalars(statement).all()]


def get_project_snapshot(
    session: Session,
    project_id: str,
    snapshot_id: str,
    *,
    owner_user_id: str | None = None,
) -> ProjectSnapshotDetailResponse:
    ensure_project_exists(session, project_id, owner_user_id)
    statement = select(ProjectSnapshot).where(
        ProjectSnapshot.project_id == project_id,
        ProjectSnapshot.id == snapshot_id,
    )
    snapshot = session.scalars(statement).first()
    if snapshot is None:
        raise ProjectSnapshotNotFoundError(f"Snapshot '{snapshot_id}' was not found in project '{project_id}'.")
    return ProjectSnapshotDetailResponse.model_validate(snapshot)


def compare_project_snapshot(
    session: Session,
    project_id: str,
    snapshot_id: str,
    *,
    owner_user_id: str | None = None,
) -> ProjectSnapshotComparisonResponse:
    snapshot = get_project_snapshot(session, project_id, snapshot_id, owner_user_id=owner_user_id)
    current_payload = _snapshot_payload(session, project_id, snapshot.snapshot_type)

    if snapshot.snapshot_type == "validation":
        deltas = {
            "total_requirements": _delta(current_payload["total_requirements"], snapshot.payload["total_requirements"]),
            "quality_warnings": _delta(
                current_payload["requirements_with_quality_warnings"],
                snapshot.payload["requirements_with_quality_warnings"],
            ),
            "conflicts": _delta(
                current_payload["requirements_with_conflicts"],
                snapshot.payload["requirements_with_conflicts"],
            ),
            "feasible": _delta(
                current_payload["feasibility_counts"]["feasible"],
                snapshot.payload["feasibility_counts"]["feasible"],
            ),
            "likely_infeasible": _delta(
                current_payload["feasibility_counts"]["likely_infeasible"],
                snapshot.payload["feasibility_counts"]["likely_infeasible"],
            ),
            "insufficient_data": _delta(
                current_payload["feasibility_counts"]["insufficient_data"],
                snapshot.payload["feasibility_counts"]["insufficient_data"],
            ),
            "warning_feasibility": _delta(
                current_payload["feasibility_counts"]["warning"],
                snapshot.payload["feasibility_counts"]["warning"],
            ),
        }
    else:
        deltas = {
            "total_requirements": _delta(current_payload["total_requirements"], snapshot.payload["total_requirements"]),
            "total_warnings": _delta(current_payload["total_warnings"], snapshot.payload["total_warnings"]),
            "conflicts": _delta(current_payload["conflict_count"], snapshot.payload["conflict_count"]),
            "feasible": _delta(current_payload["feasible_count"], snapshot.payload["feasible_count"]),
            "likely_infeasible": _delta(
                current_payload["likely_infeasible_count"],
                snapshot.payload["likely_infeasible_count"],
            ),
            "insufficient_data": _delta(
                current_payload["insufficient_data_count"],
                snapshot.payload["insufficient_data_count"],
            ),
            "generated": _delta(
                current_payload["generated_summary"]["generated"],
                snapshot.payload["generated_summary"]["generated"],
            ),
            "manual": _delta(
                current_payload["generated_summary"]["manual"],
                snapshot.payload["generated_summary"]["manual"],
            ),
        }

    return ProjectSnapshotComparisonResponse(
        snapshot=ProjectSnapshotSummaryResponse.model_validate(snapshot),
        snapshot_type=snapshot.snapshot_type,
        deltas=deltas,
    )


def _delta(current: int | float, previous: int | float) -> SnapshotComparisonDelta:
    return SnapshotComparisonDelta(current=float(current), snapshot=float(previous), delta=float(current) - float(previous))
