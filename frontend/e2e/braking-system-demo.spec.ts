import { expect, test } from "@playwright/test";

const projectId = "braking-system";

async function loadBrakingDemo(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Load Demo Project" }).last().click();
  await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/dashboard$`));
  await expect(page.getByRole("heading", { name: "Braking System Controls" })).toBeVisible();
}

test.describe("braking-system demo smoke flow", () => {
  test.beforeEach(async ({ context, page }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: "http://127.0.0.1:3000",
    });
    await loadBrakingDemo(page);
  });

  test("covers weak requirement review, conflict visibility, timing feasibility, and traceability", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Software Requirements" }).click();
    await expect(page).toHaveURL(/\/projects\/braking-system\/requirements\?type=Software$/);

    const weakRequirementRow = page.getByRole("row").filter({ hasText: "BRK-SWE-002" });
    await expect(weakRequirementRow).toBeVisible();
    await weakRequirementRow.getByRole("button", { name: "View" }).click();

    await expect(page).toHaveURL(/\/projects\/braking-system\/requirements\/BRK-SWE-002$/);
    await expect(page.getByRole("heading", { name: "BRK-SWE-002" })).toBeVisible();

    await page.getByRole("tab", { name: "Structured View" }).click();
    await expect(page.getByText("Actor")).toBeVisible();
    await expect(page.getByText("The software").first()).toBeVisible();
    await expect(page.getByText("provide").first()).toBeVisible();

    await page.getByRole("tab", { name: "Traceability" }).click();
    await expect(page.getByRole("heading", { name: "Validation Traceability" })).toBeVisible();

    await page.getByRole("button", { name: "Quality Warnings" }).click();
    await expect(page.getByText("Ambiguous wording detected")).toBeVisible();
    await expect(page.getByText("The requirement uses vague terms: quickly, user-friendly.").first()).toBeVisible();

    await page.getByRole("button", { name: "System Requirements", exact: true }).click();
    const systemRequirementRow = page.getByRole("row").filter({ hasText: "BRK-SYS-001" });
    await expect(systemRequirementRow).toBeVisible();
    await systemRequirementRow.getByRole("button", { name: "View" }).click();
    await expect(page.getByRole("heading", { name: "Requirement Detail" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Linked Engineering Data" })).toBeVisible();
    await expect(page.getByText("BRK-DD-004 - Brake pressure capability")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Potential Conflicts" })).toBeVisible();
    await expect(page.getByText("BRK-SYS-002")).toBeVisible();

    await page.getByRole("button", { name: "Stakeholder Requirements", exact: true }).click();
    const timingRequirementRow = page.getByRole("row").filter({ hasText: "BRK-STK-002" });
    await expect(timingRequirementRow).toBeVisible();
    await timingRequirementRow.getByRole("button", { name: "View" }).click();
    await expect(page.getByRole("heading", { name: "Feasibility" })).toBeVisible();
    await expect(page.getByText("likely infeasible")).toBeVisible();
    await expect(page.getByText("total_time: 24")).toBeVisible();
    await expect(page.getByText("required_time: 10")).toBeVisible();

    await page.getByRole("tab", { name: "Traceability" }).click();
    await page.getByRole("button", { name: "Evidence Chain" }).click();
    await expect(page.getByText("Parsed maximum timing target: 10.00 ms.")).toBeVisible();
    await expect(page.getByText("valve_response_time contributes 8.00 ms.")).toBeVisible();
  });

  test("covers project-level validation and reports with copy/export", async ({ page }) => {
    await page.getByRole("button", { name: "Validation" }).click();
    await expect(page.getByRole("heading", { name: "Validation", exact: true })).toBeVisible();
    await expect(page.getByText("Requirements assessed").first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Requirement Quality Warnings/i })).toBeVisible();
    await expect(page.getByText("BRK-SWE-002").first()).toBeVisible();

    await page.getByRole("button", { name: "Open Traceability" }).first().click();
    await expect(page).toHaveURL(/tab=traceability/);
    await expect(page.getByRole("heading", { name: "Validation Traceability" })).toBeVisible();

    await page.getByRole("button", { name: "Reports" }).click();
    await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
    await expect(page.getByText("# Project Report: braking-system")).toBeVisible();
    await expect(page.getByRole("button", { name: /Quality Warning Summary/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Feasibility Summary/i })).toBeVisible();

    await page.getByRole("button", { name: "Copy Report" }).click();
    await expect(page.getByText("Report copied to clipboard.")).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export Markdown" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`${projectId}-report.md`);

    const traceabilityLink = page.getByRole("button", { name: "Open Traceability" }).first();
    await expect(traceabilityLink).toBeVisible();
  });
});
