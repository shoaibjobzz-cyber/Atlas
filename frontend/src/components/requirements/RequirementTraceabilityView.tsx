import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AppCompactActionButton from "../common/AppCompactActionButton";
import type { LinkedDesignParameterReference } from "../../types/designParameters";
import type {
  Requirement,
  RequirementCorrelationSummary,
  RequirementFeasibilityAssessment,
  RequirementQualitySummary,
} from "../../types/requirements";

type RequirementTraceabilityViewProps = {
  requirement: Requirement;
  qualitySummary: RequirementQualitySummary | null;
  qualityError: string | null;
  correlations: RequirementCorrelationSummary;
  correlationError: string | null;
  linkedDesignParameters: LinkedDesignParameterReference[];
  linkedDesignParametersError: string | null;
  feasibility: RequirementFeasibilityAssessment | null;
  feasibilityError: string | null;
};

function formatStructuredValue(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : "Not extracted";
}

function formatComputedValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "None";
  }
  if (typeof value === "number") {
    return Number.isInteger(value) ? `${value}` : value.toFixed(2);
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (value === null || value === undefined || value === "") {
    return "Not available";
  }
  return String(value);
}

function buildTraceabilitySummary(props: RequirementTraceabilityViewProps) {
  const { requirement, qualitySummary, correlations, linkedDesignParameters, feasibility } = props;
  const lines: string[] = [];

  lines.push("Requirement Traceability Summary");
  lines.push(`Requirement ID: ${requirement.requirement_code}`);
  lines.push(`Title: ${requirement.title}`);
  lines.push(`Text: ${requirement.text}`);
  lines.push("");

  lines.push("Structured Output:");
  Object.entries(requirement.parsed_requirement ?? {}).forEach(([key, value]) => {
    lines.push(`- ${key}: ${formatStructuredValue(value)}`);
  });
  lines.push("");

  lines.push(`Quality Score: ${qualitySummary?.score ?? "Unavailable"}`);
  if (qualitySummary?.warnings.length) {
    lines.push("Quality Warnings:");
    qualitySummary.warnings.forEach((warning) => {
      lines.push(`- [${warning.severity}] ${warning.title}: ${warning.explanation}`);
      lines.push(`  Suggestion: ${warning.suggestion}`);
    });
  } else {
    lines.push("Quality Warnings: None");
  }
  lines.push("");

  lines.push("Related Requirements:");
  if (correlations.related_requirements.length) {
    correlations.related_requirements.forEach((item) => {
      lines.push(`- ${item.requirement?.id ?? "Current requirement"}: ${item.reason}`);
    });
  } else {
    lines.push("- None");
  }
  lines.push("");

  lines.push("Potential Conflicts:");
  if (correlations.potential_conflicts.length) {
    correlations.potential_conflicts.forEach((item) => {
      lines.push(`- ${item.requirement?.id ?? "Current requirement"}: ${item.reason}`);
    });
  } else {
    lines.push("- None");
  }
  lines.push("");

  lines.push("Linked Design Parameters:");
  if (linkedDesignParameters.length) {
    linkedDesignParameters.forEach((item) => {
      lines.push(
        `- ${item.id} | ${item.name} | ${item.parameter_name}=${item.value} ${item.unit ?? ""}`.trim()
      );
    });
  } else {
    lines.push("- None");
  }
  lines.push("");

  lines.push("Feasibility:");
  if (feasibility) {
    lines.push(`- Status: ${feasibility.assessment_status}`);
    lines.push(`- Explanation: ${feasibility.explanation}`);
    if (Object.keys(feasibility.computed_values).length) {
      lines.push("- Computed Values:");
      Object.entries(feasibility.computed_values).forEach(([key, value]) => {
        lines.push(`  - ${key}: ${formatComputedValue(value)}`);
      });
    }
    if (feasibility.evidence_used.length) {
      lines.push("- Evidence:");
      feasibility.evidence_used.forEach((item) => {
        lines.push(`  - ${item.source}: ${item.detail}`);
      });
    }
  } else {
    lines.push("- Unavailable");
  }

  return lines.join("\n");
}

