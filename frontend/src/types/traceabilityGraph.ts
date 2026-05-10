import type { RequirementType } from "./requirements";

export type GraphNodeHealth = "conflict" | "warning" | "acceptable";
export type GraphProvenanceFilter = "all" | "generated" | "manual";
export type TraceabilityEdgeKind = "parent-child" | "related" | "conflict";

export type TraceabilityGraphNodeData = {
  label: string;
  title: string;
  subsystem: string | null;
  requirementType: RequirementType;
  provenance: string;
  feasibilityStatus: string | null;
  health: GraphNodeHealth;
  warningCount: number;
  conflictCount: number;
  isGenerated: boolean;
};

export type TraceabilityGraphFilterState = {
  subsystem: string;
  type: RequirementType | "all";
  provenance: GraphProvenanceFilter;
};

export type TraceabilityGraphEdgeData = {
  kind: TraceabilityEdgeKind;
  reason: string;
};

export type TraceabilityGraphSummary = {
  totalNodes: number;
  totalEdges: number;
  conflictNodes: number;
  generatedNodes: number;
};
