from __future__ import annotations

from collections import Counter, defaultdict
import logging
import os
from typing import Literal

from sqlalchemy.orm import Session

from app.models.requirement import Requirement
from app.schemas.project_views import (
    ChangeImpactReviewDesignParameterItem,
    ChangeImpactReviewRequirementItem,
    ChangeImpactReviewResponse,
    ProjectFeasibilityCounts,
    ProjectGeneratedSummary,
    ProjectReportSectionItem,
    ProjectReportSummaryResponse,
    TraceabilityHealthScoreResponse,
    ProjectValidationRequirementRecord,
    ProjectValidationSummaryResponse,
    ProjectWarningCountsBySeverity,
    TopFlaggedRequirement,
    TraceabilityGraphEdge,
    TraceabilityGraphAnalysisResponse,
    TraceabilityGraphNode,
    TraceabilityGraphResponse,
    TraceabilityMatrixResponse,
    TraceabilityMatrixRowResponse,
)
from app.schemas.quality import RequirementQualityCheckRequest
from app.schemas.requirement import RequirementResponse
from app.services.correlation_service import CorrelationRequirementLike, get_requirement_like_correlations
from app.services.design_parameters_service import list_design_parameters
from app.services.feasibility_service import assess_requirement_with_design_parameters
from app.services.projects_service import ensure_project_exists
from app.services.quality_service import evaluate_requirement_quality
from app.services.requirements_service import list_requirements


STRUCTURED_FIELDS = [
    "actor",
    "action",
    "object",
    "parameter",
    "operator",
    "value",
    "unit",
    "timing",
    "condition",
    "scope",
]

logger = logging.getLogger(__name__)

CHANGE_REVIEW_STOPWORDS = {
    "the",
    "and",
    "for",
    "with",
    "from",
    "that",
    "this",
    "shall",
    "should",
    "would",
    "could",
    "must",
    "need",
    "needs",
    "update",
    "change",
    "request",
    "into",
    "onto",
    "than",
    "then",
    "when",
    "where",
    "while",
    "after",
    "before",
    "during",
    "under",
    "over",
    "across",
    "about",
    "have",
    "has",
    "had",
    "all",
    "any",
    "our",
    "their",
    "your",
}


def _requirement_response(requirement: Requirement) -> RequirementResponse:
    return RequirementResponse.model_validate(requirement)


def _project_design_parameters_by_requirement(session: Session, project_id: str) -> dict[str, list]:
    linked_by_requirement: dict[str, list] = defaultdict(list)
    for parameter in list_design_parameters(session, project_id):
        for requirement in parameter.linked_requirements:
            linked_by_requirement[requirement.id].append(parameter)
    return linked_by_requirement


def _tokenize_change_request(change_request: str) -> list[str]:
    normalized = []
    current = []
    for character in change_request.lower():
        if character.isalnum() or character in {"-", "_", "."}:
            current.append(character)
        else:
            if current:
                normalized.append("".join(current))
                current = []
    if current:
        normalized.append("".join(current))
    return [
        token
        for token in normalized
        if token and token not in CHANGE_REVIEW_STOPWORDS and (len(token) >= 3 or any(char.isdigit() for char in token))
    ]


def _normalize_parsed_requirement(parsed_requirement: object | None) -> dict[str, object]:
    if parsed_requirement is None:
        return {}
    if isinstance(parsed_requirement, dict):
        return parsed_requirement
    model_dump = getattr(parsed_requirement, "model_dump", None)
    if callable(model_dump):
        result = model_dump()
        return result if isinstance(result, dict) else {}
    return {}


def _recommend_fix_action(
    matched_tokens: list[str],
    record: ProjectValidationRequirementRecord,
    linked_parameter_count: int,
    relationship_type: str,
) -> str:
    parsed = _normalize_parsed_requirement(record.requirement.parsed_requirement)
    if any(token in {str(parsed.get("value", "")).lower(), str(parsed.get("unit", "")).lower()} for token in matched_tokens):
        return "Update the structured value/unit fields and confirm linked verification evidence remains valid."
    if linked_parameter_count > 0:
        return "Review linked design parameters and update the requirement text or constraints to keep them aligned."
    if relationship_type == "indirect":
        return "Review downstream traceability and update the requirement if parent, child, or dependency changes propagate here."
    if record.correlation_summary and record.correlation_summary.potential_conflicts:
        return "Review conflict links and revise this requirement so the requested change does not introduce contradictory behavior."
    if record.feasibility and record.feasibility.assessment_status in {"warning", "insufficient_data", "likely_infeasible"}:
        return "Reassess feasibility and add supporting evidence before finalizing this change."
    return "Review the requirement text and acceptance intent, then update wording or linked evidence if the change applies."


def _relationship_reason(
    record: ProjectValidationRequirementRecord,
    matched_tokens: list[str],
    linked_parameter_count: int,
    relationship_type: str,
    connected_via: str | None = None,
) -> str:
    if relationship_type == "direct":
        reason_parts: list[str] = []
        if matched_tokens:
            reason_parts.append(f"matched keyword/value/unit: {', '.join(matched_tokens)}")
        if record.requirement.subsystem and any(token == record.requirement.subsystem.lower() for token in matched_tokens):
            reason_parts.append(f"matched subsystem: {record.requirement.subsystem}")
        if linked_parameter_count > 0 and any(token in (record.requirement.text or "").lower() for token in matched_tokens):
            reason_parts.append("linked design parameter evidence is attached")
        if not reason_parts:
            reason_parts.append("matched requirement title/text/type or parsed fields")
        return "; ".join(reason_parts)

    if connected_via == "parent-child":
        return "linked parent/child requirement in the traceability structure"
    if connected_via == "related":
        return "related requirement edge from an explicitly connected requirement"
    if connected_via == "conflict":
        return "conflict edge from an explicitly connected requirement"
    return "downstream dependency or traceability link from a directly matched requirement"


