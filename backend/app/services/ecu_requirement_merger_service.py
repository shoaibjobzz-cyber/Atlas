from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass
import re

from sqlalchemy.orm import Session

from app.models.design_parameter import DesignParameter
from app.models.requirement import Requirement
from app.schemas.ecu_merger import (
    EcuRequirementMergerAffectedDesignParameter,
    EcuRequirementMergerAnalyzeRequest,
    EcuRequirementMergerAnalyzeResponse,
    EcuRequirementMergerCandidateReview,
    EcuRequirementMergerSaveCandidate,
    EcuRequirementMergerSaveRequest,
    EcuRequirementMergerTraceabilityItem,
)
from app.schemas.generation import (
    GeneratedRequirementCandidateInput,
    GeneratedRequirementCandidateValidation,
    RequirementGenerationSaveResponse,
)
from app.schemas.quality import RequirementQualityCheckRequest
from app.schemas.requirement import RequirementCreate, RequirementGenerationMetadata, RequirementPriority, RequirementType
from app.services.correlation_service import CorrelationRequirementLike, get_requirement_like_correlations
from app.services.design_parameters_service import list_design_parameters
from app.services.projects_service import ensure_project_exists
from app.services.quality_service import evaluate_requirement_quality
from app.services.requirement_generation_provider import generation_metadata
from app.services.requirements_service import create_requirement, list_requirements
from app.services.structured_requirement_service import parse_requirement_text


ECU_MERGER_DRAFT_LABEL = "Deterministic centralized ECU merger draft. Review before saving."
ECU_MERGER_STRATEGY = "deterministic-centralized-ecu-merger-v1"
INTERFACE_TERMS = ("signal", "signals", "interface", "interfaces", "can", "lin", "message", "messages", "bus")
SAFETY_TERMS = ("safety", "asil", "hazard", "fail-safe", "diagnostic")
SECURITY_TERMS = ("security", "secure", "cyber", "authentication", "integrity")
TIMING_PATTERN = re.compile(r"\b\d+(?:\.\d+)?\s*(?:us|ms|s|sec|seconds|hz|khz)\b", re.IGNORECASE)
TOKEN_PATTERN = re.compile(r"[A-Za-z][A-Za-z0-9_-]+")
STOPWORDS = {
    "the",
    "shall",
    "be",
    "and",
    "for",
    "with",
    "from",
    "into",
    "that",
    "this",
    "during",
    "under",
    "when",
    "using",
    "across",
    "must",
    "system",
    "subsystem",
    "software",
    "hardware",
    "controller",
    "ecu",
}
PRIORITY_RANK: dict[RequirementPriority, int] = {
    "Low": 0,
    "Medium": 1,
    "High": 2,
    "Critical": 3,
}


@dataclass
class ClusterEdge:
    kind: str
    reason: str
    peer_id: str


def _normalized(value: str | None) -> str:
    return (value or "").strip().lower()


def _requirement_text_blob(requirement: Requirement) -> str:
    return " ".join(
        part
        for part in (
            requirement.requirement_code,
            requirement.title,
            requirement.text,
            requirement.subsystem,
            requirement.rationale,
            requirement.assumptions,
        )
        if part
    )


def _get_parsed_requirement(requirement: Requirement) -> dict[str, str | None]:
    if requirement.parsed_requirement:
        return dict(requirement.parsed_requirement)
    return parse_requirement_text(requirement.title, requirement.text).model_dump()


def _candidate_validation(
    session: Session,
    project_id: str,
    candidate: GeneratedRequirementCandidateInput,
) -> GeneratedRequirementCandidateValidation:
    quality_summary = evaluate_requirement_quality(
        RequirementQualityCheckRequest(
            title=candidate.title,
            text=candidate.text,
            type=candidate.type,
        )
    )
    parsed_requirement = parse_requirement_text(candidate.title, candidate.text)
    correlation_summary = get_requirement_like_correlations(
        session,
        CorrelationRequirementLike(
            id=candidate.temp_id,
            project_id=project_id,
            title=candidate.title,
            text=candidate.text,
            type=candidate.type,
            status="Draft",
            subsystem=candidate.subsystem,
            parsed_requirement=parsed_requirement.model_dump(),
        ),
    )
    return GeneratedRequirementCandidateValidation(
        quality_summary=quality_summary,
        parsed_requirement=parsed_requirement,
        correlation_summary=correlation_summary,
    )