function SectionHeading({
  title,
  countLabel,
}: {
  title: string;
  countLabel?: string;
}) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap">
      <Typography variant="subtitle1" fontWeight={700}>
        {title}
      </Typography>
      {countLabel ? <Chip size="small" variant="outlined" label={countLabel} /> : null}
    </Stack>
  );
}

export default function RequirementTraceabilityView(props: RequirementTraceabilityViewProps) {
  const summaryText = buildTraceabilitySummary(props);

  async function handleCopy() {
    await navigator.clipboard.writeText(summaryText);
  }

  function handleExport() {
    const blob = new Blob([summaryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${props.requirement.requirement_code}-traceability-summary.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const feasibilityEvidenceChain = [
    ...(props.feasibility?.evidence_used ?? []).map((item) => ({
      label: `${item.source}: ${item.detail}`,
      tone: "info" as const,
    })),
    ...props.correlations.potential_conflicts.map((item) => ({
      label: `${item.requirement?.id ?? "Current requirement"}: ${item.reason}`,
      tone: "warning" as const,
    })),
    ...(props.qualitySummary?.warnings ?? []).map((warning) => ({
      label: `${warning.rule_id}: ${warning.explanation}`,
      tone: "warning" as const,
    })),
  ];

  return (
    <Paper elevation={0} sx={{ p: 3, border: "1px solid rgba(15,23,42,0.12)", bgcolor: "#fff" }}>
      <Stack spacing={2.5}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ md: "center" }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700} color="#0f172a">
              Validation Traceability
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              Review all deterministic validation outputs, linked evidence, and engineering context for this requirement in one place.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <AppCompactActionButton startIcon={<ContentCopyOutlinedIcon />} onClick={handleCopy}>
              Copy Summary
            </AppCompactActionButton>
            <AppCompactActionButton startIcon={<DownloadOutlinedIcon />} onClick={handleExport}>
              Export Summary
            </AppCompactActionButton>
          </Stack>
        </Stack>

        <Accordion defaultExpanded disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
            <SectionHeading title="Requirement" />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.5}>
              <Typography variant="body2" color="text.secondary">
                Text
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {props.requirement.text}
              </Typography>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
            <SectionHeading title="Structured Parsed Output" />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {Object.entries(props.requirement.parsed_requirement ?? {}).map(([key, value]) => (
                <Stack key={key} direction={{ xs: "column", md: "row" }} spacing={1.5}>
                  <Typography minWidth={160} variant="body2" color="text.secondary">
                    {key}
                  </Typography>
                  <Typography variant="body2">{formatStructuredValue(value)}</Typography>
                </Stack>
              ))}
              {!props.requirement.parsed_requirement ? (
                <Typography variant="body2" color="text.secondary">
                  No structured fields are available for this requirement yet.
                </Typography>
              ) : null}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
            <SectionHeading
              title="Quality Warnings"
              countLabel={
                props.qualitySummary ? `${props.qualitySummary.warnings.length} warnings | score ${props.qualitySummary.score}` : undefined
              }
            />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.25}>
              {props.qualityError ? <Alert severity="error">{props.qualityError}</Alert> : null}
              {!props.qualityError && props.qualitySummary?.warnings.length === 0 ? (
                <Alert severity="success">No deterministic quality warnings were raised for this requirement.</Alert>
              ) : null}
              {props.qualitySummary?.warnings.map((warning) => (
                <Paper key={warning.rule_id} elevation={0} sx={{ p: 1.5, border: "1px solid rgba(15,23,42,0.08)" }}>
                  <Stack spacing={0.5}>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                      <Chip label={warning.severity} size="small" color={warning.severity === "high" ? "error" : warning.severity === "medium" ? "warning" : "default"} />
                      <Typography variant="subtitle2" fontWeight={700}>
                        {warning.title}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      {warning.explanation}
                    </Typography>
                    <Typography variant="body2">
                      Suggestion: {warning.suggestion}
                    </Typography>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
            <SectionHeading
              title="Related Requirements and Conflicts"
              countLabel={`${props.correlations.related_requirements.length} related | ${props.correlations.potential_conflicts.length} conflicts`}
            />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              {props.correlationError ? <Alert severity="error">{props.correlationError}</Alert> : null}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Related Requirements
                </Typography>
                <Stack spacing={1}>
                  {props.correlations.related_requirements.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No related requirements were identified.
                    </Typography>
                  ) : (
                    props.correlations.related_requirements.map((item, index) => (
                      <Paper key={`${item.requirement?.id ?? "current"}-${index}`} elevation={0} sx={{ p: 1.5, border: "1px solid rgba(15,23,42,0.08)" }}>
                        <Typography variant="body2" fontWeight={600}>
                          {item.requirement?.id ?? "Current requirement"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.reason}
                        </Typography>
                      </Paper>
                    ))
                  )}
                </Stack>
              </Box>
              <Divider />
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  Potential Conflicts
                </Typography>
                <Stack spacing={1}>
                  {props.correlations.potential_conflicts.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No conflict warnings were produced.
                    </Typography>
                  ) : (
                    props.correlations.potential_conflicts.map((item, index) => (
                      <Paper key={`${item.requirement?.id ?? "current"}-conflict-${index}`} elevation={0} sx={{ p: 1.5, border: "1px solid rgba(185,28,28,0.15)", bgcolor: "#fff7f7" }}>
                        <Typography variant="body2" fontWeight={600} color="#7f1d1d">
                          {item.requirement?.id ?? "Current requirement"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.reason}
                        </Typography>
                      </Paper>
                    ))
                  )}
                </Stack>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
            <SectionHeading title="Linked Design Parameters" countLabel={`${props.linkedDesignParameters.length} linked`} />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.25}>
              {props.linkedDesignParametersError ? <Alert severity="error">{props.linkedDesignParametersError}</Alert> : null}
              {!props.linkedDesignParametersError && props.linkedDesignParameters.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No linked design parameters are available for this requirement.
                </Typography>
              ) : (
                props.linkedDesignParameters.map((parameter) => (
                  <Paper key={parameter.id} elevation={0} sx={{ p: 1.5, border: "1px solid rgba(15,23,42,0.08)" }}>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {parameter.id} · {parameter.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {parameter.parameter_name} = {parameter.value} {parameter.unit ?? ""}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Subsystem: {parameter.subsystem ?? "Unassigned"} | Source: {parameter.source_document ?? "Not specified"} | Revision: {parameter.revision ?? "N/A"}
                      </Typography>
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
            <SectionHeading title="Feasibility Result" countLabel={props.feasibility?.assessment_status.replace("_", " ") ?? "Unavailable"} />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1.25}>
              {props.feasibilityError ? <Alert severity="error">{props.feasibilityError}</Alert> : null}
              {!props.feasibilityError && !props.feasibility ? (
                <Typography variant="body2" color="text.secondary">
                  No feasibility result is available yet.
                </Typography>
              ) : null}
              {props.feasibility ? (
                <>
                  <Typography variant="body2">{props.feasibility.explanation}</Typography>
                  {Object.keys(props.feasibility.computed_values).length > 0 ? (
                    <Paper elevation={0} sx={{ p: 1.5, border: "1px solid rgba(15,23,42,0.08)" }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Computed Values
                      </Typography>
                      <Stack spacing={0.75}>
                        {Object.entries(props.feasibility.computed_values).map(([key, value]) => (
                          <Typography key={key} variant="body2" color="text.secondary">
                            {key}: {formatComputedValue(value)}
                          </Typography>
                        ))}
                      </Stack>
                    </Paper>
                  ) : null}
                </>
              ) : null}
            </Stack>
          </AccordionDetails>
        </Accordion>

        <Accordion disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
            <SectionHeading title="Evidence Chain" countLabel={`${feasibilityEvidenceChain.length} items`} />
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={1}>
              {feasibilityEvidenceChain.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No evidence chain items are available yet.
                </Typography>
              ) : (
                feasibilityEvidenceChain.map((item, index) => (
                  <Paper
                    key={`${item.tone}-${index}`}
                    elevation={0}
                    sx={{
                      p: 1.25,
                      border: "1px solid rgba(15,23,42,0.08)",
                      bgcolor: item.tone === "warning" ? "#fffaf0" : "#f8fafc",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Paper>
                ))
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Stack>
    </Paper>
  );
}