def _build_change_impact_requirement_item(
    record: ProjectValidationRequirementRecord,
    relationship_type: str,
    reason: str,
    matched_tokens: list[str],
    linked_parameter_count: int,
) -> ChangeImpactReviewRequirementItem:
    return ChangeImpactReviewRequirementItem(
        requirement=record.requirement,
        relationship_type=relationship_type,
        reason=reason,
        recommended_fix_action=_recommend_fix_action(
            matched_tokens,
            record,
            linked_parameter_count,
            relationship_type,
        ),
        warning_count=len(record.quality_summary.warnings) if record.quality_summary else 0,
        conflict_count=len(record.correlation_summary.potential_conflicts) if record.correlation_summary else 0,
        linked_design_parameter_count=linked_parameter_count,
        matched_tokens=matched_tokens,
    )


def _parsing_coverage(requirement: Requirement) -> tuple[int, int, list[str]]:
    parsed = requirement.parsed_requirement or {}
    missing = [field for field in STRUCTURED_FIELDS if not parsed.get(field)]
    return len(STRUCTURED_FIELDS) - len(missing), len(STRUCTURED_FIELDS), missing


def _correlation_target(requirement: Requirement) -> CorrelationRequirementLike:
    return CorrelationRequirementLike(
        id=requirement.id,
        project_id=requirement.project_id,
        title=requirement.title,
        text=requirement.text,
        type=requirement.type,
        status=requirement.status,
        subsystem=requirement.subsystem,
        parsed_requirement=requirement.parsed_requirement or {},
    )


def build_project_validation_records(
    session: Session,
    project_id: str,
) -> list[ProjectValidationRequirementRecord]:
    ensure_project_exists(session, project_id)
    requirements = list_requirements(session, project_id)
    linked_by_requirement = _project_design_parameters_by_requirement(session, project_id)

    records: list[ProjectValidationRequirementRecord] = []
    for requirement in requirements:
        quality_summary = evaluate_requirement_quality(
            RequirementQualityCheckRequest(
                title=requirement.title,
                text=requirement.text,
                type=requirement.type,
            )
        )
        correlation_summary = get_requirement_like_correlations(
            session,
            _correlation_target(requirement),
            exclude_requirement_id=requirement.id,
            project_requirements=requirements,
        )
        feasibility = assess_requirement_with_design_parameters(
            requirement,
            linked_by_requirement.get(requirement.id, []),
        )
        coverage_count, coverage_total, missing_fields = _parsing_coverage(requirement)

        records.append(
            ProjectValidationRequirementRecord(
                requirement=_requirement_response(requirement),
                quality_summary=quality_summary,
                quality_error=None,
                correlation_summary=correlation_summary,
                correlation_error=None,
                feasibility=feasibility,
                feasibility_error=None,
                parsed_coverage_count=coverage_count,
                parsed_coverage_total=coverage_total,
                parsed_missing_fields=missing_fields,
            )
        )

    return records


def get_project_validation_summary(session: Session, project_id: str) -> ProjectValidationSummaryResponse:
    records = build_project_validation_records(session, project_id)

    warning_counts = Counter()
    for record in records:
        for warning in record.quality_summary.warnings if record.quality_summary else []:
            warning_counts[warning.severity] += 1

    feasibility_counts = Counter(
        record.feasibility.assessment_status
        for record in records
        if record.feasibility is not None
    )

    top_flagged = sorted(
        [
            TopFlaggedRequirement(
                requirement=record.requirement,
                warning_count=len(record.quality_summary.warnings) if record.quality_summary else 0,
                conflict_count=len(record.correlation_summary.potential_conflicts) if record.correlation_summary else 0,
                feasibility_status=record.feasibility.assessment_status if record.feasibility else None,
                flag_score=(
                    (len(record.quality_summary.warnings) if record.quality_summary else 0)
                    + (len(record.correlation_summary.potential_conflicts) if record.correlation_summary else 0) * 2
                    + (
                        2
                        if record.feasibility
                        and record.feasibility.assessment_status in {"likely_infeasible", "warning"}
                        else 1
                        if record.feasibility and record.feasibility.assessment_status == "insufficient_data"
                        else 0
                    )
                ),
            )
            for record in records
        ],
        key=lambda item: (item.flag_score, item.conflict_count, item.warning_count),
        reverse=True,
    )[:8]

    parsing_coverage_average = (
        sum(record.parsed_coverage_count / record.parsed_coverage_total for record in records) / len(records)
        if records
        else 0.0
    )

    return ProjectValidationSummaryResponse(
        total_requirements=len(records),
        requirements_with_quality_warnings=sum(
            1 for record in records if (record.quality_summary and record.quality_summary.warnings)
        ),
        warning_counts_by_severity=ProjectWarningCountsBySeverity(
            low=warning_counts.get("low", 0),
            medium=warning_counts.get("medium", 0),
            high=warning_counts.get("high", 0),
        ),
        parsing_requirements_with_gaps=sum(1 for record in records if record.parsed_missing_fields),
        parsing_coverage_average=parsing_coverage_average,
        requirements_with_conflicts=sum(
            1 for record in records if record.correlation_summary and record.correlation_summary.potential_conflicts
        ),
        feasibility_counts=ProjectFeasibilityCounts(
            feasible=feasibility_counts.get("feasible", 0),
            likely_infeasible=feasibility_counts.get("likely_infeasible", 0),
            insufficient_data=feasibility_counts.get("insufficient_data", 0),
            warning=feasibility_counts.get("warning", 0),
        ),
        top_flagged_requirements=top_flagged,
        requirements=records,
    )


