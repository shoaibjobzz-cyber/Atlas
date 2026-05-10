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

Locator: getByRole('heading', { name: 'Quality Warning Summary' })
Expected: visible
Error: strict mode violation: getByRole('heading', { name: 'Quality Warning Summary' }) resolved to 2 elements:
    1) <h3 class="MuiAccordion-heading css-wnfue5">…</h3> aka getByRole('heading', { name: 'Quality Warning Summary Requirements currently contributing quality findings to' })
    2) <h6 class="MuiTypography-root MuiTypography-h6 css-1970yq1">Quality Warning Summary</h6> aka getByRole('button', { name: 'Quality Warning Summary' })

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Quality Warning Summary' })

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
          - heading "Reports" [level=4] [ref=e99]
          - paragraph [ref=e100]: Generate a current project report from live validation, traceability, conflict, and feasibility outputs.
        - generic [ref=e101]:
          - button "Copy Report" [ref=e102] [cursor=pointer]:
            - img [ref=e104]
            - text: Copy Report
          - button "Export Markdown" [ref=e106] [cursor=pointer]:
            - img [ref=e108]
            - text: Export Markdown
      - generic [ref=e110]:
        - generic [ref=e111]:
          - generic [ref=e114]:
            - paragraph [ref=e115]: Requirements overview
            - heading "15" [level=4] [ref=e116]
            - paragraph [ref=e117]: Requirements currently included in this project-level report.
          - generic [ref=e120]:
            - paragraph [ref=e121]: Quality warning summary
            - heading "10" [level=4] [ref=e122]
            - paragraph [ref=e123]: Total deterministic quality findings across the project.
          - generic [ref=e126]:
            - paragraph [ref=e127]: Parsing summary
            - heading "69%" [level=4] [ref=e128]
            - paragraph [ref=e129]: Average structured-data extraction coverage.
          - generic [ref=e132]:
            - paragraph [ref=e133]: Conflict summary
            - heading "3" [level=4] [ref=e134]
            - paragraph [ref=e135]: 60 related requirement links were also identified.
          - generic [ref=e138]:
            - paragraph [ref=e139]: Feasibility summary
            - heading "9" [level=4] [ref=e140]
            - paragraph [ref=e141]: 6 requirements currently assess as feasible.
          - generic [ref=e144]:
            - paragraph [ref=e145]: Traceability evidence
            - heading "22" [level=4] [ref=e146]
            - paragraph [ref=e147]: Feasibility evidence items currently available across the project.
        - generic [ref=e149]:
          - heading "Report Preview" [level=6] [ref=e150]
          - paragraph [ref=e151]: Current markdown output used for copy/export.
          - generic [ref=e152]: "# Project Report: braking-system ## Requirements Overview - Requirements assessed: 15 ## Quality Warning Summary - Total quality warnings: 10 - BRK-STK-001: 1 warnings - BRK-STK-002: 1 warnings - BRK-SWE-001: 2 warnings - BRK-SWE-002: 1 warnings - BRK-SWE-003: 2 warnings - BRK-HWE-001: 1 warnings - BRK-HWE-003: 2 warnings ## Parsing Summary - Average parsing coverage: 69% - BRK-STK-001: missing parameter, operator, value, unit - BRK-STK-002: missing object, operator, unit, timing, condition - BRK-SYS-001: missing timing, condition - BRK-SYS-002: missing timing, condition - BRK-SYS-003: missing timing, condition - BRK-SYS-004: missing timing, condition - BRK-SUB-001: missing object - BRK-SUB-002: missing object, condition - BRK-SUB-003: missing object - BRK-SWE-001: missing parameter, operator, value, unit - BRK-SWE-002: missing parameter, operator, value, unit, timing, condition - BRK-SWE-003: missing parameter, operator, value, unit, timing, condition - BRK-HWE-001: missing operator, timing, condition - BRK-HWE-002: missing timing, condition - BRK-HWE-003: missing parameter, operator, value, unit ## Conflict and Correlation Summary - Potential conflicts: 3 - Related requirement links: 60 - BRK-SYS-003: 1 potential conflicts - BRK-SYS-004: 1 potential conflicts - BRK-SUB-003: 1 potential conflicts ## Feasibility Summary - Feasible: 6 - Likely infeasible: 2 - Warning: 5 - Insufficient data: 2 ## Traceability and Evidence Summary - Feasibility evidence items: 22 - BRK-STK-002: 4 evidence items - BRK-SYS-001: 2 evidence items - BRK-SYS-002: 2 evidence items - BRK-SYS-003: 4 evidence items - BRK-SYS-004: 2 evidence items - BRK-SUB-001: 2 evidence items - BRK-SUB-002: 2 evidence items - BRK-SUB-003: 2 evidence items - BRK-HWE-001: 1 evidence items - BRK-HWE-002: 1 evidence items"
        - generic [ref=e153]:
          - heading "Quality Warning Summary Requirements currently contributing quality findings to the project report." [level=3] [ref=e154]:
            - button "Quality Warning Summary Requirements currently contributing quality findings to the project report." [expanded] [ref=e155] [cursor=pointer]:
              - generic [ref=e157]:
                - heading "Quality Warning Summary" [level=6] [ref=e158]
                - paragraph [ref=e159]: Requirements currently contributing quality findings to the project report.
              - img [ref=e161]
          - region [ref=e166]:
            - generic [ref=e168]:
              - generic [ref=e170]:
                - generic [ref=e171]:
                  - paragraph [ref=e172]: BRK-STK-001
                  - generic [ref=e174]: Stakeholder
                  - generic [ref=e176]: In Review
                - paragraph [ref=e177]: Predictable brake response
                - paragraph [ref=e178]: The vehicle shall provide predictable braking response for the driver during normal operation.
                - paragraph [ref=e180]: "Missing numeric value: The statement appears to describe a measurable constraint or performance target without a number."
                - generic [ref=e181]:
                  - button "Open Detail" [ref=e182] [cursor=pointer]:
                    - img [ref=e184]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e186] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e188]
              - generic [ref=e191]:
                - generic [ref=e192]:
                  - paragraph [ref=e193]: BRK-STK-002
                  - generic [ref=e195]: Stakeholder
                  - generic [ref=e197]: In Review
                - paragraph [ref=e198]: Fast pressure build-up
                - paragraph [ref=e199]: At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.
                - paragraph [ref=e201]: "Ambiguous wording detected: The requirement uses vague terms: fast."
                - generic [ref=e202]:
                  - button "Open Detail" [ref=e203] [cursor=pointer]:
                    - img [ref=e205]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e207] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e209]
              - generic [ref=e212]:
                - generic [ref=e213]:
                  - paragraph [ref=e214]: BRK-SWE-001
                  - generic [ref=e216]: Software
                  - generic [ref=e218]: Draft
                - paragraph [ref=e219]: Wheel-end monitoring
                - paragraph [ref=e220]: The software shall monitor wheel-end pressure and log diagnostic deviations during normal and degraded mode.
                - generic [ref=e221]:
                  - paragraph [ref=e222]: "Missing numeric value: The statement appears to describe a measurable constraint or performance target without a number."
                  - paragraph [ref=e223]: "Possible compound requirement: The statement may contain multiple obligations bundled into one requirement."
                - generic [ref=e224]:
                  - button "Open Detail" [ref=e225] [cursor=pointer]:
                    - img [ref=e227]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e229] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e231]
              - generic [ref=e234]:
                - generic [ref=e235]:
                  - paragraph [ref=e236]: BRK-SWE-002
                  - generic [ref=e238]: Software
                  - generic [ref=e240]: Draft
                - paragraph [ref=e241]: Weak software wording
                - paragraph [ref=e242]: The software shall quickly provide user-friendly brake status messages.
                - paragraph [ref=e244]: "Ambiguous wording detected: The requirement uses vague terms: quickly, user-friendly."
                - generic [ref=e245]:
                  - button "Open Detail" [ref=e246] [cursor=pointer]:
                    - img [ref=e248]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e250] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e252]
              - generic [ref=e255]:
                - generic [ref=e256]:
                  - paragraph [ref=e257]: BRK-SWE-003
                  - generic [ref=e259]: Software
                  - generic [ref=e261]: Draft
                - paragraph [ref=e262]: Weak compound software requirement
                - paragraph [ref=e263]: The software should robustly detect wheel slip and notify the driver and log the event as needed.
                - generic [ref=e264]:
                  - paragraph [ref=e265]: "Non-testable language detected: The statement includes wording that is difficult to verify objectively."
                  - paragraph [ref=e266]: "Weak or passive phrasing detected: The requirement uses weak modal language or passive voice, which can reduce clarity."
                - generic [ref=e267]:
                  - button "Open Detail" [ref=e268] [cursor=pointer]:
                    - img [ref=e270]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e272] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e274]
              - generic [ref=e277]:
                - generic [ref=e278]:
                  - paragraph [ref=e279]: BRK-HWE-001
                  - generic [ref=e281]: Hardware
                  - generic [ref=e283]: Approved
                - paragraph [ref=e284]: Operating voltage range
                - paragraph [ref=e285]: The brake controller hardware shall operate between 9 V and 16 V in normal mode.
                - paragraph [ref=e287]: "Possible compound requirement: The statement may contain multiple obligations bundled into one requirement."
                - generic [ref=e288]:
                  - button "Open Detail" [ref=e289] [cursor=pointer]:
                    - img [ref=e291]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e293] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e295]
              - generic [ref=e298]:
                - generic [ref=e299]:
                  - paragraph [ref=e300]: BRK-HWE-003
                  - generic [ref=e302]: Hardware
                  - generic [ref=e304]: Draft
                - paragraph [ref=e305]: Weak hardware wording
                - paragraph [ref=e306]: The hardware shall be efficient and robust during startup.
                - generic [ref=e307]:
                  - paragraph [ref=e308]: "Ambiguous wording detected: The requirement uses vague terms: efficient, robust."
                  - paragraph [ref=e309]: "Possible compound requirement: The statement may contain multiple obligations bundled into one requirement."
                - generic [ref=e310]:
                  - button "Open Detail" [ref=e311] [cursor=pointer]:
                    - img [ref=e313]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e315] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e317]
        - generic [ref=e319]:
          - heading "Parsing / Structured-Data Summary Requirements with incomplete structured extraction coverage." [level=3] [ref=e320]:
            - button "Parsing / Structured-Data Summary Requirements with incomplete structured extraction coverage." [expanded] [ref=e321] [cursor=pointer]:
              - generic [ref=e323]:
                - heading "Parsing / Structured-Data Summary" [level=6] [ref=e324]
                - paragraph [ref=e325]: Requirements with incomplete structured extraction coverage.
              - img [ref=e327]
          - region [ref=e332]:
            - generic [ref=e334]:
              - generic [ref=e336]:
                - generic [ref=e337]:
                  - paragraph [ref=e338]: BRK-STK-001
                  - generic [ref=e340]: Stakeholder
                  - generic [ref=e342]: In Review
                - paragraph [ref=e343]: Predictable brake response
                - paragraph [ref=e344]: The vehicle shall provide predictable braking response for the driver during normal operation.
                - paragraph [ref=e345]: "Missing structured fields: parameter, operator, value, unit"
                - generic [ref=e346]:
                  - button "Open Detail" [ref=e347] [cursor=pointer]:
                    - img [ref=e349]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e351] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e353]
              - generic [ref=e356]:
                - generic [ref=e357]:
                  - paragraph [ref=e358]: BRK-STK-002
                  - generic [ref=e360]: Stakeholder
                  - generic [ref=e362]: In Review
                - paragraph [ref=e363]: Fast pressure build-up
                - paragraph [ref=e364]: At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.
                - paragraph [ref=e365]: "Missing structured fields: object, operator, unit, timing, condition"
                - generic [ref=e366]:
                  - button "Open Detail" [ref=e367] [cursor=pointer]:
                    - img [ref=e369]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e371] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e373]
              - generic [ref=e376]:
                - generic [ref=e377]:
                  - paragraph [ref=e378]: BRK-SYS-001
                  - generic [ref=e380]: System
                  - generic [ref=e382]: Approved
                - paragraph [ref=e383]: Normal-mode minimum pressure
                - paragraph [ref=e384]: Brake pressure shall be at least 6 bar in normal mode.
                - paragraph [ref=e385]: "Missing structured fields: timing, condition"
                - generic [ref=e386]:
                  - button "Open Detail" [ref=e387] [cursor=pointer]:
                    - img [ref=e389]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e391] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e393]
              - generic [ref=e396]:
                - generic [ref=e397]:
                  - paragraph [ref=e398]: BRK-SYS-002
                  - generic [ref=e400]: System
                  - generic [ref=e402]: Draft
                - paragraph [ref=e403]: Conflicting upper pressure limit
                - paragraph [ref=e404]: Brake pressure shall be at most 4 bar in normal mode.
                - paragraph [ref=e405]: "Missing structured fields: timing, condition"
                - generic [ref=e406]:
                  - button "Open Detail" [ref=e407] [cursor=pointer]:
                    - img [ref=e409]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e411] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e413]
              - generic [ref=e416]:
                - generic [ref=e417]:
                  - paragraph [ref=e418]: BRK-SYS-003
                  - generic [ref=e420]: System
                  - generic [ref=e422]: In Review
                - paragraph [ref=e423]: Response-time limit
                - paragraph [ref=e424]: The braking system shall limit response time to at most 100 ms in all modes.
                - paragraph [ref=e425]: "Missing structured fields: timing, condition"
                - generic [ref=e426]:
                  - button "Open Detail" [ref=e427] [cursor=pointer]:
                    - img [ref=e429]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e431] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e433]
              - generic [ref=e436]:
                - generic [ref=e437]:
                  - paragraph [ref=e438]: BRK-SYS-004
                  - generic [ref=e440]: System
                  - generic [ref=e442]: Draft
                - paragraph [ref=e443]: Conflicting response-time limit
                - paragraph [ref=e444]: The braking system shall limit response time to at most 250 ms in all modes.
                - paragraph [ref=e445]: "Missing structured fields: timing, condition"
                - generic [ref=e446]:
                  - button "Open Detail" [ref=e447] [cursor=pointer]:
                    - img [ref=e449]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e451] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e453]
              - generic [ref=e456]:
                - generic [ref=e457]:
                  - paragraph [ref=e458]: BRK-SUB-001
                  - generic [ref=e460]: Subsystem
                  - generic [ref=e462]: Approved
                - paragraph [ref=e463]: Valve delay budget
                - paragraph [ref=e464]: The hydraulic valve subsystem shall respond within 8 ms during normal mode.
                - paragraph [ref=e465]: "Missing structured fields: object"
                - generic [ref=e466]:
                  - button "Open Detail" [ref=e467] [cursor=pointer]:
                    - img [ref=e469]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e471] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e473]
              - generic [ref=e476]:
                - generic [ref=e477]:
                  - paragraph [ref=e478]: BRK-SUB-002
                  - generic [ref=e480]: Subsystem
                  - generic [ref=e482]: Approved
                - paragraph [ref=e483]: Controller latency
                - paragraph [ref=e484]: The brake controller shall process a pedal request within 4 ms in normal mode.
                - paragraph [ref=e485]: "Missing structured fields: object, condition"
                - generic [ref=e486]:
                  - button "Open Detail" [ref=e487] [cursor=pointer]:
                    - img [ref=e489]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e491] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e493]
              - generic [ref=e496]:
                - generic [ref=e497]:
                  - paragraph [ref=e498]: BRK-SUB-003
                  - generic [ref=e500]: Subsystem
                  - generic [ref=e502]: Approved
                - paragraph [ref=e503]: Hydraulic build-up estimate
                - paragraph [ref=e504]: The hydraulic circuit shall build pressure within 12 ms during normal mode.
                - paragraph [ref=e505]: "Missing structured fields: object"
                - generic [ref=e506]:
                  - button "Open Detail" [ref=e507] [cursor=pointer]:
                    - img [ref=e509]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e511] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e513]
              - generic [ref=e516]:
                - generic [ref=e517]:
                  - paragraph [ref=e518]: BRK-SWE-001
                  - generic [ref=e520]: Software
                  - generic [ref=e522]: Draft
                - paragraph [ref=e523]: Wheel-end monitoring
                - paragraph [ref=e524]: The software shall monitor wheel-end pressure and log diagnostic deviations during normal and degraded mode.
                - paragraph [ref=e525]: "Missing structured fields: parameter, operator, value, unit"
                - generic [ref=e526]:
                  - button "Open Detail" [ref=e527] [cursor=pointer]:
                    - img [ref=e529]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e531] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e533]
              - generic [ref=e536]:
                - generic [ref=e537]:
                  - paragraph [ref=e538]: BRK-SWE-002
                  - generic [ref=e540]: Software
                  - generic [ref=e542]: Draft
                - paragraph [ref=e543]: Weak software wording
                - paragraph [ref=e544]: The software shall quickly provide user-friendly brake status messages.
                - paragraph [ref=e545]: "Missing structured fields: parameter, operator, value, unit, timing, condition"
                - generic [ref=e546]:
                  - button "Open Detail" [ref=e547] [cursor=pointer]:
                    - img [ref=e549]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e551] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e553]
              - generic [ref=e556]:
                - generic [ref=e557]:
                  - paragraph [ref=e558]: BRK-SWE-003
                  - generic [ref=e560]: Software
                  - generic [ref=e562]: Draft
                - paragraph [ref=e563]: Weak compound software requirement
                - paragraph [ref=e564]: The software should robustly detect wheel slip and notify the driver and log the event as needed.
                - paragraph [ref=e565]: "Missing structured fields: parameter, operator, value, unit, timing, condition"
                - generic [ref=e566]:
                  - button "Open Detail" [ref=e567] [cursor=pointer]:
                    - img [ref=e569]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e571] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e573]
              - generic [ref=e576]:
                - generic [ref=e577]:
                  - paragraph [ref=e578]: BRK-HWE-001
                  - generic [ref=e580]: Hardware
                  - generic [ref=e582]: Approved
                - paragraph [ref=e583]: Operating voltage range
                - paragraph [ref=e584]: The brake controller hardware shall operate between 9 V and 16 V in normal mode.
                - paragraph [ref=e585]: "Missing structured fields: operator, timing, condition"
                - generic [ref=e586]:
                  - button "Open Detail" [ref=e587] [cursor=pointer]:
                    - img [ref=e589]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e591] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e593]
              - generic [ref=e596]:
                - generic [ref=e597]:
                  - paragraph [ref=e598]: BRK-HWE-002
                  - generic [ref=e600]: Hardware
                  - generic [ref=e602]: Draft
                - paragraph [ref=e603]: Conflicting minimum voltage
                - paragraph [ref=e604]: The brake controller hardware shall operate at least 18 V in normal mode.
                - paragraph [ref=e605]: "Missing structured fields: timing, condition"
                - generic [ref=e606]:
                  - button "Open Detail" [ref=e607] [cursor=pointer]:
                    - img [ref=e609]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e611] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e613]
              - generic [ref=e616]:
                - generic [ref=e617]:
                  - paragraph [ref=e618]: BRK-HWE-003
                  - generic [ref=e620]: Hardware
                  - generic [ref=e622]: Draft
                - paragraph [ref=e623]: Weak hardware wording
                - paragraph [ref=e624]: The hardware shall be efficient and robust during startup.
                - paragraph [ref=e625]: "Missing structured fields: parameter, operator, value, unit"
                - generic [ref=e626]:
                  - button "Open Detail" [ref=e627] [cursor=pointer]:
                    - img [ref=e629]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e631] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e633]
        - generic [ref=e635]:
          - heading "Conflict / Correlation Summary Requirements contributing correlation and conflict evidence to the report." [level=3] [ref=e636]:
            - button "Conflict / Correlation Summary Requirements contributing correlation and conflict evidence to the report." [expanded] [ref=e637] [cursor=pointer]:
              - generic [ref=e639]:
                - heading "Conflict / Correlation Summary" [level=6] [ref=e640]
                - paragraph [ref=e641]: Requirements contributing correlation and conflict evidence to the report.
              - img [ref=e643]
          - region [ref=e648]:
            - generic [ref=e650]:
              - generic [ref=e652]:
                - generic [ref=e653]:
                  - paragraph [ref=e654]: BRK-STK-001
                  - generic [ref=e656]: Stakeholder
                  - generic [ref=e658]: In Review
                - paragraph [ref=e659]: Predictable brake response
                - paragraph [ref=e660]: The vehicle shall provide predictable braking response for the driver during normal operation.
                - generic [ref=e661]:
                  - paragraph [ref=e662]: "Related: BRK-SYS-003 · Same subsystem: Brake Control."
                  - paragraph [ref=e663]: "Related: BRK-SYS-004 · Same subsystem: Brake Control."
                  - paragraph [ref=e664]: "Related: BRK-SUB-002 · Same subsystem: Brake Control."
                - generic [ref=e665]:
                  - button "Open Detail" [ref=e666] [cursor=pointer]:
                    - img [ref=e668]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e670] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e672]
              - generic [ref=e675]:
                - generic [ref=e676]:
                  - paragraph [ref=e677]: BRK-STK-002
                  - generic [ref=e679]: Stakeholder
                  - generic [ref=e681]: In Review
                - paragraph [ref=e682]: Fast pressure build-up
                - paragraph [ref=e683]: At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.
                - generic [ref=e684]:
                  - paragraph [ref=e685]: "Related: BRK-SYS-001 · Same subsystem: Hydraulics."
                  - paragraph [ref=e686]: "Related: BRK-SYS-002 · Same subsystem: Hydraulics."
                  - paragraph [ref=e687]: "Related: BRK-SUB-001 · Same subsystem: Hydraulics."
                - generic [ref=e688]:
                  - button "Open Detail" [ref=e689] [cursor=pointer]:
                    - img [ref=e691]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e693] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e695]
              - generic [ref=e698]:
                - generic [ref=e699]:
                  - paragraph [ref=e700]: BRK-SYS-001
                  - generic [ref=e702]: System
                  - generic [ref=e704]: Approved
                - paragraph [ref=e705]: Normal-mode minimum pressure
                - paragraph [ref=e706]: Brake pressure shall be at least 6 bar in normal mode.
                - generic [ref=e707]:
                  - paragraph [ref=e708]: "Related: BRK-STK-002 · Same subsystem: Hydraulics."
                  - paragraph [ref=e709]: "Related: BRK-SYS-002 · Same subsystem: Hydraulics. Both requirements use the same unit: bar. The requirements operate in overlapping scope."
                  - paragraph [ref=e710]: "Related: BRK-SUB-001 · Same subsystem: Hydraulics."
                - generic [ref=e711]:
                  - button "Open Detail" [ref=e712] [cursor=pointer]:
                    - img [ref=e714]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e716] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e718]
              - generic [ref=e721]:
                - generic [ref=e722]:
                  - paragraph [ref=e723]: BRK-SYS-002
                  - generic [ref=e725]: System
                  - generic [ref=e727]: Draft
                - paragraph [ref=e728]: Conflicting upper pressure limit
                - paragraph [ref=e729]: Brake pressure shall be at most 4 bar in normal mode.
                - generic [ref=e730]:
                  - paragraph [ref=e731]: "Related: BRK-STK-002 · Same subsystem: Hydraulics."
                  - paragraph [ref=e732]: "Related: BRK-SYS-001 · Same subsystem: Hydraulics. Both requirements use the same unit: bar. The requirements operate in overlapping scope."
                  - paragraph [ref=e733]: "Related: BRK-SUB-001 · Same subsystem: Hydraulics."
                - generic [ref=e734]:
                  - button "Open Detail" [ref=e735] [cursor=pointer]:
                    - img [ref=e737]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e739] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e741]
              - generic [ref=e744]:
                - generic [ref=e745]:
                  - paragraph [ref=e746]: BRK-SYS-003
                  - generic [ref=e748]: System
                  - generic [ref=e750]: In Review
                - paragraph [ref=e751]: Response-time limit
                - paragraph [ref=e752]: The braking system shall limit response time to at most 100 ms in all modes.
                - generic [ref=e753]:
                  - paragraph [ref=e754]: "Conflict: BRK-SYS-004 · The requirements define different upper bounds for the same parameter under overlapping conditions."
                  - paragraph [ref=e755]: "Related: BRK-STK-001 · Same subsystem: Brake Control."
                  - paragraph [ref=e756]: "Related: BRK-SYS-004 · Same subsystem: Brake Control. Both requirements reference the same parameter: to at most. Both requirements use the same unit: ms. The requirements operate in overlapping scope."
                  - paragraph [ref=e757]: "Related: BRK-SUB-001 · Both requirements use the same unit: ms."
                - generic [ref=e758]:
                  - button "Open Detail" [ref=e759] [cursor=pointer]:
                    - img [ref=e761]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e763] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e765]
              - generic [ref=e768]:
                - generic [ref=e769]:
                  - paragraph [ref=e770]: BRK-SYS-004
                  - generic [ref=e772]: System
                  - generic [ref=e774]: Draft
                - paragraph [ref=e775]: Conflicting response-time limit
                - paragraph [ref=e776]: The braking system shall limit response time to at most 250 ms in all modes.
                - generic [ref=e777]:
                  - paragraph [ref=e778]: "Conflict: BRK-SYS-003 · The requirements define different upper bounds for the same parameter under overlapping conditions."
                  - paragraph [ref=e779]: "Related: BRK-STK-001 · Same subsystem: Brake Control."
                  - paragraph [ref=e780]: "Related: BRK-SYS-003 · Same subsystem: Brake Control. Both requirements reference the same parameter: to at most. Both requirements use the same unit: ms. The requirements operate in overlapping scope."
                  - paragraph [ref=e781]: "Related: BRK-SUB-001 · Both requirements use the same unit: ms."
                - generic [ref=e782]:
                  - button "Open Detail" [ref=e783] [cursor=pointer]:
                    - img [ref=e785]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e787] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e789]
              - generic [ref=e792]:
                - generic [ref=e793]:
                  - paragraph [ref=e794]: BRK-SUB-001
                  - generic [ref=e796]: Subsystem
                  - generic [ref=e798]: Approved
                - paragraph [ref=e799]: Valve delay budget
                - paragraph [ref=e800]: The hydraulic valve subsystem shall respond within 8 ms during normal mode.
                - generic [ref=e801]:
                  - paragraph [ref=e802]: "Related: BRK-STK-002 · Same subsystem: Hydraulics."
                  - paragraph [ref=e803]: "Related: BRK-SYS-001 · Same subsystem: Hydraulics."
                  - paragraph [ref=e804]: "Related: BRK-SYS-002 · Same subsystem: Hydraulics."
                - generic [ref=e805]:
                  - button "Open Detail" [ref=e806] [cursor=pointer]:
                    - img [ref=e808]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e810] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e812]
              - generic [ref=e815]:
                - generic [ref=e816]:
                  - paragraph [ref=e817]: BRK-SUB-002
                  - generic [ref=e819]: Subsystem
                  - generic [ref=e821]: Approved
                - paragraph [ref=e822]: Controller latency
                - paragraph [ref=e823]: The brake controller shall process a pedal request within 4 ms in normal mode.
                - generic [ref=e824]:
                  - paragraph [ref=e825]: "Related: BRK-STK-001 · Same subsystem: Brake Control."
                  - paragraph [ref=e826]: "Related: BRK-SYS-003 · Same subsystem: Brake Control. Both requirements use the same unit: ms."
                  - paragraph [ref=e827]: "Related: BRK-SYS-004 · Same subsystem: Brake Control. Both requirements use the same unit: ms."
                - generic [ref=e828]:
                  - button "Open Detail" [ref=e829] [cursor=pointer]:
                    - img [ref=e831]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e833] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e835]
              - generic [ref=e838]:
                - generic [ref=e839]:
                  - paragraph [ref=e840]: BRK-SUB-003
                  - generic [ref=e842]: Subsystem
                  - generic [ref=e844]: Approved
                - paragraph [ref=e845]: Hydraulic build-up estimate
                - paragraph [ref=e846]: The hydraulic circuit shall build pressure within 12 ms during normal mode.
                - generic [ref=e847]:
                  - paragraph [ref=e848]: "Conflict: The parsed parameter 'pressure' is paired with unit 'ms', which does not look valid for that parameter."
                  - paragraph [ref=e849]: "Related: BRK-STK-002 · Same subsystem: Hydraulics."
                  - paragraph [ref=e850]: "Related: BRK-SYS-001 · Same subsystem: Hydraulics."
                  - paragraph [ref=e851]: "Related: BRK-SYS-002 · Same subsystem: Hydraulics."
                - generic [ref=e852]:
                  - button "Open Detail" [ref=e853] [cursor=pointer]:
                    - img [ref=e855]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e857] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e859]
              - generic [ref=e862]:
                - generic [ref=e863]:
                  - paragraph [ref=e864]: BRK-SWE-001
                  - generic [ref=e866]: Software
                  - generic [ref=e868]: Draft
                - paragraph [ref=e869]: Wheel-end monitoring
                - paragraph [ref=e870]: The software shall monitor wheel-end pressure and log diagnostic deviations during normal and degraded mode.
                - generic [ref=e871]:
                  - paragraph [ref=e872]: "Related: BRK-SWE-002 · The requirements operate in overlapping scope."
                  - paragraph [ref=e873]: "Related: BRK-SWE-003 · Same subsystem: Brake Software. The requirements operate in overlapping scope."
                - generic [ref=e874]:
                  - button "Open Detail" [ref=e875] [cursor=pointer]:
                    - img [ref=e877]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e879] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e881]
              - generic [ref=e884]:
                - generic [ref=e885]:
                  - paragraph [ref=e886]: BRK-SWE-002
                  - generic [ref=e888]: Software
                  - generic [ref=e890]: Draft
                - paragraph [ref=e891]: Weak software wording
                - paragraph [ref=e892]: The software shall quickly provide user-friendly brake status messages.
                - generic [ref=e893]:
                  - paragraph [ref=e894]: "Related: BRK-SWE-001 · The requirements operate in overlapping scope."
                  - paragraph [ref=e895]: "Related: BRK-SWE-003 · The requirements operate in overlapping scope."
                - generic [ref=e896]:
                  - button "Open Detail" [ref=e897] [cursor=pointer]:
                    - img [ref=e899]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e901] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e903]
              - generic [ref=e906]:
                - generic [ref=e907]:
                  - paragraph [ref=e908]: BRK-SWE-003
                  - generic [ref=e910]: Software
                  - generic [ref=e912]: Draft
                - paragraph [ref=e913]: Weak compound software requirement
                - paragraph [ref=e914]: The software should robustly detect wheel slip and notify the driver and log the event as needed.
                - generic [ref=e915]:
                  - paragraph [ref=e916]: "Related: BRK-SWE-001 · Same subsystem: Brake Software. The requirements operate in overlapping scope."
                  - paragraph [ref=e917]: "Related: BRK-SWE-002 · The requirements operate in overlapping scope."
                - generic [ref=e918]:
                  - button "Open Detail" [ref=e919] [cursor=pointer]:
                    - img [ref=e921]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e923] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e925]
              - generic [ref=e928]:
                - generic [ref=e929]:
                  - paragraph [ref=e930]: BRK-HWE-001
                  - generic [ref=e932]: Hardware
                  - generic [ref=e934]: Approved
                - paragraph [ref=e935]: Operating voltage range
                - paragraph [ref=e936]: The brake controller hardware shall operate between 9 V and 16 V in normal mode.
                - generic [ref=e937]:
                  - paragraph [ref=e938]: "Related: BRK-SUB-002 · The requirements operate in overlapping scope."
                  - paragraph [ref=e939]: "Related: BRK-HWE-002 · Same subsystem: Brake ECU. Both requirements use the same unit: v. The requirements operate in overlapping scope."
                  - paragraph [ref=e940]: "Related: BRK-HWE-003 · Same subsystem: Brake ECU."
                - generic [ref=e941]:
                  - button "Open Detail" [ref=e942] [cursor=pointer]:
                    - img [ref=e944]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e946] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e948]
              - generic [ref=e951]:
                - generic [ref=e952]:
                  - paragraph [ref=e953]: BRK-HWE-002
                  - generic [ref=e955]: Hardware
                  - generic [ref=e957]: Draft
                - paragraph [ref=e958]: Conflicting minimum voltage
                - paragraph [ref=e959]: The brake controller hardware shall operate at least 18 V in normal mode.
                - generic [ref=e960]:
                  - paragraph [ref=e961]: "Related: BRK-SUB-002 · The requirements operate in overlapping scope."
                  - paragraph [ref=e962]: "Related: BRK-HWE-001 · Same subsystem: Brake ECU. Both requirements use the same unit: v. The requirements operate in overlapping scope."
                  - paragraph [ref=e963]: "Related: BRK-HWE-003 · Same subsystem: Brake ECU."
                - generic [ref=e964]:
                  - button "Open Detail" [ref=e965] [cursor=pointer]:
                    - img [ref=e967]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e969] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e971]
              - generic [ref=e974]:
                - generic [ref=e975]:
                  - paragraph [ref=e976]: BRK-HWE-003
                  - generic [ref=e978]: Hardware
                  - generic [ref=e980]: Draft
                - paragraph [ref=e981]: Weak hardware wording
                - paragraph [ref=e982]: The hardware shall be efficient and robust during startup.
                - generic [ref=e983]:
                  - paragraph [ref=e984]: "Related: BRK-HWE-001 · Same subsystem: Brake ECU."
                  - paragraph [ref=e985]: "Related: BRK-HWE-002 · Same subsystem: Brake ECU."
                - generic [ref=e986]:
                  - button "Open Detail" [ref=e987] [cursor=pointer]:
                    - img [ref=e989]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e991] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e993]
        - generic [ref=e995]:
          - heading "Feasibility Summary Requirements with non-feasible, warning-level, or incomplete feasibility results." [level=3] [ref=e996]:
            - button "Feasibility Summary Requirements with non-feasible, warning-level, or incomplete feasibility results." [expanded] [ref=e997] [cursor=pointer]:
              - generic [ref=e999]:
                - heading "Feasibility Summary" [level=6] [ref=e1000]
                - paragraph [ref=e1001]: Requirements with non-feasible, warning-level, or incomplete feasibility results.
              - img [ref=e1003]
          - region [ref=e1008]:
            - generic [ref=e1010]:
              - generic [ref=e1012]:
                - generic [ref=e1013]:
                  - paragraph [ref=e1014]: BRK-STK-001
                  - generic [ref=e1016]: Stakeholder
                  - generic [ref=e1018]: In Review
                - paragraph [ref=e1019]: Predictable brake response
                - paragraph [ref=e1020]: The vehicle shall provide predictable braking response for the driver during normal operation.
                - generic [ref=e1021]:
                  - paragraph [ref=e1022]: "Status: warning"
                  - paragraph [ref=e1023]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
                - generic [ref=e1024]:
                  - button "Open Detail" [ref=e1025] [cursor=pointer]:
                    - img [ref=e1027]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1029] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1031]
              - generic [ref=e1034]:
                - generic [ref=e1035]:
                  - paragraph [ref=e1036]: BRK-STK-002
                  - generic [ref=e1038]: Stakeholder
                  - generic [ref=e1040]: In Review
                - paragraph [ref=e1041]: Fast pressure build-up
                - paragraph [ref=e1042]: At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.
                - generic [ref=e1043]:
                  - paragraph [ref=e1044]: "Status: likely infeasible"
                  - paragraph [ref=e1045]: Computed timing budget is 24.00 ms against a required maximum of 10.00 ms.
                - generic [ref=e1046]:
                  - button "Open Detail" [ref=e1047] [cursor=pointer]:
                    - img [ref=e1049]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1051] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1053]
              - generic [ref=e1056]:
                - generic [ref=e1057]:
                  - paragraph [ref=e1058]: BRK-SYS-002
                  - generic [ref=e1060]: System
                  - generic [ref=e1062]: Draft
                - paragraph [ref=e1063]: Conflicting upper pressure limit
                - paragraph [ref=e1064]: Brake pressure shall be at most 4 bar in normal mode.
                - generic [ref=e1065]:
                  - paragraph [ref=e1066]: "Status: likely infeasible"
                  - paragraph [ref=e1067]: Observed linked bound is 8 bar, compared against the required maximum of 4 bar.
                - generic [ref=e1068]:
                  - button "Open Detail" [ref=e1069] [cursor=pointer]:
                    - img [ref=e1071]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1073] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1075]
              - generic [ref=e1078]:
                - generic [ref=e1079]:
                  - paragraph [ref=e1080]: BRK-SWE-001
                  - generic [ref=e1082]: Software
                  - generic [ref=e1084]: Draft
                - paragraph [ref=e1085]: Wheel-end monitoring
                - paragraph [ref=e1086]: The software shall monitor wheel-end pressure and log diagnostic deviations during normal and degraded mode.
                - generic [ref=e1087]:
                  - paragraph [ref=e1088]: "Status: warning"
                  - paragraph [ref=e1089]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
                - generic [ref=e1090]:
                  - button "Open Detail" [ref=e1091] [cursor=pointer]:
                    - img [ref=e1093]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1095] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1097]
              - generic [ref=e1100]:
                - generic [ref=e1101]:
                  - paragraph [ref=e1102]: BRK-SWE-002
                  - generic [ref=e1104]: Software
                  - generic [ref=e1106]: Draft
                - paragraph [ref=e1107]: Weak software wording
                - paragraph [ref=e1108]: The software shall quickly provide user-friendly brake status messages.
                - generic [ref=e1109]:
                  - paragraph [ref=e1110]: "Status: warning"
                  - paragraph [ref=e1111]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
                - generic [ref=e1112]:
                  - button "Open Detail" [ref=e1113] [cursor=pointer]:
                    - img [ref=e1115]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1117] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1119]
              - generic [ref=e1122]:
                - generic [ref=e1123]:
                  - paragraph [ref=e1124]: BRK-SWE-003
                  - generic [ref=e1126]: Software
                  - generic [ref=e1128]: Draft
                - paragraph [ref=e1129]: Weak compound software requirement
                - paragraph [ref=e1130]: The software should robustly detect wheel slip and notify the driver and log the event as needed.
                - generic [ref=e1131]:
                  - paragraph [ref=e1132]: "Status: warning"
                  - paragraph [ref=e1133]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
                - generic [ref=e1134]:
                  - button "Open Detail" [ref=e1135] [cursor=pointer]:
                    - img [ref=e1137]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1139] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1141]
              - generic [ref=e1144]:
                - generic [ref=e1145]:
                  - paragraph [ref=e1146]: BRK-HWE-001
                  - generic [ref=e1148]: Hardware
                  - generic [ref=e1150]: Approved
                - paragraph [ref=e1151]: Operating voltage range
                - paragraph [ref=e1152]: The brake controller hardware shall operate between 9 V and 16 V in normal mode.
                - generic [ref=e1153]:
                  - paragraph [ref=e1154]: "Status: insufficient data"
                  - paragraph [ref=e1155]: A range requirement was expected, but the numeric bounds could not be parsed.
                - generic [ref=e1156]:
                  - button "Open Detail" [ref=e1157] [cursor=pointer]:
                    - img [ref=e1159]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1161] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1163]
              - generic [ref=e1166]:
                - generic [ref=e1167]:
                  - paragraph [ref=e1168]: BRK-HWE-002
                  - generic [ref=e1170]: Hardware
                  - generic [ref=e1172]: Draft
                - paragraph [ref=e1173]: Conflicting minimum voltage
                - paragraph [ref=e1174]: The brake controller hardware shall operate at least 18 V in normal mode.
                - generic [ref=e1175]:
                  - paragraph [ref=e1176]: "Status: insufficient data"
                  - paragraph [ref=e1177]: A minimum-value requirement was detected, but no comparable linked design parameters were available.
                - generic [ref=e1178]:
                  - button "Open Detail" [ref=e1179] [cursor=pointer]:
                    - img [ref=e1181]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1183] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1185]
              - generic [ref=e1188]:
                - generic [ref=e1189]:
                  - paragraph [ref=e1190]: BRK-HWE-003
                  - generic [ref=e1192]: Hardware
                  - generic [ref=e1194]: Draft
                - paragraph [ref=e1195]: Weak hardware wording
                - paragraph [ref=e1196]: The hardware shall be efficient and robust during startup.
                - generic [ref=e1197]:
                  - paragraph [ref=e1198]: "Status: warning"
                  - paragraph [ref=e1199]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
                - generic [ref=e1200]:
                  - button "Open Detail" [ref=e1201] [cursor=pointer]:
                    - img [ref=e1203]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1205] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1207]
        - generic [ref=e1209]:
          - heading "Traceability / Evidence Summary Requirements with current evidence chains that contribute directly to the report." [level=3] [ref=e1210]:
            - button "Traceability / Evidence Summary Requirements with current evidence chains that contribute directly to the report." [expanded] [ref=e1211] [cursor=pointer]:
              - generic [ref=e1213]:
                - heading "Traceability / Evidence Summary" [level=6] [ref=e1214]
                - paragraph [ref=e1215]: Requirements with current evidence chains that contribute directly to the report.
              - img [ref=e1217]
          - region [ref=e1222]:
            - generic [ref=e1224]:
              - generic [ref=e1226]:
                - generic [ref=e1227]:
                  - paragraph [ref=e1228]: BRK-STK-002
                  - generic [ref=e1230]: Stakeholder
                  - generic [ref=e1232]: In Review
                - paragraph [ref=e1233]: Fast pressure build-up
                - paragraph [ref=e1234]: At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.
                - generic [ref=e1235]:
                  - paragraph [ref=e1236]: "requirement: Parsed maximum timing target: 10.00 ms."
                  - paragraph [ref=e1237]: "linked_design_parameter: controller_delay contributes 4.00 ms."
                  - paragraph [ref=e1238]: "linked_design_parameter: hydraulic_build_up_estimate contributes 12.00 ms."
                  - paragraph [ref=e1239]: "linked_design_parameter: valve_response_time contributes 8.00 ms."
                - generic [ref=e1240]:
                  - button "Open Detail" [ref=e1241] [cursor=pointer]:
                    - img [ref=e1243]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1245] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1247]
              - generic [ref=e1250]:
                - generic [ref=e1251]:
                  - paragraph [ref=e1252]: BRK-SYS-001
                  - generic [ref=e1254]: System
                  - generic [ref=e1256]: Approved
                - paragraph [ref=e1257]: Normal-mode minimum pressure
                - paragraph [ref=e1258]: Brake pressure shall be at least 6 bar in normal mode.
                - generic [ref=e1259]:
                  - paragraph [ref=e1260]: "requirement: Parsed minimum requirement: brake_pressure >= 6 bar"
                  - paragraph [ref=e1261]: "linked_design_parameter: Best available linked capability: brake_pressure_capability = 8 bar"
                - generic [ref=e1262]:
                  - button "Open Detail" [ref=e1263] [cursor=pointer]:
                    - img [ref=e1265]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1267] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1269]
              - generic [ref=e1272]:
                - generic [ref=e1273]:
                  - paragraph [ref=e1274]: BRK-SYS-002
                  - generic [ref=e1276]: System
                  - generic [ref=e1278]: Draft
                - paragraph [ref=e1279]: Conflicting upper pressure limit
                - paragraph [ref=e1280]: Brake pressure shall be at most 4 bar in normal mode.
                - generic [ref=e1281]:
                  - paragraph [ref=e1282]: "requirement: Parsed maximum requirement: brake_pressure <= 4 bar"
                  - paragraph [ref=e1283]: "linked_design_parameter: Highest comparable linked value: brake_pressure_capability = 8 bar"
                - generic [ref=e1284]:
                  - button "Open Detail" [ref=e1285] [cursor=pointer]:
                    - img [ref=e1287]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1289] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1291]
              - generic [ref=e1294]:
                - generic [ref=e1295]:
                  - paragraph [ref=e1296]: BRK-SYS-003
                  - generic [ref=e1298]: System
                  - generic [ref=e1300]: In Review
                - paragraph [ref=e1301]: Response-time limit
                - paragraph [ref=e1302]: The braking system shall limit response time to at most 100 ms in all modes.
                - generic [ref=e1303]:
                  - paragraph [ref=e1304]: "requirement: Parsed maximum timing target: 100.00 ms."
                  - paragraph [ref=e1305]: "linked_design_parameter: controller_delay contributes 4.00 ms."
                  - paragraph [ref=e1306]: "linked_design_parameter: hydraulic_build_up_estimate contributes 12.00 ms."
                  - paragraph [ref=e1307]: "linked_design_parameter: valve_response_time contributes 8.00 ms."
                - generic [ref=e1308]:
                  - button "Open Detail" [ref=e1309] [cursor=pointer]:
                    - img [ref=e1311]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1313] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1315]
              - generic [ref=e1318]:
                - generic [ref=e1319]:
                  - paragraph [ref=e1320]: BRK-SYS-004
                  - generic [ref=e1322]: System
                  - generic [ref=e1324]: Draft
                - paragraph [ref=e1325]: Conflicting response-time limit
                - paragraph [ref=e1326]: The braking system shall limit response time to at most 250 ms in all modes.
                - generic [ref=e1327]:
                  - paragraph [ref=e1328]: "requirement: Parsed maximum timing target: 250.00 ms."
                  - paragraph [ref=e1329]: "linked_design_parameter: pressure_sensor_latency contributes 15.00 ms."
                - generic [ref=e1330]:
                  - button "Open Detail" [ref=e1331] [cursor=pointer]:
                    - img [ref=e1333]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1335] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1337]
              - generic [ref=e1340]:
                - generic [ref=e1341]:
                  - paragraph [ref=e1342]: BRK-SUB-001
                  - generic [ref=e1344]: Subsystem
                  - generic [ref=e1346]: Approved
                - paragraph [ref=e1347]: Valve delay budget
                - paragraph [ref=e1348]: The hydraulic valve subsystem shall respond within 8 ms during normal mode.
                - generic [ref=e1349]:
                  - paragraph [ref=e1350]: "requirement: Parsed maximum timing target: 8.00 ms."
                  - paragraph [ref=e1351]: "linked_design_parameter: valve_response_time contributes 8.00 ms."
                - generic [ref=e1352]:
                  - button "Open Detail" [ref=e1353] [cursor=pointer]:
                    - img [ref=e1355]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1357] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1359]
              - generic [ref=e1362]:
                - generic [ref=e1363]:
                  - paragraph [ref=e1364]: BRK-SUB-002
                  - generic [ref=e1366]: Subsystem
                  - generic [ref=e1368]: Approved
                - paragraph [ref=e1369]: Controller latency
                - paragraph [ref=e1370]: The brake controller shall process a pedal request within 4 ms in normal mode.
                - generic [ref=e1371]:
                  - paragraph [ref=e1372]: "requirement: Parsed maximum timing target: 4.00 ms."
                  - paragraph [ref=e1373]: "linked_design_parameter: controller_delay contributes 4.00 ms."
                - generic [ref=e1374]:
                  - button "Open Detail" [ref=e1375] [cursor=pointer]:
                    - img [ref=e1377]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1379] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1381]
              - generic [ref=e1384]:
                - generic [ref=e1385]:
                  - paragraph [ref=e1386]: BRK-SUB-003
                  - generic [ref=e1388]: Subsystem
                  - generic [ref=e1390]: Approved
                - paragraph [ref=e1391]: Hydraulic build-up estimate
                - paragraph [ref=e1392]: The hydraulic circuit shall build pressure within 12 ms during normal mode.
                - generic [ref=e1393]:
                  - paragraph [ref=e1394]: "requirement: Parsed maximum timing target: 12.00 ms."
                  - paragraph [ref=e1395]: "linked_design_parameter: hydraulic_build_up_estimate contributes 12.00 ms."
                - generic [ref=e1396]:
                  - button "Open Detail" [ref=e1397] [cursor=pointer]:
                    - img [ref=e1399]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1401] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1403]
              - generic [ref=e1406]:
                - generic [ref=e1407]:
                  - paragraph [ref=e1408]: BRK-HWE-001
                  - generic [ref=e1410]: Hardware
                  - generic [ref=e1412]: Approved
                - paragraph [ref=e1413]: Operating voltage range
                - paragraph [ref=e1414]: The brake controller hardware shall operate between 9 V and 16 V in normal mode.
                - paragraph [ref=e1416]: "requirement: Parsed measurable constraint: type=range, parameter=operate between, value=9.0, unit=v."
                - generic [ref=e1417]:
                  - button "Open Detail" [ref=e1418] [cursor=pointer]:
                    - img [ref=e1420]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1422] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1424]
              - generic [ref=e1427]:
                - generic [ref=e1428]:
                  - paragraph [ref=e1429]: BRK-HWE-002
                  - generic [ref=e1431]: Hardware
                  - generic [ref=e1433]: Draft
                - paragraph [ref=e1434]: Conflicting minimum voltage
                - paragraph [ref=e1435]: The brake controller hardware shall operate at least 18 V in normal mode.
                - paragraph [ref=e1437]: "requirement: Parsed measurable constraint: type=min_value, parameter=operate, value=18.0, unit=v."
                - generic [ref=e1438]:
                  - button "Open Detail" [ref=e1439] [cursor=pointer]:
                    - img [ref=e1441]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1443] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1445]
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
  65 |     await page.getByRole("button", { name: "Validation" }).click();
  66 |     await expect(page.getByRole("heading", { name: "Validation", exact: true })).toBeVisible();
  67 |     await expect(page.getByText("Requirements assessed").first()).toBeVisible();
  68 |     await expect(page.getByRole("button", { name: /Requirement Quality Warnings/i })).toBeVisible();
  69 |     await expect(page.getByText("BRK-SWE-002").first()).toBeVisible();
  70 | 
  71 |     await page.getByRole("button", { name: "Open Traceability" }).first().click();
  72 |     await expect(page).toHaveURL(/tab=traceability/);
  73 |     await expect(page.getByRole("heading", { name: "Validation Traceability" })).toBeVisible();
  74 | 
  75 |     await page.getByRole("button", { name: "Reports" }).click();
  76 |     await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
  77 |     await expect(page.getByText("# Project Report: braking-system")).toBeVisible();
> 78 |     await expect(page.getByRole("heading", { name: "Quality Warning Summary" })).toBeVisible();
     |                                                                                  ^ Error: expect(locator).toBeVisible() failed
  79 |     await expect(page.getByRole("heading", { name: "Feasibility Summary" })).toBeVisible();
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