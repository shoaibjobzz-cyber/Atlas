import type { Requirement } from "../types/requirements";

type RequirementIdentityLike = Pick<Requirement, "hierarchy" | "id" | "requirement_code">;
type HierarchySegment = string | number;

export function getRequirementDisplayId(requirement: Pick<Requirement, "id" | "requirement_code">): string {
  return requirement.requirement_code || requirement.id;
}

export function getRequirementHierarchy(requirement: RequirementIdentityLike): string {
  return requirement.hierarchy || getRequirementDisplayId(requirement);
}

export function getHierarchyDepth(requirement: RequirementIdentityLike): number {
  return Math.max(0, getRequirementHierarchy(requirement).split(".").length - 1);
}

function hierarchySegments(requirement: RequirementIdentityLike): HierarchySegment[] {
  const hierarchy = getRequirementHierarchy(requirement);
  const [root, ...rest] = hierarchy.split(".");
  const segments: HierarchySegment[] = [root];
  for (const segment of rest) {
    segments.push(Number.isNaN(Number(segment)) ? segment : Number(segment));
  }
  return segments;
}

export function compareRequirementsByHierarchy(
  left: Pick<Requirement, "hierarchy" | "id" | "requirement_code" | "title">,
  right: Pick<Requirement, "hierarchy" | "id" | "requirement_code" | "title">
): number {
  const leftSegments = hierarchySegments(left);
  const rightSegments = hierarchySegments(right);
  const maxLength = Math.max(leftSegments.length, rightSegments.length);

  for (let index = 0; index < maxLength; index += 1) {
    const leftSegment = leftSegments[index];
    const rightSegment = rightSegments[index];
    if (leftSegment === undefined) {
      return -1;
    }
    if (rightSegment === undefined) {
      return 1;
    }
    if (leftSegment === rightSegment) {
      continue;
    }
    if (typeof leftSegment === "number" && typeof rightSegment === "number") {
      return leftSegment - rightSegment;
    }
    return String(leftSegment).localeCompare(String(rightSegment));
  }

  return left.title.localeCompare(right.title);
}