def _format_percent(value: float) -> str:
    return f"{round(value)}%"


def _display_requirement_code(requirement: RequirementResponse) -> str:
    return requirement.requirement_code


def _build_traceability_graph_components(
    records: list[ProjectValidationRequirementRecord],
) -> tuple[list[TraceabilityGraphNode], list[TraceabilityGraphEdge]]:
    nodes = [
        TraceabilityGraphNode(
            id=record.requirement.id,
            label=f"{record.requirement.requirement_code}\n{record.requirement.title}",
            title=record.requirement.title,
            type=record.requirement.type,
            subsystem=record.requirement.subsystem,
            provenance="Generated"
            if record.requirement.generation_metadata
            and record.requirement.generation_metadata.generation_source == "ai"
            else "Manual",
            health=(
                "conflict"
                if record.correlation_summary and record.correlation_summary.potential_conflicts
                else "warning"
                if record.quality_summary and record.quality_summary.warnings
                else "acceptable"
            ),
            warning_count=len(record.quality_summary.warnings) if record.quality_summary else 0,
            conflict_count=len(record.correlation_summary.potential_conflicts) if record.correlation_summary else 0,
            feasibility_status=record.feasibility.assessment_status if record.feasibility else None,
            is_generated=bool(
                record.requirement.generation_metadata
                and record.requirement.generation_metadata.generation_source == "ai"
            ),
        )
        for record in records
    ]

    edges: dict[str, TraceabilityGraphEdge] = {}
    record_ids = {record.requirement.id for record in records}
    for record in records:
        source_id = record.requirement.id
        parent_id = record.requirement.parent_requirement_id
        if parent_id and parent_id in record_ids:
            edge_id = f"parent-child:{parent_id}:{source_id}"
            edges[edge_id] = TraceabilityGraphEdge(
                id=edge_id,
                source=parent_id,
                target=source_id,
                kind="parent-child",
                reason="Parent-child decomposition link",
            )

        if record.correlation_summary:
            for related in record.correlation_summary.related_requirements:
                target_id = related.requirement.id if related.requirement else None
                if target_id and target_id in record_ids:
                    normalized = sorted([source_id, target_id])
                    edge_id = f"related:{normalized[0]}:{normalized[1]}"
                    edges.setdefault(
                        edge_id,
                        TraceabilityGraphEdge(
                            id=edge_id,
                            source=source_id,
                            target=target_id,
                            kind="related",
                            reason=related.reason,
                        ),
                    )

            for conflict in record.correlation_summary.potential_conflicts:
                target_id = conflict.requirement.id if conflict.requirement else None
                if target_id and target_id in record_ids:
                    normalized = sorted([source_id, target_id])
                    edge_id = f"conflict:{normalized[0]}:{normalized[1]}"
                    edges.setdefault(
                        edge_id,
                        TraceabilityGraphEdge(
                            id=edge_id,
                            source=source_id,
                            target=target_id,
                            kind="conflict",
                            reason=conflict.reason,
                        ),
                    )

    return nodes, list(edges.values())


def _summarize_analysis_scope(
    node_ids: set[str],
    node_by_id: dict[str, TraceabilityGraphNode],
) -> tuple[int, list[str], int, int]:
    scoped_nodes = [node_by_id[node_id] for node_id in node_ids if node_id in node_by_id]
    subsystems = sorted({node.subsystem or "Unassigned" for node in scoped_nodes})
    return (
        len(scoped_nodes),
        subsystems,
        sum(node.warning_count for node in scoped_nodes),
        sum(node.conflict_count for node in scoped_nodes),
    )


def _collect_reachability(
    requirement_id: str,
    edges: list[TraceabilityGraphEdge],
    direction: Literal["incoming", "outgoing"],
    allowed_kinds: set[str] | None = None,
) -> tuple[dict[str, int], dict[str, int]]:
    node_depths: dict[str, int] = {requirement_id: 0}
    edge_depths: dict[str, int] = {}
    queue: list[tuple[str, int]] = [(requirement_id, 0)]
    visited = {requirement_id}

    while queue:
        current_id, current_depth = queue.pop(0)
        matching_edges = [
            edge
            for edge in edges
            if (
                (allowed_kinds is None or edge.kind in allowed_kinds)
                and (
                    (direction == "incoming" and edge.target == current_id)
                    or (direction == "outgoing" and edge.source == current_id)
                )
            )
        ]
        for edge in matching_edges:
            next_node_id = (
                edge.source
                if direction == "incoming"
                else edge.target
                if direction == "outgoing"
                else edge.source
            )
            next_depth = current_depth + 1
            edge_depths[edge.id] = min(edge_depths.get(edge.id, next_depth), next_depth)
            node_depths[next_node_id] = min(node_depths.get(next_node_id, next_depth), next_depth)
            if next_node_id not in visited:
                visited.add(next_node_id)
                queue.append((next_node_id, next_depth))

    return node_depths, edge_depths


def _collect_direct_impact(
    requirement_id: str,
    edges: list[TraceabilityGraphEdge],
    direction: Literal["both", "upstream", "downstream"],
) -> tuple[set[str], set[str]]:
    direct_node_ids: set[str] = set()
    direct_edge_ids: set[str] = set()

    for edge in edges:
        if edge.kind == "parent-child":
            is_upstream = edge.target == requirement_id
            is_downstream = edge.source == requirement_id
            if direction in {"both", "upstream"} and is_upstream:
                direct_node_ids.add(edge.source)
                direct_edge_ids.add(edge.id)
            if direction in {"both", "downstream"} and is_downstream:
                direct_node_ids.add(edge.target)
                direct_edge_ids.add(edge.id)
            continue

        # Related/conflict edges are useful immediate context, but we keep them
        # as one-hop lateral signals only so impact analysis stays local.
        if direction == "both" and (edge.source == requirement_id or edge.target == requirement_id):
            direct_node_ids.add(edge.target if edge.source == requirement_id else edge.source)
            direct_edge_ids.add(edge.id)

    return direct_node_ids, direct_edge_ids


