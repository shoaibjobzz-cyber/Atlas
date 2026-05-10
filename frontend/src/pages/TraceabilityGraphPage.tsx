import "@xyflow/react/dist/style.css";
import HubOutlinedIcon from "@mui/icons-material/HubOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import {
  Alert,
  Box,
  Button,
  Divider,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import WorkspaceStatePanel from "../components/common/WorkspaceStatePanel";
import AppCompactActionButton from "../components/common/AppCompactActionButton";
import AppIconActionButton from "../components/common/AppIconActionButton";
import WorkspaceCommandBar from "../components/common/WorkspaceCommandBar";
import ProjectWorkspaceShell from "../components/layout/ProjectWorkspaceShell";
import RequirementsContextPanel from "../components/requirements/RequirementsContextPanel";
import {
  getTraceabilityMatrixFocusPath,
  routePaths,
} from "../routes/routePaths";
import {
  fetchProjectTraceabilityHealth,
  fetchProjectTraceabilityBrokenChains,
  fetchProjectTraceabilityCriticalPath,
  fetchProjectTraceabilityImpactAnalysis,
  runProjectChangeImpactReview,
} from "../services/projectViewsApi";
import {
  collectTraceabilityGraphFilters,
  fetchProjectTraceabilityGraph,
  filterTraceabilityGraph,
} from "../services/traceabilityGraphService";
import type {
  ChangeImpactReviewResponse,
  TraceabilityHealthScoreResponse,
  TraceabilityGraphAnalysisResponse,
  TraceabilityGraphEdgeResponse,
  TraceabilityGraphNodeResponse,
} from "../types/projectViews";
import type { RequirementType } from "../types/requirements";
import type {
  TraceabilityGraphEdgeData,
  TraceabilityGraphFilterState,
  TraceabilityGraphNodeData,
} from "../types/traceabilityGraph";

const defaultFilters: TraceabilityGraphFilterState = {
  subsystem: "all",
  type: "all",
  provenance: "all",
};

type GraphExplorationMode =
  | "impact"
  | "upstream-impact"
  | "downstream-impact"
  | "parents"
  | "children"
  | "dependents"
  | "upstream"
  | "downstream"
  | "focus"
  | "subtree"
  | "broken-chains"
  | "orphans"
  | "missing-evidence"
  | "critical-path";

type GraphContextMenuState = {
  nodeId: string;
  requirementCode: string;
  title: string;
  mouseX: number;
  mouseY: number;
};

type GraphAnalysisResult = {
  title: string;
  description: string;
  selectedNodeId?: string;
  primaryNodes: Set<string>;
  secondaryNodes: Set<string>;
  primaryEdges: Set<string>;
  secondaryEdges: Set<string>;
  warningNodes?: Set<string>;
  dimUnrelated: boolean;
  summaryItems: Array<{ label: string; value: string }>;
};

type NodeRenderState = "selected" | "direct" | "indirect" | "inactive";
type EdgeRenderState = "direct_edge" | "indirect_edge" | "inactive_edge";
type GraphRenderIntegrity = {
  selectedNodeId?: string;
  activeNodeIds: string[];
  directNodeIds: string[];
  indirectNodeIds: string[];
  activeEdgeIds: string[];
  filteredGraphNodeIds: string[];
  filteredGraphRequirementCodes: string[];
  explorationForcedInNodeIds: string[];
  finalVisibleSelectedNodeIds: string[];
  finalVisibleDirectNodeIds: string[];
  finalVisibleIndirectNodeIds: string[];
  finalVisibleActiveNodeIds: string[];
  finalVisibleActiveEdgeIds: string[];
  finalRenderedNodeIds: string[];
  finalRenderedEdgeIds: string[];
  semanticActiveRequirementCodes: string[];
  finalVisibleActiveRequirementCodes: string[];
  droppedActiveEdgesWithMissingVisibleEndpoints: string[];
  droppedRenderedEdgeDetails: string[];
  autoAddedEndpointNodeIds: string[];
  droppedEdgeIds: string[];
  repositionedActiveNodeIds: string[];
  renderedVisibleNodeIds: string[];
  missingVisibleActiveNodeIds: string[];
  activeEdgesWithInvisibleEndpoints: string[];
  missingVisibleActiveNodeReasons: string[];
  nodeProofRows: string[];
  renderNodeProofRows: string[];
  overlapProofRows: string[];
};

type NodePosition = { x: number; y: number };

function extractRequirementCodeFromLabel(label: string) {
  return label.split("\n")[0]?.trim() ?? "";
}

function isDefined<T>(value: T | null): value is T {
  return value !== null;
}

function impactModeLabel(
  mode: Extract<GraphExplorationMode, "impact" | "upstream-impact" | "downstream-impact">
) {
  return mode === "upstream-impact"
    ? "Upstream"
    : mode === "downstream-impact"
      ? "Downstream"
      : "Bidirectional";
}

function impactDirectionForMode(
  mode: Extract<GraphExplorationMode, "impact" | "upstream-impact" | "downstream-impact">
) {
  return mode === "upstream-impact"
    ? "upstream"
    : mode === "downstream-impact"
      ? "downstream"
      : "both";
}

function buildImpactSummaryItems(
  mode: Extract<GraphExplorationMode, "impact" | "upstream-impact" | "downstream-impact">,
  graphNodes: Node<TraceabilityGraphNodeData>[],
  primaryNodes: Set<string>,
  secondaryNodes: Set<string>
) {
  const impactedNodeIds = new Set([...primaryNodes, ...secondaryNodes]);
  const summary = summarizeAnalysis(impactedNodeIds, graphNodes);

  return [
    { label: "Mode", value: impactModeLabel(mode) },
    { label: "Direct impacts", value: String(primaryNodes.size) },
    { label: "Indirect impacts", value: String(secondaryNodes.size) },
    { label: "Affected requirements", value: String(summary.affectedCount) },
  ];
}

function collectReachability(
  nodeId: string,
  graphEdges: Edge<TraceabilityGraphEdgeData>[],
  direction: "incoming" | "outgoing" | "both",
  options?: {
    kindFilter?: TraceabilityGraphEdgeData["kind"] | "non-parent-child";
    includeStart?: boolean;
  }
) {
  const includeStart = options?.includeStart ?? true;
  const nodesByDepth = new Map<string, number>();
  const edgesByDepth = new Map<string, number>();
  const queue: Array<{ id: string; depth: number }> = [{ id: nodeId, depth: 0 }];
  const visited = new Set<string>([nodeId]);

  if (includeStart) {
    nodesByDepth.set(nodeId, 0);
  }

  const matchesKind = (edge: Edge<TraceabilityGraphEdgeData>) => {
    if (!options?.kindFilter) {
      return true;
    }
    if (options.kindFilter === "non-parent-child") {
      return edge.data?.kind !== "parent-child";
    }
    return edge.data?.kind === options.kindFilter;
  };

  while (queue.length > 0) {
    const current = queue.shift()!;
    const matchingEdges = graphEdges.filter((edge) => {
      if (!matchesKind(edge)) {
        return false;
      }
      if (direction === "incoming") {
        return edge.target === current.id;
      }
      if (direction === "outgoing") {
        return edge.source === current.id;
      }
      return edge.source === current.id || edge.target === current.id;
    });

    matchingEdges.forEach((edge) => {
      const nextNodeId =
        direction === "incoming"
          ? edge.source
          : direction === "outgoing"
            ? edge.target
            : edge.source === current.id
              ? edge.target
              : edge.source;
      const nextDepth = current.depth + 1;
      edgesByDepth.set(edge.id, Math.min(edgesByDepth.get(edge.id) ?? nextDepth, nextDepth));
      if (!nodesByDepth.has(nextNodeId) || nextDepth < (nodesByDepth.get(nextNodeId) ?? nextDepth)) {
        nodesByDepth.set(nextNodeId, nextDepth);
      }
      if (!visited.has(nextNodeId)) {
        visited.add(nextNodeId);
        queue.push({ id: nextNodeId, depth: nextDepth });
      }
    });
  }

  return { nodesByDepth, edgesByDepth };
}

function collectDirectImpact(
  nodeId: string,
  graphEdges: Edge<TraceabilityGraphEdgeData>[],
  direction: "both" | "incoming" | "outgoing"
) {
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  graphEdges.forEach((edge) => {
    if (edge.data?.kind === "parent-child") {
      const isIncoming = edge.target === nodeId;
      const isOutgoing = edge.source === nodeId;

      if (direction !== "outgoing" && isIncoming) {
        nodeIds.add(edge.source);
        edgeIds.add(edge.id);
      }

      if (direction !== "incoming" && isOutgoing) {
        nodeIds.add(edge.target);
        edgeIds.add(edge.id);
      }

      return;
    }

    // Lateral relationships stay one-hop only so impact mode remains centered
    // on the selected node instead of expanding through the whole mesh.
    if (direction === "both" && (edge.source === nodeId || edge.target === nodeId)) {
      nodeIds.add(edge.source === nodeId ? edge.target : edge.source);
      edgeIds.add(edge.id);
    }
  });

  return { nodeIds, edgeIds };
}

function sortNodeIdsByOriginalPosition(
  nodeIds: Iterable<string>,
  graphNodes: Node<TraceabilityGraphNodeData>[]
) {
  const nodeById = new Map(graphNodes.map((node) => [node.id, node]));
  const sortedNodes: Node<TraceabilityGraphNodeData>[] = [];

  [...nodeIds].forEach((nodeId) => {
    const node = nodeById.get(nodeId);
    if (node) {
      sortedNodes.push(node);
    }
  });

  return sortedNodes
    .sort((left, right) =>
      left.position.x === right.position.x
        ? left.position.y - right.position.y
        : left.position.x - right.position.x
    )
    .map((node) => node.id);
}

function buildColumnPositions(
  nodeIds: string[],
  x: number,
  centerY: number,
  stepY: number
) {
  const positions = new Map<string, NodePosition>();
  const startY = centerY - ((nodeIds.length - 1) * stepY) / 2;

  nodeIds.forEach((nodeId, index) => {
    positions.set(nodeId, {
      x,
      y: startY + index * stepY,
    });
  });

  return positions;
}

function buildRingPositions(
  nodeIds: string[],
  center: NodePosition,
  radiusX: number,
  radiusY: number,
  startAngle = -Math.PI / 2
) {
  const positions = new Map<string, NodePosition>();

  if (nodeIds.length === 0) {
    return positions;
  }

  nodeIds.forEach((nodeId, index) => {
    const angle = startAngle + (index / Math.max(nodeIds.length, 1)) * Math.PI * 2;
    positions.set(nodeId, {
      x: center.x + Math.cos(angle) * radiusX,
      y: center.y + Math.sin(angle) * radiusY,
    });
  });

  return positions;
}

function resolveExplorationNodeOverlap(
  positions: Map<string, NodePosition>,
  graphNodes: Node<TraceabilityGraphNodeData>[],
  selectedNodeId: string
) {
  const minimumHorizontalSeparation = 320;
  const minimumVerticalSeparation = 120;
  const minimumCenterDistance = 260;
  const selectedPosition = positions.get(selectedNodeId);

  if (!selectedPosition) {
    return positions;
  }

  const originalNodeOrder = sortNodeIdsByOriginalPosition(positions.keys(), graphNodes).filter(
    (nodeId) => nodeId !== selectedNodeId
  );
  const resolvedPositions = new Map<string, NodePosition>();
  resolvedPositions.set(selectedNodeId, selectedPosition);

  const collidesWithPlacedNode = (candidate: NodePosition) => {
    for (const placedPosition of resolvedPositions.values()) {
      const deltaX = Math.abs(candidate.x - placedPosition.x);
      const deltaY = Math.abs(candidate.y - placedPosition.y);
      const distance = Math.hypot(candidate.x - placedPosition.x, candidate.y - placedPosition.y);

      if (
        (deltaX < minimumHorizontalSeparation && deltaY < minimumVerticalSeparation) ||
        distance < minimumCenterDistance
      ) {
        return true;
      }
    }

    return false;
  };

  originalNodeOrder.forEach((nodeId, index) => {
    const basePosition = positions.get(nodeId);
    if (!basePosition) {
      return;
    }

    if (!collidesWithPlacedNode(basePosition)) {
      resolvedPositions.set(nodeId, basePosition);
      return;
    }

    const baseAngle =
      Math.atan2(basePosition.y - selectedPosition.y, basePosition.x - selectedPosition.x) ||
      -Math.PI / 2;
    let resolvedPosition = basePosition;

    for (let attempt = 0; attempt < 24; attempt += 1) {
      const ring = Math.floor(attempt / 6) + 1;
      const spoke = attempt % 6;
      const angle = baseAngle + spoke * (Math.PI / 3);
      const offsetX = Math.cos(angle) * ring * minimumHorizontalSeparation * 0.85;
      const offsetY = Math.sin(angle) * ring * minimumVerticalSeparation * 1.1;
      const laneOffset = ((index % 2 === 0 ? 1 : -1) * ring * minimumVerticalSeparation) / 3;

      const candidate = {
        x: basePosition.x + offsetX,
        y: basePosition.y + offsetY + laneOffset,
      };

      if (!collidesWithPlacedNode(candidate)) {
        resolvedPosition = candidate;
        break;
      }
    }

    resolvedPositions.set(nodeId, resolvedPosition);
  });

  return resolvedPositions;
}

