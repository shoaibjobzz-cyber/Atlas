import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import { fetchProjectTraceabilityGraph as fetchProjectTraceabilityGraphPayload } from "./projectViewsApi";
import type {
  GraphNodeHealth,
  TraceabilityEdgeKind,
  TraceabilityGraphEdgeData,
  TraceabilityGraphFilterState,
  TraceabilityGraphNodeData,
  TraceabilityGraphSummary,
} from "../types/traceabilityGraph";
import type { RequirementType } from "../types/requirements";
import type {
  TraceabilityGraphEdgeResponse,
  TraceabilityGraphNodeResponse,
} from "../types/projectViews";

const typeOrder: RequirementType[] = ["Stakeholder", "System", "Subsystem", "Software", "Hardware"];
const xByType: Record<RequirementType, number> = {
  Stakeholder: 0,
  System: 380,
  Subsystem: 760,
  Software: 1140,
  Hardware: 1520,
};

function nodeColor(health: GraphNodeHealth) {
  switch (health) {
    case "conflict":
      return "#fca5a5";
    case "warning":
      return "#fde68a";
    case "acceptable":
      return "#86efac";
  }
}

function borderColor(health: GraphNodeHealth) {
  switch (health) {
    case "conflict":
      return "#b91c1c";
    case "warning":
      return "#b45309";
    case "acceptable":
      return "#166534";
  }
}

function edgeStyle(kind: TraceabilityEdgeKind) {
  switch (kind) {
    case "parent-child":
      return {
        stroke: "#2563eb",
        strokeWidth: 2,
      };
    case "related":
      return {
        stroke: "#64748b",
        strokeWidth: 1.5,
        strokeDasharray: "6 4",
      };
    case "conflict":
      return {
        stroke: "#dc2626",
        strokeWidth: 2.5,
      };
  }
}

function shouldIncludeNode(node: TraceabilityGraphNodeResponse, filters: TraceabilityGraphFilterState) {
  const subsystemMatches =
    filters.subsystem === "all" || (node.subsystem ?? "Unassigned") === filters.subsystem;
  const typeMatches = filters.type === "all" || node.type === filters.type;
  const provenanceMatches =
    filters.provenance === "all" ||
    (filters.provenance === "generated" ? node.provenance === "ai" : node.provenance !== "ai");

  return subsystemMatches && typeMatches && provenanceMatches;
}

function buildNodes(graphNodes: TraceabilityGraphNodeResponse[]): Node<TraceabilityGraphNodeData>[] {
  const rowsByType = new Map<RequirementType, number>();

  return graphNodes.map((node) => {
    const row = rowsByType.get(node.type) ?? 0;
    rowsByType.set(node.type, row + 1);

    return {
      id: node.id,
      type: "default",
      position: {
        x: xByType[node.type],
        y: row * 170,
      },
      draggable: false,
      selectable: true,
      data: {
        label: node.label,
        title: node.title,
        subsystem: node.subsystem,
        requirementType: node.type,
        provenance: node.provenance,
        feasibilityStatus: node.feasibility_status,
        health: node.health as GraphNodeHealth,
        warningCount: node.warning_count,
        conflictCount: node.conflict_count,
        isGenerated: node.is_generated,
      },
      style: {
        width: 300,
        padding: 12,
        borderRadius: 8,
        border: `2px ${node.is_generated ? "dashed" : "solid"} ${borderColor(node.health as GraphNodeHealth)}`,
        background: nodeColor(node.health as GraphNodeHealth),
        color: "#0f172a",
        boxShadow: "0 6px 16px rgba(15, 23, 42, 0.08)",
        fontSize: 12,
      },
    };
  });
}

function buildEdges(graphEdges: TraceabilityGraphEdgeResponse[]): Edge<TraceabilityGraphEdgeData>[] {
  return graphEdges.map((edge) => {
    const kind = edge.kind as TraceabilityEdgeKind;
    const style = edgeStyle(kind);

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      animated: kind === "conflict",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: style.stroke,
      },
      style,
      data: {
        kind,
        reason: edge.reason,
      },
    };
  });
}

export async function fetchProjectTraceabilityGraph(projectId: string) {
  return fetchProjectTraceabilityGraphPayload(projectId);
}

export function filterTraceabilityGraph(
  graphNodes: TraceabilityGraphNodeResponse[],
  graphEdges: TraceabilityGraphEdgeResponse[],
  filters: TraceabilityGraphFilterState
) {
  const filteredGraphNodes = graphNodes.filter((node) => shouldIncludeNode(node, filters));
  const filteredIds = new Set(filteredGraphNodes.map((node) => node.id));
  const filteredGraphEdges = graphEdges.filter(
    (edge) => filteredIds.has(edge.source) && filteredIds.has(edge.target)
  );

  const nodes = buildNodes(filteredGraphNodes);
  const edges = buildEdges(filteredGraphEdges);

  const summary: TraceabilityGraphSummary = {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    conflictNodes: filteredGraphNodes.filter((node) => node.health === "conflict").length,
    generatedNodes: filteredGraphNodes.filter((node) => node.provenance === "ai").length,
  };

  return {
    nodes,
    edges,
    summary,
  };
}

export function collectTraceabilityGraphFilters(graphNodes: TraceabilityGraphNodeResponse[]) {
  const subsystems = Array.from(new Set(graphNodes.map((node) => node.subsystem ?? "Unassigned"))).sort(
    (left, right) => left.localeCompare(right)
  );

  return {
    subsystemOptions: ["all", ...subsystems],
    typeOptions: ["all", ...typeOrder] as Array<RequirementType | "all">,
  };
}