def _merge_reachability_maps(
    node_maps: list[dict[str, int]],
    edge_maps: list[dict[str, int]],
) -> tuple[dict[str, int], dict[str, int]]:
    merged_node_depths: dict[str, int] = {}
    merged_edge_depths: dict[str, int] = {}

    for node_depths in node_maps:
        for node_id, depth in node_depths.items():
            merged_node_depths[node_id] = min(merged_node_depths.get(node_id, depth), depth)

    for edge_depths in edge_maps:
        for edge_id, depth in edge_depths.items():
            merged_edge_depths[edge_id] = min(merged_edge_depths.get(edge_id, depth), depth)

    return merged_node_depths, merged_edge_depths


def _impact_debug_enabled() -> bool:
    return os.getenv("TRACEABILITY_IMPACT_DEBUG", "").lower() in {"1", "true", "yes", "on"}


def get_project_report_summary(session: Session, project_id: str) -> ProjectReportSummaryResponse:
    validation = get_project_validation_summary(session, project_id)
    records = validation.requirements

    total_warnings = sum(len(record.quality_summary.warnings) for record in records if record.quality_summary)
    conflict_count = sum(
        len(record.correlation_summary.potential_conflicts) for record in records if record.correlation_summary
    )
    related_count = sum(
        len(record.correlation_summary.related_requirements) for record in records if record.correlation_summary
    )
    linked_evidence_count = sum(len(record.feasibility.evidence_used) for record in records if record.feasibility)

    quality_items = [
        ProjectReportSectionItem(
            requirement=record.requirement,
            summary=f"{len(record.quality_summary.warnings)} warnings",
        )
        for record in records
        if record.quality_summary and record.quality_summary.warnings
    ]
    parsing_items = [
        ProjectReportSectionItem(
            requirement=record.requirement,
            summary=f"Missing {', '.join(record.parsed_missing_fields)}",
        )
        for record in records
        if record.parsed_missing_fields
    ]
    conflict_items = [
        ProjectReportSectionItem(
            requirement=record.requirement,
            summary=(
                f"{len(record.correlation_summary.potential_conflicts)} conflicts, "
                f"{len(record.correlation_summary.related_requirements)} related"
            ),
        )
        for record in records
        if record.correlation_summary
        and (record.correlation_summary.potential_conflicts or record.correlation_summary.related_requirements)
    ]
    feasibility_items = [
        ProjectReportSectionItem(
            requirement=record.requirement,
            summary=record.feasibility.explanation,
        )
        for record in records
        if record.feasibility and record.feasibility.assessment_status != "feasible"
    ]
    evidence_items = [
        ProjectReportSectionItem(
            requirement=record.requirement,
            summary=f"{len(record.feasibility.evidence_used)} evidence items",
        )
        for record in records
        if record.feasibility and record.feasibility.evidence_used
    ]

    generated = sum(
        1
        for record in records
        if record.requirement.generation_metadata
        and record.requirement.generation_metadata.generation_source == "ai"
    )
    manual = len(records) - generated

    report_lines: list[str] = [
        f"# Project Report: {project_id}",
        "",
        "## Requirements Overview",
        f"- Requirements assessed: {validation.total_requirements}",
        "",
        "## Quality Warning Summary",
        f"- Total quality warnings: {total_warnings}",
    ]
    report_lines.extend(f"- {_display_requirement_code(item.requirement)}: {item.summary}" for item in quality_items)
    report_lines.extend(
        [
            "",
            "## Parsing Summary",
            f"- Average parsing coverage: {_format_percent(validation.parsing_coverage_average * 100)}",
        ]
    )
    report_lines.extend(f"- {_display_requirement_code(item.requirement)}: {item.summary}" for item in parsing_items)
    report_lines.extend(
        [
            "",
            "## Conflict and Correlation Summary",
            f"- Potential conflicts: {conflict_count}",
            f"- Related requirement links: {related_count}",
        ]
    )
    report_lines.extend(f"- {_display_requirement_code(item.requirement)}: {item.summary}" for item in conflict_items)
    report_lines.extend(
        [
            "",
            "## Feasibility Summary",
            f"- Feasible: {validation.feasibility_counts.feasible}",
            f"- Likely infeasible: {validation.feasibility_counts.likely_infeasible}",
            f"- Warning: {validation.feasibility_counts.warning}",
            f"- Insufficient data: {validation.feasibility_counts.insufficient_data}",
        ]
    )
    report_lines.extend(f"- {_display_requirement_code(item.requirement)}: {item.summary}" for item in feasibility_items)
    report_lines.extend(
        [
            "",
            "## Traceability and Evidence Summary",
            f"- Feasibility evidence items: {linked_evidence_count}",
        ]
    )
    report_lines.extend(f"- {_display_requirement_code(item.requirement)}: {item.summary}" for item in evidence_items)
    report_lines.extend(
        [
            "",
            "## Generation Provenance Summary",
            f"- Generated requirements: {generated}",
            f"- Manual requirements: {manual}",
            "",
        ]
    )

    return ProjectReportSummaryResponse(
        total_requirements=validation.total_requirements,
        total_warnings=total_warnings,
        conflict_count=conflict_count,
        related_count=related_count,
        feasible_count=validation.feasibility_counts.feasible,
        insufficient_data_count=validation.feasibility_counts.insufficient_data,
        likely_infeasible_count=validation.feasibility_counts.likely_infeasible,
        warning_feasibility_count=validation.feasibility_counts.warning,
        avg_parsing_coverage=validation.parsing_coverage_average,
        linked_evidence_count=linked_evidence_count,
        generated_summary=ProjectGeneratedSummary(generated=generated, manual=manual),
        quality_items=quality_items,
        parsing_items=parsing_items,
        conflict_items=conflict_items,
        feasibility_items=feasibility_items,
        evidence_items=evidence_items,
        markdown="\n".join(report_lines),
    )