function normalizeExplorationClusterPositions(
  positions: Map<string, NodePosition>,
  activeNodeIds: Set<string>
) {
  const horizontalPadding = 250;
  const verticalPadding = 180;
  const minimumX = 100;
  const minimumY = 100;
  const activePositions = [...activeNodeIds]
    .map((nodeId) => {
      const position = positions.get(nodeId);
      return position ? { nodeId, position } : null;
    })
    .filter(isDefined);

  if (activePositions.length === 0) {
    return positions;
  }

  const bounds = activePositions.reduce(
    (accumulator, entry) => ({
      minX: Math.min(accumulator.minX, entry.position.x),
      minY: Math.min(accumulator.minY, entry.position.y),
      maxX: Math.max(accumulator.maxX, entry.position.x),
      maxY: Math.max(accumulator.maxY, entry.position.y),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    }
  );

  const clusterCenterX = (bounds.minX + bounds.maxX) / 2;
  const clusterCenterY = (bounds.minY + bounds.maxY) / 2;
  const targetCenterX = Math.max(clusterCenterX, minimumX + horizontalPadding);
  const targetCenterY = Math.max(clusterCenterY, minimumY + verticalPadding);

  let shiftX = targetCenterX - clusterCenterX;
  let shiftY = targetCenterY - clusterCenterY;

  const shiftedMinX = bounds.minX + shiftX;
  const shiftedMinY = bounds.minY + shiftY;

  if (shiftedMinX < minimumX) {
    shiftX += minimumX - shiftedMinX;
  }
  if (shiftedMinY < minimumY) {
    shiftY += minimumY - shiftedMinY;
  }

  const normalizedPositions = new Map<string, NodePosition>();
  positions.forEach((position, nodeId) => {
    normalizedPositions.set(nodeId, {
      x: position.x + shiftX,
      y: position.y + shiftY,
    });
  });

  return normalizedPositions;
}

function buildLocalExplorationRingPositions(
  nodeIds: string[],
  center: NodePosition,
  baseRadius: number,
  slotsPerRing: number,
  radiusStep: number,
  startAngle = -Math.PI / 2
) {
  const positions = new Map<string, NodePosition>();

  if (nodeIds.length === 0) {
    return positions;
  }

  nodeIds.forEach((nodeId, index) => {
    const ringIndex = Math.floor(index / slotsPerRing);
    const ringOffset = index % slotsPerRing;
    const nodesInRing = Math.min(slotsPerRing, nodeIds.length - ringIndex * slotsPerRing);
    const angle = startAngle + (ringOffset / Math.max(nodesInRing, 1)) * Math.PI * 2;
    const radius = baseRadius + ringIndex * radiusStep;

    positions.set(nodeId, {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  });

  return positions;
}

function buildExplorationClusterLayout(
  graphNodes: Node<TraceabilityGraphNodeData>[],
  selectedNodeId: string | undefined,
  activeNodeIds: Set<string>,
  directNodeIds: Set<string>,
  indirectNodeIds: Set<string>,
  mode: GraphExplorationMode | null
) {
  if (!selectedNodeId || !mode) {
    return null;
  }

  const sortedDirect = sortNodeIdsByOriginalPosition(directNodeIds, graphNodes).filter(
    (nodeId) => nodeId !== selectedNodeId
  );
  const sortedIndirect = sortNodeIdsByOriginalPosition(indirectNodeIds, graphNodes).filter(
    (nodeId) => nodeId !== selectedNodeId && !directNodeIds.has(nodeId)
  );
  const fixedExplorationModes = new Set<GraphExplorationMode>([
    "impact",
    "upstream-impact",
    "downstream-impact",
    "parents",
    "children",
    "dependents",
    "upstream",
    "downstream",
  ]);

  if (fixedExplorationModes.has(mode)) {
    const selectedPosition = { x: 400, y: 250 };
    const positions = new Map<string, NodePosition>();
    positions.set(selectedNodeId, selectedPosition);

    buildLocalExplorationRingPositions(sortedDirect, selectedPosition, 320, 8, 180).forEach(
      (position, nodeId) => positions.set(nodeId, position)
    );

    buildLocalExplorationRingPositions(sortedIndirect, selectedPosition, 520, 10, 180, -Math.PI / 3).forEach(
      (position, nodeId) => positions.set(nodeId, position)
    );

    const missingNodeIds = sortNodeIdsByOriginalPosition(
      [...activeNodeIds].filter((nodeId) => !positions.has(nodeId) && nodeId !== selectedNodeId),
      graphNodes
    );
    buildLocalExplorationRingPositions(missingNodeIds, selectedPosition, 720, 12, 180, Math.PI / 6).forEach(
      (position, nodeId) => positions.set(nodeId, position)
    );

    return normalizeExplorationClusterPositions(positions, activeNodeIds);
  }

  const selectedNode = graphNodes.find((node) => node.id === selectedNodeId);
  if (!selectedNode) {
    return null;
  }

  const selectedPosition = { ...selectedNode.position };

  const positions = new Map<string, NodePosition>();
  positions.set(selectedNodeId, selectedPosition);
  const fillMissingActivePositions = () => {
    const missingNodeIds = sortNodeIdsByOriginalPosition(
      [...activeNodeIds].filter((nodeId) => !positions.has(nodeId)),
      graphNodes
    );
    buildRingPositions(missingNodeIds, selectedPosition, 360, 240, Math.PI / 6).forEach(
      (position, nodeId) => positions.set(nodeId, position)
    );
    const resolvedPositions = resolveExplorationNodeOverlap(positions, graphNodes, selectedNodeId);
    return normalizeExplorationClusterPositions(resolvedPositions, activeNodeIds);
  };

  if (mode === "parents" || mode === "upstream" || mode === "upstream-impact") {
    buildColumnPositions(sortedDirect, selectedPosition.x - 300, selectedPosition.y, 160).forEach(
      (position, nodeId) => positions.set(nodeId, position)
    );
    buildColumnPositions(sortedIndirect, selectedPosition.x - 580, selectedPosition.y, 150).forEach(
      (position, nodeId) => positions.set(nodeId, position)
    );
    return fillMissingActivePositions();
  }

  if (
    mode === "children" ||
    mode === "downstream" ||
    mode === "downstream-impact" ||
    mode === "subtree"
  ) {
    buildColumnPositions(sortedDirect, selectedPosition.x + 300, selectedPosition.y, 160).forEach(
      (position, nodeId) => positions.set(nodeId, position)
    );
    buildColumnPositions(sortedIndirect, selectedPosition.x + 580, selectedPosition.y, 150).forEach(
      (position, nodeId) => positions.set(nodeId, position)
    );
    return fillMissingActivePositions();
  }

  if (mode === "dependents") {
    buildRingPositions(sortedDirect, selectedPosition, 280, 180).forEach((position, nodeId) =>
      positions.set(nodeId, position)
    );
    buildRingPositions(sortedIndirect, selectedPosition, 500, 280, -Math.PI / 3).forEach(
      (position, nodeId) => positions.set(nodeId, position)
    );
    return fillMissingActivePositions();
  }

  if (mode === "impact" || mode === "critical-path" || mode === "focus") {
    buildRingPositions(sortedDirect, selectedPosition, 300, 190).forEach((position, nodeId) =>
      positions.set(nodeId, position)
    );
    buildRingPositions(sortedIndirect, selectedPosition, 540, 300, -Math.PI / 3).forEach(
      (position, nodeId) => positions.set(nodeId, position)
    );
    return fillMissingActivePositions();
  }

  return fillMissingActivePositions();
}

function summarizeAnalysis(
  nodeIds: Iterable<string>,
  graphNodes: Node<TraceabilityGraphNodeData>[]
) {
  const selectedIds = new Set(nodeIds);
  const selectedNodes = graphNodes.filter((node) => selectedIds.has(node.id));
  const affectedSubsystems = new Set(
    selectedNodes.map((node) => node.data.subsystem ?? "Unassigned")
  );

  return {
    affectedCount: selectedNodes.length,
    subsystemCount: affectedSubsystems.size,
    warningTotal: selectedNodes.reduce((total, node) => total + node.data.warningCount, 0),
    conflictTotal: selectedNodes.reduce((total, node) => total + node.data.conflictCount, 0),
  };
}

function buildImpactAnalysis(
  nodeId: string,
  mode: Extract<GraphExplorationMode, "impact" | "upstream-impact" | "downstream-impact">,
  graphNodes: Node<TraceabilityGraphNodeData>[],
  graphEdges: Edge<TraceabilityGraphEdgeData>[]
): GraphAnalysisResult {
  const direction = mode === "upstream-impact" ? "incoming" : mode === "downstream-impact" ? "outgoing" : "both";
  const directImpact = collectDirectImpact(nodeId, graphEdges, direction);
  const primaryNodes = new Set<string>(directImpact.nodeIds);
  const primaryEdges = new Set<string>(directImpact.edgeIds);
  const secondaryNodes = new Set<string>();
  const secondaryEdges = new Set<string>();

  const structuralReachability =
    direction === "both"
      ? [
          collectReachability(nodeId, graphEdges, "incoming", { kindFilter: "parent-child" }),
          collectReachability(nodeId, graphEdges, "outgoing", { kindFilter: "parent-child" }),
        ]
      : [collectReachability(nodeId, graphEdges, direction, { kindFilter: "parent-child" })];

  structuralReachability.forEach((reachability) => {
    reachability.nodesByDepth.forEach((depth, currentNodeId) => {
      if (currentNodeId === nodeId || depth <= 1 || primaryNodes.has(currentNodeId)) {
        return;
      }
      secondaryNodes.add(currentNodeId);
    });

    reachability.edgesByDepth.forEach((depth, edgeId) => {
      if (depth <= 1 || primaryEdges.has(edgeId)) {
        return;
      }
      secondaryEdges.add(edgeId);
    });
  });

  return {
    title:
      mode === "upstream-impact"
        ? "Upstream Impact"
        : mode === "downstream-impact"
          ? "Downstream Impact"
          : "Impact Analysis",
    description:
      mode === "upstream-impact"
        ? "Tracing upstream requirements and dependencies that feed the selected requirement."
        : mode === "downstream-impact"
          ? "Tracing downstream requirements and dependents affected by the selected requirement."
          : "Tracing both upstream and downstream impact from the selected requirement.",
    selectedNodeId: nodeId,
    primaryNodes,
    secondaryNodes,
    primaryEdges,
    secondaryEdges,
    dimUnrelated: primaryNodes.size + secondaryNodes.size > 0,
    summaryItems: buildImpactSummaryItems(mode, graphNodes, primaryNodes, secondaryNodes),
  };
}

function buildBrokenChainAnalysis(
  mode: Extract<GraphExplorationMode, "broken-chains" | "orphans" | "missing-evidence">,
  graphNodes: Node<TraceabilityGraphNodeData>[],
  graphEdges: Edge<TraceabilityGraphEdgeData>[]
): GraphAnalysisResult {
  const incoming = new Map<string, Edge<TraceabilityGraphEdgeData>[]>();
  const outgoing = new Map<string, Edge<TraceabilityGraphEdgeData>[]>();

  graphEdges.forEach((edge) => {
    incoming.set(edge.target, [...(incoming.get(edge.target) ?? []), edge]);
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
  });

  const orphanNodes = new Set<string>();
  const missingEvidenceNodes = new Set<string>();
  const brokenNodes = new Set<string>();

  graphNodes.forEach((node) => {
    const inEdges = incoming.get(node.id) ?? [];
    const outEdges = outgoing.get(node.id) ?? [];
    const allEdges = [...inEdges, ...outEdges];
    const parentLinks = allEdges.filter((edge) => edge.data?.kind === "parent-child");
    const relatedLinks = allEdges.filter((edge) => edge.data?.kind === "related");

    const isOrphan = allEdges.length === 0 || (allEdges.length <= 1 && parentLinks.length === 0);
    const lacksEvidenceSignals =
      (node.data.warningCount > 0 || node.data.feasibilityStatus === "insufficient_data") &&
      relatedLinks.length === 0;
    const generatedWithoutStructure =
      node.data.isGenerated && parentLinks.length === 0 && allEdges.length <= 1;

    if (isOrphan) {
      orphanNodes.add(node.id);
    }
    if (lacksEvidenceSignals || generatedWithoutStructure) {
      missingEvidenceNodes.add(node.id);
    }
    if (isOrphan || lacksEvidenceSignals || generatedWithoutStructure) {
      brokenNodes.add(node.id);
    }
  });

  const targetNodes =
    mode === "orphans" ? orphanNodes : mode === "missing-evidence" ? missingEvidenceNodes : brokenNodes;
  const targetEdges = new Set(
    graphEdges.filter((edge) => targetNodes.has(edge.source) || targetNodes.has(edge.target)).map((edge) => edge.id)
  );
  const summary = summarizeAnalysis(targetNodes, graphNodes);

  return {
    title:
      mode === "orphans"
        ? "Orphan Requirements"
        : mode === "missing-evidence"
          ? "Missing Evidence Signals"
          : "Broken Chain Analysis",
    description:
      mode === "orphans"
        ? "Highlighting structurally isolated requirements with weak or no traceability links."
        : mode === "missing-evidence"
          ? "Highlighting requirements with warning or insufficient-data signals but weak supporting linkage."
          : "Highlighting likely traceability gaps, isolated nodes, and generated drafts with incomplete linkage.",
    primaryNodes: targetNodes,
    secondaryNodes: new Set<string>(),
    primaryEdges: targetEdges,
    secondaryEdges: new Set<string>(),
    warningNodes: targetNodes,
    dimUnrelated: true,
    summaryItems: [
      { label: "Flagged requirements", value: String(summary.affectedCount) },
      { label: "Affected subsystems", value: String(summary.subsystemCount) },
      { label: "Warnings in scope", value: String(summary.warningTotal) },
      { label: "Conflicts in scope", value: String(summary.conflictTotal) },
    ],
  };
}

function findCriticalPath(
  graphNodes: Node<TraceabilityGraphNodeData>[],
  graphEdges: Edge<TraceabilityGraphEdgeData>[]
) {
  const parentEdges = graphEdges.filter((edge) => edge.data?.kind === "parent-child");
  const outgoing = new Map<string, Edge<TraceabilityGraphEdgeData>[]>();

  parentEdges.forEach((edge) => {
    outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge]);
  });

  const nodeMap = new Map(graphNodes.map((node) => [node.id, node]));
  const memo = new Map<string, { score: number; nodes: string[]; edges: string[] }>();

  const riskScore = (nodeId: string) => {
    const node = nodeMap.get(nodeId);
    if (!node) {
      return 0;
    }
    const healthWeight =
      node.data.health === "conflict" ? 4 : node.data.health === "warning" ? 2 : 1;
    return healthWeight + node.data.warningCount + node.data.conflictCount * 2;
  };

  const visit = (
    nodeId: string,
    visiting = new Set<string>()
  ): { score: number; nodes: string[]; edges: string[] } => {
    if (memo.has(nodeId)) {
      return memo.get(nodeId)!;
    }
    if (visiting.has(nodeId)) {
      return { score: riskScore(nodeId), nodes: [nodeId], edges: [] };
    }

    visiting.add(nodeId);
    const nextEdges = outgoing.get(nodeId) ?? [];
    let best = { score: riskScore(nodeId), nodes: [nodeId], edges: [] as string[] };

    nextEdges.forEach((edge) => {
      const child = visit(edge.target, new Set(visiting));
      const candidate = {
        score: riskScore(nodeId) + child.score + 10,
        nodes: [nodeId, ...child.nodes],
        edges: [edge.id, ...child.edges],
      };
      if (
        candidate.nodes.length > best.nodes.length ||
        (candidate.nodes.length === best.nodes.length && candidate.score > best.score)
      ) {
        best = candidate;
      }
    });

    memo.set(nodeId, best);
    return best;
  };

  let bestOverall = { score: 0, nodes: [] as string[], edges: [] as string[] };
  graphNodes.forEach((node) => {
    const candidate = visit(node.id);
    if (
      candidate.nodes.length > bestOverall.nodes.length ||
      (candidate.nodes.length === bestOverall.nodes.length && candidate.score > bestOverall.score)
    ) {
      bestOverall = candidate;
    }
  });

  return bestOverall;
}

function buildCriticalPathAnalysis(
  graphNodes: Node<TraceabilityGraphNodeData>[],
  graphEdges: Edge<TraceabilityGraphEdgeData>[]
): GraphAnalysisResult {
  const path = findCriticalPath(graphNodes, graphEdges);
  const primaryNodes = new Set(path.nodes);
  const primaryEdges = new Set(path.edges);
  const summary = summarizeAnalysis(primaryNodes, graphNodes);

  return {
    title: "Critical Path",
    description:
      "Highlighting the longest parent-child chain, with ties broken by cumulative warning and conflict density.",
    selectedNodeId: path.nodes[0],
    primaryNodes,
    secondaryNodes: new Set<string>(),
    primaryEdges,
    secondaryEdges: new Set<string>(),
    dimUnrelated: true,
    summaryItems: [
      { label: "Path length", value: String(path.nodes.length) },
      { label: "Subsystems touched", value: String(summary.subsystemCount) },
      { label: "Warnings on path", value: String(summary.warningTotal) },
      { label: "Conflicts on path", value: String(summary.conflictTotal) },
    ],
  };
}

function buildRelationshipAnalysis(
  nodeId: string,
  mode: Extract<GraphExplorationMode, "parents" | "children" | "dependents" | "upstream" | "downstream" | "focus" | "subtree">,
  graphNodes: Node<TraceabilityGraphNodeData>[],
  graphEdges: Edge<TraceabilityGraphEdgeData>[]
): GraphAnalysisResult {
  if (mode === "focus") {
    return {
      title: "Focused Requirement",
      description: "Centering attention on the selected requirement only.",
      selectedNodeId: nodeId,
      primaryNodes: new Set<string>([nodeId]),
      secondaryNodes: new Set<string>(),
      primaryEdges: new Set<string>(),
      secondaryEdges: new Set<string>(),
      dimUnrelated: true,
      summaryItems: [{ label: "Visible focus", value: "1 requirement" }],
    };
  }

  if (mode === "subtree") {
    const reachability = collectReachability(nodeId, graphEdges, "outgoing", {
      kindFilter: "parent-child",
    });
    const primaryNodes = new Set<string>([nodeId]);
    const secondaryNodes = new Set<string>();
    const primaryEdges = new Set<string>();
    const secondaryEdges = new Set<string>();

    reachability.nodesByDepth.forEach((depth, currentNodeId) => {
      if (currentNodeId === nodeId) {
        return;
      }
      if (depth === 1) {
        primaryNodes.add(currentNodeId);
      } else if (depth > 1) {
        secondaryNodes.add(currentNodeId);
      }
    });

    reachability.edgesByDepth.forEach((depth, edgeId) => {
      if (depth === 1) {
        primaryEdges.add(edgeId);
      } else {
        secondaryEdges.add(edgeId);
      }
    });

    const summary = summarizeAnalysis(new Set([...primaryNodes, ...secondaryNodes]), graphNodes);
    return {
      title: "Requirement Subtree",
      description: "Highlighting the selected requirement and its decomposed child subtree.",
      selectedNodeId: nodeId,
      primaryNodes,
      secondaryNodes,
      primaryEdges,
      secondaryEdges,
      dimUnrelated: true,
      summaryItems: [
        { label: "Requirements in subtree", value: String(summary.affectedCount) },
        { label: "Subsystems touched", value: String(summary.subsystemCount) },
        { label: "Warnings in scope", value: String(summary.warningTotal) },
        { label: "Conflicts in scope", value: String(summary.conflictTotal) },
      ],
    };
  }

  if (mode === "parents" || mode === "children") {
    const reachability = collectReachability(
      nodeId,
      graphEdges,
      mode === "parents" ? "incoming" : "outgoing",
      { kindFilter: "parent-child" }
    );
    const primaryNodes = new Set<string>([nodeId]);
    const secondaryNodes = new Set<string>();
    const primaryEdges = new Set<string>();
    const secondaryEdges = new Set<string>();

    reachability.nodesByDepth.forEach((depth, currentNodeId) => {
      if (currentNodeId === nodeId) {
        return;
      }
      if (depth === 1) {
        primaryNodes.add(currentNodeId);
      } else if (depth > 1) {
        secondaryNodes.add(currentNodeId);
      }
    });

    reachability.edgesByDepth.forEach((depth, edgeId) => {
      if (depth === 1) {
        primaryEdges.add(edgeId);
      } else if (depth > 1) {
        secondaryEdges.add(edgeId);
      }
    });

    const summary = summarizeAnalysis(new Set([...primaryNodes, ...secondaryNodes]), graphNodes);
    return {
      title: mode === "parents" ? "Parent Chain" : "Child Subtree",
      description:
        mode === "parents"
          ? "Highlighting the selected requirement and its structural parent chain only."
          : "Highlighting the selected requirement and its structural child subtree only.",
      selectedNodeId: nodeId,
      primaryNodes,
      secondaryNodes,
      primaryEdges,
      secondaryEdges,
      dimUnrelated: true,
      summaryItems: [
        { label: "Connected requirements", value: String(summary.affectedCount) },
        { label: "Subsystems touched", value: String(summary.subsystemCount) },
        { label: "Warnings in scope", value: String(summary.warningTotal) },
        { label: "Conflicts in scope", value: String(summary.conflictTotal) },
      ],
    };
  }

  if (mode === "upstream" || mode === "downstream") {
    const structuralReachability = collectReachability(
      nodeId,
      graphEdges,
      mode === "upstream" ? "incoming" : "outgoing",
      { kindFilter: "parent-child" }
    );
    const lateralDirect = collectDirectImpact(
      nodeId,
      graphEdges,
      mode === "upstream" ? "incoming" : "outgoing"
    );
    const primaryNodes = new Set<string>([nodeId]);
    const secondaryNodes = new Set<string>();
    const primaryEdges = new Set<string>(lateralDirect.edgeIds);
    const secondaryEdges = new Set<string>();

    lateralDirect.nodeIds.forEach((currentNodeId) => {
      primaryNodes.add(currentNodeId);
    });

    structuralReachability.nodesByDepth.forEach((depth, currentNodeId) => {
      if (currentNodeId === nodeId) {
        return;
      }
      if (depth === 1) {
        primaryNodes.add(currentNodeId);
      } else if (depth > 1) {
        secondaryNodes.add(currentNodeId);
      }
    });

    structuralReachability.edgesByDepth.forEach((depth, edgeId) => {
      if (depth === 1) {
        primaryEdges.add(edgeId);
      } else if (depth > 1) {
        secondaryEdges.add(edgeId);
      }
    });

    const summary = summarizeAnalysis(new Set([...primaryNodes, ...secondaryNodes]), graphNodes);
    return {
      title: mode === "upstream" ? "Upstream Trace" : "Downstream Trace",
      description:
        mode === "upstream"
          ? "Highlighting connected upstream requirements feeding into the selected node."
          : "Highlighting connected downstream requirements and dependencies branching out from the selected node.",
      selectedNodeId: nodeId,
      primaryNodes,
      secondaryNodes,
      primaryEdges,
      secondaryEdges,
      dimUnrelated: true,
      summaryItems: [
        { label: "Connected requirements", value: String(summary.affectedCount) },
        { label: "Subsystems touched", value: String(summary.subsystemCount) },
        { label: "Warnings in scope", value: String(summary.warningTotal) },
        { label: "Conflicts in scope", value: String(summary.conflictTotal) },
        ],
      };
    }

  const directEdges = graphEdges.filter((edge) => {
    if (mode === "dependents") {
      return (
        (edge.source === nodeId || edge.target === nodeId) &&
        edge.data?.kind !== "parent-child"
      );
    }
    return false;
  });

  const primaryNodes = new Set<string>([nodeId]);
  const primaryEdges = new Set<string>();
  directEdges.forEach((edge) => {
    primaryEdges.add(edge.id);
    primaryNodes.add(edge.source === nodeId ? edge.target : edge.source);
  });
  const summary = summarizeAnalysis(primaryNodes, graphNodes);

  return {
    title: "Dependent Requirements",
    description: "Highlighting direct dependent or lateral requirements connected to the selected node.",
    selectedNodeId: nodeId,
    primaryNodes,
    secondaryNodes: new Set<string>(),
    primaryEdges,
    secondaryEdges: new Set<string>(),
    dimUnrelated: true,
    summaryItems: [
      { label: "Connected requirements", value: String(summary.affectedCount) },
      { label: "Subsystems touched", value: String(summary.subsystemCount) },
      { label: "Warnings in scope", value: String(summary.warningTotal) },
      { label: "Conflicts in scope", value: String(summary.conflictTotal) },
    ],
  };
}

export default function TraceabilityGraphPage() {
  const { id } = useParams<{ id: string }>();
  const projectId = id ?? "";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [graphNodes, setGraphNodes] = useState<TraceabilityGraphNodeResponse[]>([]);
  const [graphEdges, setGraphEdges] = useState<TraceabilityGraphEdgeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TraceabilityGraphFilterState>(defaultFilters);
  const [showGraphNote, setShowGraphNote] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<TraceabilityGraphNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<TraceabilityGraphEdgeData>>([]);
  const [contextMenu, setContextMenu] = useState<GraphContextMenuState | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [explorationMode, setExplorationMode] = useState<GraphExplorationMode | null>(null);
  const [health, setHealth] = useState<TraceabilityHealthScoreResponse | null>(null);
  const [backendAnalysis, setBackendAnalysis] = useState<TraceabilityGraphAnalysisResponse | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showChangeImpactReview, setShowChangeImpactReview] = useState(false);
  const [changeRequest, setChangeRequest] = useState("");
  const [changeImpactReview, setChangeImpactReview] = useState<ChangeImpactReviewResponse | null>(null);
  const [changeImpactLoading, setChangeImpactLoading] = useState(false);
  const [changeImpactError, setChangeImpactError] = useState<string | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<Node<TraceabilityGraphNodeData>, Edge<TraceabilityGraphEdgeData>> | null>(null);
  const [backendAnalysisKey, setBackendAnalysisKey] = useState<string | null>(null);
  const [debugRenderMode, setDebugRenderMode] = useState(
      import.meta.env.DEV && searchParams.get("debugRender") === "1"
      );
  const [domRenderProofRows, setDomRenderProofRows] = useState<string[]>([]);
  const [domOverlapProofRows, setDomOverlapProofRows] = useState<string[]>([]);
  const graphCanvasRef = useRef<HTMLDivElement | null>(null);
  const hasAppliedInitialFitRef = useRef(false);
  const lastProjectIdRef = useRef<string | null>(null);
  const lastInitialFocusKeyRef = useRef<string | null>(null);
  const lastAppliedImpactKeyRef = useRef<string | null>(null);
  const lastExplorationFitKeyRef = useRef<string | null>(null);
  const pendingExplorationFitKeyRef = useRef<string | null>(null);
  const committedExplorationNodeListKeyRef = useRef<string | null>(null);
  const standalone = searchParams.get("standalone") === "1";
  const focusRequirementId = searchParams.get("focus");
  const focusMode = searchParams.get("mode");
  const selectedGraphNode = useMemo(
    () => graphNodes.find((node) => node.id === activeNodeId) ?? null,
    [activeNodeId, graphNodes]
  );
  const integrityDiagnosticsEnabled =
    import.meta.env.DEV || searchParams.get("graphDebug") === "1";
  const debugRenderableMode =
    explorationMode === "parents" ||
    explorationMode === "children" ||
    explorationMode === "impact" ||
    explorationMode === "upstream-impact" ||
    explorationMode === "downstream-impact";

    useEffect(() => {
      if (lastProjectIdRef.current !== projectId) {
        lastProjectIdRef.current = projectId;
        hasAppliedInitialFitRef.current = false;
        lastInitialFocusKeyRef.current = null;
        lastExplorationFitKeyRef.current = null;
        pendingExplorationFitKeyRef.current = null;
        committedExplorationNodeListKeyRef.current = null;
        setShowChangeImpactReview(false);
        setChangeRequest("");
        setChangeImpactReview(null);
        setChangeImpactLoading(false);
        setChangeImpactError(null);
      }
    }, [projectId]);

  useEffect(() => {
    let active = true;

    async function loadGraph() {
      if (!projectId) {
        setError("Project context is missing.");
        setLoading(false);
        return;
      }

      try {
        const [response, healthResponse] = await Promise.all([
          fetchProjectTraceabilityGraph(projectId),
          fetchProjectTraceabilityHealth(projectId),
        ]);
        if (!active) {
          return;
        }
        setGraphNodes(response.nodes);
        setGraphEdges(response.edges);
        setHealth(healthResponse);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : "Unable to load traceability graph.");
        setHealth(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadGraph();
    return () => {
      active = false;
    };
  }, [projectId]);

  const { subsystemOptions, typeOptions } = useMemo(
    () => collectTraceabilityGraphFilters(graphNodes),
    [graphNodes]
  );

  const graph = useMemo(
    () => filterTraceabilityGraph(graphNodes, graphEdges, filters),
    [filters, graphEdges, graphNodes]
  );
  const fullGraph = useMemo(
    () => filterTraceabilityGraph(graphNodes, graphEdges, defaultFilters),
    [graphEdges, graphNodes]
  );

  const backendDrivenExploration = useMemo(
    () =>
      explorationMode === "impact" ||
      explorationMode === "upstream-impact" ||
      explorationMode === "downstream-impact" ||
      explorationMode === "broken-chains" ||
      explorationMode === "orphans" ||
      explorationMode === "missing-evidence" ||
      explorationMode === "critical-path",
    [explorationMode]
  );

  const currentBackendAnalysisKey = useMemo(() => {
    if (
      activeNodeId &&
      (explorationMode === "impact" ||
        explorationMode === "upstream-impact" ||
        explorationMode === "downstream-impact")
    ) {
      return `${explorationMode}:${activeNodeId}`;
    }
    if (
      explorationMode === "broken-chains" ||
      explorationMode === "orphans" ||
      explorationMode === "missing-evidence" ||
      explorationMode === "critical-path"
    ) {
      return explorationMode;
    }
    return null;
  }, [activeNodeId, explorationMode]);
  const explorationMembershipOverride =
    explorationMode === "impact" ||
    explorationMode === "upstream-impact" ||
    explorationMode === "downstream-impact" ||
    explorationMode === "parents" ||
    explorationMode === "children" ||
    explorationMode === "dependents";

  const activeBackendAnalysis =
    backendAnalysisKey && backendAnalysisKey === currentBackendAnalysisKey ? backendAnalysis : null;

  const changeImpactLikelyEditIds = useMemo(
    () =>
      new Set(
        changeImpactReview?.likely_requirements_needing_edits.map((item) => item.requirement.id) ?? []
      ),
    [changeImpactReview]
  );
  const changeImpactWorkspaceMode =
    showChangeImpactReview || changeImpactReview !== null || changeImpactLoading || changeImpactError !== null;

  const changeImpactResultRows = useMemo(() => {
    if (!changeImpactReview) {
      return [];
    }

    return [
      ...changeImpactReview.direct_matches.map((item) => ({
        ...item,
        relationshipLabel: "direct" as const,
      })),
      ...changeImpactReview.indirect_impacts.map((item) => ({
        ...item,
        relationshipLabel: "indirect" as const,
      })),
    ];
  }, [changeImpactReview]);

  const changeImpactDirectRows = useMemo(
    () => changeImpactResultRows.filter((item) => item.relationshipLabel === "direct"),
    [changeImpactResultRows]
  );

  const changeImpactIndirectRows = useMemo(
    () => changeImpactResultRows.filter((item) => item.relationshipLabel === "indirect"),
    [changeImpactResultRows]
  );

  const handleRunChangeImpactReview = async () => {
    const nextRequest = changeRequest.trim();
    if (!projectId) {
      setChangeImpactError("Project context is missing.");
      return;
    }
    if (!nextRequest) {
      setChangeImpactError("Enter a change request before running the review.");
      return;
    }

    setShowChangeImpactReview(true);
    setChangeImpactLoading(true);
    setChangeImpactError(null);

    try {
      const response = await runProjectChangeImpactReview(projectId, nextRequest);
      setChangeImpactReview(response);
    } catch (reviewError) {
      setChangeImpactReview(null);
      setChangeImpactError(
        reviewError instanceof Error
          ? reviewError.message
          : "Unable to analyze the change request right now."
      );
    } finally {
      setChangeImpactLoading(false);
    }
  };

  const dispatchContextMenuAction = (
    action:
      | "view-requirement"
      | "open-in-matrix"
      | "show-row-in-matrix"
      | "show-parents"
      | "show-children"
      | "show-dependents"
      | "analyze-impact"
      | "show-upstream-impact"
      | "show-downstream-impact"
      | "highlight-upstream"
      | "highlight-downstream"
      | "focus-this-requirement"
  ) => {
    if (!contextMenu) {
      return;
    }

    const clickedNodeId = contextMenu.nodeId;
    const clickedRequirementCode = contextMenu.requirementCode;
    const clickedTitle = contextMenu.title;

    let dispatchTarget: string | null = null;
    let dispatchMode: string | null = null;

    switch (action) {
      case "view-requirement":
        dispatchTarget = routePaths.projectRequirementDetail(projectId, clickedNodeId);
        break;
      case "open-in-matrix":
      case "show-row-in-matrix":
        dispatchTarget = getTraceabilityMatrixFocusPath(projectId, clickedNodeId);
        break;
      case "show-parents":
        dispatchMode = "parents";
        break;
      case "show-children":
        dispatchMode = "children";
        break;
      case "show-dependents":
        dispatchMode = "dependents";
        break;
      case "analyze-impact":
        dispatchMode = "impact";
        break;
      case "show-upstream-impact":
        dispatchMode = "upstream-impact";
        break;
      case "show-downstream-impact":
        dispatchMode = "downstream-impact";
        break;
      case "highlight-upstream":
        dispatchMode = "upstream";
        break;
      case "highlight-downstream":
        dispatchMode = "downstream";
        break;
      case "focus-this-requirement":
        dispatchMode = "focus";
        break;
    }

    const debugPayload = {
      clickedGraphNodeId: clickedNodeId,
      clickedInternalId: clickedNodeId,
      clickedRequirementCode,
      clickedTitle,
      actionNodeId: clickedNodeId,
      actionRequirementCode: clickedRequirementCode,
      action,
      dispatchTarget,
      dispatchMode,
    };

    if (import.meta.env.DEV) {
      console.debug("[TraceabilityGraph][ContextMenu][action]", debugPayload);
    }

    switch (action) {
      case "view-requirement":
        navigate(routePaths.projectRequirementDetail(projectId, clickedNodeId));
        break;
      case "open-in-matrix":
      case "show-row-in-matrix":
        navigate(getTraceabilityMatrixFocusPath(projectId, clickedNodeId));
        break;
      case "show-parents":
        setActiveNodeId(clickedNodeId);
        setExplorationMode("parents");
        break;
      case "show-children":
        setActiveNodeId(clickedNodeId);
        setExplorationMode("children");
        break;
      case "show-dependents":
        setActiveNodeId(clickedNodeId);
        setExplorationMode("dependents");
        break;
      case "analyze-impact":
        setActiveNodeId(clickedNodeId);
        setExplorationMode("impact");
        break;
      case "show-upstream-impact":
        setActiveNodeId(clickedNodeId);
        setExplorationMode("upstream-impact");
        break;
      case "show-downstream-impact":
        setActiveNodeId(clickedNodeId);
        setExplorationMode("downstream-impact");
        break;
      case "highlight-upstream":
        setActiveNodeId(clickedNodeId);
        setExplorationMode("upstream");
        break;
      case "highlight-downstream":
        setActiveNodeId(clickedNodeId);
        setExplorationMode("downstream");
        break;
      case "focus-this-requirement": {
        setActiveNodeId(clickedNodeId);
        setExplorationMode("focus");
        const nodeToFocus = graph.nodes.find((node) => node.id === clickedNodeId);
        if (nodeToFocus && reactFlowInstance) {
          reactFlowInstance.setCenter(nodeToFocus.position.x + 150, nodeToFocus.position.y + 55, {
            zoom: 1.05,
            duration: 280,
          });
        }
        break;
      }
    }

    setContextMenu(null);
  };

  useEffect(() => {
    if (!focusRequirementId) {
      return;
    }
    setActiveNodeId(focusRequirementId);
    if (focusMode === "parents" || focusMode === "children" || focusMode === "subtree") {
      setExplorationMode(focusMode);
      return;
    }
    if (
      focusMode === "focus" ||
      focusMode === "impact" ||
      focusMode === "upstream-impact" ||
      focusMode === "downstream-impact"
    ) {
      setExplorationMode(focusMode);
      return;
    }
    setExplorationMode("impact");
  }, [focusMode, focusRequirementId]);

  useEffect(() => {
    if (!backendDrivenExploration || !projectId) {
      setBackendAnalysis(null);
      setBackendAnalysisKey(null);
      setAnalysisLoading(false);
      setAnalysisError(null);
      return;
    }

    if (
      (explorationMode === "impact" ||
        explorationMode === "upstream-impact" ||
        explorationMode === "downstream-impact") &&
      !activeNodeId
    ) {
      setBackendAnalysis(null);
      setBackendAnalysisKey(null);
      setAnalysisLoading(false);
      setAnalysisError(null);
      return;
    }

    let active = true;
    const requestKey = currentBackendAnalysisKey;
    setBackendAnalysis(null);
    setBackendAnalysisKey(null);
    setAnalysisLoading(true);
    setAnalysisError(null);

    async function loadAnalysis() {
      try {
        let response: TraceabilityGraphAnalysisResponse;
        if (explorationMode === "impact") {
          if (import.meta.env.DEV) {
            console.debug("[TraceabilityGraph][AnalyzeImpact][request]", {
              selectedGraphNodeId: activeNodeId,
              selectedInternalId: activeNodeId,
              selectedRequirementCode: selectedGraphNode
                ? extractRequirementCodeFromLabel(selectedGraphNode.label)
                : null,
              selectedNodeTitle: selectedGraphNode?.title ?? null,
              analysisRequest: {
                projectId,
                requirementId: activeNodeId,
                direction: "both",
              },
            });
          }
          response = await fetchProjectTraceabilityImpactAnalysis(projectId, activeNodeId!, "both");
        } else if (explorationMode === "upstream-impact") {
          if (import.meta.env.DEV) {
            console.debug("[TraceabilityGraph][AnalyzeImpact][request]", {
              selectedGraphNodeId: activeNodeId,
              selectedInternalId: activeNodeId,
              selectedRequirementCode: selectedGraphNode
                ? extractRequirementCodeFromLabel(selectedGraphNode.label)
                : null,
              selectedNodeTitle: selectedGraphNode?.title ?? null,
              analysisRequest: {
                projectId,
                requirementId: activeNodeId,
                direction: "upstream",
              },
            });
          }
          response = await fetchProjectTraceabilityImpactAnalysis(projectId, activeNodeId!, "upstream");
        } else if (explorationMode === "downstream-impact") {
          if (import.meta.env.DEV) {
            console.debug("[TraceabilityGraph][AnalyzeImpact][request]", {
              selectedGraphNodeId: activeNodeId,
              selectedInternalId: activeNodeId,
              selectedRequirementCode: selectedGraphNode
                ? extractRequirementCodeFromLabel(selectedGraphNode.label)
                : null,
              selectedNodeTitle: selectedGraphNode?.title ?? null,
              analysisRequest: {
                projectId,
                requirementId: activeNodeId,
                direction: "downstream",
              },
            });
          }
          response = await fetchProjectTraceabilityImpactAnalysis(projectId, activeNodeId!, "downstream");
        } else if (explorationMode === "orphans") {
          response = await fetchProjectTraceabilityBrokenChains(projectId, "orphans");
        } else if (explorationMode === "missing-evidence") {
          response = await fetchProjectTraceabilityBrokenChains(projectId, "missing-evidence");
        } else if (explorationMode === "broken-chains") {
          response = await fetchProjectTraceabilityBrokenChains(projectId, "all");
        } else {
          response = await fetchProjectTraceabilityCriticalPath(projectId);
        }

        if (!active) {
          return;
        }
        if (
          import.meta.env.DEV &&
          (explorationMode === "impact" ||
            explorationMode === "upstream-impact" ||
            explorationMode === "downstream-impact")
        ) {
          console.debug("[TraceabilityGraph][AnalyzeImpact][result]", {
            selectedGraphNodeId: activeNodeId,
            selectedInternalId: activeNodeId,
            selectedRequirementCode: selectedGraphNode
              ? extractRequirementCodeFromLabel(selectedGraphNode.label)
              : null,
            selectedNodeTitle: selectedGraphNode?.title ?? null,
            analysisMode: explorationMode,
            backendSelectedRequirementId: response.selected_requirement_id,
            impactedNodeIds: [...response.primary_node_ids, ...response.secondary_node_ids],
            impactedEdgeIds: [...response.primary_edge_ids, ...response.secondary_edge_ids],
          });
        }
        setBackendAnalysis(response);
        setBackendAnalysisKey(requestKey);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setBackendAnalysis(null);
        setBackendAnalysisKey(null);
        setAnalysisError(
          loadError instanceof Error ? loadError.message : "Unable to load graph analysis."
        );
      } finally {
        if (active) {
          setAnalysisLoading(false);
        }
      }
    }

    loadAnalysis();
    return () => {
      active = false;
    };
  }, [
    activeNodeId,
    backendDrivenExploration,
    currentBackendAnalysisKey,
    explorationMode,
    projectId,
    selectedGraphNode,
  ]);

  const styledGraph = useMemo(() => {
    let analysis: GraphAnalysisResult | null = null;
    const analysisGraph = explorationMembershipOverride ? fullGraph : graph;

    if (backendDrivenExploration) {
      if (activeBackendAnalysis) {
        analysis = {
          title: activeBackendAnalysis.title,
          description: activeBackendAnalysis.description,
          selectedNodeId: activeBackendAnalysis.selected_requirement_id ?? undefined,
          primaryNodes: new Set(activeBackendAnalysis.primary_node_ids),
          secondaryNodes: new Set(activeBackendAnalysis.secondary_node_ids),
          primaryEdges: new Set(activeBackendAnalysis.primary_edge_ids),
          secondaryEdges: new Set(activeBackendAnalysis.secondary_edge_ids),
          warningNodes: new Set(activeBackendAnalysis.warning_node_ids),
          dimUnrelated: true,
          summaryItems:
            activeNodeId &&
            (explorationMode === "impact" ||
              explorationMode === "upstream-impact" ||
              explorationMode === "downstream-impact")
              ? buildImpactSummaryItems(
                  explorationMode,
                  analysisGraph.nodes,
                  new Set(activeBackendAnalysis.primary_node_ids),
                  new Set(activeBackendAnalysis.secondary_node_ids)
                )
              : [
                  {
                    label: "Affected requirements",
                    value: String(activeBackendAnalysis.affected_requirement_count),
                  },
                  {
                    label: "Affected subsystems",
                    value: String(activeBackendAnalysis.affected_subsystems.length),
                  },
                  { label: "Warnings in scope", value: String(activeBackendAnalysis.warning_count) },
                  { label: "Conflicts in scope", value: String(activeBackendAnalysis.conflict_count) },
                ],
        };

        if (
          activeNodeId &&
          (explorationMode === "impact" ||
            explorationMode === "upstream-impact" ||
            explorationMode === "downstream-impact")
        ) {
          analysis.summaryItems = buildImpactSummaryItems(
            explorationMode,
            analysisGraph.nodes,
            new Set(activeBackendAnalysis.primary_node_ids),
            new Set(activeBackendAnalysis.secondary_node_ids)
          );
        }
      } else if (
        activeNodeId &&
        (explorationMode === "impact" ||
          explorationMode === "upstream-impact" ||
          explorationMode === "downstream-impact")
      ) {
        analysis = buildImpactAnalysis(activeNodeId, explorationMode, analysisGraph.nodes, analysisGraph.edges);
      }
    } else if (explorationMode === "critical-path") {
      analysis = buildCriticalPathAnalysis(analysisGraph.nodes, analysisGraph.edges);
    } else if (
      explorationMode === "broken-chains" ||
      explorationMode === "orphans" ||
      explorationMode === "missing-evidence"
    ) {
      analysis = buildBrokenChainAnalysis(explorationMode, analysisGraph.nodes, analysisGraph.edges);
    } else if (
      activeNodeId &&
      (explorationMode === "impact" ||
        explorationMode === "upstream-impact" ||
        explorationMode === "downstream-impact")
    ) {
      analysis = buildImpactAnalysis(activeNodeId, explorationMode, analysisGraph.nodes, analysisGraph.edges);
    } else if (activeNodeId && explorationMode) {
      analysis = buildRelationshipAnalysis(
        activeNodeId,
        explorationMode as Extract<
          GraphExplorationMode,
          "parents" | "children" | "dependents" | "upstream" | "downstream" | "focus" | "subtree"
        >,
        analysisGraph.nodes,
        analysisGraph.edges
      );
    }

      if (!analysis) {
        return {
          graph,
          analysis: null as GraphAnalysisResult | null,
          integrity: null as GraphRenderIntegrity | null,
        };
      }

      const renderGraph =
        explorationMembershipOverride
          ? (() => {
              const filteredNodeById = new Map(graph.nodes.map((node) => [node.id, node]));
              const fullNodeById = new Map(fullGraph.nodes.map((node) => [node.id, node]));
              const filteredEdgeById = new Map(graph.edges.map((edge) => [edge.id, edge]));
              const fullEdgeById = new Map(fullGraph.edges.map((edge) => [edge.id, edge]));
              const renderNodeIds = new Set<string>([
                ...graph.nodes.map((node) => node.id),
                ...analysis.primaryNodes,
                ...analysis.secondaryNodes,
                ...(analysis.selectedNodeId ? [analysis.selectedNodeId] : []),
              ]);
              const renderNodes: Node<TraceabilityGraphNodeData>[] = [];
              [...renderNodeIds].forEach((nodeId) => {
                const node = filteredNodeById.get(nodeId) ?? fullNodeById.get(nodeId);
                if (node) {
                  renderNodes.push(node);
                }
              });
              const renderNodeIdSet = new Set(renderNodes.map((node) => node.id));
              const renderEdgeIds = new Set<string>([
                ...graph.edges.map((edge) => edge.id),
                ...analysis.primaryEdges,
                ...analysis.secondaryEdges,
              ]);
              const renderEdges: Edge<TraceabilityGraphEdgeData>[] = [];
              [...renderEdgeIds].forEach((edgeId) => {
                const edge = filteredEdgeById.get(edgeId) ?? fullEdgeById.get(edgeId);
                if (edge && renderNodeIdSet.has(edge.source) && renderNodeIdSet.has(edge.target)) {
                  renderEdges.push(edge);
                }
              });

              return {
                ...analysisGraph,
                nodes: renderNodes,
                edges: renderEdges,
              };
            })()
          : graph;

      const filteredGraphNodeIdSet = new Set(graph.nodes.map((node) => node.id));
      const graphNodeIds = new Set(renderGraph.nodes.map((node) => node.id));
      const graphNodeById = new Map(renderGraph.nodes.map((node) => [node.id, node]));
      const edgeById = new Map(renderGraph.edges.map((edge) => [edge.id, edge]));
      const directNodeIds = new Set<string>(analysis.primaryNodes);
      const indirectNodeIds = new Set<string>(analysis.secondaryNodes);
      const activeNodeIds = new Set<string>([
        ...directNodeIds,
        ...indirectNodeIds,
        ...(analysis.selectedNodeId ? [analysis.selectedNodeId] : []),
      ]);
      const activeEdgeIds = new Set<string>([...analysis.primaryEdges, ...analysis.secondaryEdges]);
      const autoAddedEndpointNodeIds = new Set<string>();
      const droppedEdgeIds = new Set<string>();

      [...activeEdgeIds].forEach((edgeId) => {
        const edge = edgeById.get(edgeId);
        if (!edge || !graphNodeIds.has(edge.source) || !graphNodeIds.has(edge.target)) {
          activeEdgeIds.delete(edgeId);
          droppedEdgeIds.add(edgeId);
          return;
        }

        if (!activeNodeIds.has(edge.source)) {
          activeNodeIds.add(edge.source);
          autoAddedEndpointNodeIds.add(edge.source);
          if ((analysis.primaryEdges as Set<string>).has(edgeId)) {
            directNodeIds.add(edge.source);
          } else {
            indirectNodeIds.add(edge.source);
          }
        }
        if (!activeNodeIds.has(edge.target)) {
          activeNodeIds.add(edge.target);
          autoAddedEndpointNodeIds.add(edge.target);
          if ((analysis.primaryEdges as Set<string>).has(edgeId)) {
            directNodeIds.add(edge.target);
          } else {
            indirectNodeIds.add(edge.target);
          }
        }
      });

      const nodeStateMap = new Map<string, NodeRenderState>();
      const edgeStateMap = new Map<string, EdgeRenderState>();
      const compactLayoutPositions = buildExplorationClusterLayout(
        renderGraph.nodes,
        analysis.selectedNodeId,
        activeNodeIds,
        directNodeIds,
        indirectNodeIds,
        explorationMode
      );

      renderGraph.nodes.forEach((node) => {
        if (analysis.selectedNodeId && node.id === analysis.selectedNodeId) {
          nodeStateMap.set(node.id, "selected");
          return;
        }
        if (directNodeIds.has(node.id)) {
          nodeStateMap.set(node.id, "direct");
          return;
        }
        if (indirectNodeIds.has(node.id)) {
          nodeStateMap.set(node.id, "indirect");
          return;
        }
        if (activeNodeIds.has(node.id)) {
          nodeStateMap.set(node.id, "direct");
          return;
        }
        nodeStateMap.set(node.id, "inactive");
      });

      renderGraph.edges.forEach((edge) => {
        if (!activeEdgeIds.has(edge.id)) {
          edgeStateMap.set(edge.id, "inactive_edge");
          return;
        }
        if (analysis.primaryEdges.has(edge.id)) {
          edgeStateMap.set(edge.id, "direct_edge");
          return;
        }
        if (analysis.secondaryEdges.has(edge.id)) {
          edgeStateMap.set(edge.id, "indirect_edge");
          return;
        }
        edgeStateMap.set(edge.id, "inactive_edge");
      });
      const isImpactAnalysisMode =
        explorationMode === "impact" ||
        explorationMode === "upstream-impact" ||
        explorationMode === "downstream-impact";
      const modeVisualFamily =
        explorationMode === "parents"
          ? "parents"
          : explorationMode === "children" || explorationMode === "subtree"
            ? "children"
            : explorationMode === "upstream" || explorationMode === "upstream-impact"
              ? "upstream"
              : explorationMode === "downstream" || explorationMode === "downstream-impact"
                ? "downstream"
                : explorationMode === "impact"
                  ? "impact"
                  : explorationMode === "dependents"
                    ? "dependents"
                    : explorationMode === "critical-path"
                      ? "critical-path"
                      : "default";
      const modePalette =
        modeVisualFamily === "parents"
          ? {
              primary: "#4f46e5",
              secondary: "#818cf8",
              dimNodeOpacity: 0.14,
              dimEdgeOpacity: 0.05,
              primaryEdgeDash: undefined as string | undefined,
              secondaryEdgeDash: "4 3",
            }
          : modeVisualFamily === "children"
            ? {
                primary: "#0f766e",
                secondary: "#5eead4",
                dimNodeOpacity: 0.14,
                dimEdgeOpacity: 0.05,
                primaryEdgeDash: undefined as string | undefined,
                secondaryEdgeDash: "2 3",
              }
            : modeVisualFamily === "upstream"
              ? {
                  primary: "#7c3aed",
                  secondary: "#c4b5fd",
                  dimNodeOpacity: 0.16,
                  dimEdgeOpacity: 0.06,
                  primaryEdgeDash: "5 3",
                  secondaryEdgeDash: "2 4",
                }
              : modeVisualFamily === "downstream"
                ? {
                    primary: "#0891b2",
                    secondary: "#67e8f9",
                    dimNodeOpacity: 0.16,
                    dimEdgeOpacity: 0.06,
                    primaryEdgeDash: "8 3",
                    secondaryEdgeDash: "3 4",
                  }
                : modeVisualFamily === "impact"
                  ? {
                      primary: "#2563eb",
                      secondary: "#93c5fd",
                      dimNodeOpacity: 0.18,
                      dimEdgeOpacity: 0.08,
                      primaryEdgeDash: undefined as string | undefined,
                      secondaryEdgeDash: "3 4",
                    }
                  : modeVisualFamily === "dependents"
                    ? {
                        primary: "#d97706",
                        secondary: "#fbbf24",
                        dimNodeOpacity: 0.16,
                        dimEdgeOpacity: 0.06,
                        primaryEdgeDash: "6 4",
                        secondaryEdgeDash: "3 4",
                      }
                    : modeVisualFamily === "critical-path"
                      ? {
                          primary: "#1d4ed8",
                          secondary: "#60a5fa",
                          dimNodeOpacity: 0.14,
                          dimEdgeOpacity: 0.05,
                          primaryEdgeDash: undefined as string | undefined,
                          secondaryEdgeDash: "4 3",
                        }
                      : {
                          primary: "#2563eb",
                          secondary: "#93c5fd",
                          dimNodeOpacity: 0.18,
                          dimEdgeOpacity: 0.08,
                          primaryEdgeDash: undefined as string | undefined,
                          secondaryEdgeDash: "3 4",
                        };
      const lateralPrimaryEdges = new Set<string>();
      const structuralPrimaryEdges = new Set<string>();
      const lateralPrimaryNodes = new Set<string>();
      const repositionedActiveNodeIds = new Set<string>();
      const debugRenderEnabled = integrityDiagnosticsEnabled && debugRenderMode && Boolean(analysis) && debugRenderableMode;
      const strongFocusMode = analysis?.dimUnrelated ?? false;
      const explorationOnlyRenderMode =
        explorationMode === "impact" ||
        explorationMode === "upstream-impact" ||
        explorationMode === "downstream-impact" ||
        explorationMode === "parents" ||
        explorationMode === "children" ||
        explorationMode === "dependents";

    if (isImpactAnalysisMode && analysis.selectedNodeId) {
      graph.edges.forEach((edge) => {
        if (!analysis?.primaryEdges.has(edge.id)) {
          return;
        }
        const touchesSelected =
          edge.source === analysis.selectedNodeId || edge.target === analysis.selectedNodeId;
        const isLateralKind =
          edge.data?.kind === "related" || edge.data?.kind === "conflict";

        if (touchesSelected && isLateralKind) {
          lateralPrimaryEdges.add(edge.id);
          lateralPrimaryNodes.add(
            edge.source === analysis.selectedNodeId ? edge.target : edge.source
          );
        } else {
          structuralPrimaryEdges.add(edge.id);
        }
      });
    }

      const renderedNodes = renderGraph.nodes.map((node): Node<TraceabilityGraphNodeData> | null => {
            const nodeState = nodeStateMap.get(node.id) ?? "inactive";
            if (explorationOnlyRenderMode && nodeState === "inactive") {
              return null;
            }
            const isSelected = nodeState === "selected";
            const isDirect = nodeState === "direct";
            const isIndirect = nodeState === "indirect";
            const isActive = isSelected || isDirect || isIndirect;
            const isWarning = analysis?.warningNodes?.has(node.id) ?? false;
            const isDimmed = nodeState === "inactive" && analysis?.dimUnrelated;
            const isLateralDirect = isDirect && lateralPrimaryNodes.has(node.id);
            const isDirectStructural = isDirect && !isLateralDirect;
            const activePosition = compactLayoutPositions?.get(node.id);
            if (activePosition && nodeState !== "inactive") {
              repositionedActiveNodeIds.add(node.id);
            }
            const nodeOutlineColor = isWarning
              ? "rgba(220,38,38,0.35)"
              : isSelected
                  ? "rgba(15,27,45,0.45)"
                  : isActive
                    ? modePalette.primary
                      : "transparent";
  
            if (debugRenderEnabled) {
                const debugVisible = nodeState !== "inactive";
                if (!debugVisible) {
                  return null;
                }
                return {
                  ...node,
                  position: activePosition ?? node.position,
                  zIndex: isSelected ? 16 : 12,
                  style: {
                    ...node.style,
                    opacity: 1,
                    background:
                      isSelected
                        ? "#16a34a"
                        : "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    outline: isSelected ? "4px solid #14532d" : "3px solid #1d4ed8",
                    outlineOffset: 0,
                    boxShadow: isSelected
                      ? "0 0 0 5px rgba(34,197,94,0.25), 0 16px 28px rgba(21,128,61,0.24)"
                      : "0 12px 24px rgba(37,99,235,0.28)",
                    backgroundImage:
                      integrityDiagnosticsEnabled && !isSelected
                        ? "radial-gradient(circle at 10px 10px, rgba(255,255,255,0.96) 0 3px, transparent 4px)"
                        : undefined,
                    transform: isSelected ? "scale(1.05)" : "scale(1.02)",
                    transition: "none",
                  },
                };
              }

              return {
                ...node,
                position: activePosition ?? node.position,
                zIndex: isSelected ? 16 : isDirect ? 12 : isIndirect ? 10 : 1,
                style: {
                  ...node.style,
                  minWidth: isSelected ? 328 : isDirect ? 316 : isIndirect ? 308 : node.style?.width,
                  backgroundColor: isSelected
                    ? "#ffffff"
                    : isDirectStructural
                      ? `${modePalette.primary}${strongFocusMode ? "66" : "52"}`
                      : isDirect
                        ? `${modePalette.primary}${strongFocusMode ? "52" : "40"}`
                        : isIndirect
                          ? `${modePalette.secondary}${strongFocusMode ? "38" : "2e"}`
                        : isLateralDirect
                          ? strongFocusMode
                            ? "rgba(245,158,11,0.38)"
                            : "rgba(245,158,11,0.3)"
                            : "#ffffff",
                  color: isDimmed ? "rgba(100,116,139,0.12)" : "#020617",
                  border: isSelected
                    ? `4px solid ${modePalette.primary}`
                      : isDirectStructural
                        ? `3px solid ${modePalette.primary}`
                        : isActive
                          ? `2px solid ${modePalette.primary}`
                        : isLateralDirect
                          ? "3px solid rgba(217,119,6,0.72)"
                            : "1px solid rgba(226,232,240,0.45)",
                  opacity: isDimmed
                    ? 0.008
                    : isSelected
                      ? 1
                      : isDirect
                        ? 1
                        : isIndirect
                          ? 0.96
                          : 1,
                  boxShadow: isSelected
                    ? `0 0 0 12px ${modePalette.primary}2e, 0 0 0 4px ${modePalette.primary}, 0 34px 60px rgba(15,23,42,0.4)`
                      : isDirectStructural
                        ? isWarning
                          ? "0 0 0 5px rgba(220,38,38,0.2), 0 22px 36px rgba(220,38,38,0.2)"
                          : `0 0 0 6px ${modePalette.primary}36, 0 22px 36px ${modePalette.primary}52`
                        : isDirect
                          ? `0 0 0 4px ${modePalette.primary}30, 0 18px 30px ${modePalette.primary}40`
                        : isIndirect
                          ? `0 0 0 3px ${modePalette.secondary}2c, 0 12px 22px ${modePalette.secondary}2e`
                        : isLateralDirect
                          ? "0 0 0 5px rgba(217,119,6,0.2), 0 16px 26px rgba(217,119,6,0.22)"
                            : "0 2px 6px rgba(15,23,42,0.02)",
                  outline: isSelected
                    ? `6px solid ${modePalette.primary}`
                    : isDirect
                      ? `4px solid ${nodeOutlineColor}`
                      : isIndirect
                        ? `3px solid ${nodeOutlineColor}`
                        : `2px solid ${nodeOutlineColor}`,
                  outlineOffset: 0,
                  backgroundImage:
                    integrityDiagnosticsEnabled && isActive
                      ? `radial-gradient(circle at 14px 14px, ${isSelected ? "#16a34a" : "#facc15"} 0 6px, rgba(255,255,255,0.98) 7px, transparent 9px), linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0))`
                      : undefined,
                  transform: isSelected
                    ? "translateY(-5px) scale(1.08)"
                        : isDirect
                          ? "translateY(-2px) scale(1.04)"
                          : isIndirect
                            ? "translateY(-1px) scale(1.02)"
                          : "none",
                  filter: isDimmed ? "grayscale(0.88) saturate(0.12) brightness(1.05) blur(0.35px)" : "none",
                  zIndex: isSelected ? 16 : isDirect ? 12 : isIndirect ? 10 : 1,
                  pointerEvents: isDimmed ? "none" : "auto",
                  transition: "opacity 180ms ease, box-shadow 180ms ease, transform 180ms ease, outline-color 180ms ease",
                },
              };
          }).filter(isDefined).sort((left, right) => {
            const weight = (nodeId: string) => {
              const state = nodeStateMap.get(nodeId) ?? "inactive";
              if (state === "selected") {
                return 3;
              }
              if (state === "direct") {
                return 2;
              }
              if (state === "indirect") {
                return 1;
              }
              return 0;
            };

            return weight(left.id) - weight(right.id);
          });
      const finalRenderedNodeIds = renderedNodes.map((node) => node.id);
      const finalRenderedNodeIdSet = new Set(finalRenderedNodeIds);

      const renderedVisibleNodeIds = renderedNodes
        .filter((node) => (nodeStateMap.get(node.id) ?? "inactive") !== "inactive")
        .filter((node) => Number(node.style?.opacity ?? 1) >= 0.9)
        .map((node) => node.id);
      const renderedVisibleNodeIdSet = new Set(renderedVisibleNodeIds);
      const finalVisibleSelectedNodeIds = renderedVisibleNodeIds.filter(
        (nodeId) => (nodeStateMap.get(nodeId) ?? "inactive") === "selected"
      );
      const finalVisibleDirectNodeIds = renderedVisibleNodeIds.filter(
        (nodeId) => (nodeStateMap.get(nodeId) ?? "inactive") === "direct"
      );
      const finalVisibleIndirectNodeIds = renderedVisibleNodeIds.filter(
        (nodeId) => (nodeStateMap.get(nodeId) ?? "inactive") === "indirect"
      );
      const missingVisibleActiveNodeIds = [...activeNodeIds].filter(
        (nodeId) => !renderedVisibleNodeIdSet.has(nodeId)
      );
      const renderedNodeById = new Map(renderedNodes.map((node) => [node.id, node]));
      const missingVisibleActiveNodeReasons = missingVisibleActiveNodeIds.map((nodeId) => {
        if (!filteredGraphNodeIdSet.has(nodeId)) {
          return `${nodeId}: filtered out`;
        }
        const renderedNode = renderedNodeById.get(nodeId);
        if (!renderedNode) {
          return `${nodeId}: hidden by render conditions`;
        }
        if (!compactLayoutPositions?.has(nodeId)) {
          return `${nodeId}: not assigned exploration position`;
        }
        const state = nodeStateMap.get(nodeId) ?? "inactive";
        if (state === "inactive") {
          return `${nodeId}: styled inactive`;
        }
        if (Number(renderedNode.style?.opacity ?? 1) < 0.9) {
          return `${nodeId}: opacity too low`;
        }
        return `${nodeId}: overlapped/off-screen`;
      });
      const activeEdgesWithInvisibleEndpoints = [...activeEdgeIds].filter((edgeId) => {
        const edge = edgeById.get(edgeId);
        if (!edge) {
          return true;
        }
        return (
          !renderedVisibleNodeIdSet.has(edge.source) || !renderedVisibleNodeIdSet.has(edge.target)
        );
      });
      const toRequirementCode = (nodeId: string) => {
        const node = graphNodeById.get(nodeId);
        return node ? extractRequirementCodeFromLabel(node.data.label) : nodeId;
      };
      const filteredGraphRequirementCodes = graph.nodes.map((node) =>
        extractRequirementCodeFromLabel(node.data.label)
      );
      const semanticActiveRequirementCodes = [...activeNodeIds].map(toRequirementCode);
      const finalVisibleActiveRequirementCodes = renderedVisibleNodeIds.map(toRequirementCode);
      const droppedActiveEdgesWithMissingVisibleEndpoints = activeEdgesWithInvisibleEndpoints.map(
        (edgeId) => {
          const edge = edgeById.get(edgeId);
          if (!edge) {
            return edgeId;
          }
          return `${edgeId} (${toRequirementCode(edge.source)} -> ${toRequirementCode(edge.target)})`;
        }
      );
      const nodeProofRows = [...activeNodeIds].map((nodeId) => {
        const filteredNode = graphNodeById.get(nodeId);
        const requirementCode = filteredNode
          ? extractRequirementCodeFromLabel(filteredNode.data.label)
          : nodeId;
        const inFilteredGraph = filteredGraphNodeIdSet.has(nodeId);
        const inFinalRenderedNodes = finalRenderedNodeIdSet.has(nodeId);
        const visibleActive = renderedVisibleNodeIdSet.has(nodeId);
        let failureReason = "visible active";

        if (!inFilteredGraph) {
          const rawGraphNode = graphNodes.find((node) => node.id === nodeId);
          if (!rawGraphNode) {
            failureReason = "other: absent from raw graph payload";
          } else {
            const rawRequirementCode = extractRequirementCodeFromLabel(rawGraphNode.label);
            const codeMatchedFilteredNode = graph.nodes.find(
              (candidate) => extractRequirementCodeFromLabel(candidate.data.label) === rawRequirementCode
            );
            if (codeMatchedFilteredNode && codeMatchedFilteredNode.id !== nodeId) {
              failureReason = `present in filtered graph payload but id mismatch prevents activation (${codeMatchedFilteredNode.id})`;
            } else {
              failureReason = `absent from filtered graph payload (filters: subsystem=${filters.subsystem}, type=${filters.type}, provenance=${filters.provenance})`;
            }
          }
        } else if (!inFinalRenderedNodes) {
          failureReason = "present in filtered graph payload but removed by render conditions";
        } else if (!visibleActive) {
          const renderedNode = renderedNodeById.get(nodeId);
          if (!renderedNode) {
            failureReason = "present in filtered graph payload but removed by render conditions";
          } else if (Number(renderedNode.style?.opacity ?? 1) < 0.9) {
            failureReason = "present in filtered graph payload but opacity too low";
          } else {
            failureReason = "present and rendered, but overlapped/off-screen";
          }
        }

        return `${requirementCode} | id=${nodeId} | in filtered=${inFilteredGraph ? "yes" : "no"} | in final rendered=${inFinalRenderedNodes ? "yes" : "no"} | visible active=${visibleActive ? "yes" : "no"} | ${failureReason}`;
      });

      const finalVisibleActiveEdgeIds: string[] = [];
      const finalRenderedEdgeIds: string[] = [];
      const droppedRenderedEdgeDetails: string[] = [];
      const renderedEdges = renderGraph.edges.map((edge): Edge<TraceabilityGraphEdgeData> | null => {
            const edgeState = edgeStateMap.get(edge.id) ?? "inactive_edge";
            const endpointsRendered =
              finalRenderedNodeIdSet.has(edge.source) &&
              finalRenderedNodeIdSet.has(edge.target);
            const singleRenderedNodeWithoutSelfLoop =
              finalRenderedNodeIds.length === 1 &&
              !(edge.source === edge.target && finalRenderedNodeIdSet.has(edge.source));
            const resolvedEdgeState =
              edgeState !== "inactive_edge" && (!endpointsRendered || singleRenderedNodeWithoutSelfLoop)
                ? "inactive_edge"
                : edgeState;
            if (
              edgeState !== "inactive_edge" &&
              resolvedEdgeState === "inactive_edge" &&
              (explorationOnlyRenderMode || !endpointsRendered || singleRenderedNodeWithoutSelfLoop)
            ) {
              droppedRenderedEdgeDetails.push(
                `${edge.id} (${edge.source} -> ${edge.target})`
              );
            }
            if (explorationOnlyRenderMode && resolvedEdgeState === "inactive_edge") {
              return null;
            }
            if (resolvedEdgeState !== "inactive_edge") {
              finalVisibleActiveEdgeIds.push(edge.id);
              finalRenderedEdgeIds.push(edge.id);
            }
            const isPrimary = resolvedEdgeState === "direct_edge";
            const isSecondary = resolvedEdgeState === "indirect_edge";
              const isDimmed = resolvedEdgeState === "inactive_edge" && analysis?.dimUnrelated;
                const isLateralPrimary = lateralPrimaryEdges.has(edge.id);
                const isStructuralPrimary = structuralPrimaryEdges.has(edge.id) || (isPrimary && !isLateralPrimary);
            const edgeStroke =
              isImpactAnalysisMode && isPrimary
                ? edge.data?.kind === "conflict"
                  ? "#dc2626"
                  : edge.data?.kind === "related"
                    ? "#d97706"
                    : modePalette.primary
                : isStructuralPrimary
                  ? modePalette.primary
                  : isSecondary
                    ? modePalette.secondary
                : edge.style?.stroke;
  
              if (debugRenderEnabled) {
                  const debugVisible = resolvedEdgeState !== "inactive_edge";
                  if (!debugVisible) {
                    return null;
                  }
              return {
                ...edge,
                animated: false,
                style: {
                  ...edge.style,
                  stroke: isPrimary ? "#2563eb" : "#f59e0b",
                  opacity: 1,
                  strokeWidth: isPrimary ? 4.2 : 3.2,
                  strokeDasharray: isPrimary ? undefined : "7 4",
                  filter: "none",
                  transition: "none",
                },
              };
            }

              return {
                ...edge,
                animated:
                  isImpactAnalysisMode
                    ? isStructuralPrimary || edge.animated
                  : modeVisualFamily === "upstream" || modeVisualFamily === "downstream"
                    ? isStructuralPrimary
                    : edge.animated,
                style: {
                  ...edge.style,
                  stroke: edgeStroke,
                  opacity: isDimmed
                    ? 0.01
                    : isStructuralPrimary
                      ? 1
                      : isLateralPrimary
                        ? 0.86
                        : isSecondary
                          ? 0.56
                          : 1,
                  strokeWidth: isStructuralPrimary
                    ? typeof edge.style?.strokeWidth === "number"
                      ? edge.style.strokeWidth + 3.2
                      : 4.8
                    : isLateralPrimary
                      ? typeof edge.style?.strokeWidth === "number"
                          ? edge.style.strokeWidth + 1
                          : 2.9
                      : isSecondary
                        ? typeof edge.style?.strokeWidth === "number"
                          ? edge.style.strokeWidth + 0.7
                          : 2.35
                        : edge.style?.strokeWidth,
                  filter: isStructuralPrimary
                    ? `drop-shadow(0 0 9px ${modePalette.primary}66)`
                    : isLateralPrimary
                      ? edge.data?.kind === "conflict"
                        ? "drop-shadow(0 0 5px rgba(220,38,38,0.24))"
                        : "drop-shadow(0 0 5px rgba(217,119,6,0.22))"
                      : isSecondary
                        ? `drop-shadow(0 0 4px ${modePalette.secondary}34)`
                        : "none",
                  strokeDasharray:
                    isImpactAnalysisMode && isLateralPrimary
                      ? edge.data?.kind === "conflict"
                        ? "4 3"
                      : "6 4"
                    : isStructuralPrimary
                      ? modePalette.primaryEdgeDash
                      : isSecondary
                        ? modePalette.secondaryEdgeDash
                      : edge.style?.strokeDasharray,
                  zIndex: isStructuralPrimary ? 10 : isSecondary ? 6 : 1,
                  pointerEvents: isDimmed ? "none" : "auto",
                  transition: "opacity 180ms ease, stroke-width 180ms ease, filter 180ms ease, stroke 180ms ease",
                },
              };
          }).filter(isDefined);

        if (
          integrityDiagnosticsEnabled &&
          analysis &&
          activeNodeId &&
          explorationMode &&
          ["impact", "upstream-impact", "downstream-impact", "parents", "children", "dependents", "upstream", "downstream"].includes(explorationMode)
        ) {
          console.log("[TraceabilityGraph][Viewport][positions-built]", {
            action: explorationMode,
            selectedNodeId: analysis.selectedNodeId,
            finalActiveNodeIds: renderedVisibleNodeIds,
            finalActiveBoundsUsed: renderedVisibleNodeIds
              .map((nodeId) => {
                const positionedNode = renderedNodes.find((node) => node.id === nodeId);
                return positionedNode
                  ? { id: nodeId, x: positionedNode.position.x, y: positionedNode.position.y }
                  : null;
              })
              .filter(isDefined),
          });
        }

        return {
          analysis,
          integrity: {
          selectedNodeId: analysis.selectedNodeId,
          activeNodeIds: [...activeNodeIds],
          directNodeIds: [...directNodeIds],
          indirectNodeIds: [...indirectNodeIds],
          activeEdgeIds: [...activeEdgeIds],
          filteredGraphNodeIds: [...filteredGraphNodeIdSet],
          filteredGraphRequirementCodes,
          explorationForcedInNodeIds: [...activeNodeIds].filter((nodeId) => !graph.nodes.some((node) => node.id === nodeId)),
          finalVisibleSelectedNodeIds,
          finalVisibleDirectNodeIds,
          finalVisibleIndirectNodeIds,
          finalVisibleActiveNodeIds: renderedVisibleNodeIds,
          finalVisibleActiveEdgeIds,
          finalRenderedNodeIds,
          finalRenderedEdgeIds,
          semanticActiveRequirementCodes,
          finalVisibleActiveRequirementCodes,
          droppedActiveEdgesWithMissingVisibleEndpoints,
          droppedRenderedEdgeDetails,
          autoAddedEndpointNodeIds: [...autoAddedEndpointNodeIds],
          droppedEdgeIds: [...droppedEdgeIds],
          repositionedActiveNodeIds: [...repositionedActiveNodeIds],
            renderedVisibleNodeIds,
            missingVisibleActiveNodeIds,
            activeEdgesWithInvisibleEndpoints,
            missingVisibleActiveNodeReasons,
            nodeProofRows,
            renderNodeProofRows: [],
            overlapProofRows: [],
          },
          graph: {
            ...renderGraph,
            nodes: renderedNodes,
            edges: renderedEdges,
          },
        };
    }, [activeBackendAnalysis, activeNodeId, backendDrivenExploration, debugRenderMode, debugRenderableMode, explorationMembershipOverride, explorationMode, fullGraph, graph, integrityDiagnosticsEnabled]);

  const debugIntegrity = useMemo(() => {
    if (!styledGraph.integrity) {
      return null;
    }

    return {
      ...styledGraph.integrity,
      renderNodeProofRows: domRenderProofRows,
      overlapProofRows: domOverlapProofRows,
    };
  }, [domOverlapProofRows, domRenderProofRows, styledGraph.integrity]);

  const explorationResultRows = useMemo(() => {
    if (
      !styledGraph.analysis ||
      !explorationMode ||
      !["impact", "upstream-impact", "downstream-impact", "parents", "children", "dependents"].includes(explorationMode)
    ) {
      return [];
    }

    const responseNodeById = new Map(graphNodes.map((node) => [node.id, node]));
    const orderedIds = [
      ...(styledGraph.analysis.selectedNodeId ? [styledGraph.analysis.selectedNodeId] : []),
      ...styledGraph.analysis.primaryNodes,
      ...styledGraph.analysis.secondaryNodes,
    ].filter((nodeId, index, values) => values.indexOf(nodeId) === index);

    return orderedIds.map((nodeId) => {
      const responseNode = responseNodeById.get(nodeId);
      const graphNode = styledGraph.graph.nodes.find((node) => node.id === nodeId);
      const requirementCode = responseNode
        ? extractRequirementCodeFromLabel(responseNode.label)
        : graphNode
          ? extractRequirementCodeFromLabel(graphNode.data.label)
          : nodeId;
      const title = responseNode?.title ?? graphNode?.data.title ?? "Untitled requirement";
      const relationshipType =
        styledGraph.analysis?.selectedNodeId === nodeId
          ? "selected"
          : styledGraph.analysis?.primaryNodes.has(nodeId)
            ? "direct"
            : "indirect";

      return {
        nodeId,
        requirementCode,
        title,
        relationshipType,
      };
    });
  }, [explorationMode, graphNodes, styledGraph.analysis, styledGraph.graph.nodes]);

  useEffect(() => {
    setNodes(styledGraph.graph.nodes);
    setEdges(styledGraph.graph.edges);
    const explorationFitEligible =
      Boolean(styledGraph.analysis) &&
      Boolean(activeNodeId) &&
      Boolean(explorationMode) &&
      ["impact", "upstream-impact", "downstream-impact", "parents", "children", "dependents", "upstream", "downstream"].includes(explorationMode ?? "");
    const finalActiveNodeIds = styledGraph.integrity?.finalVisibleActiveNodeIds ?? [];
    const committedNodeListKey = styledGraph.graph.nodes.map((node) => `${node.id}:${node.position.x}:${node.position.y}`).join("|");

    committedExplorationNodeListKeyRef.current = committedNodeListKey;

    if (explorationFitEligible && finalActiveNodeIds.length > 0) {
      pendingExplorationFitKeyRef.current = `${explorationMode}:${activeNodeId}:${finalActiveNodeIds.join(",")}`;
      if (integrityDiagnosticsEnabled) {
        console.log("[TraceabilityGraph][Viewport][final-node-list-committed]", {
          action: explorationMode,
          selectedNodeId: activeNodeId,
          committedNodeListKey,
          finalActiveNodeIds,
        });
      }
    } else {
      pendingExplorationFitKeyRef.current = null;
    }
  }, [setEdges, setNodes, styledGraph.graph.edges, styledGraph.graph.nodes]);

  useEffect(() => {
    if (
      !integrityDiagnosticsEnabled ||
      !styledGraph.integrity ||
      !activeNodeId ||
      !explorationMode ||
      !["dependents", "impact", "upstream-impact", "downstream-impact", "parents", "children"].includes(explorationMode)
    ) {
      setDomRenderProofRows([]);
      setDomOverlapProofRows([]);
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const integrity = styledGraph.integrity;
      if (!integrity) {
        setDomRenderProofRows([]);
        setDomOverlapProofRows([]);
        return;
      }
      const renderedNodeById = new Map(styledGraph.graph.nodes.map((node) => [node.id, node]));
      const domNodes = Array.from(document.querySelectorAll<HTMLElement>(".react-flow__node"));
      const screenNodeRows = integrity.activeNodeIds.map((nodeId) => {
        const graphNode = renderedNodeById.get(nodeId);
        const requirementCode = graphNode
          ? extractRequirementCodeFromLabel(graphNode.data.label)
          : nodeId;
        const domNode = domNodes.find((candidate) => candidate.dataset.id === nodeId);
        const rect = domNode?.getBoundingClientRect();
        const computed = domNode ? window.getComputedStyle(domNode) : null;
        const nodeType = graphNode?.type ?? "default";
        const x = graphNode?.position.x ?? null;
        const y = graphNode?.position.y ?? null;
        const assignedWidth = Number(graphNode?.style?.width ?? graphNode?.width ?? 0);
        const assignedHeight = Number(graphNode?.style?.height ?? graphNode?.height ?? 0);
        const opacity = computed?.opacity ?? String(graphNode?.style?.opacity ?? 1);
        const display = computed?.display ?? String(graphNode?.style?.display ?? "default");
        const visibility = computed?.visibility ?? String(graphNode?.style?.visibility ?? "visible");
        const labelRendered = Boolean(domNode?.textContent?.trim());
        const visibleNodeBody =
          Boolean(domNode) &&
          (rect?.width ?? 0) > 40 &&
          (rect?.height ?? 0) > 20 &&
          display !== "none" &&
          visibility !== "hidden" &&
          Number(opacity) > 0.3;
        const centerX = rect ? rect.left + rect.width / 2 : null;
        const centerY = rect ? rect.top + rect.height / 2 : null;

        return {
          nodeId,
          requirementCode,
          graphNode,
          domNode,
          rect,
          nodeType,
          x,
          y,
          assignedWidth,
          assignedHeight,
          opacity,
          display,
          visibility,
          labelRendered,
          visibleNodeBody,
          centerX,
          centerY,
        };
      });

      const overlapByNodeId = new Map<string, string[]>();
      const overlapRows: string[] = [];
      for (let index = 0; index < screenNodeRows.length; index += 1) {
        for (let nextIndex = index + 1; nextIndex < screenNodeRows.length; nextIndex += 1) {
          const leftNode = screenNodeRows[index];
          const rightNode = screenNodeRows[nextIndex];
          const leftRect = leftNode.rect;
          const rightRect = rightNode.rect;
          if (!leftRect || !rightRect) {
            continue;
          }

          const overlapWidth =
            Math.max(0, Math.min(leftRect.right, rightRect.right) - Math.max(leftRect.left, rightRect.left));
          const overlapHeight =
            Math.max(0, Math.min(leftRect.bottom, rightRect.bottom) - Math.max(leftRect.top, rightRect.top));
          const overlapArea = overlapWidth * overlapHeight;
          const overlaps = overlapArea > 24;

          overlapRows.push(
            `${leftNode.requirementCode}<->${rightNode.requirementCode} | overlap=${overlaps ? "yes" : "no"} | area=${Math.round(overlapArea)}`
          );

          if (overlaps) {
            overlapByNodeId.set(leftNode.nodeId, [
              ...(overlapByNodeId.get(leftNode.nodeId) ?? []),
              rightNode.requirementCode,
            ]);
            overlapByNodeId.set(rightNode.nodeId, [
              ...(overlapByNodeId.get(rightNode.nodeId) ?? []),
              leftNode.requirementCode,
            ]);
          }
        }
      }

      const proofRows = screenNodeRows.map((node) => {
        const overlapPartners = overlapByNodeId.get(node.nodeId) ?? [];
        const renderedOffScreen = node.rect
          ? (
              node.rect.right < 0 ||
              node.rect.bottom < 0 ||
              node.rect.left > window.innerWidth ||
              node.rect.top > window.innerHeight
            )
          : false;
        const nearZeroArea = (node.rect?.width ?? 0) <= 8 || (node.rect?.height ?? 0) <= 8;
        const visuallyDistinct =
          node.visibleNodeBody && !renderedOffScreen && !nearZeroArea && overlapPartners.length === 0;
        let classification = "visible and distinct";
        let failureReason = "visible and distinct";

        if (!node.graphNode) {
          classification = "not rendered";
          failureReason = "node missing from React Flow node list";
        } else if (!node.domNode) {
          classification = "not rendered";
          failureReason = "node DOM element missing";
        } else if (nearZeroArea) {
          classification = "rendered but zero/near-zero area";
          failureReason = "zero-size or near-zero-size box";
        } else if (node.display === "none" || node.visibility === "hidden") {
          classification = "not rendered";
          failureReason = "node body styled hidden";
        } else if (Number(node.opacity) <= 0.3) {
          classification = "not rendered";
          failureReason = "node body opacity too low";
        } else if (!node.labelRendered) {
          classification = "not rendered";
          failureReason = "label/body text not rendered";
        } else if (renderedOffScreen) {
          classification = "rendered but off-screen";
          failureReason = "off-screen";
        } else if (overlapPartners.length > 0) {
          classification = "rendered but overlapped";
          failureReason = `overlaps ${overlapPartners.join(", ")}`;
        }

        return `${node.requirementCode} | id=${node.nodeId} | x=${node.x ?? "na"} | y=${node.y ?? "na"} | rect=${node.rect ? `${Math.round(node.rect.left)},${Math.round(node.rect.top)},${Math.round(node.rect.width)},${Math.round(node.rect.height)}` : "na"} | body=${node.visibleNodeBody ? "yes" : "no"} | overlaps=${overlapPartners.length > 0 ? overlapPartners.join(", ") : "none"} | distinct=${visuallyDistinct ? "yes" : "no"} | ${classification} | ${failureReason}`;
      });

      console.log("[TraceabilityGraph][RenderNodeProof]", {
        action: explorationMode,
        selectedRequirementCode: selectedGraphNode
          ? extractRequirementCodeFromLabel(selectedGraphNode.label)
          : activeNodeId,
        renderNodeProofRows: proofRows,
        overlapProofRows: overlapRows,
      });
      setDomRenderProofRows(proofRows);
      setDomOverlapProofRows(overlapRows);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [activeNodeId, explorationMode, integrityDiagnosticsEnabled, selectedGraphNode, styledGraph.graph.nodes, styledGraph.integrity]);

  useEffect(() => {
    if (
      !integrityDiagnosticsEnabled ||
      !styledGraph.analysis ||
      !(
        explorationMode === "impact" ||
        explorationMode === "upstream-impact" ||
        explorationMode === "downstream-impact"
      )
    ) {
      return;
    }

    const applyKey = activeNodeId && explorationMode ? `${explorationMode}:${activeNodeId}` : null;
    const emphasizedNodeIds = [
      ...styledGraph.analysis.primaryNodes,
      ...styledGraph.analysis.secondaryNodes,
      ...(styledGraph.analysis.selectedNodeId ? [styledGraph.analysis.selectedNodeId] : []),
    ];
    const emphasizedEdgeIds = [
      ...styledGraph.analysis.primaryEdges,
      ...styledGraph.analysis.secondaryEdges,
    ];
    const dimmedNodeIds = styledGraph.graph.nodes
      .filter((node) => !emphasizedNodeIds.includes(node.id))
      .map((node) => node.id);

    console.log("[TraceabilityGraph][AnalyzeImpact][applied]", {
      selectedGraphNodeId: activeNodeId,
      selectedInternalId: activeNodeId,
      selectedRequirementCode: selectedGraphNode
        ? extractRequirementCodeFromLabel(selectedGraphNode.label)
        : null,
      frontendHighlightNodeIds: emphasizedNodeIds,
      frontendHighlightEdgeIds: emphasizedEdgeIds,
      dimmedNodeIds,
      previousImpactStateClearedFirst: lastAppliedImpactKeyRef.current !== applyKey,
    });

    lastAppliedImpactKeyRef.current = applyKey;
  }, [activeNodeId, explorationMode, integrityDiagnosticsEnabled, selectedGraphNode, styledGraph.analysis, styledGraph.graph.nodes]);

  useEffect(() => {
    if (
      !integrityDiagnosticsEnabled ||
      !styledGraph.analysis ||
      !activeNodeId ||
      !explorationMode ||
      !["parents", "children", "dependents", "impact", "upstream-impact", "downstream-impact", "upstream", "downstream"].includes(explorationMode)
    ) {
      return;
    }

    const highlightedNodeIds = styledGraph.graph.nodes
      .filter((node) => Number(node.style?.opacity ?? 1) > 0.26)
      .map((node) => node.id);
    const highlightedEdgeIds = styledGraph.graph.edges
      .filter((edge) => Number(edge.style?.opacity ?? 1) > 0.14)
      .map((edge) => edge.id);

    console.log("[TraceabilityGraph][Exploration][applied]", {
      action: explorationMode,
      selectedRequirementCode: selectedGraphNode
        ? extractRequirementCodeFromLabel(selectedGraphNode.label)
        : null,
      traversalResultNodeIds: [
        ...(styledGraph.analysis.selectedNodeId ? [styledGraph.analysis.selectedNodeId] : []),
        ...styledGraph.analysis.primaryNodes,
        ...styledGraph.analysis.secondaryNodes,
      ],
      traversalResultEdgeIds: [
        ...styledGraph.analysis.primaryEdges,
        ...styledGraph.analysis.secondaryEdges,
      ],
      finalHighlightedNodeIds: highlightedNodeIds,
      finalHighlightedEdgeIds: highlightedEdgeIds,
      dimmedNodeIds: styledGraph.graph.nodes
        .filter((node) => Number(node.style?.opacity ?? 1) <= 0.26)
        .map((node) => node.id),
      renderedVisibleNodeIds: styledGraph.integrity?.renderedVisibleNodeIds ?? [],
      missingVisibleActiveNodeIds: styledGraph.integrity?.missingVisibleActiveNodeIds ?? [],
      activeEdgesWithInvisibleEndpoints:
        styledGraph.integrity?.activeEdgesWithInvisibleEndpoints ?? [],
      filteredGraphNodeIds: styledGraph.integrity?.filteredGraphNodeIds ?? [],
      filteredGraphRequirementCodes:
        styledGraph.integrity?.filteredGraphRequirementCodes ?? [],
      semanticActiveRequirementCodes:
        styledGraph.integrity?.semanticActiveRequirementCodes ?? [],
      finalVisibleActiveRequirementCodes:
        styledGraph.integrity?.finalVisibleActiveRequirementCodes ?? [],
      nodeProofRows: styledGraph.integrity?.nodeProofRows ?? [],
    });
  }, [activeNodeId, explorationMode, integrityDiagnosticsEnabled, selectedGraphNode, styledGraph]);

  useEffect(() => {
    if (!reactFlowInstance || styledGraph.graph.nodes.length === 0 || hasAppliedInitialFitRef.current) {
      return;
    }
    if (focusRequirementId) {
      return;
    }
    reactFlowInstance.fitView({ padding: 0.18, duration: 0 });
    hasAppliedInitialFitRef.current = true;
  }, [focusRequirementId, reactFlowInstance, styledGraph.graph.nodes.length]);

  useEffect(() => {
    if (!reactFlowInstance || !focusRequirementId) {
      return;
    }
    const focusKey = `${focusRequirementId}:${focusMode ?? "impact"}`;
    if (lastInitialFocusKeyRef.current === focusKey) {
      return;
    }
    const nodeToFocus = styledGraph.graph.nodes.find((node) => node.id === focusRequirementId);
    if (!nodeToFocus) {
      return;
    }
    reactFlowInstance.setCenter(nodeToFocus.position.x + 150, nodeToFocus.position.y + 55, {
      zoom: focusMode === "focus" ? 1.08 : 1.02,
      duration: 260,
    });
    lastInitialFocusKeyRef.current = focusKey;
    hasAppliedInitialFitRef.current = true;
  }, [focusMode, focusRequirementId, reactFlowInstance, styledGraph.graph.nodes]);

  useEffect(() => {
    if (
      !reactFlowInstance ||
      !activeNodeId ||
      !(
        explorationMode === "impact" ||
        explorationMode === "upstream-impact" ||
        explorationMode === "downstream-impact" ||
        explorationMode === "parents" ||
        explorationMode === "children" ||
        explorationMode === "dependents" ||
        explorationMode === "upstream" ||
        explorationMode === "downstream"
      )
    ) {
      return;
    }

    const activeNodeIds = new Set<string>(styledGraph.integrity?.finalVisibleActiveNodeIds ?? []);
    const pendingFitKey = pendingExplorationFitKeyRef.current;
    const fitKey = `${explorationMode}:${activeNodeId}:${[...activeNodeIds].join(",")}`;
    if (!pendingFitKey || pendingFitKey !== fitKey || lastExplorationFitKeyRef.current === fitKey) {
      return;
    }

    const focusNodes = nodes.filter((node) => activeNodeIds.has(node.id));

    if (focusNodes.length === 0 || focusNodes.length !== activeNodeIds.size) {
      return;
    }

    let postFocusFrameId: number | null = null;
    const frameId = window.requestAnimationFrame(() => {
      const committedNodeListKey = nodes
        .map((node) => `${node.id}:${node.position.x}:${node.position.y}`)
        .join("|");
      if (committedExplorationNodeListKeyRef.current !== committedNodeListKey) {
        return;
      }

      const instanceNodes = reactFlowInstance
        .getNodes()
        .filter((node) => activeNodeIds.has(node.id));

      if (instanceNodes.length === 0 || instanceNodes.length !== activeNodeIds.size) {
        return;
      }

      reactFlowInstance.fitView({
        nodes: instanceNodes,
        padding: 0.25,
        duration: 200,
      });

      postFocusFrameId = window.requestAnimationFrame(() => {
        const domNodes = Array.from(document.querySelectorAll<HTMLElement>(".react-flow__node"))
          .filter((node) => activeNodeIds.has(node.dataset.id ?? ""));
        const finalNodeRects = domNodes.map((domNode) => {
          const rect = domNode.getBoundingClientRect();
          return {
            id: domNode.dataset.id ?? "unknown",
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };
        });

        if (integrityDiagnosticsEnabled) {
          console.log("[TraceabilityGraph][Viewport][focus-executed]", {
            action: explorationMode,
            selectedNodeId: activeNodeId,
            activeNodeIdsUsedForFocus: [...activeNodeIds],
            finalActiveBoundsUsed: instanceNodes.map((node) => ({
              id: node.id,
              x: node.position.x,
              y: node.position.y,
              width: node.measured?.width ?? node.width ?? null,
              height: node.measured?.height ?? node.height ?? null,
            })),
            finalNodeRectsAfterFocus: finalNodeRects,
          });
        }

        lastExplorationFitKeyRef.current = fitKey;
        pendingExplorationFitKeyRef.current = null;
        hasAppliedInitialFitRef.current = true;
      });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      if (postFocusFrameId !== null) {
        window.cancelAnimationFrame(postFocusFrameId);
      }
    };
  }, [activeNodeId, explorationMode, integrityDiagnosticsEnabled, nodes, reactFlowInstance, styledGraph.integrity]);

  useEffect(() => {
    setShowGraphNote(true);
    const timeoutId = window.setTimeout(() => {
      setShowGraphNote(false);
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [projectId, filters]);

  useEffect(() => {
    if (activeNodeId && !graph.nodes.some((node) => node.id === activeNodeId)) {
      setActiveNodeId(null);
      setExplorationMode(null);
      setContextMenu(null);
    }
  }, [activeNodeId, graph.nodes]);

  const contextItems = [
    { label: "Project ID", value: projectId || "Unknown" },
    { label: "Requirements shown", value: String(graph.summary.totalNodes) },
    { label: "Relationship edges", value: String(graph.summary.totalEdges) },
    { label: "Conflict nodes", value: String(graph.summary.conflictNodes) },
    { label: "Generated nodes", value: String(graph.summary.generatedNodes) },
  ];

  const compactSelectSx = {
    minWidth: standalone ? 148 : 208,
    "& .MuiInputBase-root": {
      minHeight: standalone ? 32 : 38,
      fontSize: standalone ? "0.79rem" : "0.875rem",
      borderRadius: 1.5,
      bgcolor: "#ffffff",
    },
    "& .MuiInputLabel-root": {
      fontSize: standalone ? "0.77rem" : "0.85rem",
    },
  };

  const toolbarLegend = (
    <Stack
      direction="row"
      spacing={standalone ? 1 : 1.5}
      useFlexGap
      flexWrap="wrap"
      alignItems="center"
      sx={{ color: "#64748b", minHeight: standalone ? 32 : 38 }}
    >
      {[
        { color: "#2563eb", label: "Parent-child" },
        { color: "#94a3b8", label: "Related" },
        { color: "#dc2626", label: "Conflict" },
        { color: "#d97706", label: "Generated" },
      ].map((item) => (
        <Stack key={item.label} direction="row" spacing={0.75} alignItems="center">
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: item.color,
              opacity: item.label === "Generated" ? 0.8 : 1,
            }}
          />
          <Typography
            variant="caption"
            sx={{ fontSize: standalone ? "0.73rem" : "0.76rem", letterSpacing: "0.01em" }}
          >
            {item.label}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );

  const graphBody = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        overflowY: changeImpactWorkspaceMode ? "auto" : "hidden",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          height: "100%",
          p: standalone ? 0 : changeImpactWorkspaceMode ? { xs: 1.25, md: 1.5 } : { xs: 2, md: 3 },
          border: standalone ? "none" : "1px solid rgba(15,23,42,0.10)",
          borderTop: "none",
          bgcolor: "#ffffff",
          borderRadius: 0,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <Stack spacing={changeImpactWorkspaceMode ? 2 : 3} sx={{ height: "100%", minHeight: 0 }}>
          {!standalone ? (
            <Stack
              direction={{ xs: "column", lg: "row" }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ lg: "flex-start" }}
            >
              <Box>
                <Stack direction="row" spacing={1} alignItems="center">
                  <HubOutlinedIcon sx={{ color: "#1d4ed8" }} />
                  <Typography variant="h5" fontWeight={700} color="#0f172a">
                    Traceability Graph
                  </Typography>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 980 }}>
                  Visualize parent-child decomposition, related requirement links, conflicts, and generated draft provenance across the project.
                </Typography>
              </Box>

              <AppCompactActionButton
                startIcon={<OpenInNewOutlinedIcon />}
                onClick={() =>
                  window.open(
                    `${window.location.origin}/?openGraphProject=${encodeURIComponent(projectId)}&standalone=1`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                Open in Separate Window
              </AppCompactActionButton>
            </Stack>
          ) : null}

          {loading ? (
            <WorkspaceStatePanel
              state="loading"
              title="Loading traceability graph"
              message="Aggregating current relationships, validation signals, and provenance into a graph view."
            />
          ) : null}

          {error ? <WorkspaceStatePanel state="error" title="Unable to load graph" message={error} /> : null}

          {!loading && !error ? (
            <>
              <Paper
                elevation={0}
                sx={{
                  px: standalone ? 1.5 : 2,
                  py: standalone ? 1 : 2,
                  border: standalone ? "none" : "1px solid rgba(15,23,42,0.10)",
                  borderBottom: "1px solid rgba(15,23,42,0.08)",
                  bgcolor: standalone ? "#f8fafc" : "#f8fafc",
                  borderRadius: 0,
                }}
              >
                <Stack
                  direction={{ xs: "column", lg: "row" }}
                  spacing={standalone ? 1 : 1.5}
                  alignItems={{ lg: "center" }}
                  justifyContent="space-between"
                  useFlexGap
                  flexWrap="wrap"
                >
                  <Stack
                    direction="row"
                    spacing={standalone ? 1 : 1.5}
                    alignItems="center"
                    useFlexGap
                    flexWrap="wrap"
                  >
                  <TextField
                    select
                    size="small"
                    label="Subsystem"
                    value={filters.subsystem}
                    onChange={(event) => setFilters((current) => ({ ...current, subsystem: event.target.value }))}
                    sx={compactSelectSx}
                  >
                    {subsystemOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option === "all" ? "All subsystems" : option}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    size="small"
                    label="Requirement Type"
                    value={filters.type}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        type: event.target.value as RequirementType | "all",
                      }))
                    }
                    sx={compactSelectSx}
                  >
                    {typeOptions.map((option) => (
                      <MenuItem key={option} value={option}>
                        {option === "all" ? "All types" : option}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    size="small"
                    label="Provenance"
                    value={filters.provenance}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        provenance: event.target.value as TraceabilityGraphFilterState["provenance"],
                      }))
                    }
                    sx={{ ...compactSelectSx, minWidth: standalone ? 138 : 208 }}
                  >
                    <MenuItem value="all">All requirements</MenuItem>
                    <MenuItem value="generated">Generated drafts</MenuItem>
                    <MenuItem value="manual">Manual requirements</MenuItem>
                  </TextField>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={standalone ? 1 : 1.25}
                    alignItems="center"
                    useFlexGap
                    flexWrap="wrap"
                  >
                    {toolbarLegend}
                    {explorationMode ? (
                      <>
                        <Divider orientation="vertical" flexItem sx={{ borderColor: "rgba(148,163,184,0.35)" }} />
                      <AppCompactActionButton
                        tone="neutral"
                        variant="text"
                        onClick={() => {
                          setActiveNodeId(null);
                            setExplorationMode(null);
                          }}
                        >
                          Clear highlight
                        </AppCompactActionButton>
                      </>
                    ) : null}
                  </Stack>
                </Stack>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  px: standalone ? 1.5 : 2,
                  py: standalone ? 0.9 : 1.1,
                  border: "1px solid rgba(15,23,42,0.08)",
                  borderTop: "none",
                  bgcolor: "#ffffff",
                  borderRadius: 0,
                }}
              >
                <Stack
                  direction={{ xs: "column", xl: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xl: "center" }}
                  useFlexGap
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <WorkspaceCommandBar
                      primaryAction={
                        <AppCompactActionButton
                          tone={showChangeImpactReview ? "accent" : "neutral"}
                          variant={showChangeImpactReview ? "contained" : "outlined"}
                          onClick={() => setShowChangeImpactReview((current) => !current)}
                        >
                          Analyze Change Request
                        </AppCompactActionButton>
                      }
                      menus={[
                        {
                          key: "analyze",
                          label: "Analyze",
                          items: [
                            {
                              label: "Analyze Impact",
                              onClick: () => activeNodeId && setExplorationMode("impact"),
                              disabled: !activeNodeId,
                            },
                            {
                              label: "Show Upstream Impact",
                              onClick: () => activeNodeId && setExplorationMode("upstream-impact"),
                              disabled: !activeNodeId,
                            },
                            {
                              label: "Show Downstream Impact",
                              onClick: () => activeNodeId && setExplorationMode("downstream-impact"),
                              disabled: !activeNodeId,
                            },
                            {
                              label: "Critical Path",
                              onClick: () => setExplorationMode("critical-path"),
                            },
                          ],
                        },
                        {
                          key: "tools",
                          label: "Tools",
                          items: [
                            { label: "Show Broken Chains", onClick: () => setExplorationMode("broken-chains") },
                            { label: "Highlight Orphans", onClick: () => setExplorationMode("orphans") },
                            { label: "Highlight Missing Evidence", onClick: () => setExplorationMode("missing-evidence") },
                          ],
                        },
                        {
                          key: "view",
                          label: "View",
                          items: [
                            {
                              label: "Reset Highlights",
                              onClick: () => {
                                setActiveNodeId(null);
                                setExplorationMode(null);
                                setContextMenu(null);
                                lastExplorationFitKeyRef.current = null;
                                reactFlowInstance?.fitView({ padding: 0.18, duration: 260 });
                              },
                            },
                          ],
                        },
                        {
                          key: "more",
                          label: "More",
                          items: integrityDiagnosticsEnabled
                            ? [
                                {
                                  label: debugRenderMode ? "Disable Debug Render" : "Enable Debug Render",
                                  onClick: () => setDebugRenderMode((current) => !current),
                                },
                              ]
                            : [],
                        },
                      ]}
                      statusContent={`${graph.summary.totalNodes} nodes · ${graph.summary.totalEdges} edges`}
                    />
                  </Box>

                  {analysisLoading ? (
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.76rem" }}>
                      Running graph analysis...
                    </Typography>
                  ) : analysisError ? (
                    <Typography variant="caption" color="#b91c1c" sx={{ fontSize: "0.76rem" }}>
                      {analysisError}
                    </Typography>
                    ) : styledGraph.analysis ? (
                      <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                        {health ? (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.74rem" }}>
                            <Box component="span" sx={{ fontWeight: 700, color: "#0f172a", mr: 0.5 }}>
                            Health {health.score}/100
                          </Box>
                          {health.status}
                        </Typography>
                      ) : null}
                        <Box
                          sx={{
                            alignSelf: "flex-start",
                            px: 0.85,
                            py: 0.35,
                            borderRadius: 999,
                            bgcolor: "rgba(15,23,42,0.06)",
                            border: "1px solid rgba(15,23,42,0.08)",
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: "#475569",
                            }}
                          >
                            Showing {styledGraph.analysis.title}
                          </Typography>
                        </Box>
                      <Typography variant="body2" color="#0f172a" sx={{ lineHeight: 1.45 }}>
                        {styledGraph.analysis.description}
                      </Typography>
                      {activeBackendAnalysis?.rationale ? (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.74rem", lineHeight: 1.5 }}>
                          {activeBackendAnalysis.rationale}
                        </Typography>
                      ) : null}
                        <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
                          {styledGraph.analysis.summaryItems.map((item) => (
                            <Typography
                              key={item.label}
                              variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: "0.76rem" }}
                          >
                            <Box component="span" sx={{ fontWeight: 700, color: "#0f172a", mr: 0.5 }}>
                              {item.value}
                            </Box>
                              {item.label}
                            </Typography>
                          ))}
                        </Stack>
                        {integrityDiagnosticsEnabled && debugRenderMode && debugRenderableMode ? (
                          <Box
                            sx={{
                              alignSelf: "flex-start",
                              mt: 0.35,
                              px: 1,
                              py: 0.7,
                              borderRadius: 1.5,
                              bgcolor: "rgba(15,23,42,0.04)",
                              border: "1px solid rgba(15,23,42,0.08)",
                            }}
                          >
                            <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "#0f172a" }}>
                              Debug Render Mode
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>
                              Action: {styledGraph.analysis.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>
                              Selected: {selectedGraphNode ? extractRequirementCodeFromLabel(selectedGraphNode.label) : activeNodeId ?? "None"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>
                              Returned nodes: {styledGraph.graph.nodes.length} • Returned edges: {styledGraph.graph.edges.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>
                              Direct: {styledGraph.analysis.primaryNodes.size} • Indirect: {styledGraph.analysis.secondaryNodes.size}
                            </Typography>
                          </Box>
                        ) : null}
                        {integrityDiagnosticsEnabled && styledGraph.integrity && activeNodeId ? (
                          <Box
                            sx={{
                              alignSelf: "flex-start",
                              mt: 0.35,
                              px: 1,
                              py: 0.7,
                              borderRadius: 1.5,
                              bgcolor: "rgba(15,23,42,0.04)",
                              border: "1px solid rgba(15,23,42,0.08)",
                              maxWidth: 420,
                            }}
                          >
                            <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "#0f172a" }}>
                              Render Integrity
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>
                              Selected: {selectedGraphNode ? extractRequirementCodeFromLabel(selectedGraphNode.label) : activeNodeId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>
                              Semantic active nodes: {styledGraph.integrity.activeNodeIds.length} • Semantic active edges: {styledGraph.integrity.activeEdgeIds.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>
                              Final visible active nodes: {styledGraph.integrity.finalVisibleActiveNodeIds.length} • Final visible active edges: {styledGraph.integrity.finalVisibleActiveEdgeIds.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>
                              Visible selected/direct/indirect: {styledGraph.integrity.finalVisibleSelectedNodeIds.length}/{styledGraph.integrity.finalVisibleDirectNodeIds.length}/{styledGraph.integrity.finalVisibleIndirectNodeIds.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>
                              Repositioned active nodes: {styledGraph.integrity.repositionedActiveNodeIds.length} • Visible active nodes: {styledGraph.integrity.renderedVisibleNodeIds.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>
                              Auto-added endpoints: {styledGraph.integrity.autoAddedEndpointNodeIds.length} • Dropped edges: {styledGraph.integrity.droppedEdgeIds.length}
                            </Typography>
                            <Typography variant="caption" color={styledGraph.integrity.missingVisibleActiveNodeIds.length > 0 ? "#b91c1c" : "text.secondary"} sx={{ display: "block", fontSize: "0.72rem" }}>
                              Missing visible active nodes: {styledGraph.integrity.missingVisibleActiveNodeIds.length}
                            </Typography>
                            <Typography variant="caption" color={styledGraph.integrity.activeEdgesWithInvisibleEndpoints.length > 0 ? "#b91c1c" : "text.secondary"} sx={{ display: "block", fontSize: "0.72rem" }}>
                              Active edges with invisible endpoints: {styledGraph.integrity.activeEdgesWithInvisibleEndpoints.length}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5 }}>
                              Semantic active requirements: {styledGraph.integrity.semanticActiveRequirementCodes.join(", ")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5 }}>
                              Final visible active requirements: {styledGraph.integrity.finalVisibleActiveRequirementCodes.join(", ")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5 }}>
                              Semantic active node ids: {styledGraph.integrity.activeNodeIds.join(", ")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5 }}>
                              Filtered graph node ids: {styledGraph.integrity.filteredGraphNodeIds.join(", ")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5 }}>
                              Filtered graph requirements: {styledGraph.integrity.filteredGraphRequirementCodes.join(", ")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5 }}>
                              Final visible active node ids: {styledGraph.integrity.finalVisibleActiveNodeIds.join(", ")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5 }}>
                              Final rendered node ids: {styledGraph.integrity.finalRenderedNodeIds.join(", ")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5 }}>
                              Final rendered edge ids: {styledGraph.integrity.finalRenderedEdgeIds.join(", ")}
                            </Typography>
                            {styledGraph.integrity.missingVisibleActiveNodeIds.length > 0 ? (
                              <Typography variant="caption" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5, color: "#b91c1c" }}>
                                Missing: {styledGraph.integrity.missingVisibleActiveNodeIds.join(", ")}
                              </Typography>
                            ) : null}
                            {styledGraph.integrity.missingVisibleActiveNodeReasons.length > 0 ? (
                              <Typography variant="caption" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5, color: "#b91c1c" }}>
                                Missing reasons: {styledGraph.integrity.missingVisibleActiveNodeReasons.join(" | ")}
                              </Typography>
                            ) : null}
                            {styledGraph.integrity.droppedActiveEdgesWithMissingVisibleEndpoints.length > 0 ? (
                              <Typography variant="caption" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5, color: "#b91c1c" }}>
                                Dropped active edges: {styledGraph.integrity.droppedActiveEdgesWithMissingVisibleEndpoints.join(", ")}
                              </Typography>
                            ) : null}
                            {styledGraph.integrity.droppedRenderedEdgeDetails.length > 0 ? (
                              <Typography variant="caption" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5, color: "#b91c1c" }}>
                                Dropped rendered edges: {styledGraph.integrity.droppedRenderedEdgeDetails.join(", ")}
                              </Typography>
                            ) : null}
                              <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5 }}>
                                Proof rows: {styledGraph.integrity.nodeProofRows.join(" || ")}
                              </Typography>
                              {debugIntegrity?.renderNodeProofRows.length ? (
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5 }}>
                                  Render rows: {debugIntegrity.renderNodeProofRows.join(" || ")}
                                </Typography>
                              ) : null}
                              {debugIntegrity?.overlapProofRows.length ? (
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem", lineHeight: 1.5 }}>
                                  Overlap rows: {debugIntegrity.overlapProofRows.join(" || ")}
                                </Typography>
                              ) : null}
                            </Box>
                          ) : null}
                        {integrityDiagnosticsEnabled && activeNodeId && explorationMode ? (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
                            Debug: {explorationMode} • {selectedGraphNode ? extractRequirementCodeFromLabel(selectedGraphNode.label) : activeNodeId} •{" "}
                            {styledGraph.analysis.primaryNodes.size + styledGraph.analysis.secondaryNodes.size + (styledGraph.analysis.selectedNodeId ? 1 : 0)} nodes •{" "}
                            {styledGraph.analysis.primaryEdges.size + styledGraph.analysis.secondaryEdges.size} edges
                          </Typography>
                        ) : null}
                      </Stack>
                    ) : (
                    <Stack spacing={0.35}>
                      {health ? (
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.74rem" }}>
                          <Box component="span" sx={{ fontWeight: 700, color: "#0f172a", mr: 0.5 }}>
                            Health {health.score}/100
                          </Box>
                          {health.status}
                        </Typography>
                      ) : null}
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.76rem" }}>
                        Select a node, then use impact analysis or right-click for focused traceability exploration.
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Paper>

              {showChangeImpactReview || changeImpactReview || changeImpactLoading || changeImpactError ? (
                <Paper
                  elevation={0}
                  sx={{
                    px: standalone ? 1.5 : 2,
                    py: standalone ? 1.1 : 1.35,
                    border: "1px solid rgba(15,23,42,0.08)",
                    borderTop: "none",
                    bgcolor: "#fcfdff",
                    borderRadius: 0,
                  }}
                >
                  <Stack spacing={1.25}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={1}
                      justifyContent="space-between"
                      alignItems={{ md: "center" }}
                      useFlexGap
                    >
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                          Change Impact Review
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Enter a plain-English change request to identify directly and indirectly affected requirements with explainable reasons.
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => {
                          setShowChangeImpactReview(false);
                          setChangeImpactError(null);
                        }}
                      >
                        Hide
                      </Button>
                    </Stack>

                    <TextField
                      multiline
                      minRows={3}
                      label="Change request"
                      placeholder="Example: Increase minimum braking torque from 1200 Nm to 1400 Nm for rear axle braking performance."
                      value={changeRequest}
                      onChange={(event) => setChangeRequest(event.target.value)}
                      fullWidth
                    />

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Button
                        variant="contained"
                        onClick={handleRunChangeImpactReview}
                        disabled={changeImpactLoading || !changeRequest.trim()}
                      >
                        {changeImpactLoading ? "Running Analysis..." : "Run Analysis"}
                      </Button>
                      {changeImpactReview ? (
                        <Typography variant="caption" color="text.secondary">
                          {changeImpactReview.direct_matches.length} direct • {changeImpactReview.indirect_impacts.length} indirect •{" "}
                          {changeImpactResultRows.length} affected requirement
                          {changeImpactResultRows.length === 1 ? "" : "s"}
                        </Typography>
                      ) : null}
                    </Stack>

                    {changeImpactError ? <Alert severity="error">{changeImpactError}</Alert> : null}

                    {changeImpactReview ? (
                      <Stack spacing={1.15}>
                        <Paper
                          elevation={0}
                          sx={{
                            px: 1.25,
                            py: 1,
                            borderRadius: 1.5,
                            border: "1px solid rgba(37,99,235,0.14)",
                            bgcolor: "rgba(248,250,252,0.95)",
                            minHeight: 0,
                            display: "flex",
                            flexDirection: "column",
                          }}
                        >
                          <Stack spacing={1} sx={{ minHeight: 0 }}>
                            <Stack
                              direction={{ xs: "column", md: "row" }}
                              spacing={0.75}
                              justifyContent="space-between"
                              alignItems={{ md: "center" }}
                              useFlexGap
                            >
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                                  Summary
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                                  Review direct matches first, then check propagated indirect impacts and the fix actions that follow from them.
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                Query: {changeImpactReview.change_request}
                              </Typography>
                            </Stack>
                            <Stack direction={{ xs: "column", md: "row" }} spacing={1} useFlexGap flexWrap="wrap">
                              <Paper elevation={0} sx={{ px: 1.1, py: 0.8, borderRadius: 1.25, border: "1px solid rgba(15,23,42,0.08)", bgcolor: "#fff", minWidth: 136 }}>
                                <Typography variant="caption" sx={{ display: "block", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4 }}>
                                  Affected
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                                  {changeImpactResultRows.length} requirements
                                </Typography>
                              </Paper>
                              <Paper elevation={0} sx={{ px: 1.1, py: 0.8, borderRadius: 1.25, border: "1px solid rgba(37,99,235,0.14)", bgcolor: "rgba(239,246,255,0.96)", minWidth: 136 }}>
                                <Typography variant="caption" sx={{ display: "block", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4 }}>
                                  Direct
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                                  {changeImpactDirectRows.length} requirements
                                </Typography>
                              </Paper>
                              <Paper elevation={0} sx={{ px: 1.1, py: 0.8, borderRadius: 1.25, border: "1px solid rgba(148,163,184,0.18)", bgcolor: "#fff", minWidth: 136 }}>
                                <Typography variant="caption" sx={{ display: "block", color: "#64748b", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4 }}>
                                  Indirect
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                                  {changeImpactIndirectRows.length} requirements
                                </Typography>
                              </Paper>
                              <Paper elevation={0} sx={{ px: 1.1, py: 0.8, borderRadius: 1.25, border: "1px solid rgba(217,119,6,0.2)", bgcolor: "rgba(255,251,235,0.96)", minWidth: 136 }}>
                                <Typography variant="caption" sx={{ display: "block", color: "#92400e", textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.4 }}>
                                  Likely Edits
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                                  {changeImpactReview.likely_requirements_needing_edits.length} requirements
                                </Typography>
                              </Paper>
                            </Stack>
                            <Stack spacing={0.85}>
                              <Box
                                sx={{
                                  position: "sticky",
                                  top: 0,
                                  zIndex: 2,
                                  bgcolor: "#f8fbff",
                                  py: 0.35,
                                }}
                              >
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                                  Directly Affected Requirements
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  These matched the change request itself.
                                </Typography>
                              </Box>
                              {changeImpactDirectRows.map((item) => {
                                const likelyEdit = changeImpactLikelyEditIds.has(item.requirement.id);

                                return (
                                  <Paper
                                    key={`direct-${item.requirement.id}`}
                                    elevation={0}
                                    sx={{
                                      px: 1.2,
                                      py: 0.95,
                                      borderRadius: 1.5,
                                      border: "1px solid rgba(37,99,235,0.28)",
                                      bgcolor: "rgba(239,246,255,0.96)",
                                    }}
                                  >
                                    <Stack spacing={0.75}>
                                      <Stack
                                        direction={{ xs: "column", lg: "row" }}
                                        spacing={1}
                                        justifyContent="space-between"
                                        alignItems={{ lg: "flex-start" }}
                                      >
                                        <Stack spacing={0.2} sx={{ minWidth: 0 }}>
                                          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                textTransform: "uppercase",
                                                fontWeight: 800,
                                                letterSpacing: 0.45,
                                                color: "#475569",
                                              }}
                                            >
                                              direct
                                            </Typography>
                                            {likelyEdit ? (
                                              <Typography variant="caption" sx={{ fontWeight: 700, color: "#92400e" }}>
                                                Likely edit needed
                                              </Typography>
                                            ) : null}
                                          </Stack>
                                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                                            {item.requirement.requirement_code}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                                            {item.requirement.title}
                                          </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                          <Button
                                            size="small"
                                            variant="text"
                                            onClick={() =>
                                              navigate(
                                                routePaths.projectRequirementDetail(projectId, item.requirement.id)
                                              )
                                            }
                                          >
                                            View
                                          </Button>
                                          <Button
                                            size="small"
                                            variant="text"
                                            onClick={() =>
                                              navigate(getTraceabilityMatrixFocusPath(projectId, item.requirement.id))
                                            }
                                          >
                                            Matrix
                                          </Button>
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => {
                                              if (!graph.nodes.some((node) => node.id === item.requirement.id)) {
                                                setChangeImpactError(
                                                  `${item.requirement.requirement_code} is hidden by the current graph filters. Open it in the matrix or clear filters before highlighting it in the graph.`
                                                );
                                                return;
                                              }
                                              setChangeImpactError(null);
                                              setActiveNodeId(item.requirement.id);
                                              setExplorationMode("impact");
                                            }}
                                          >
                                            Graph
                                          </Button>
                                        </Stack>
                                      </Stack>
                                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                                        Why flagged: {item.reason}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: "#0f172a", lineHeight: 1.45 }}>
                                        Recommended fix: {item.recommended_fix_action}
                                      </Typography>
                                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        <Typography variant="caption" color="text.secondary">
                                          Warnings: {item.warning_count}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Conflicts: {item.conflict_count}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Design parameters: {item.linked_design_parameter_count}
                                        </Typography>
                                        {item.matched_tokens.length > 0 ? (
                                          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                                            Matched tokens: {item.matched_tokens.join(", ")}
                                          </Typography>
                                        ) : null}
                                      </Stack>
                                    </Stack>
                                  </Paper>
                                );
                              })}
                              {changeImpactIndirectRows.length > 0 ? (
                                <Box
                                  sx={{
                                    pt: 0.35,
                                    position: "sticky",
                                    top: 0,
                                    zIndex: 2,
                                    bgcolor: "#f8fbff",
                                    pb: 0.2,
                                  }}
                                >
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                                    Indirectly Affected Requirements
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    These were pulled in through existing traceability links and downstream dependencies.
                                  </Typography>
                                </Box>
                              ) : null}
                              {changeImpactIndirectRows.map((item) => {
                                const likelyEdit = changeImpactLikelyEditIds.has(item.requirement.id);

                                return (
                                  <Paper
                                    key={`indirect-${item.requirement.id}`}
                                    elevation={0}
                                    sx={{
                                      px: 1.2,
                                      py: 0.95,
                                      borderRadius: 1.5,
                                      border: "1px solid rgba(148,163,184,0.24)",
                                      bgcolor: "#ffffff",
                                    }}
                                  >
                                    <Stack spacing={0.75}>
                                      <Stack
                                        direction={{ xs: "column", lg: "row" }}
                                        spacing={1}
                                        justifyContent="space-between"
                                        alignItems={{ lg: "flex-start" }}
                                      >
                                        <Stack spacing={0.2} sx={{ minWidth: 0 }}>
                                          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
                                            <Typography
                                              variant="caption"
                                              sx={{
                                                textTransform: "uppercase",
                                                fontWeight: 800,
                                                letterSpacing: 0.45,
                                                color: "#475569",
                                              }}
                                            >
                                              indirect
                                            </Typography>
                                            {likelyEdit ? (
                                              <Typography variant="caption" sx={{ fontWeight: 700, color: "#92400e" }}>
                                                Likely edit needed
                                              </Typography>
                                            ) : null}
                                          </Stack>
                                          <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                                            {item.requirement.requirement_code}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                                            {item.requirement.title}
                                          </Typography>
                                        </Stack>
                                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                          <Button
                                            size="small"
                                            variant="text"
                                            onClick={() =>
                                              navigate(
                                                routePaths.projectRequirementDetail(projectId, item.requirement.id)
                                              )
                                            }
                                          >
                                            View
                                          </Button>
                                          <Button
                                            size="small"
                                            variant="text"
                                            onClick={() =>
                                              navigate(getTraceabilityMatrixFocusPath(projectId, item.requirement.id))
                                            }
                                          >
                                            Matrix
                                          </Button>
                                          <Button
                                            size="small"
                                            variant="outlined"
                                            onClick={() => {
                                              if (!graph.nodes.some((node) => node.id === item.requirement.id)) {
                                                setChangeImpactError(
                                                  `${item.requirement.requirement_code} is hidden by the current graph filters. Open it in the matrix or clear filters before highlighting it in the graph.`
                                                );
                                                return;
                                              }
                                              setChangeImpactError(null);
                                              setActiveNodeId(item.requirement.id);
                                              setExplorationMode("impact");
                                            }}
                                          >
                                            Graph
                                          </Button>
                                        </Stack>
                                      </Stack>
                                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                                        Why flagged: {item.reason}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: "#0f172a", lineHeight: 1.45 }}>
                                        Recommended fix: {item.recommended_fix_action}
                                      </Typography>
                                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                                        <Typography variant="caption" color="text.secondary">
                                          Warnings: {item.warning_count}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Conflicts: {item.conflict_count}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          Design parameters: {item.linked_design_parameter_count}
                                        </Typography>
                                        {item.matched_tokens.length > 0 ? (
                                          <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                                            Matched tokens: {item.matched_tokens.join(", ")}
                                          </Typography>
                                        ) : null}
                                      </Stack>
                                    </Stack>
                                  </Paper>
                                );
                              })}
                            </Stack>
                          </Stack>
                        </Paper>

                        {changeImpactReview.affected_design_parameters.length > 0 ? (
                          <Paper
                            elevation={0}
                            sx={{
                              px: 1.25,
                              py: 1,
                              borderRadius: 1.5,
                              border: "1px solid rgba(15,23,42,0.08)",
                              bgcolor: "#ffffff",
                            }}
                          >
                            <Stack spacing={0.75}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                                Affected Design Parameters
                              </Typography>
                              {changeImpactReview.affected_design_parameters.map((parameter) => (
                                <Box
                                  key={parameter.id}
                                  sx={{
                                    px: 1,
                                    py: 0.8,
                                    borderRadius: 1.25,
                                    border: "1px solid rgba(15,23,42,0.06)",
                                    bgcolor: "#f8fafc",
                                  }}
                                >
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                                    {parameter.name}
                                    {parameter.value ? ` • ${parameter.value}` : ""}
                                    {parameter.unit ? ` ${parameter.unit}` : ""}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.45 }}>
                                    {parameter.reason}
                                  </Typography>
                                </Box>
                              ))}
                            </Stack>
                          </Paper>
                        ) : null}

                        {changeImpactReview.warnings.length > 0 || changeImpactReview.recommended_actions.length > 0 ? (
                          <Paper
                            elevation={0}
                            sx={{
                              px: 1.25,
                              py: 1,
                              borderRadius: 1.5,
                              border: "1px solid rgba(15,23,42,0.08)",
                              bgcolor: "#ffffff",
                            }}
                          >
                            <Stack spacing={0.85}>
                              {changeImpactReview.recommended_actions.length > 0 ? (
                                <Stack spacing={0.35}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                                    Recommended Fix Actions
                                  </Typography>
                                  {changeImpactReview.recommended_actions.map((action) => (
                                    <Paper
                                      key={action}
                                      elevation={0}
                                      sx={{
                                        px: 1,
                                        py: 0.75,
                                        borderRadius: 1.25,
                                        border: "1px solid rgba(15,23,42,0.06)",
                                        bgcolor: "#f8fafc",
                                      }}
                                    >
                                      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                                        {action}
                                      </Typography>
                                    </Paper>
                                  ))}
                                </Stack>
                              ) : null}
                              {changeImpactReview.warnings.length > 0 ? (
                                <Stack spacing={0.35}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#7f1d1d" }}>
                                    Warnings / Conflicts
                                  </Typography>
                                  {changeImpactReview.warnings.map((warning) => (
                                    <Paper
                                      key={warning}
                                      elevation={0}
                                      sx={{
                                        px: 1,
                                        py: 0.75,
                                        borderRadius: 1.25,
                                        border: "1px solid rgba(248,113,113,0.22)",
                                        bgcolor: "rgba(254,242,242,0.92)",
                                      }}
                                    >
                                      <Typography variant="caption" sx={{ lineHeight: 1.45, color: "#991b1b" }}>
                                        {warning}
                                      </Typography>
                                    </Paper>
                                  ))}
                                </Stack>
                              ) : null}
                            </Stack>
                          </Paper>
                        ) : null}
                      </Stack>
                    ) : null}
                  </Stack>
                </Paper>
              ) : null}

                {graph.summary.totalNodes === 0 ? (
                  <WorkspaceStatePanel
                    state="empty"
                    title="No graph nodes match the current filters"
                    message="Adjust subsystem, type, or provenance filters to bring requirements back into view."
                  />
                ) : (
                  <Stack spacing={1.25} sx={{ flex: changeImpactWorkspaceMode ? "0 0 auto" : 1, minHeight: 0, minWidth: 0 }}>
                    {explorationResultRows.length > 0 ? (
                      <Paper
                        elevation={0}
                        sx={{
                          border: standalone ? "1px solid rgba(15,23,42,0.1)" : "1px solid rgba(15,23,42,0.12)",
                          borderRadius: 0,
                          px: 1.5,
                          py: 1.25,
                          bgcolor: "#f8fbff",
                        }}
                      >
                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#0f172a" }}>
                                Impacted Requirements
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {explorationResultRows.length} visible requirement{explorationResultRows.length === 1 ? "" : "s"} in the current exploration result.
                              </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary">
                              This list mirrors the active exploration set so impacted requirements remain readable even when the graph canvas is noisy.
                            </Typography>
                          </Stack>
                          <Stack spacing={0.75}>
                            {explorationResultRows.map((row) => (
                              <Paper
                                key={`${row.relationshipType}-${row.nodeId}`}
                                elevation={0}
                                sx={{
                                  px: 1.25,
                                  py: 0.9,
                                  borderRadius: 1.5,
                                  border:
                                    row.relationshipType === "selected"
                                      ? "2px solid rgba(37,99,235,0.5)"
                                      : row.relationshipType === "direct"
                                        ? "1px solid rgba(37,99,235,0.28)"
                                        : "1px solid rgba(148,163,184,0.28)",
                                  bgcolor:
                                    row.relationshipType === "selected"
                                      ? "rgba(219,234,254,0.82)"
                                      : row.relationshipType === "direct"
                                        ? "rgba(239,246,255,0.96)"
                                        : "#ffffff",
                                }}
                              >
                                <Stack
                                  direction={{ xs: "column", md: "row" }}
                                  spacing={1}
                                  justifyContent="space-between"
                                  alignItems={{ xs: "flex-start", md: "center" }}
                                >
                                  <Stack spacing={0.2} sx={{ minWidth: 0 }}>
                                    <Typography variant="caption" sx={{ textTransform: "uppercase", fontWeight: 800, letterSpacing: 0.45, color: "#475569" }}>
                                      {row.relationshipType}
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#0f172a" }}>
                                      {row.requirementCode}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-word" }}>
                                      {row.title}
                                    </Typography>
                                  </Stack>
                                  <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                                    <Button
                                      size="small"
                                      variant="text"
                                      onClick={() => navigate(routePaths.projectRequirementDetail(projectId, row.nodeId))}
                                    >
                                      View Requirement
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="text"
                                      onClick={() => navigate(getTraceabilityMatrixFocusPath(projectId, row.nodeId))}
                                    >
                                      Open in Matrix
                                    </Button>
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={() => {
                                        setActiveNodeId(row.nodeId);
                                        const graphNode = styledGraph.graph.nodes.find((node) => node.id === row.nodeId);
                                        if (graphNode && reactFlowInstance) {
                                          reactFlowInstance.setCenter(graphNode.position.x + 150, graphNode.position.y + 55, {
                                            zoom: 1.02,
                                            duration: 220,
                                          });
                                        }
                                      }}
                                    >
                                      Highlight in Graph
                                    </Button>
                                  </Stack>
                                </Stack>
                              </Paper>
                            ))}
                          </Stack>
                        </Stack>
                      </Paper>
                    ) : null}
                    <Paper
                      elevation={0}
                      sx={{
                        flex: changeImpactWorkspaceMode ? "0 0 auto" : 1,
                        minHeight: changeImpactWorkspaceMode ? 300 : 0,
                        height: changeImpactWorkspaceMode ? "34vh" : "100%",
                        border: standalone ? "none" : "1px solid rgba(15,23,42,0.12)",
                        borderRadius: 0,
                        overflow: "hidden",
                        display: "flex",
                        minWidth: 0,
                      }}
                    >
                      <Box ref={graphCanvasRef} sx={{ flex: 1, minWidth: 0, minHeight: 0, height: "100%" }}>
                        <ReactFlow
                          nodes={nodes}
                          edges={edges}
                          onNodesChange={onNodesChange}
                          onEdgesChange={onEdgesChange}
                          onInit={setReactFlowInstance}
                          proOptions={{ hideAttribution: true }}
                          onPaneClick={() => setContextMenu(null)}
                          onNodeClick={(_, node) => {
                            setActiveNodeId(node.id);
                            navigate(routePaths.projectRequirementDetail(projectId, node.id));
                          }}
                          onNodeContextMenu={(event, node) => {
                            event.preventDefault();
                            event.stopPropagation();
                            const requirementCode = extractRequirementCodeFromLabel(node.data.label);
                            if (import.meta.env.DEV) {
                              console.debug("[TraceabilityGraph][ContextMenu][open]", {
                                clickedGraphNodeId: node.id,
                                clickedInternalId: node.id,
                                clickedRequirementCode: requirementCode,
                                clickedTitle: node.data.title,
                              });
                            }
                            setContextMenu({
                              nodeId: node.id,
                              requirementCode,
                              title: node.data.title,
                              mouseX: event.clientX + 2,
                              mouseY: event.clientY - 6,
                            });
                          }}
                          >
                            <Panel position="top-left">
                              <AppIconActionButton title="Node labels show the visible requirement ID and title. Dashed borders indicate generated requirements." ariaLabel="Graph legend note">
                                <InfoOutlinedIcon fontSize="small" />
                              </AppIconActionButton>
                            </Panel>
                            <Controls />
                            <Background gap={28} size={1} color="#dbe4ee" />
                          </ReactFlow>
                      </Box>
                    </Paper>
                  </Stack>
                )}

              {showGraphNote && !standalone ? (
                <Alert severity="info" icon={<WarningAmberOutlinedIcon />}>
                  Node colors come from current validation outputs: red for conflict findings, yellow for warning-heavy requirements, and green for acceptable requirements. Click any node to open its requirement detail view.
                </Alert>
              ) : null}

              {integrityDiagnosticsEnabled ? (
                <Paper
                  elevation={0}
                  sx={{
                    position: "fixed",
                    right: 18,
                    bottom: 18,
                    width: 360,
                    maxWidth: "calc(100vw - 32px)",
                    maxHeight: "42vh",
                    overflowY: "auto",
                    zIndex: 40,
                    border: "1px solid rgba(15,23,42,0.14)",
                    boxShadow: "0 18px 42px rgba(15,23,42,0.14)",
                    borderRadius: 2,
                    bgcolor: "rgba(255,255,255,0.96)",
                    backdropFilter: "blur(10px)",
                    p: 1.25,
                  }}
                >
                  <Typography variant="caption" sx={{ display: "block", fontWeight: 800, color: "#0f172a", mb: 0.6 }}>
                    Graph Integrity Debug
                  </Typography>
                  {styledGraph.integrity ? (
                    <>
                      <Typography variant="caption" sx={{ display: "block", fontSize: "0.7rem", color: "#475569", lineHeight: 1.45 }}>
                        Semantic active requirements: {styledGraph.integrity.semanticActiveRequirementCodes.join(", ") || "None"}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", fontSize: "0.7rem", color: "#475569", lineHeight: 1.45, mt: 0.35 }}>
                        Filtered graph requirements: {styledGraph.integrity.filteredGraphRequirementCodes.join(", ") || "None"}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", fontSize: "0.7rem", color: "#475569", lineHeight: 1.45, mt: 0.35 }}>
                        Exploration forced-in node ids: {styledGraph.integrity.explorationForcedInNodeIds.join(", ") || "None"}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", fontSize: "0.7rem", color: "#475569", lineHeight: 1.45, mt: 0.35 }}>
                        Final rendered node ids: {styledGraph.integrity.finalRenderedNodeIds.join(", ") || "None"}
                      </Typography>
                      <Typography variant="caption" sx={{ display: "block", fontSize: "0.7rem", color: "#475569", lineHeight: 1.45, mt: 0.35 }}>
                        Final visible active node ids: {styledGraph.integrity.finalVisibleActiveNodeIds.join(", ") || "None"}
                      </Typography>
                      <Divider sx={{ my: 0.9 }} />
                      <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "#0f172a", mb: 0.35 }}>
                        Proof Rows
                      </Typography>
                        <Stack spacing={0.45}>
                          {styledGraph.integrity.nodeProofRows.length > 0 ? (
                            styledGraph.integrity.nodeProofRows.map((row) => (
                              <Typography
                                key={row}
                              variant="caption"
                              sx={{
                                display: "block",
                                fontSize: "0.68rem",
                                lineHeight: 1.4,
                                color: row.includes("visible active") ? "#334155" : "#b91c1c",
                                wordBreak: "break-word",
                              }}
                            >
                              {row}
                            </Typography>
                          ))
                          ) : (
                            <Typography variant="caption" sx={{ display: "block", fontSize: "0.68rem", color: "#64748b" }}>
                              No active proof rows.
                            </Typography>
                          )}
                        </Stack>
                        <Divider sx={{ my: 0.9 }} />
                        <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "#0f172a", mb: 0.35 }}>
                          Render Rows
                        </Typography>
                        <Stack spacing={0.45}>
                          {debugIntegrity?.renderNodeProofRows.length ? (
                            debugIntegrity.renderNodeProofRows.map((row) => (
                              <Typography
                                key={row}
                                variant="caption"
                                sx={{
                                  display: "block",
                                  fontSize: "0.68rem",
                                  lineHeight: 1.4,
                                  color: row.includes("body=yes") ? "#334155" : "#b91c1c",
                                  wordBreak: "break-word",
                                }}
                              >
                                {row}
                              </Typography>
                            ))
                          ) : (
                            <Typography variant="caption" sx={{ display: "block", fontSize: "0.68rem", color: "#64748b" }}>
                              No render proof rows yet.
                            </Typography>
                          )}
                        </Stack>
                        <Divider sx={{ my: 0.9 }} />
                        <Typography variant="caption" sx={{ display: "block", fontWeight: 700, color: "#0f172a", mb: 0.35 }}>
                          Overlap Rows
                        </Typography>
                        <Stack spacing={0.45}>
                          {debugIntegrity?.overlapProofRows.length ? (
                            debugIntegrity.overlapProofRows.map((row) => (
                              <Typography
                                key={row}
                                variant="caption"
                                sx={{
                                  display: "block",
                                  fontSize: "0.68rem",
                                  lineHeight: 1.4,
                                  color: row.includes("overlap=yes") ? "#b91c1c" : "#334155",
                                  wordBreak: "break-word",
                                }}
                              >
                                {row}
                              </Typography>
                            ))
                          ) : (
                            <Typography variant="caption" sx={{ display: "block", fontSize: "0.68rem", color: "#64748b" }}>
                              No overlap proof rows yet.
                            </Typography>
                          )}
                        </Stack>
                      </>
                    ) : (
                    <Typography variant="caption" sx={{ display: "block", fontSize: "0.7rem", color: "#64748b", lineHeight: 1.45 }}>
                      Waiting for an exploration selection. Right-click a node and choose an exploration mode.
                    </Typography>
                  )}
                </Paper>
              ) : null}
            </>
          ) : null}
        </Stack>
      </Paper>

      <Menu
        open={Boolean(contextMenu)}
        onClose={() => setContextMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined
        }
        slotProps={{
          paper: {
            sx: {
              minWidth: 210,
              borderRadius: 1.75,
              border: "1px solid rgba(226,232,240,0.92)",
              boxShadow: "0 14px 32px rgba(15,23,42,0.12)",
            },
          },
        }}
        >
          <MenuItem onClick={() => dispatchContextMenuAction("view-requirement")}>
            View Requirement
          </MenuItem>
          <MenuItem onClick={() => dispatchContextMenuAction("open-in-matrix")}>
            Open in Matrix
          </MenuItem>
          <MenuItem onClick={() => dispatchContextMenuAction("show-row-in-matrix")}>
            Show Row in Matrix
          </MenuItem>
          <MenuItem onClick={() => dispatchContextMenuAction("show-parents")}>
            Show Parents
          </MenuItem>
          <MenuItem onClick={() => dispatchContextMenuAction("show-children")}>
            Show Children
          </MenuItem>
          <MenuItem onClick={() => dispatchContextMenuAction("show-dependents")}>
            Show Dependents
          </MenuItem>
          <MenuItem onClick={() => dispatchContextMenuAction("analyze-impact")}>
            Analyze Impact
          </MenuItem>
          <MenuItem onClick={() => dispatchContextMenuAction("show-upstream-impact")}>
            Show Upstream Impact
          </MenuItem>
          <MenuItem onClick={() => dispatchContextMenuAction("show-downstream-impact")}>
            Show Downstream Impact
          </MenuItem>
          <MenuItem onClick={() => dispatchContextMenuAction("highlight-upstream")}>
            Highlight Upstream
          </MenuItem>
          <MenuItem onClick={() => dispatchContextMenuAction("highlight-downstream")}>
            Highlight Downstream
          </MenuItem>
          <MenuItem onClick={() => dispatchContextMenuAction("focus-this-requirement")}>
            Focus This Requirement
          </MenuItem>
          {integrityDiagnosticsEnabled && contextMenu ? (
            <>
              <Divider />
              <Box sx={{ px: 1.5, py: 0.9 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>
                  Context: {contextMenu.requirementCode}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.72rem" }}>
                  ID: {contextMenu.nodeId}
                </Typography>
              </Box>
            </>
          ) : null}
        </Menu>
    </Box>
  );

  if (standalone) {
    return (
      <Box
        sx={{
          height: "100vh",
          bgcolor: "#edf2f8",
        }}
      >
        {graphBody}
      </Box>
    );
  }

  return (
    <ProjectWorkspaceShell
      projectId={projectId}
      activeNavKey="graph"
      rightPanel={<RequirementsContextPanel title="Graph Summary" items={contextItems} />}
    >
      {graphBody}
    </ProjectWorkspaceShell>
  );
}