def _design_parameters_by_requirement(session: Session, project_id: str) -> dict[str, list[DesignParameter]]:
    linked: dict[str, list[DesignParameter]] = defaultdict(list)
    for parameter in list_design_parameters(session, project_id):
        for requirement in parameter.linked_requirements:
            linked[requirement.id].append(parameter)
    return linked


def _dedupe_keep_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        normalized = value.strip()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(normalized)
    return result


def _tokenize_titles(requirements: list[Requirement]) -> list[str]:
    tokens: list[str] = []
    for requirement in requirements:
        for token in TOKEN_PATTERN.findall(requirement.title.lower()):
            if token in STOPWORDS or len(token) < 3:
                continue
            tokens.append(token)
    return tokens


def _topic_label(requirements: list[Requirement], parsed_requirements: dict[str, dict[str, str | None]]) -> str:
    parameters = [
        parsed_requirements[requirement.id].get("parameter")
        for requirement in requirements
        if parsed_requirements[requirement.id].get("parameter")
    ]
    if parameters:
        return Counter(parameters).most_common(1)[0][0] or "behavior coordination"

    interface_terms = _collect_interface_terms(requirements)
    if interface_terms:
        return interface_terms[0]

    title_tokens = _tokenize_titles(requirements)
    if title_tokens:
        most_common = Counter(title_tokens).most_common(2)
        return " ".join(token for token, _count in most_common)

    return "cross-domain behavior"


def _collect_interface_terms(requirements: list[Requirement]) -> list[str]:
    found: list[str] = []
    for requirement in requirements:
        blob = _normalized(_requirement_text_blob(requirement))
        for term in INTERFACE_TERMS:
            if term in blob:
                found.append(term.upper() if term in {"can", "lin"} else term)
    return _dedupe_keep_order(found)


def _collect_timing_constraints(requirements: list[Requirement], parsed_requirements: dict[str, dict[str, str | None]]) -> list[str]:
    items: list[str] = []
    for requirement in requirements:
        parsed_timing = parsed_requirements[requirement.id].get("timing")
        if parsed_timing:
            items.append(f"{requirement.requirement_code}: {parsed_timing}")
            continue
        matches = TIMING_PATTERN.findall(requirement.text)
        for match in matches:
            items.append(f"{requirement.requirement_code}: {match}")
    return _dedupe_keep_order(items)


def _collect_safety_security_constraints(requirements: list[Requirement]) -> list[str]:
    items: list[str] = []
    for requirement in requirements:
        blob = _normalized(_requirement_text_blob(requirement))
        safety_hits = [term for term in SAFETY_TERMS if term in blob]
        security_hits = [term for term in SECURITY_TERMS if term in blob]
        if safety_hits:
            items.append(f"{requirement.requirement_code}: safety-sensitive ({', '.join(sorted(set(safety_hits)))})")
        if security_hits:
            items.append(f"{requirement.requirement_code}: security-sensitive ({', '.join(sorted(set(security_hits)))})")
    return _dedupe_keep_order(items)


def _shared_parameter_reason(requirement: Requirement, parameter: str | None) -> str:
    if parameter:
        return f"Selected for centralized merge because it contributes to the shared {parameter} behavior."
    return "Selected for centralized merge because it participates in the same merged requirement cluster."