def get_traceability_health_score(session: Session, project_id: str) -> TraceabilityHealthScoreResponse:
    records = build_project_validation_records(session, project_id)
    total_requirements = len(records)
    if total_requirements == 0:
        return TraceabilityHealthScoreResponse(
            project_id=project_id,
            score=0,
            total_requirements=0,
            coverage_percent=0,
            missing_link_count=0,
            conflict_requirement_count=0,
            evidence_gap_count=0,
            broken_traceability_count=0,
            status="No data",
            rationale="The project has no requirements yet, so the health score will populate as traceability data is created.",
        )

    nodes, edges = _build_traceability_graph_components(records)
    linked_by_requirement = _project_design_parameters_by_requirement(session, project_id)
    adjacency_count: Counter[str] = Counter()
    for edge in edges:
        adjacency_count[edge.source] += 1
        adjacency_count[edge.target] += 1

    coverage_percent = round(
        sum(record.parsed_coverage_count / record.parsed_coverage_total for record in records) / total_requirements * 100
    )
    missing_link_count = sum(
        1 for record in records if adjacency_count.get(record.requirement.id, 0) == 0
    )
    conflict_requirement_count = sum(
        1 for record in records if record.correlation_summary and record.correlation_summary.potential_conflicts
    )
    evidence_gap_count = sum(
        1
        for record in records
        if record.requirement.type != "Stakeholder"
        and len(linked_by_requirement.get(record.requirement.id, [])) == 0
    )
    broken_traceability_count = sum(
        1
        for record in records
        if adjacency_count.get(record.requirement.id, 0) == 0
        or (
            record.requirement.type != "Stakeholder"
            and len(linked_by_requirement.get(record.requirement.id, [])) == 0
            and (
                (record.quality_summary and bool(record.quality_summary.warnings))
                or (record.feasibility and record.feasibility.assessment_status in {"warning", "insufficient_data", "likely_infeasible"})
            )
        )
    )

    score = round(
        coverage_percent * 0.4
        + max(0.0, 1 - missing_link_count / total_requirements) * 25
        + max(0.0, 1 - conflict_requirement_count / total_requirements) * 20
        + max(0.0, 1 - evidence_gap_count / total_requirements) * 15
    )

    status = "Strong" if score >= 85 else "Monitor" if score >= 65 else "Needs attention"

    return TraceabilityHealthScoreResponse(
        project_id=project_id,
        score=score,
        total_requirements=total_requirements,
        coverage_percent=coverage_percent,
        missing_link_count=missing_link_count,
        conflict_requirement_count=conflict_requirement_count,
        evidence_gap_count=evidence_gap_count,
        broken_traceability_count=broken_traceability_count,
        status=status,
        rationale="The score blends parsing coverage (40%), structural link completeness (25%), conflict load (20%), and evidence coverage (15%) into a 0-100 traceability health summary.",
    )


def get_traceability_graph(session: Session, project_id: str) -> TraceabilityGraphResponse:
    records = build_project_validation_records(session, project_id)
    nodes, edges = _build_traceability_graph_components(records)
    return TraceabilityGraphResponse(project_id=project_id, nodes=nodes, edges=edges)


def get_traceability_impact_analysis(
    session: Session,
    project_id: str,
    requirement_id: str,
    direction: Literal["both", "upstream", "downstream"] = "both",
) -> TraceabilityGraphAnalysisResponse:
    records = build_project_validation_records(session, project_id)
    nodes, edges = _build_traceability_graph_components(records)
    node_by_id = {node.id: node for node in nodes}
    requirement_code_by_id = {
        record.requirement.id: record.requirement.requirement_code for record in records
    }
    if requirement_id not in node_by_id:
        raise ValueError(f"Requirement '{requirement_id}' is not part of project '{project_id}'.")

    direct_node_ids, direct_edge_ids = _collect_direct_impact(requirement_id, edges, direction)

    # Recursive impact stays intentionally narrow for MVP: we only recurse over
    # structural parent-child links so Analyze Impact remains centered on the
    # selected node instead of ballooning through broad related/conflict meshes.
    structural_kinds = {"parent-child"}

    if direction == "both":
        incoming_node_depths, incoming_edge_depths = _collect_reachability(
            requirement_id,
            edges,
            "incoming",
            allowed_kinds=structural_kinds,
        )
        outgoing_node_depths, outgoing_edge_depths = _collect_reachability(
            requirement_id,
            edges,
            "outgoing",
            allowed_kinds=structural_kinds,
        )
        node_depths, edge_depths = _merge_reachability_maps(
            [incoming_node_depths, outgoing_node_depths],
            [incoming_edge_depths, outgoing_edge_depths],
        )
    else:
        node_depths, edge_depths = _collect_reachability(
            requirement_id,
            edges,
            "incoming" if direction == "upstream" else "outgoing",
            allowed_kinds=structural_kinds,
        )

    indirect_node_ids = {
        node_id
        for node_id, depth in node_depths.items()
        if depth > 1 and node_id != requirement_id and node_id not in direct_node_ids
    }
    indirect_edge_ids = {
        edge_id
        for edge_id, depth in edge_depths.items()
        if depth > 1 and edge_id not in direct_edge_ids
    }
    primary_node_ids = sorted(direct_node_ids)
    secondary_node_ids = sorted(indirect_node_ids)
    primary_edge_ids = sorted(direct_edge_ids)
    secondary_edge_ids = sorted(indirect_edge_ids)
    affected_count, affected_subsystems, warning_count, conflict_count = _summarize_analysis_scope(
        set(primary_node_ids + secondary_node_ids),
        node_by_id,
    )

    if _impact_debug_enabled():
        logger.warning(
            "[TraceabilityImpact] selected_internal_id=%s selected_requirement_code=%s traversal_start=%s direction=%s included_direct_edge_types=%s recursive_edge_types=%s impacted_node_ids=%s impacted_requirement_codes=%s impacted_edge_ids=%s direct_impact_count=%s indirect_impact_count=%s",
            requirement_id,
            requirement_code_by_id.get(requirement_id),
            requirement_id,
            direction,
            ["parent-child", "related", "conflict"] if direction == "both" else ["parent-child"],
            ["parent-child"],
            primary_node_ids + secondary_node_ids,
            [requirement_code_by_id.get(node_id) for node_id in primary_node_ids + secondary_node_ids],
            primary_edge_ids + secondary_edge_ids,
            len(primary_node_ids),
            len(secondary_node_ids),
        )

    return TraceabilityGraphAnalysisResponse(
        project_id=project_id,
        analysis_mode=f"{direction}-impact",
        title="Impact Analysis"
        if direction == "both"
        else "Upstream Impact"
        if direction == "upstream"
        else "Downstream Impact",
        description="Highlighting direct upstream, downstream, and lateral impacts, with deeper traversal limited to structural decomposition paths."
        if direction == "both"
        else "Highlighting direct parent requirements and deeper upstream structural decomposition paths feeding the selected requirement."
        if direction == "upstream"
        else "Highlighting direct child requirements and deeper downstream structural decomposition paths affected by the selected requirement.",
        selected_requirement_id=requirement_id,
        primary_node_ids=primary_node_ids,
        secondary_node_ids=secondary_node_ids,
        primary_edge_ids=primary_edge_ids,
        secondary_edge_ids=secondary_edge_ids,
        affected_requirement_count=affected_count,
        affected_subsystems=affected_subsystems,
        warning_count=warning_count,
        conflict_count=conflict_count,
        rationale="Direct impacts are one hop from the selected requirement. Indirect impacts recurse only through parent-child structural paths; related and conflict links are included as direct adjacency only.",
    )


