# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: braking-system-demo.spec.ts >> braking-system demo smoke flow >> covers weak requirement review, conflict visibility, timing feasibility, and traceability
- Location: e2e\braking-system-demo.spec.ts:20:3

# Error details

```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'System Requirements' }) resolved to 2 elements:
    1) <div tabindex="0" role="button" class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-gutters MuiListItemButton-root MuiListItemButton-gutters css-193lxfd">…</div> aka getByRole('button', { name: 'System Requirements', exact: true })
    2) <div tabindex="0" role="button" class="MuiButtonBase-root MuiListItemButton-root MuiListItemButton-gutters MuiListItemButton-root MuiListItemButton-gutters css-193lxfd">…</div> aka getByRole('button', { name: 'Subsystem Requirements' })

Call log:
  - waiting for getByRole('button', { name: 'System Requirements' })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - text: Engineering Workspace
      - heading "Project Navigation" [level=6] [ref=e6]
      - paragraph [ref=e7]: Move between requirements, design data, validation, and reporting views.
    - separator [ref=e8]
    - list [ref=e9]:
      - button "Overview" [ref=e10] [cursor=pointer]:
        - img [ref=e12]
        - generic [ref=e15]: Overview
      - button "Stakeholder Requirements" [ref=e16] [cursor=pointer]:
        - img [ref=e18]
        - generic [ref=e21]: Stakeholder Requirements
      - button "System Requirements" [ref=e22] [cursor=pointer]:
        - img [ref=e24]
        - generic [ref=e27]: System Requirements
      - button "Subsystem Requirements" [ref=e28] [cursor=pointer]:
        - img [ref=e30]
        - generic [ref=e33]: Subsystem Requirements
      - button "Software Requirements" [ref=e34] [cursor=pointer]:
        - img [ref=e36]
        - generic [ref=e39]: Software Requirements
      - button "Hardware Requirements" [ref=e40] [cursor=pointer]:
        - img [ref=e42]
        - generic [ref=e45]: Hardware Requirements
      - button "Design Data" [ref=e46] [cursor=pointer]:
        - img [ref=e48]
        - generic [ref=e53]: Design Data
      - button "Validation" [ref=e54] [cursor=pointer]:
        - img [ref=e56]
        - generic [ref=e61]: Validation
      - button "Reports" [ref=e62] [cursor=pointer]:
        - img [ref=e64]
        - generic [ref=e67]: Reports
  - generic [ref=e68]:
    - generic [ref=e70]:
      - generic [ref=e71]:
        - text: Requirements Intelligence Platform
        - heading "Braking System Controls" [level=5] [ref=e72]
        - generic [ref=e73]:
          - generic [ref=e75]: In Review
          - generic [ref=e77]: Brake Demo Baseline 1.0
          - generic [ref=e79]: Rev A
      - generic [ref=e80]:
        - generic [ref=e81]:
          - img [ref=e82]
          - generic [ref=e84]: Project braking-system
        - generic [ref=e85]:
          - img [ref=e86]
          - generic [ref=e88]: Updated Demo dataset
        - generic [ref=e89]:
          - img [ref=e90]
          - generic [ref=e92]: Workspace filters
    - generic [ref=e96]:
      - generic [ref=e97]:
        - generic [ref=e98]:
          - heading "Requirement Detail" [level=5] [ref=e99]
          - paragraph [ref=e100]: Review requirement content and engineering metadata before editing or deletion.
        - generic [ref=e101]:
          - button "Back to List" [ref=e102] [cursor=pointer]:
            - img [ref=e104]
            - text: Back to List
          - button "Edit" [ref=e106] [cursor=pointer]:
            - img [ref=e108]
            - text: Edit
          - button "Delete" [ref=e110] [cursor=pointer]:
            - img [ref=e112]
            - text: Delete
      - generic [ref=e114]:
        - generic [ref=e115]:
          - heading "BRK-SWE-002" [level=6] [ref=e116]
          - generic [ref=e117]:
            - img [ref=e118]
            - generic [ref=e120]: Under Review
          - generic [ref=e122]: Software
          - generic [ref=e124]: Draft
          - generic [ref=e126]: Low
        - tablist [ref=e130]:
          - tab "Overview" [ref=e131] [cursor=pointer]
          - tab "Structured View" [ref=e132] [cursor=pointer]: Structured View
          - tab "Traceability" [selected] [ref=e133] [cursor=pointer]: Traceability
        - generic [ref=e136]:
          - generic [ref=e137]:
            - generic [ref=e138]:
              - heading "Validation Traceability" [level=6] [ref=e139]
              - paragraph [ref=e140]: Review all deterministic validation outputs, linked evidence, and engineering context for this requirement in one place.
            - generic [ref=e141]:
              - button "Copy Summary" [ref=e142] [cursor=pointer]:
                - img [ref=e144]
                - text: Copy Summary
              - button "Export Summary" [ref=e146] [cursor=pointer]:
                - img [ref=e148]
                - text: Export Summary
          - generic [ref=e150]:
            - heading "Requirement" [level=3] [ref=e151]:
              - button "Requirement" [expanded] [ref=e152] [cursor=pointer]:
                - heading "Requirement" [level=6] [ref=e155]
                - img [ref=e157]
            - region [ref=e162]:
              - generic [ref=e164]:
                - paragraph [ref=e165]: Text
                - paragraph [ref=e166]: The software shall quickly provide user-friendly brake status messages.
          - heading "Structured Parsed Output" [level=3] [ref=e168]:
            - button "Structured Parsed Output" [ref=e169] [cursor=pointer]:
              - heading "Structured Parsed Output" [level=6] [ref=e172]
              - img [ref=e174]
          - generic [ref=e176]:
            - heading "Quality Warnings 1 warnings | score 90" [level=3] [ref=e177]:
              - button "Quality Warnings 1 warnings | score 90" [expanded] [active] [ref=e178] [cursor=pointer]:
                - generic [ref=e180]:
                  - heading "Quality Warnings" [level=6] [ref=e181]
                  - generic [ref=e183]: 1 warnings | score 90
                - img [ref=e185]
            - region [ref=e190]:
              - generic [ref=e194]:
                - generic [ref=e195]:
                  - generic [ref=e197]: medium
                  - heading "Ambiguous wording detected" [level=6] [ref=e198]
                - paragraph [ref=e199]: "The requirement uses vague terms: quickly, user-friendly."
                - paragraph [ref=e200]: "Suggestion: Replace the vague wording with measurable thresholds or specific acceptance criteria."
          - heading "Related Requirements and Conflicts 2 related | 0 conflicts" [level=3] [ref=e202]:
            - button "Related Requirements and Conflicts 2 related | 0 conflicts" [ref=e203] [cursor=pointer]:
              - generic [ref=e205]:
                - heading "Related Requirements and Conflicts" [level=6] [ref=e206]
                - generic [ref=e208]: 2 related | 0 conflicts
              - img [ref=e210]
          - heading "Linked Design Parameters 0 linked" [level=3] [ref=e213]:
            - button "Linked Design Parameters 0 linked" [ref=e214] [cursor=pointer]:
              - generic [ref=e216]:
                - heading "Linked Design Parameters" [level=6] [ref=e217]
                - generic [ref=e219]: 0 linked
              - img [ref=e221]
          - heading "Feasibility Result warning" [level=3] [ref=e224]:
            - button "Feasibility Result warning" [ref=e225] [cursor=pointer]:
              - generic [ref=e227]:
                - heading "Feasibility Result" [level=6] [ref=e228]
                - generic [ref=e230]: warning
              - img [ref=e232]
          - heading "Evidence Chain 1 items" [level=3] [ref=e235]:
            - button "Evidence Chain 1 items" [ref=e236] [cursor=pointer]:
              - generic [ref=e238]:
                - heading "Evidence Chain" [level=6] [ref=e239]
                - generic [ref=e241]: 1 items
              - img [ref=e243]
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
  31 |     await expect(page.getByRole("heading", { name: "BRK-SWE-002" })).toBeVisible();
  32 | 
  33 |     await page.getByRole("tab", { name: "Structured View" }).click();
  34 |     await expect(page.getByText("Actor")).toBeVisible();
  35 |     await expect(page.getByText("The software").first()).toBeVisible();
  36 |     await expect(page.getByText("provide").first()).toBeVisible();
  37 | 
  38 |     await page.getByRole("tab", { name: "Traceability" }).click();
  39 |     await expect(page.getByRole("heading", { name: "Validation Traceability" })).toBeVisible();
  40 | 
  41 |     await page.getByRole("button", { name: "Quality Warnings" }).click();
  42 |     await expect(page.getByText("Ambiguous wording detected")).toBeVisible();
  43 |     await expect(page.getByText("The requirement uses vague terms: quickly, user-friendly.").first()).toBeVisible();
  44 | 
> 45 |     await page.getByRole("button", { name: "System Requirements" }).click();
     |                                                                     ^ Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'System Requirements' }) resolved to 2 elements:
  46 |     const systemRequirementRow = page.getByRole("row").filter({ hasText: "BRK-SYS-001" });
  47 |     await expect(systemRequirementRow).toBeVisible();
  48 |     await systemRequirementRow.getByRole("button", { name: "View" }).click();
  49 |     await expect(page.getByRole("heading", { name: "Requirement Detail" })).toBeVisible();
  50 |     await expect(page.getByRole("heading", { name: "Linked Engineering Data" })).toBeVisible();
  51 |     await expect(page.getByText("BRK-DD-004 - Brake pressure capability")).toBeVisible();
  52 |     await expect(page.getByRole("heading", { name: "Potential Conflicts" })).toBeVisible();
  53 |     await expect(page.getByText("BRK-SYS-002")).toBeVisible();
  54 | 
  55 |     await page.getByRole("button", { name: "Stakeholder Requirements" }).click();
  56 |     const timingRequirementRow = page.getByRole("row").filter({ hasText: "BRK-STK-002" });
  57 |     await expect(timingRequirementRow).toBeVisible();
  58 |     await timingRequirementRow.getByRole("button", { name: "View" }).click();
  59 |     await expect(page.getByRole("heading", { name: "Feasibility" })).toBeVisible();
  60 |     await expect(page.getByText("likely infeasible")).toBeVisible();
  61 |     await expect(page.getByText("total_time: 24")).toBeVisible();
  62 |     await expect(page.getByText("required_time: 10")).toBeVisible();
  63 | 
  64 |     await page.getByRole("tab", { name: "Traceability" }).click();
  65 |     await page.getByRole("button", { name: "Evidence Chain" }).click();
  66 |     await expect(page.getByText("Parsed maximum timing target: 10.00 ms.")).toBeVisible();
  67 |     await expect(page.getByText("valve_response_time contributes 8.00 ms.")).toBeVisible();
  68 |   });
  69 | 
  70 |   test("covers project-level validation and reports with copy/export", async ({ page }) => {
  71 |     await page.getByRole("button", { name: "Validation" }).click();
  72 |     await expect(page.getByRole("heading", { name: "Validation", exact: true })).toBeVisible();
  73 |     await expect(page.getByText("Requirements assessed").first()).toBeVisible();
  74 |     await expect(page.getByRole("button", { name: /Requirement Quality Warnings/i })).toBeVisible();
  75 |     await expect(page.getByText("BRK-SWE-002").first()).toBeVisible();
  76 | 
  77 |     await page.getByRole("button", { name: "Open Traceability" }).first().click();
  78 |     await expect(page).toHaveURL(/tab=traceability/);
  79 |     await expect(page.getByRole("heading", { name: "Validation Traceability" })).toBeVisible();
  80 | 
  81 |     await page.getByRole("button", { name: "Reports" }).click();
  82 |     await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
  83 |     await expect(page.getByText("# Project Report: braking-system")).toBeVisible();
  84 |     await expect(page.getByRole("button", { name: /Quality Warning Summary/i })).toBeVisible();
  85 |     await expect(page.getByRole("button", { name: /Feasibility Summary/i })).toBeVisible();
  86 | 
  87 |     await page.getByRole("button", { name: "Copy Report" }).click();
  88 |     await expect(page.getByText("Report copied to clipboard.")).toBeVisible();
  89 | 
  90 |     const downloadPromise = page.waitForEvent("download");
  91 |     await page.getByRole("button", { name: "Export Markdown" }).click();
  92 |     const download = await downloadPromise;
  93 |     expect(download.suggestedFilename()).toBe(`${projectId}-report.md`);
  94 | 
  95 |     const traceabilityLink = page.getByRole("button", { name: "Open Traceability" }).first();
  96 |     await expect(traceabilityLink).toBeVisible();
  97 |   });
  98 | });
  99 | 
```