def _build_graph_edges(
    session: Session,
    project_id: str,
    selected_requirements: list[Requirement],
    parsed_requirements: dict[str, dict[str, str | None]],
) -> tuple[dict[str, list[ClusterEdge]], dict[frozenset[str], list[str]], dict[frozenset[str], list[str]]]:
    by_id = {requirement.id: requirement for requirement in selected_requirements}
    adjacency: dict[str, list[ClusterEdge]] = defaultdict(list)
    related_reasons: dict[frozenset[str], list[str]] = defaultdict(list)
    conflict_reasons: dict[frozenset[str], list[str]] = defaultdict(list)

    for requirement in selected_requirements:
        summary = get_requirement_like_correlations(
            session,
            CorrelationRequirementLike(
                id=requirement.id,
                project_id=project_id,
                title=requirement.title,
                text=requirement.text,
                type=requirement.type,
                status=requirement.status,
                subsystem=requirement.subsystem,
                parsed_requirement=parsed_requirements[requirement.id],
            ),
            exclude_requirement_id=requirement.id,
            project_requirements=selected_requirements,
        )
        for item in summary.related_requirements:
            if item.requirement is None or item.requirement.id not in by_id:
                continue
            edge_key = frozenset({requirement.id, item.requirement.id})
            related_reasons[edge_key].append(item.reason)
            adjacency[requirement.id].append(ClusterEdge(kind="related", reason=item.reason, peer_id=item.requirement.id))
        for item in summary.potential_conflicts:
            if item.requirement is None or item.requirement.id not in by_id:
                continue
            edge_key = frozenset({requirement.id, item.requirement.id})
            conflict_reasons[edge_key].append(item.reason)
            adjacency[requirement.id].append(ClusterEdge(kind="conflict", reason=item.reason, peer_id=item.requirement.id))

    for index, left in enumerate(selected_requirements):
        for right in selected_requirements[index + 1 :]:
            left_parsed = parsed_requirements[left.id]
            right_parsed = parsed_requirements[right.id]
            same_title = _normalized(left.title) == _normalized(right.title)
            same_text = _normalized(left.text) == _normalized(right.text)
            same_parameter = (
                left_parsed.get("parameter")
                and left_parsed.get("parameter") == right_parsed.get("parameter")
                and left_parsed.get("operator") == right_parsed.get("operator")
                and left_parsed.get("value") == right_parsed.get("value")
                and left_parsed.get("unit") == right_parsed.get("unit")
            )
            if not (same_title or same_text or same_parameter):
                continue
            edge_key = frozenset({left.id, right.id})
            duplicate_reason = "The selected requirements appear to be duplicates or near-duplicates and should be consolidated."
            related_reasons[edge_key].append(duplicate_reason)
            adjacency[left.id].append(ClusterEdge(kind="duplicate", reason=duplicate_reason, peer_id=right.id))
            adjacency[right.id].append(ClusterEdge(kind="duplicate", reason=duplicate_reason, peer_id=left.id))

    return adjacency, related_reasons, conflict_reasons


def _connected_components(selected_requirements: list[Requirement], adjacency: dict[str, list[ClusterEdge]]) -> list[list[Requirement]]:
    by_id = {requirement.id: requirement for requirement in selected_requirements}
    visited: set[str] = set()
    components: list[list[Requirement]] = []

    for requirement in selected_requirements:
        if requirement.id in visited:
            continue
        stack = [requirement.id]
        component_ids: list[str] = []
        while stack:
            node_id = stack.pop()
            if node_id in visited:
                continue
            visited.add(node_id)
            component_ids.append(node_id)
            for edge in adjacency.get(node_id, []):
                if edge.peer_id not in visited:
                    stack.append(edge.peer_id)
        components.append([by_id[node_id] for node_id in component_ids])

    return components


def _merged_priority(requirements: list[Requirement]) -> RequirementPriority:
    return max((requirement.priority for requirement in requirements), key=lambda value: PRIORITY_RANK[value])


def _merged_type(requirements: list[Requirement]) -> RequirementType:
    types = {requirement.type for requirement in requirements}
    if len(types) == 1:
        return next(iter(types))
    return "System"


def _candidate_metadata(requirements: list[Requirement]) -> RequirementGenerationMetadata:
    metadata = generation_metadata(
        generation_source="manual",
        generation_provider=None,
        generated_from_requirement_id=requirements[0].id if len(requirements) == 1 else None,
        is_generated_draft=True,
    )
    metadata.merged_from_requirement_ids = [requirement.id for requirement in requirements]
    metadata.merged_from_requirement_codes = [requirement.requirement_code for requirement in requirements]
    metadata.merged_from_subsystems = _dedupe_keep_order([requirement.subsystem or "Unknown subsystem" for requirement in requirements])
    metadata.merge_strategy = ECU_MERGER_STRATEGY
    return metadata


