import type { ValidationRequirementResult } from "../types/validation";

function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function buildProjectReport(results: ValidationRequirementResult[], projectId: string) {
  const totalRequirements = results.length;
  const totalWarnings = results.reduce((sum, item) => sum + (item.qualitySummary?.warnings.length ?? 0), 0);
  const conflictCount = results.reduce(
    (sum, item) => sum + (item.correlationSummary?.potential_conflicts.length ?? 0),
    0
  );
  const relatedCount = results.reduce(
    (sum, item) => sum + (item.correlationSummary?.related_requirements.length ?? 0),
    0
  );
  const feasibleCount = results.filter((item) => item.feasibility?.assessment_status === "feasible").length;
  const insufficientDataCount = results.filter(
    (item) => item.feasibility?.assessment_status === "insufficient_data"
  ).length;
  const likelyInfeasibleCount = results.filter(
    (item) => item.feasibility?.assessment_status === "likely_infeasible"
  ).length;
  const warningFeasibilityCount = results.filter(
    (item) => item.feasibility?.assessment_status === "warning"
  ).length;
  const avgParsingCoverage =
    totalRequirements > 0
      ? results.reduce((sum, item) => sum + item.parsedCoverageCount / item.parsedCoverageTotal, 0) /
        totalRequirements
      : 0;
  const linkedEvidenceCount = results.reduce(
    (sum, item) => sum + (item.feasibility?.evidence_used.length ?? 0),
    0
  );

  const reportLines: string[] = [];
  reportLines.push(`# Project Report: ${projectId}`);
  reportLines.push("");
  reportLines.push("## Requirements Overview");
  reportLines.push(`- Requirements assessed: ${totalRequirements}`);
  reportLines.push("");
  reportLines.push("## Quality Warning Summary");
  reportLines.push(`- Total quality warnings: ${totalWarnings}`);
  reportLines.push(
    ...results
      .filter((item) => (item.qualitySummary?.warnings.length ?? 0) > 0)
      .map(
        (item) =>
          `- ${item.requirement.requirement_code}: ${(item.qualitySummary?.warnings ?? []).length} warnings`
      )
  );
  reportLines.push("");
  reportLines.push("## Parsing Summary");
  reportLines.push(`- Average parsing coverage: ${formatPercent(avgParsingCoverage * 100)}`);
  reportLines.push(
    ...results
      .filter((item) => item.parsedMissingFields.length > 0)
      .map(
        (item) =>
          `- ${item.requirement.requirement_code}: missing ${item.parsedMissingFields.join(", ")}`
      )
  );
  reportLines.push("");
  reportLines.push("## Conflict and Correlation Summary");
  reportLines.push(`- Potential conflicts: ${conflictCount}`);
  reportLines.push(`- Related requirement links: ${relatedCount}`);
  reportLines.push(
    ...results
      .filter((item) => (item.correlationSummary?.potential_conflicts.length ?? 0) > 0)
      .map(
        (item) =>
          `- ${item.requirement.requirement_code}: ${(item.correlationSummary?.potential_conflicts ?? []).length} potential conflicts`
      )
  );
  reportLines.push("");
  reportLines.push("## Feasibility Summary");
  reportLines.push(`- Feasible: ${feasibleCount}`);
  reportLines.push(`- Likely infeasible: ${likelyInfeasibleCount}`);
  reportLines.push(`- Warning: ${warningFeasibilityCount}`);
  reportLines.push(`- Insufficient data: ${insufficientDataCount}`);
  reportLines.push("");
  reportLines.push("## Traceability and Evidence Summary");
  reportLines.push(`- Feasibility evidence items: ${linkedEvidenceCount}`);
  reportLines.push(
    ...results
      .filter((item) => (item.feasibility?.evidence_used.length ?? 0) > 0)
      .map(
        (item) =>
          `- ${item.requirement.requirement_code}: ${(item.feasibility?.evidence_used.length ?? 0)} evidence items`
      )
  );
  reportLines.push("");

  return {
    totalRequirements,
    totalWarnings,
    conflictCount,
    relatedCount,
    feasibleCount,
    insufficientDataCount,
    likelyInfeasibleCount,
    warningFeasibilityCount,
    avgParsingCoverage,
    linkedEvidenceCount,
    markdown: reportLines.join("\n"),
  };
}

export function downloadReport(markdown: string, projectId: string) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${projectId}-report.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
