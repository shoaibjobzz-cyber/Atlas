import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RequirementFeasibilityCard from "./RequirementFeasibilityCard";


describe("RequirementFeasibilityCard", () => {
  it("renders computed values and evidence", () => {
    render(
      <RequirementFeasibilityCard
        error={null}
        assessment={{
          assessment_status: "likely_infeasible",
          explanation: "Computed timing budget is 24 ms against a required maximum of 10 ms.",
          evidence_used: [{ source: "linked_design_parameter", detail: "controller_delay contributes 4.00 ms." }],
          assumptions: ["Timing contributors are treated as serial contributors and summed directly."],
          confidence: 0.92,
          computed_values: {
            total_time: 24,
            required_time: 10,
            parameters_used: ["valve_response_time", "controller_delay"],
          },
        }}
      />
    );

    expect(screen.getByText(/likely infeasible/i)).toBeInTheDocument();
    expect(screen.getByText(/total_time: 24/i)).toBeInTheDocument();
    expect(screen.getByText(/linked_design_parameter: controller_delay contributes 4.00 ms./i)).toBeInTheDocument();
  });
});