def _build_proposed_text(
    topic: str,
    requirements: list[Requirement],
    timing_constraints: list[str],
    interface_terms: list[str],
    safety_security_constraints: list[str],
) -> str:
    subsystem_phrase = ", ".join(_dedupe_keep_order([requirement.subsystem or "Unassigned subsystem" for requirement in requirements]))
    text = f"The centralized ECU shall coordinate {topic} behavior across {subsystem_phrase} requirements."
    if interface_terms:
        text += f" It shall preserve the shared interfaces/signals for {', '.join(interface_terms)}."
    if timing_constraints:
        condensed = "; ".join(item.split(": ", 1)[1] for item in timing_constraints[:2])
        text += f" It shall satisfy timing constraints including {condensed}."
    if safety_security_constraints:
        text += " It shall maintain identified safety and security constraints during consolidation."
    return text


def _build_assumptions(requirements: list[Requirement], interface_terms: list[str]) -> list[str]:
    assumptions = [
        "The centralized ECU becomes the orchestration point for the merged behavior across the selected source requirements.",
        "Source verification methods remain relevant unless architecture ownership changes during detailed review.",
    ]
    if interface_terms:
        assumptions.append(
            f"Existing interfaces/signals ({', '.join(interface_terms)}) remain externally compatible unless the integration team approves a protocol update."
        )
    if len({requirement.subsystem for requirement in requirements if requirement.subsystem}) > 1:
        assumptions.append("Cross-subsystem ownership and timing budgets will be aligned during final implementation review.")
    return assumptions


def _build_conflicts(
    cluster: list[Requirement],
    conflict_reasons: dict[frozenset[str], list[str]],
) -> list[str]:
    items: list[str] = []
    cluster_ids = {requirement.id for requirement in cluster}
    for pair, reasons in conflict_reasons.items():
        if pair.issubset(cluster_ids):
            items.extend(reasons)
    return _dedupe_keep_order(items)


def _build_warnings(
    cluster: list[Requirement],
    parsed_requirements: dict[str, dict[str, str | None]],
    design_parameters_by_requirement: dict[str, list[DesignParameter]],
) -> list[str]:
    warnings: list[str] = []
    if len({requirement.subsystem for requirement in cluster if requirement.subsystem}) > 1:
        warnings.append("The merged proposal spans multiple subsystems and will need explicit ownership alignment.")

    verification_methods = {requirement.verification_method for requirement in cluster if requirement.verification_method}
    if len(verification_methods) > 1:
        warnings.append("Source requirements use different verification methods. Review whether one merged verification plan is sufficient.")

    parameter_units: dict[str, set[str]] = defaultdict(set)
    for requirement in cluster:
        parsed = parsed_requirements[requirement.id]
        if parsed.get("parameter") and parsed.get("unit"):
            parameter_units[parsed["parameter"]].add(parsed["unit"] or "")
    for parameter, units in parameter_units.items():
        if len(units) > 1:
            warnings.append(f"Parameter '{parameter}' appears with multiple units ({', '.join(sorted(units))}). Normalize the unit before approval.")

    if not any(design_parameters_by_requirement.get(requirement.id) for requirement in cluster):
        warnings.append("No linked design parameters were found for this merged cluster. Add supporting design evidence before approval.")

    return _dedupe_keep_order(warnings)


def _build_recommended_actions(conflicts: list[str], warnings: list[str], design_parameters: list[EcuRequirementMergerAffectedDesignParameter]) -> list[str]:
    actions = [
        "Review the proposed centralized ECU wording and confirm the system boundary and ownership.",
        "Update the source requirements or retire duplicates only after the merged requirement is approved.",
    ]
    if conflicts:
        actions.append("Resolve the flagged conflicts before accepting the merged requirement into the baseline.")
    if warnings:
        actions.append("Address the listed warnings and assumptions during architecture and verification review.")
    if design_parameters:
        actions.append("Confirm linked design parameters stay aligned with the merged requirement text, units, and timing commitments.")
    return actions


def _build_verification_notes(cluster: list[Requirement], timing_constraints: list[str], conflicts: list[str]) -> list[str]:
    notes = _dedupe_keep_order(
        [
            f"Preserve or update verification evidence for {requirement.requirement_code} ({requirement.verification_method or 'Unspecified method'})."
            for requirement in cluster
        ]
    )
    if timing_constraints:
        notes.append("Re-run timing analysis for the centralized ECU behavior after merge approval.")
    if conflicts:
        notes.append("Add a regression review to prove the merged requirement resolves the detected constraint conflicts.")
    return notes