def get_traceability_broken_chain_analysis(
    session: Session,
    project_id: str,
    mode: Literal["all", "orphans", "missing-evidence"] = "all",
) -> TraceabilityGraphAnalysisResponse:
    records = build_project_validation_records(session, project_id)
    nodes, edges = _build_traceability_graph_components(records)
    node_by_id = {node.id: node for node in nodes}
    linked_by_requirement = _project_design_parameters_by_requirement(session, project_id)
    incoming: dict[str, list[TraceabilityGraphEdge]] = defaultdict(list)
    outgoing: dict[str, list[TraceabilityGraphEdge]] = defaultdict(list)
    for edge in edges:
        incoming[edge.target].append(edge)
        outgoing[edge.source].append(edge)

    orphan_ids: set[str] = set()
    missing_evidence_ids: set[str] = set()
    broken_ids: set[str] = set()

    for record in records:
        requirement = record.requirement
        all_edges = incoming.get(requirement.id, []) + outgoing.get(requirement.id, [])
        parent_edges = [edge for edge in all_edges if edge.kind == "parent-child"]
        related_edges = [edge for edge in all_edges if edge.kind == "related"]
        is_orphan = len(all_edges) == 0 or (len(all_edges) <= 1 and len(parent_edges) == 0)
        missing_evidence = (
            requirement.type != "Stakeholder"
            and len(linked_by_requirement.get(requirement.id, [])) == 0
            and (
                (record.feasibility and record.feasibility.assessment_status in {"insufficient_data", "warning", "likely_infeasible"})
                or (record.quality_summary and bool(record.quality_summary.warnings))
                or (
                    requirement.generation_metadata
                    and requirement.generation_metadata.generation_source == "ai"
                )
            )
            and len(related_edges) == 0
        )
        if is_orphan:
            orphan_ids.add(requirement.id)
        if missing_evidence:
            missing_evidence_ids.add(requirement.id)
        if is_orphan or missing_evidence:
            broken_ids.add(requirement.id)

    selected_ids = (
        orphan_ids if mode == "orphans" else missing_evidence_ids if mode == "missing-evidence" else broken_ids
    )
    edge_ids = sorted(
        edge.id for edge in edges if edge.source in selected_ids or edge.target in selected_ids
    )
    affected_count, affected_subsystems, warning_count, conflict_count = _summarize_analysis_scope(
        selected_ids,
        node_by_id,
    )

    return TraceabilityGraphAnalysisResponse(
        project_id=project_id,
        analysis_mode=f"broken-{mode}",
        title="Broken Chain Analysis"
        if mode == "all"
        else "Orphan Requirements"
        if mode == "orphans"
        else "Missing Evidence Signals",
        description="Highlighting likely traceability gaps, isolated nodes, and weakly supported generated requirements."
        if mode == "all"
        else "Highlighting structurally isolated requirements with weak or no traceability links."
        if mode == "orphans"
        else "Highlighting requirements that have warning or feasibility risk but lack supporting evidence links.",
        primary_node_ids=sorted(selected_ids),
        secondary_node_ids=[],
        primary_edge_ids=edge_ids,
        secondary_edge_ids=[],
        warning_node_ids=sorted(selected_ids),
        affected_requirement_count=affected_count,
        affected_subsystems=affected_subsystems,
        warning_count=warning_count,
        conflict_count=conflict_count,
        rationale="Broken-chain heuristics combine orphan detection, sparse structural linkage, and missing supporting evidence for non-stakeholder requirements.",
    )


