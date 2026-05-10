import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RequirementHealthChip from "./RequirementHealthChip";


describe("RequirementHealthChip", () => {
  it("renders a healthy chip for approved requirements", () => {
    render(<RequirementHealthChip requirement={{ status: "Approved", priority: "High" }} />);

    expect(screen.getByText("Healthy")).toBeInTheDocument();
  });

  it("renders needs attention for critical draft requirements", () => {
    render(<RequirementHealthChip requirement={{ status: "Draft", priority: "Critical" }} />);

    expect(screen.getByText("Needs Attention")).toBeInTheDocument();
  });
});