def _affected_design_parameter_items(
    cluster: list[Requirement],
    design_parameters_by_requirement: dict[str, list[DesignParameter]],
) -> list[EcuRequirementMergerAffectedDesignParameter]:
    by_parameter_id: dict[str, EcuRequirementMergerAffectedDesignParameter] = {}
    for requirement in cluster:
        for parameter in design_parameters_by_requirement.get(requirement.id, []):
            existing = by_parameter_id.get(parameter.id)
            if existing is None:
                by_parameter_id[parameter.id] = EcuRequirementMergerAffectedDesignParameter(
                    id=parameter.id,
                    name=parameter.name,
                    parameter_name=parameter.parameter_name,
                    value=parameter.value,
                    unit=parameter.unit,
                    subsystem=parameter.subsystem,
                    linked_requirement_ids=[linked.id for linked in parameter.linked_requirements],
                    reason=f"Linked to merged source requirement {requirement.requirement_code}.",
                )
            else:
                existing.reason = f"Linked to merged source requirements including {requirement.requirement_code}."
    return list(by_parameter_id.values())


def _traceability_items(
    cluster: list[Requirement],
    parsed_requirements: dict[str, dict[str, str | None]],
    topic: str,
) -> list[EcuRequirementMergerTraceabilityItem]:
    items: list[EcuRequirementMergerTraceabilityItem] = []
    for requirement in cluster:
        reason = _shared_parameter_reason(requirement, parsed_requirements[requirement.id].get("parameter") or topic)
        items.append(
            EcuRequirementMergerTraceabilityItem(
                requirement=requirement,
                source_subsystem=requirement.subsystem,
                source_feature_label=None,
                traceability_reason=reason,
            )
        )
    return items