def get_traceability_critical_path_analysis(
    session: Session,
    project_id: str,
) -> TraceabilityGraphAnalysisResponse:
    records = build_project_validation_records(session, project_id)
    nodes, edges = _build_traceability_graph_components(records)
    node_by_id = {node.id: node for node in nodes}
    outgoing: dict[str, list[TraceabilityGraphEdge]] = defaultdict(list)
    for edge in edges:
        if edge.kind == "parent-child":
            outgoing[edge.source].append(edge)

    risk_score_by_id = {
        node.id: (
            4 if node.health == "conflict" else 2 if node.health == "warning" else 1
        )
        + node.warning_count
        + node.conflict_count * 2
        for node in nodes
    }
    memo: dict[str, tuple[int, list[str], list[str]]] = {}

    def visit(node_id: str, visiting: set[str] | None = None) -> tuple[int, list[str], list[str]]:
        if node_id in memo:
            return memo[node_id]
        if visiting and node_id in visiting:
            return risk_score_by_id.get(node_id, 0), [node_id], []

        next_visiting = set() if visiting is None else set(visiting)
        next_visiting.add(node_id)
        best = (risk_score_by_id.get(node_id, 0), [node_id], [])
        for edge in outgoing.get(node_id, []):
            child_score, child_nodes, child_edges = visit(edge.target, next_visiting)
            candidate = (
                risk_score_by_id.get(node_id, 0) + child_score + 10,
                [node_id, *child_nodes],
                [edge.id, *child_edges],
            )
            if len(candidate[1]) > len(best[1]) or (
                len(candidate[1]) == len(best[1]) and candidate[0] > best[0]
            ):
                best = candidate
        memo[node_id] = best
        return best

    best_path = (0, [], [])
    for node in nodes:
        candidate = visit(node.id)
        if len(candidate[1]) > len(best_path[1]) or (
            len(candidate[1]) == len(best_path[1]) and candidate[0] > best_path[0]
        ):
            best_path = candidate

    primary_node_ids = best_path[1]
    primary_edge_ids = best_path[2]
    affected_count, affected_subsystems, warning_count, conflict_count = _summarize_analysis_scope(
        set(primary_node_ids),
        node_by_id,
    )

    return TraceabilityGraphAnalysisResponse(
        project_id=project_id,
        analysis_mode="critical-path",
        title="Critical Path",
        description="Highlighting the longest parent-child chain, with ties broken by cumulative warning and conflict density.",
        selected_requirement_id=primary_node_ids[0] if primary_node_ids else None,
        primary_node_ids=primary_node_ids,
        secondary_node_ids=[],
        primary_edge_ids=primary_edge_ids,
        secondary_edge_ids=[],
        affected_requirement_count=affected_count,
        affected_subsystems=affected_subsystems,
        warning_count=warning_count,
        conflict_count=conflict_count,
        rationale="Critical path selection prefers the deepest decomposition chain, then the path with the highest combined warning and conflict score.",
    )


def get_traceability_matrix(session: Session, project_id: str) -> TraceabilityMatrixResponse:
    records = build_project_validation_records(session, project_id)
    code_by_internal_id = {record.requirement.id: record.requirement.requirement_code for record in records}
    children_count = Counter(
        record.requirement.parent_requirement_id for record in records if record.requirement.parent_requirement_id
    )
    linked_by_requirement = _project_design_parameters_by_requirement(session, project_id)

    rows = [
        TraceabilityMatrixRowResponse(
            requirement=record.requirement,
            parent_id=code_by_internal_id.get(record.requirement.parent_requirement_id or ""),
            children_count=children_count.get(record.requirement.id, 0),
            related_count=len(record.correlation_summary.related_requirements) if record.correlation_summary else 0,
            conflict_count=len(record.correlation_summary.potential_conflicts) if record.correlation_summary else 0,
            linked_design_parameters_count=len(linked_by_requirement.get(record.requirement.id, [])),
            feasibility_status=record.feasibility.assessment_status if record.feasibility else "not assessed",
            generation_provenance=(
                "Generated"
                if record.requirement.generation_metadata
                and record.requirement.generation_metadata.generation_source == "ai"
                else "Manual"
            ),
            low_quality=bool(record.quality_summary and record.quality_summary.warnings),
            missing_evidence=(
                bool(record.feasibility and record.feasibility.assessment_status == "insufficient_data")
                or (
                    len(linked_by_requirement.get(record.requirement.id, [])) == 0
                    and record.requirement.type != "Stakeholder"
                )
            ),
            warning_count=len(record.quality_summary.warnings) if record.quality_summary else 0,
        )
        for record in records
    ]

    return TraceabilityMatrixResponse(project_id=project_id, rows=rows)


