# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: braking-system-demo.spec.ts >> braking-system demo smoke flow >> covers weak requirement review, conflict visibility, timing feasibility, and traceability
- Location: e2e\braking-system-demo.spec.ts:20:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('BRK-SWE-002')
Expected: visible
Error: strict mode violation: getByText('BRK-SWE-002') resolved to 2 elements:
    1) <h6 class="MuiTypography-root MuiTypography-h6 css-1fwkysh">BRK-SWE-002</h6> aka getByRole('heading', { name: 'BRK-SWE-' })
    2) <p class="MuiTypography-root MuiTypography-body1 css-1inogv3">BRK-SWE-002</p> aka locator('p').filter({ hasText: 'BRK-SWE-002' })

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('BRK-SWE-002')

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
          - tab "Overview" [selected] [ref=e131] [cursor=pointer]
          - tab "Structured View" [ref=e132] [cursor=pointer]
          - tab "Traceability" [ref=e133] [cursor=pointer]
        - generic [ref=e135]:
          - generic [ref=e136]:
            - generic [ref=e138]:
              - paragraph [ref=e139]: Title
              - paragraph [ref=e140]: Weak software wording
            - generic [ref=e142]:
              - paragraph [ref=e143]: Project ID
              - paragraph [ref=e144]: braking-system
            - generic [ref=e146]:
              - paragraph [ref=e147]: Requirement Text
              - paragraph [ref=e148]: The software shall quickly provide user-friendly brake status messages.
            - generic [ref=e150]:
              - paragraph [ref=e151]: Priority
              - paragraph [ref=e152]: Low
            - generic [ref=e154]:
              - paragraph [ref=e155]: Parent Requirement
              - paragraph [ref=e156]: None
            - generic [ref=e158]:
              - paragraph [ref=e159]: Subsystem
              - paragraph [ref=e160]: Brake HMI
            - generic [ref=e162]:
              - paragraph [ref=e163]: Verification Method
              - paragraph [ref=e164]: Inspection
            - generic [ref=e166]:
              - paragraph [ref=e167]: Created
              - paragraph [ref=e168]: 4/7/2026, 1:19:31 PM
            - generic [ref=e170]:
              - paragraph [ref=e171]: Rationale
              - paragraph [ref=e172]: Included as a weak wording example for quality checks.
            - generic [ref=e174]:
              - paragraph [ref=e175]: Assumptions
              - paragraph [ref=e176]: Driver messaging strategy is still under review.
          - generic [ref=e177]:
            - generic [ref=e179]:
              - heading "Feasibility" [level=6] [ref=e180]
              - generic [ref=e181]:
                - generic [ref=e182]:
                  - generic [ref=e184]: warning
                  - generic [ref=e186]: Confidence 43%
                - paragraph [ref=e187]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
                - generic [ref=e188]:
                  - heading "Computed Values" [level=6] [ref=e189]
                  - paragraph [ref=e190]: "constraint_type: Not available"
                  - paragraph [ref=e191]: "linked_parameter_count: 0"
                - generic [ref=e192]:
                  - heading "Evidence Used" [level=6] [ref=e193]
                  - paragraph [ref=e194]: No evidence items were available.
                - generic [ref=e195]:
                  - heading "Assumptions" [level=6] [ref=e196]
                  - paragraph [ref=e197]: Current feasibility coverage is limited to max-time, min-value, max-value, and range rules.
            - generic [ref=e198]:
              - heading "Linked Engineering Data" [level=6] [ref=e199]
              - alert [ref=e200]:
                - img [ref=e202]
                - generic [ref=e204]: No design parameters are linked to this requirement yet.
            - generic [ref=e205]:
              - generic [ref=e206]:
                - heading "Related Requirements" [level=6] [ref=e207]
                - paragraph [ref=e208]: Requirements that appear connected by subsystem, parameter, unit, or scope.
              - generic [ref=e210]:
                - generic [ref=e211]:
                  - paragraph [ref=e212]: BRK-SWE-001
                  - generic [ref=e214]: Software
                  - generic [ref=e216]: Draft
                - paragraph [ref=e217]: Wheel-end monitoring
                - paragraph [ref=e218]: The requirements operate in overlapping scope.
              - generic [ref=e220]:
                - generic [ref=e221]:
                  - paragraph [ref=e222]: BRK-SWE-003
                  - generic [ref=e224]: Software
                  - generic [ref=e226]: Draft
                - paragraph [ref=e227]: Weak compound software requirement
                - paragraph [ref=e228]: The requirements operate in overlapping scope.
            - generic [ref=e229]:
              - generic [ref=e230]:
                - heading "Potential Conflicts" [level=6] [ref=e231]
                - paragraph [ref=e232]: Potential contradictions or incompatible engineering constraints.
              - alert [ref=e233]:
                - img [ref=e235]
                - generic [ref=e237]: No obvious contradictions or incompatible constraints were detected.
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
> 31 |     await expect(page.getByText("BRK-SWE-002")).toBeVisible();
     |                                                 ^ Error: expect(locator).toBeVisible() failed
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
  66 |     await expect(page.getByRole("heading", { name: "Validation" })).toBeVisible();
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