def analyze_ecu_requirement_merge(
    session: Session,
    payload: EcuRequirementMergerAnalyzeRequest,
    owner_user_id: str | None = None,
) -> EcuRequirementMergerAnalyzeResponse:
    ensure_project_exists(session, payload.project_id, owner_user_id)
    project_requirements = list_requirements(session, payload.project_id, owner_user_id)
    requirements_by_id = {requirement.id: requirement for requirement in project_requirements}
    selected_requirements = [requirements_by_id[requirement_id] for requirement_id in payload.requirement_ids if requirement_id in requirements_by_id]
    missing_ids = [requirement_id for requirement_id in payload.requirement_ids if requirement_id not in requirements_by_id]

    parsed_requirements = {requirement.id: _get_parsed_requirement(requirement) for requirement in selected_requirements}
    adjacency, related_reasons, conflict_reasons = _build_graph_edges(
        session,
        payload.project_id,
        selected_requirements,
        parsed_requirements,
    )
    components = _connected_components(selected_requirements, adjacency)
    design_parameters_by_requirement = _design_parameters_by_requirement(session, payload.project_id)

    candidates: list[EcuRequirementMergerCandidateReview] = []
    for index, cluster in enumerate(components, start=1):
        topic = _topic_label(cluster, parsed_requirements)
        interface_terms = _collect_interface_terms(cluster)
        timing_constraints = _collect_timing_constraints(cluster, parsed_requirements)
        safety_security_constraints = _collect_safety_security_constraints(cluster)
        affected_design_parameters = _affected_design_parameter_items(cluster, design_parameters_by_requirement)
        conflicts = _build_conflicts(cluster, conflict_reasons)
        warnings = _build_warnings(cluster, parsed_requirements, design_parameters_by_requirement)
        assumptions_list = _build_assumptions(cluster, interface_terms)
        recommended_actions = _build_recommended_actions(conflicts, warnings, affected_design_parameters)
        verification_notes = _build_verification_notes(cluster, timing_constraints, conflicts)
        source_codes = [requirement.requirement_code for requirement in cluster]
        source_subsystems = _dedupe_keep_order([requirement.subsystem or "Unknown subsystem" for requirement in cluster])
        relationship_reasons: list[str] = []
        cluster_ids = {requirement.id for requirement in cluster}
        for pair, reasons in related_reasons.items():
            if pair.issubset(cluster_ids):
                relationship_reasons.extend(reasons)
        relationship_summary = _dedupe_keep_order(relationship_reasons)
        merge_rationale = (
            f"Consolidate {', '.join(source_codes)} into one centralized ECU requirement because they share {topic} behavior."
        )
        if relationship_summary:
            merge_rationale += f" Deterministic merge evidence: {' '.join(relationship_summary[:3])}"

        candidate_input = GeneratedRequirementCandidateInput(
            temp_id=f"ecu-merge-{index}",
            suggested_id=f"CEN-ECU-MRG-{index:02d}",
            suggested_hierarchy=None,
            title=f"Centralized ECU coordination for {topic.title()}",
            text=_build_proposed_text(topic, cluster, timing_constraints, interface_terms, safety_security_constraints),
            type=_merged_type(cluster),
            priority=_merged_priority(cluster),
            rationale=merge_rationale,
            parent_requirement_id=None,
            subsystem="Centralized ECU",
            verification_method=", ".join(_dedupe_keep_order([requirement.verification_method or "Analysis" for requirement in cluster])),
            assumptions=" ".join(assumptions_list),
            generation_metadata=_candidate_metadata(cluster),
        )
        candidates.append(
            EcuRequirementMergerCandidateReview(
                temp_id=candidate_input.temp_id,
                suggested_id=candidate_input.suggested_id,
                suggested_hierarchy=None,
                title=candidate_input.title,
                text=candidate_input.text,
                type=candidate_input.type,
                priority=candidate_input.priority,
                rationale=candidate_input.rationale,
                parent_requirement_id=None,
                subsystem=candidate_input.subsystem,
                verification_method=candidate_input.verification_method,
                assumptions=candidate_input.assumptions,
                generation_metadata=candidate_input.generation_metadata,
                validation=_candidate_validation(session, payload.project_id, candidate_input),
                draft_label=ECU_MERGER_DRAFT_LABEL,
                source_requirement_ids=[requirement.id for requirement in cluster],
                source_requirement_codes=source_codes,
                source_subsystems=source_subsystems,
                merge_rationale=merge_rationale,
                assumptions_list=assumptions_list,
                conflicts=conflicts,
                warnings=warnings,
                recommended_fix_actions=recommended_actions,
                verification_notes=verification_notes,
                shared_signals_or_interfaces=interface_terms,
                timing_constraints=timing_constraints,
                safety_security_constraints=safety_security_constraints,
                affected_design_parameters=affected_design_parameters,
                traceability=_traceability_items(cluster, parsed_requirements, topic),
            )
        )

    warnings: list[str] = []
    if missing_ids:
        warnings.append(
            f"Some requested requirements were not available in the current project scope and were skipped: {', '.join(missing_ids)}."
        )
    if any(len(candidate.source_requirement_ids) == 1 for candidate in candidates):
        warnings.append("One or more selections had no deterministic overlap evidence, so they were kept as single-source merge proposals.")

    return EcuRequirementMergerAnalyzeResponse(
        project_id=payload.project_id,
        selected_requirement_ids=[requirement.id for requirement in selected_requirements],
        selected_requirement_count=len(selected_requirements),
        candidates=candidates,
        warnings=_dedupe_keep_order(warnings),
    )


def save_merged_requirement_candidates(
    session: Session,
    payload: EcuRequirementMergerSaveRequest,
    owner_user_id: str | None = None,
) -> RequirementGenerationSaveResponse:
    ensure_project_exists(session, payload.project_id, owner_user_id)
    saved_requirements = []
    for candidate in payload.candidates:
        saved_requirements.append(_save_merged_requirement(session, payload.project_id, candidate, owner_user_id))
    return RequirementGenerationSaveResponse(saved_requirements=saved_requirements)


def _save_merged_requirement(
    session: Session,
    project_id: str,
    candidate: EcuRequirementMergerSaveCandidate,
    owner_user_id: str | None = None,
) -> Requirement:
    return create_requirement(
        session,
        RequirementCreate(
            project_id=project_id,
            title=candidate.title,
            text=candidate.text,
            type=candidate.type,
            priority=candidate.priority,
            status="Draft",
            parent_requirement_id=candidate.parent_requirement_id,
            subsystem=candidate.subsystem,
            verification_method=candidate.verification_method,
            rationale=candidate.rationale,
            assumptions=candidate.assumptions,
            generation_metadata=candidate.generation_metadata,
        ),
        owner_user_id,
    )
