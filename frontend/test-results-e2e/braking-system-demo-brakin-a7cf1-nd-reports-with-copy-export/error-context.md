# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: braking-system-demo.spec.ts >> braking-system demo smoke flow >> covers project-level validation and reports with copy/export
- Location: e2e\braking-system-demo.spec.ts:64:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Validation' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Validation' })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - heading "404 Not Found" [level=1] [ref=e3]
  - separator [ref=e4]
  - generic [ref=e5]: nginx/1.27.5
```

# Test source

```ts
  1  | import { expect, test } from "@playwright/test";
  2  | 
  3  | const projectId = "braking-system";
  4  | 
  5  | async function loadBrakingDemo(page: import("@playwright/test").Page) {
  6  |   await page.goto("/");
  7  |   await page.getByRole("button", { name: "Load Demo Project" }).last().click();
  8  |   await expect(page).toHaveURL(new RegExp(`/projects/${projectId}/dashboard$`));
  9  |   await expect(page.getByRole("heading", { name: "Braking System Controls" })).toBeVisible();
  10 | }
  11 | 
  12 | test.describe("braking-system demo smoke flow", () => {
  13 |   test.beforeEach(async ({ context, page }) => {
  14 |     await context.grantPermissions(["clipboard-read", "clipboard-write"], {
  15 |       origin: "http://127.0.0.1:3000",
  16 |     });
  17 |     await loadBrakingDemo(page);
  18 |   });
  19 | 
  20 |   test("covers weak requirement review, conflict visibility, timing feasibility, and traceability", async ({
  21 |     page,
  22 |   }) => {
  23 |     await page.getByRole("button", { name: "Software Requirements" }).click();
  24 |     await expect(page).toHaveURL(/\/projects\/braking-system\/requirements\?type=Software$/);
  25 | 
  26 |     const weakRequirementRow = page.getByRole("row").filter({ hasText: "BRK-SWE-002" });
  27 |     await expect(weakRequirementRow).toBeVisible();
  28 |     await weakRequirementRow.getByRole("button", { name: "View" }).click();
  29 | 
  30 |     await expect(page).toHaveURL(/\/projects\/braking-system\/requirements\/BRK-SWE-002$/);
  31 |     await expect(page.getByText("BRK-SWE-002")).toBeVisible();
  32 | 
  33 |     await page.getByRole("tab", { name: "Structured View" }).click();
  34 |     await expect(page.getByText("Actor")).toBeVisible();
  35 |     await expect(page.getByText("The software")).toBeVisible();
  36 |     await expect(page.getByText("provide")).toBeVisible();
  37 | 
  38 |     await page.getByRole("tab", { name: "Traceability" }).click();
  39 |     await expect(page.getByRole("heading", { name: "Validation Traceability" })).toBeVisible();
  40 | 
  41 |     await page.getByRole("button", { name: "Quality Warnings" }).click();
  42 |     await expect(page.getByText("Ambiguous wording detected")).toBeVisible();
  43 |     await expect(page.getByText("user-friendly")).toBeVisible();
  44 | 
  45 |     await page.goto(`/projects/${projectId}/requirements/BRK-SYS-001`);
  46 |     await expect(page.getByRole("heading", { name: "Requirement Detail" })).toBeVisible();
  47 |     await expect(page.getByRole("heading", { name: "Linked Engineering Data" })).toBeVisible();
  48 |     await expect(page.getByText("BRK-DD-004 - Brake pressure capability")).toBeVisible();
  49 |     await expect(page.getByRole("heading", { name: "Potential Conflicts" })).toBeVisible();
  50 |     await expect(page.getByText("BRK-SYS-002")).toBeVisible();
  51 | 
  52 |     await page.goto(`/projects/${projectId}/requirements/BRK-STK-002`);
  53 |     await expect(page.getByRole("heading", { name: "Feasibility" })).toBeVisible();
  54 |     await expect(page.getByText("likely infeasible")).toBeVisible();
  55 |     await expect(page.getByText("total_time: 24")).toBeVisible();
  56 |     await expect(page.getByText("required_time: 10")).toBeVisible();
  57 | 
  58 |     await page.getByRole("tab", { name: "Traceability" }).click();
  59 |     await page.getByRole("button", { name: "Evidence Chain" }).click();
  60 |     await expect(page.getByText("Parsed maximum timing target: 10.00 ms.")).toBeVisible();
  61 |     await expect(page.getByText("valve_response_time contributes 8.00 ms.")).toBeVisible();
  62 |   });
  63 | 
  64 |   test("covers project-level validation and reports with copy/export", async ({ page }) => {
  65 |     await page.goto(`/projects/${projectId}/validation`);
> 66 |     await expect(page.getByRole("heading", { name: "Validation" })).toBeVisible();
     |                                                                     ^ Error: expect(locator).toBeVisible() failed
  67 |     await expect(page.getByText("Requirements assessed")).toBeVisible();
  68 |     await expect(page.getByRole("heading", { name: "Requirement Quality Warnings" })).toBeVisible();
  69 |     await expect(page.getByText("BRK-SWE-002")).toBeVisible();
  70 | 
  71 |     await page.getByRole("button", { name: "Open Traceability" }).first().click();
  72 |     await expect(page).toHaveURL(/tab=traceability/);
  73 |     await expect(page.getByRole("heading", { name: "Validation Traceability" })).toBeVisible();
  74 | 
  75 |     await page.goto(`/projects/${projectId}/reports`);
  76 |     await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  77 |     await expect(page.getByText("# Project Report: braking-system")).toBeVisible();
  78 |     await expect(page.getByText("Quality Warning Summary")).toBeVisible();
  79 |     await expect(page.getByText("Feasibility Summary")).toBeVisible();
  80 | 
  81 |     await page.getByRole("button", { name: "Copy Report" }).click();
  82 |     await expect(page.getByText("Report copied to clipboard.")).toBeVisible();
  83 | 
  84 |     const downloadPromise = page.waitForEvent("download");
  85 |     await page.getByRole("button", { name: "Export Markdown" }).click();
  86 |     const download = await downloadPromise;
  87 |     expect(download.suggestedFilename()).toBe(`${projectId}-report.md`);
  88 | 
  89 |     const traceabilityLink = page.getByRole("button", { name: "Open Traceability" }).first();
  90 |     await expect(traceabilityLink).toBeVisible();
  91 |   });
  92 | });
  93 | 
```