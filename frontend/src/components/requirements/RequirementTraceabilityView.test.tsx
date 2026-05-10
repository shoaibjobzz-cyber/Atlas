import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import RequirementTraceabilityView from "./RequirementTraceabilityView";


describe("RequirementTraceabilityView", () => {
  it("renders consolidated validation information", () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    render(
      <RequirementTraceabilityView
        requirement={{
          id: "REQ-1",
          requirement_code: "REQ-1",
          hierarchy: "REQ-1",
          project_id: "demo-project",
          title: "Brake pressure minimum",
          text: "Brake pressure shall be at least 6 bar in normal mode.",
          type: "System",
          priority: "High",
          status: "Approved",
          parent_requirement_id: null,
          subsystem: "Hydraulics",
          verification_method: "Test",
          rationale: null,
          assumptions: null,
          generation_metadata: {
            generation_source: "manual",
            generation_provider: null,
            generated_from_requirement_id: null,
            is_generated_draft: false,
          },
          parsed_requirement: {
            actor: "Brake pressure",
            action: null,
            object: null,
            parameter: "brake pressure",
            operator: "at least",
            value: "6",
            unit: "bar",
            timing: null,
            condition: null,
            scope: "Brake pressure",
          },
          created_by_user_id: "user-demo",
          updated_by_user_id: null,
          deleted_by_user_id: null,
          created_by_username: "demo",
          updated_by_username: null,
          deleted_by_username: null,
          created_at: "2026-04-01T10:00:00Z",
          updated_at: "2026-04-01T10:00:00Z",
          deleted_at: null,
          is_deleted: false,
        }}
        qualitySummary={{
          score: 90,
          warnings: [
            {
              severity: "low",
              rule_id: "missing_condition_or_mode",
              title: "Likely missing condition or mode",
              explanation: "The statement suggests behavior that often depends on a mode.",
              suggestion: "Specify the mode explicitly.",
            },
          ],
          issues: [],
          suggested_rewrite: null,
          explanation: null,
        }}
        qualityError={null}
        correlations={{
          related_requirements: [{ requirement: { id: "req_internal_2", requirement_code: "REQ-2", title: "Pressure capability", type: "System", status: "Draft" }, reason: "Both requirements reference the same parameter: pressure." }],
          potential_conflicts: [],
        }}
        correlationError={null}
        linkedDesignParameters={[
          {
            id: "DP-1",
            name: "Brake pressure capability",
            subsystem: "Hydraulics",
            parameter_name: "brake_pressure_capability",
            value: "8",
            unit: "bar",
            source_document: "Capability Sheet",
            revision: "A",
          },
        ]}
        linkedDesignParametersError={null}
        feasibility={{
          assessment_status: "feasible",
          explanation: "Available capability is 8 bar compared against the required minimum of 6 bar.",
          evidence_used: [{ source: "linked_design_parameter", detail: "Best available linked capability: brake_pressure_capability = 8 bar" }],
          assumptions: [],
          confidence: 0.86,
          computed_values: { available_value: 8, required_value: 6, unit: "bar" },
        }}
        feasibilityError={null}
      />
    );

    expect(screen.getByText("Validation Traceability")).toBeInTheDocument();
    expect(screen.getByText("Structured Parsed Output")).toBeInTheDocument();
    expect(screen.getByText("Quality Warnings")).toBeInTheDocument();
    expect(screen.getByText(/Brake pressure shall be at least 6 bar in normal mode./)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /copy summary/i }));
    expect(writeText).toHaveBeenCalled();
  });
});