def get_change_impact_review(
    session: Session,
    project_id: str,
    change_request: str,
) -> ChangeImpactReviewResponse:
    ensure_project_exists(session, project_id)
    records = build_project_validation_records(session, project_id)
    nodes, edges = _build_traceability_graph_components(records)
    record_by_id = {record.requirement.id: record for record in records}
    requirement_by_id = {record.requirement.id: record.requirement for record in records}
    linked_by_requirement = _project_design_parameters_by_requirement(session, project_id)
    change_tokens = _tokenize_change_request(change_request)
    lowered_request = change_request.lower()

    direct_match_tokens_by_id: dict[str, list[str]] = {}
    for record in records:
        requirement = record.requirement
        haystacks = [
            requirement.requirement_code.lower(),
            requirement.title.lower(),
            requirement.text.lower(),
            requirement.type.lower(),
            (requirement.subsystem or "").lower(),
        ]
        parsed = _normalize_parsed_requirement(requirement.parsed_requirement)
        haystacks.extend(str(value).lower() for value in parsed.values() if value)
        parameter_matches = linked_by_requirement.get(requirement.id, [])
        haystacks.extend(parameter.name.lower() for parameter in parameter_matches)
        haystacks.extend(parameter.parameter_name.lower() for parameter in parameter_matches)
        haystacks.extend(str(parameter.value).lower() for parameter in parameter_matches)
        haystacks.extend((parameter.unit or "").lower() for parameter in parameter_matches)

        matched_tokens = sorted(
            {
                token
                for token in change_tokens
                if any(token in haystack for haystack in haystacks if haystack)
            }
        )

        if requirement.type.lower() in lowered_request:
            matched_tokens.append(requirement.type.lower())
        if requirement.subsystem and requirement.subsystem.lower() in lowered_request:
            matched_tokens.append(requirement.subsystem.lower())

        deduped_tokens = sorted(set(filter(None, matched_tokens)))
        if deduped_tokens:
            direct_match_tokens_by_id[requirement.id] = deduped_tokens

    direct_matches = [
        _build_change_impact_requirement_item(
            record_by_id[requirement_id],
            "direct",
            _relationship_reason(
                record_by_id[requirement_id],
                matched_tokens,
                len(linked_by_requirement.get(requirement_id, [])),
                "direct",
            ),
            matched_tokens,
            len(linked_by_requirement.get(requirement_id, [])),
        )
        for requirement_id, matched_tokens in sorted(
            direct_match_tokens_by_id.items(),
            key=lambda item: (-len(item[1]), requirement_by_id[item[0]].requirement_code),
        )
    ]

    indirect_reasons_by_id: dict[str, tuple[str, str | None]] = {}
    direct_ids = set(direct_match_tokens_by_id)
    for edge in edges:
        if edge.source in direct_ids and edge.target not in direct_ids:
            indirect_reasons_by_id.setdefault(edge.target, (edge.reason, edge.kind))
        if edge.target in direct_ids and edge.source not in direct_ids:
            indirect_reasons_by_id.setdefault(edge.source, (edge.reason, edge.kind))

    indirect_impacts = [
        _build_change_impact_requirement_item(
            record_by_id[requirement_id],
            "indirect",
            _relationship_reason(
                record_by_id[requirement_id],
                [],
                len(linked_by_requirement.get(requirement_id, [])),
                "indirect",
                connected_via=reason_tuple[1],
            ),
            [],
            len(linked_by_requirement.get(requirement_id, [])),
        )
        for requirement_id, reason_tuple in sorted(
            indirect_reasons_by_id.items(),
            key=lambda item: requirement_by_id[item[0]].requirement_code,
        )
        if requirement_id in record_by_id
    ]

    likely_need_edit_ids = {
        item.requirement.id
        for item in direct_matches
        if item.warning_count > 0
        or item.conflict_count > 0
        or item.linked_design_parameter_count > 0
        or (
            record_by_id[item.requirement.id].feasibility
            and record_by_id[item.requirement.id].feasibility.assessment_status
            in {"warning", "insufficient_data", "likely_infeasible"}
        )
    }
    likely_requirements_needing_edits = [
        next(item for item in direct_matches if item.requirement.id == requirement_id)
        for requirement_id in sorted(
            likely_need_edit_ids,
            key=lambda current_id: requirement_by_id[current_id].requirement_code,
        )
    ]

    affected_parameter_items: list[ChangeImpactReviewDesignParameterItem] = []
    seen_parameter_ids: set[str] = set()
    for requirement_id in set(direct_match_tokens_by_id) | set(indirect_reasons_by_id):
        for parameter in linked_by_requirement.get(requirement_id, []):
            if parameter.id in seen_parameter_ids:
                continue
            seen_parameter_ids.add(parameter.id)
            affected_parameter_items.append(
                ChangeImpactReviewDesignParameterItem(
                    id=parameter.id,
                    name=parameter.name,
                    parameter_name=parameter.parameter_name,
                    value=parameter.value,
                    unit=parameter.unit,
                    subsystem=parameter.subsystem,
                    linked_requirement_ids=[linked_requirement.id for linked_requirement in parameter.linked_requirements],
                    reason=f"linked design parameter for {requirement_by_id[requirement_id].requirement_code}",
                )
            )

    warnings: list[str] = []
    if not direct_matches:
        warnings.append(
            "No direct requirement text or structured-field matches were found. Review subsystem or type wording if the change request is broader than current requirement text."
        )
    if any(item.conflict_count > 0 for item in direct_matches):
        warnings.append("One or more directly affected requirements already carry conflict links and should be reviewed carefully before editing.")
    if any(
        record_by_id[item.requirement.id].feasibility
        and record_by_id[item.requirement.id].feasibility.assessment_status in {"warning", "insufficient_data", "likely_infeasible"}
        for item in direct_matches
    ):
        warnings.append("Feasibility warnings exist in the directly matched set; re-check supporting evidence before finalizing the change.")

    recommended_actions = []
    if direct_matches:
        recommended_actions.append("Update directly matched requirements first, keeping requirement text and structured fields aligned with the requested change.")
    if indirect_impacts:
        recommended_actions.append("Review parent/child and related requirements for downstream wording or verification updates.")
    if affected_parameter_items:
        recommended_actions.append("Validate linked design parameters so requirement updates stay consistent with current parameter values and units.")
    if any(item.conflict_count > 0 for item in direct_matches + indirect_impacts):
        recommended_actions.append("Resolve conflict-linked requirements before approving the change set.")

    return ChangeImpactReviewResponse(
        project_id=project_id,
        change_request=change_request,
        direct_matches=direct_matches,
        indirect_impacts=indirect_impacts,
        likely_requirements_needing_edits=likely_requirements_needing_edits,
        affected_design_parameters=affected_parameter_items,
        recommended_actions=recommended_actions,
        warnings=warnings,
    )
