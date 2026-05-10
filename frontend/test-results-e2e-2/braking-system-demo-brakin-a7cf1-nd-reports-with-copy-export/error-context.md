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
Error: strict mode violation: getByRole('heading', { name: 'Validation' }) resolved to 2 elements:
    1) <h4 class="MuiTypography-root MuiTypography-h4 css-158fuhi">Validation</h4> aka getByRole('heading', { name: 'Validation', exact: true })
    2) <h6 class="MuiTypography-root MuiTypography-subtitle2 css-1gm6ud5">Loading validation outputs</h6> aka getByRole('heading', { name: 'Loading validation outputs' })

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Validation' })

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
        - heading "Validation" [level=4] [ref=e98]
        - paragraph [ref=e99]: Review quality warnings, parsing coverage, correlation findings, and feasibility assessments for the full project.
      - generic [ref=e100]:
        - generic [ref=e101]:
          - generic [ref=e104]:
            - paragraph [ref=e105]: Requirements assessed
            - heading "15" [level=4] [ref=e106]
            - paragraph [ref=e107]: Current requirements included in the project-level validation rollup.
          - generic [ref=e110]:
            - paragraph [ref=e111]: Quality warnings
            - heading "10" [level=4] [ref=e112]
            - paragraph [ref=e113]: Deterministic wording and testability findings across the current project.
          - generic [ref=e116]:
            - paragraph [ref=e117]: Parsing coverage
            - heading "69%" [level=4] [ref=e118]
            - paragraph [ref=e119]: Average structured-field extraction coverage across project requirements.
          - generic [ref=e122]:
            - paragraph [ref=e123]: Feasible assessments
            - heading "6" [level=4] [ref=e124]
            - paragraph [ref=e125]: Requirements whose current linked design evidence is assessed as feasible.
        - generic [ref=e126]:
          - heading "Requirement Quality Warnings Requirements with current deterministic quality findings, grouped from the live quality checker." [level=3] [ref=e127]:
            - button "Requirement Quality Warnings Requirements with current deterministic quality findings, grouped from the live quality checker." [expanded] [ref=e128] [cursor=pointer]:
              - generic [ref=e130]:
                - heading "Requirement Quality Warnings" [level=6] [ref=e131]
                - paragraph [ref=e132]: Requirements with current deterministic quality findings, grouped from the live quality checker.
              - img [ref=e134]
          - region [ref=e139]:
            - generic [ref=e141]:
              - generic [ref=e143]:
                - generic [ref=e144]:
                  - paragraph [ref=e145]: BRK-SWE-001
                  - generic [ref=e147]: Software
                  - generic [ref=e149]: Draft
                - paragraph [ref=e150]: Wheel-end monitoring
                - paragraph [ref=e151]: The software shall monitor wheel-end pressure and log diagnostic deviations during normal and degraded mode.
                - generic [ref=e152]:
                  - generic [ref=e153]:
                    - generic [ref=e155]:
                      - img [ref=e156]
                      - generic [ref=e158]: high · Missing numeric value
                    - paragraph [ref=e159]: The statement appears to describe a measurable constraint or performance target without a number.
                    - paragraph [ref=e160]: "Suggestion: Add the required numeric threshold or limit so the requirement is measurable."
                  - generic [ref=e161]:
                    - generic [ref=e163]:
                      - img [ref=e164]
                      - generic [ref=e166]: medium · Possible compound requirement
                    - paragraph [ref=e167]: The statement may contain multiple obligations bundled into one requirement.
                    - paragraph [ref=e168]: "Suggestion: Split the statement into separate requirements so each one expresses a single verifiable obligation."
                - generic [ref=e169]:
                  - button "Open Detail" [ref=e170] [cursor=pointer]:
                    - img [ref=e172]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e174] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e176]
              - generic [ref=e179]:
                - generic [ref=e180]:
                  - paragraph [ref=e181]: BRK-SWE-002
                  - generic [ref=e183]: Software
                  - generic [ref=e185]: Draft
                - paragraph [ref=e186]: Weak software wording
                - paragraph [ref=e187]: The software shall quickly provide user-friendly brake status messages.
                - generic [ref=e189]:
                  - generic [ref=e191]:
                    - img [ref=e192]
                    - generic [ref=e194]: medium · Ambiguous wording detected
                  - paragraph [ref=e195]: "The requirement uses vague terms: quickly, user-friendly."
                  - paragraph [ref=e196]: "Suggestion: Replace the vague wording with measurable thresholds or specific acceptance criteria."
                - generic [ref=e197]:
                  - button "Open Detail" [ref=e198] [cursor=pointer]:
                    - img [ref=e200]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e202] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e204]
              - generic [ref=e207]:
                - generic [ref=e208]:
                  - paragraph [ref=e209]: BRK-SWE-003
                  - generic [ref=e211]: Software
                  - generic [ref=e213]: Draft
                - paragraph [ref=e214]: Weak compound software requirement
                - paragraph [ref=e215]: The software should robustly detect wheel slip and notify the driver and log the event as needed.
                - generic [ref=e216]:
                  - generic [ref=e217]:
                    - generic [ref=e219]:
                      - img [ref=e220]
                      - generic [ref=e222]: medium · Non-testable language detected
                    - paragraph [ref=e223]: The statement includes wording that is difficult to verify objectively.
                    - paragraph [ref=e224]: "Suggestion: Rewrite the statement so it can be verified by inspection, analysis, test, or measurement."
                  - generic [ref=e225]:
                    - generic [ref=e227]:
                      - img [ref=e228]
                      - generic [ref=e230]: medium · Weak or passive phrasing detected
                    - paragraph [ref=e231]: The requirement uses weak modal language or passive voice, which can reduce clarity.
                    - paragraph [ref=e232]: "Suggestion: Prefer direct active phrasing such as 'The system shall ...' with a clear subject and action."
                - generic [ref=e233]:
                  - button "Open Detail" [ref=e234] [cursor=pointer]:
                    - img [ref=e236]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e238] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e240]
              - generic [ref=e243]:
                - generic [ref=e244]:
                  - paragraph [ref=e245]: BRK-HWE-001
                  - generic [ref=e247]: Hardware
                  - generic [ref=e249]: Approved
                - paragraph [ref=e250]: Operating voltage range
                - paragraph [ref=e251]: The brake controller hardware shall operate between 9 V and 16 V in normal mode.
                - generic [ref=e253]:
                  - generic [ref=e255]:
                    - img [ref=e256]
                    - generic [ref=e258]: medium · Possible compound requirement
                  - paragraph [ref=e259]: The statement may contain multiple obligations bundled into one requirement.
                  - paragraph [ref=e260]: "Suggestion: Split the statement into separate requirements so each one expresses a single verifiable obligation."
                - generic [ref=e261]:
                  - button "Open Detail" [ref=e262] [cursor=pointer]:
                    - img [ref=e264]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e266] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e268]
              - generic [ref=e271]:
                - generic [ref=e272]:
                  - paragraph [ref=e273]: BRK-HWE-003
                  - generic [ref=e275]: Hardware
                  - generic [ref=e277]: Draft
                - paragraph [ref=e278]: Weak hardware wording
                - paragraph [ref=e279]: The hardware shall be efficient and robust during startup.
                - generic [ref=e280]:
                  - generic [ref=e281]:
                    - generic [ref=e283]:
                      - img [ref=e284]
                      - generic [ref=e286]: medium · Ambiguous wording detected
                    - paragraph [ref=e287]: "The requirement uses vague terms: efficient, robust."
                    - paragraph [ref=e288]: "Suggestion: Replace the vague wording with measurable thresholds or specific acceptance criteria."
                  - generic [ref=e289]:
                    - generic [ref=e291]:
                      - img [ref=e292]
                      - generic [ref=e294]: medium · Possible compound requirement
                    - paragraph [ref=e295]: The statement may contain multiple obligations bundled into one requirement.
                    - paragraph [ref=e296]: "Suggestion: Split the statement into separate requirements so each one expresses a single verifiable obligation."
                - generic [ref=e297]:
                  - button "Open Detail" [ref=e298] [cursor=pointer]:
                    - img [ref=e300]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e302] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e304]
              - generic [ref=e307]:
                - generic [ref=e308]:
                  - paragraph [ref=e309]: BRK-STK-001
                  - generic [ref=e311]: Stakeholder
                  - generic [ref=e313]: In Review
                - paragraph [ref=e314]: Predictable brake response
                - paragraph [ref=e315]: The vehicle shall provide predictable braking response for the driver during normal operation.
                - generic [ref=e317]:
                  - generic [ref=e319]:
                    - img [ref=e320]
                    - generic [ref=e322]: high · Missing numeric value
                  - paragraph [ref=e323]: The statement appears to describe a measurable constraint or performance target without a number.
                  - paragraph [ref=e324]: "Suggestion: Add the required numeric threshold or limit so the requirement is measurable."
                - generic [ref=e325]:
                  - button "Open Detail" [ref=e326] [cursor=pointer]:
                    - img [ref=e328]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e330] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e332]
              - generic [ref=e335]:
                - generic [ref=e336]:
                  - paragraph [ref=e337]: BRK-STK-002
                  - generic [ref=e339]: Stakeholder
                  - generic [ref=e341]: In Review
                - paragraph [ref=e342]: Fast pressure build-up
                - paragraph [ref=e343]: At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.
                - generic [ref=e345]:
                  - generic [ref=e347]:
                    - img [ref=e348]
                    - generic [ref=e350]: medium · Ambiguous wording detected
                  - paragraph [ref=e351]: "The requirement uses vague terms: fast."
                  - paragraph [ref=e352]: "Suggestion: Replace the vague wording with measurable thresholds or specific acceptance criteria."
                - generic [ref=e353]:
                  - button "Open Detail" [ref=e354] [cursor=pointer]:
                    - img [ref=e356]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e358] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e360]
        - generic [ref=e362]:
          - heading "Structured Parsing Coverage Requirements where the current deterministic parser leaves some fields unfilled." [level=3] [ref=e363]:
            - button "Structured Parsing Coverage Requirements where the current deterministic parser leaves some fields unfilled." [expanded] [ref=e364] [cursor=pointer]:
              - generic [ref=e366]:
                - heading "Structured Parsing Coverage" [level=6] [ref=e367]
                - paragraph [ref=e368]: Requirements where the current deterministic parser leaves some fields unfilled.
              - img [ref=e370]
          - region [ref=e375]:
            - generic [ref=e377]:
              - generic [ref=e379]:
                - generic [ref=e380]:
                  - paragraph [ref=e381]: BRK-SUB-002
                  - generic [ref=e383]: Subsystem
                  - generic [ref=e385]: Approved
                - paragraph [ref=e386]: Controller latency
                - paragraph [ref=e387]: The brake controller shall process a pedal request within 4 ms in normal mode.
                - generic [ref=e388]:
                  - paragraph [ref=e389]: Extracted 8 of 10 structured fields.
                  - paragraph [ref=e390]: "Missing: object, condition"
                - generic [ref=e391]:
                  - button "Open Detail" [ref=e392] [cursor=pointer]:
                    - img [ref=e394]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e396] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e398]
              - generic [ref=e401]:
                - generic [ref=e402]:
                  - paragraph [ref=e403]: BRK-SUB-003
                  - generic [ref=e405]: Subsystem
                  - generic [ref=e407]: Approved
                - paragraph [ref=e408]: Hydraulic build-up estimate
                - paragraph [ref=e409]: The hydraulic circuit shall build pressure within 12 ms during normal mode.
                - generic [ref=e410]:
                  - paragraph [ref=e411]: Extracted 9 of 10 structured fields.
                  - paragraph [ref=e412]: "Missing: object"
                - generic [ref=e413]:
                  - button "Open Detail" [ref=e414] [cursor=pointer]:
                    - img [ref=e416]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e418] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e420]
              - generic [ref=e423]:
                - generic [ref=e424]:
                  - paragraph [ref=e425]: BRK-SWE-001
                  - generic [ref=e427]: Software
                  - generic [ref=e429]: Draft
                - paragraph [ref=e430]: Wheel-end monitoring
                - paragraph [ref=e431]: The software shall monitor wheel-end pressure and log diagnostic deviations during normal and degraded mode.
                - generic [ref=e432]:
                  - paragraph [ref=e433]: Extracted 6 of 10 structured fields.
                  - paragraph [ref=e434]: "Missing: parameter, operator, value, unit"
                - generic [ref=e435]:
                  - button "Open Detail" [ref=e436] [cursor=pointer]:
                    - img [ref=e438]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e440] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e442]
              - generic [ref=e445]:
                - generic [ref=e446]:
                  - paragraph [ref=e447]: BRK-SWE-002
                  - generic [ref=e449]: Software
                  - generic [ref=e451]: Draft
                - paragraph [ref=e452]: Weak software wording
                - paragraph [ref=e453]: The software shall quickly provide user-friendly brake status messages.
                - generic [ref=e454]:
                  - paragraph [ref=e455]: Extracted 4 of 10 structured fields.
                  - paragraph [ref=e456]: "Missing: parameter, operator, value, unit, timing, condition"
                - generic [ref=e457]:
                  - button "Open Detail" [ref=e458] [cursor=pointer]:
                    - img [ref=e460]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e462] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e464]
              - generic [ref=e467]:
                - generic [ref=e468]:
                  - paragraph [ref=e469]: BRK-SWE-003
                  - generic [ref=e471]: Software
                  - generic [ref=e473]: Draft
                - paragraph [ref=e474]: Weak compound software requirement
                - paragraph [ref=e475]: The software should robustly detect wheel slip and notify the driver and log the event as needed.
                - generic [ref=e476]:
                  - paragraph [ref=e477]: Extracted 4 of 10 structured fields.
                  - paragraph [ref=e478]: "Missing: parameter, operator, value, unit, timing, condition"
                - generic [ref=e479]:
                  - button "Open Detail" [ref=e480] [cursor=pointer]:
                    - img [ref=e482]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e484] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e486]
              - generic [ref=e489]:
                - generic [ref=e490]:
                  - paragraph [ref=e491]: BRK-HWE-001
                  - generic [ref=e493]: Hardware
                  - generic [ref=e495]: Approved
                - paragraph [ref=e496]: Operating voltage range
                - paragraph [ref=e497]: The brake controller hardware shall operate between 9 V and 16 V in normal mode.
                - generic [ref=e498]:
                  - paragraph [ref=e499]: Extracted 7 of 10 structured fields.
                  - paragraph [ref=e500]: "Missing: operator, timing, condition"
                - generic [ref=e501]:
                  - button "Open Detail" [ref=e502] [cursor=pointer]:
                    - img [ref=e504]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e506] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e508]
              - generic [ref=e511]:
                - generic [ref=e512]:
                  - paragraph [ref=e513]: BRK-HWE-002
                  - generic [ref=e515]: Hardware
                  - generic [ref=e517]: Draft
                - paragraph [ref=e518]: Conflicting minimum voltage
                - paragraph [ref=e519]: The brake controller hardware shall operate at least 18 V in normal mode.
                - generic [ref=e520]:
                  - paragraph [ref=e521]: Extracted 8 of 10 structured fields.
                  - paragraph [ref=e522]: "Missing: timing, condition"
                - generic [ref=e523]:
                  - button "Open Detail" [ref=e524] [cursor=pointer]:
                    - img [ref=e526]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e528] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e530]
              - generic [ref=e533]:
                - generic [ref=e534]:
                  - paragraph [ref=e535]: BRK-HWE-003
                  - generic [ref=e537]: Hardware
                  - generic [ref=e539]: Draft
                - paragraph [ref=e540]: Weak hardware wording
                - paragraph [ref=e541]: The hardware shall be efficient and robust during startup.
                - generic [ref=e542]:
                  - paragraph [ref=e543]: Extracted 6 of 10 structured fields.
                  - paragraph [ref=e544]: "Missing: parameter, operator, value, unit"
                - generic [ref=e545]:
                  - button "Open Detail" [ref=e546] [cursor=pointer]:
                    - img [ref=e548]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e550] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e552]
              - generic [ref=e555]:
                - generic [ref=e556]:
                  - paragraph [ref=e557]: BRK-STK-001
                  - generic [ref=e559]: Stakeholder
                  - generic [ref=e561]: In Review
                - paragraph [ref=e562]: Predictable brake response
                - paragraph [ref=e563]: The vehicle shall provide predictable braking response for the driver during normal operation.
                - generic [ref=e564]:
                  - paragraph [ref=e565]: Extracted 6 of 10 structured fields.
                  - paragraph [ref=e566]: "Missing: parameter, operator, value, unit"
                - generic [ref=e567]:
                  - button "Open Detail" [ref=e568] [cursor=pointer]:
                    - img [ref=e570]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e572] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e574]
              - generic [ref=e577]:
                - generic [ref=e578]:
                  - paragraph [ref=e579]: BRK-STK-002
                  - generic [ref=e581]: Stakeholder
                  - generic [ref=e583]: In Review
                - paragraph [ref=e584]: Fast pressure build-up
                - paragraph [ref=e585]: At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.
                - generic [ref=e586]:
                  - paragraph [ref=e587]: Extracted 5 of 10 structured fields.
                  - paragraph [ref=e588]: "Missing: object, operator, unit, timing, condition"
                - generic [ref=e589]:
                  - button "Open Detail" [ref=e590] [cursor=pointer]:
                    - img [ref=e592]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e594] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e596]
              - generic [ref=e599]:
                - generic [ref=e600]:
                  - paragraph [ref=e601]: BRK-SYS-001
                  - generic [ref=e603]: System
                  - generic [ref=e605]: Approved
                - paragraph [ref=e606]: Normal-mode minimum pressure
                - paragraph [ref=e607]: Brake pressure shall be at least 6 bar in normal mode.
                - generic [ref=e608]:
                  - paragraph [ref=e609]: Extracted 8 of 10 structured fields.
                  - paragraph [ref=e610]: "Missing: timing, condition"
                - generic [ref=e611]:
                  - button "Open Detail" [ref=e612] [cursor=pointer]:
                    - img [ref=e614]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e616] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e618]
              - generic [ref=e621]:
                - generic [ref=e622]:
                  - paragraph [ref=e623]: BRK-SYS-002
                  - generic [ref=e625]: System
                  - generic [ref=e627]: Draft
                - paragraph [ref=e628]: Conflicting upper pressure limit
                - paragraph [ref=e629]: Brake pressure shall be at most 4 bar in normal mode.
                - generic [ref=e630]:
                  - paragraph [ref=e631]: Extracted 8 of 10 structured fields.
                  - paragraph [ref=e632]: "Missing: timing, condition"
                - generic [ref=e633]:
                  - button "Open Detail" [ref=e634] [cursor=pointer]:
                    - img [ref=e636]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e638] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e640]
              - generic [ref=e643]:
                - generic [ref=e644]:
                  - paragraph [ref=e645]: BRK-SYS-003
                  - generic [ref=e647]: System
                  - generic [ref=e649]: In Review
                - paragraph [ref=e650]: Response-time limit
                - paragraph [ref=e651]: The braking system shall limit response time to at most 100 ms in all modes.
                - generic [ref=e652]:
                  - paragraph [ref=e653]: Extracted 8 of 10 structured fields.
                  - paragraph [ref=e654]: "Missing: timing, condition"
                - generic [ref=e655]:
                  - button "Open Detail" [ref=e656] [cursor=pointer]:
                    - img [ref=e658]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e660] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e662]
              - generic [ref=e665]:
                - generic [ref=e666]:
                  - paragraph [ref=e667]: BRK-SYS-004
                  - generic [ref=e669]: System
                  - generic [ref=e671]: Draft
                - paragraph [ref=e672]: Conflicting response-time limit
                - paragraph [ref=e673]: The braking system shall limit response time to at most 250 ms in all modes.
                - generic [ref=e674]:
                  - paragraph [ref=e675]: Extracted 8 of 10 structured fields.
                  - paragraph [ref=e676]: "Missing: timing, condition"
                - generic [ref=e677]:
                  - button "Open Detail" [ref=e678] [cursor=pointer]:
                    - img [ref=e680]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e682] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e684]
              - generic [ref=e687]:
                - generic [ref=e688]:
                  - paragraph [ref=e689]: BRK-SUB-001
                  - generic [ref=e691]: Subsystem
                  - generic [ref=e693]: Approved
                - paragraph [ref=e694]: Valve delay budget
                - paragraph [ref=e695]: The hydraulic valve subsystem shall respond within 8 ms during normal mode.
                - generic [ref=e696]:
                  - paragraph [ref=e697]: Extracted 9 of 10 structured fields.
                  - paragraph [ref=e698]: "Missing: object"
                - generic [ref=e699]:
                  - button "Open Detail" [ref=e700] [cursor=pointer]:
                    - img [ref=e702]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e704] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e706]
        - generic [ref=e708]:
          - heading "Correlation and Conflict Findings Requirements with related requirements or conflict findings from the current correlation engine." [level=3] [ref=e709]:
            - button "Correlation and Conflict Findings Requirements with related requirements or conflict findings from the current correlation engine." [expanded] [ref=e710] [cursor=pointer]:
              - generic [ref=e712]:
                - heading "Correlation and Conflict Findings" [level=6] [ref=e713]
                - paragraph [ref=e714]: Requirements with related requirements or conflict findings from the current correlation engine.
              - img [ref=e716]
          - region [ref=e721]:
            - generic [ref=e723]:
              - generic [ref=e725]:
                - generic [ref=e726]:
                  - paragraph [ref=e727]: BRK-SUB-002
                  - generic [ref=e729]: Subsystem
                  - generic [ref=e731]: Approved
                - paragraph [ref=e732]: Controller latency
                - paragraph [ref=e733]: The brake controller shall process a pedal request within 4 ms in normal mode.
                - generic [ref=e734]:
                  - paragraph [ref=e735]: "Related: BRK-SUB-003 · Both requirements use the same unit: ms."
                  - paragraph [ref=e736]: "Related: BRK-HWE-001 · The requirements operate in overlapping scope."
                  - paragraph [ref=e737]: "Related: BRK-HWE-002 · The requirements operate in overlapping scope."
                - generic [ref=e738]:
                  - button "Open Detail" [ref=e739] [cursor=pointer]:
                    - img [ref=e741]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e743] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e745]
              - generic [ref=e748]:
                - generic [ref=e749]:
                  - paragraph [ref=e750]: BRK-SUB-003
                  - generic [ref=e752]: Subsystem
                  - generic [ref=e754]: Approved
                - paragraph [ref=e755]: Hydraulic build-up estimate
                - paragraph [ref=e756]: The hydraulic circuit shall build pressure within 12 ms during normal mode.
                - generic [ref=e757]:
                  - paragraph [ref=e758]: "Conflict: The parsed parameter 'pressure' is paired with unit 'ms', which does not look valid for that parameter."
                  - paragraph [ref=e759]: "Related: BRK-SUB-002 · Both requirements use the same unit: ms."
                  - paragraph [ref=e760]: "Related: BRK-STK-002 · Same subsystem: Hydraulics."
                  - paragraph [ref=e761]: "Related: BRK-SYS-001 · Same subsystem: Hydraulics."
                - generic [ref=e762]:
                  - button "Open Detail" [ref=e763] [cursor=pointer]:
                    - img [ref=e765]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e767] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e769]
              - generic [ref=e772]:
                - generic [ref=e773]:
                  - paragraph [ref=e774]: BRK-SWE-001
                  - generic [ref=e776]: Software
                  - generic [ref=e778]: Draft
                - paragraph [ref=e779]: Wheel-end monitoring
                - paragraph [ref=e780]: The software shall monitor wheel-end pressure and log diagnostic deviations during normal and degraded mode.
                - generic [ref=e781]:
                  - paragraph [ref=e782]: "Related: BRK-SWE-002 · The requirements operate in overlapping scope."
                  - paragraph [ref=e783]: "Related: BRK-SWE-003 · Same subsystem: Brake Software. The requirements operate in overlapping scope."
                - generic [ref=e784]:
                  - button "Open Detail" [ref=e785] [cursor=pointer]:
                    - img [ref=e787]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e789] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e791]
              - generic [ref=e794]:
                - generic [ref=e795]:
                  - paragraph [ref=e796]: BRK-SWE-002
                  - generic [ref=e798]: Software
                  - generic [ref=e800]: Draft
                - paragraph [ref=e801]: Weak software wording
                - paragraph [ref=e802]: The software shall quickly provide user-friendly brake status messages.
                - generic [ref=e803]:
                  - paragraph [ref=e804]: "Related: BRK-SWE-001 · The requirements operate in overlapping scope."
                  - paragraph [ref=e805]: "Related: BRK-SWE-003 · The requirements operate in overlapping scope."
                - generic [ref=e806]:
                  - button "Open Detail" [ref=e807] [cursor=pointer]:
                    - img [ref=e809]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e811] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e813]
              - generic [ref=e816]:
                - generic [ref=e817]:
                  - paragraph [ref=e818]: BRK-SWE-003
                  - generic [ref=e820]: Software
                  - generic [ref=e822]: Draft
                - paragraph [ref=e823]: Weak compound software requirement
                - paragraph [ref=e824]: The software should robustly detect wheel slip and notify the driver and log the event as needed.
                - generic [ref=e825]:
                  - paragraph [ref=e826]: "Related: BRK-SWE-001 · Same subsystem: Brake Software. The requirements operate in overlapping scope."
                  - paragraph [ref=e827]: "Related: BRK-SWE-002 · The requirements operate in overlapping scope."
                - generic [ref=e828]:
                  - button "Open Detail" [ref=e829] [cursor=pointer]:
                    - img [ref=e831]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e833] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e835]
              - generic [ref=e838]:
                - generic [ref=e839]:
                  - paragraph [ref=e840]: BRK-HWE-001
                  - generic [ref=e842]: Hardware
                  - generic [ref=e844]: Approved
                - paragraph [ref=e845]: Operating voltage range
                - paragraph [ref=e846]: The brake controller hardware shall operate between 9 V and 16 V in normal mode.
                - generic [ref=e847]:
                  - paragraph [ref=e848]: "Related: BRK-SUB-002 · The requirements operate in overlapping scope."
                  - paragraph [ref=e849]: "Related: BRK-HWE-002 · Same subsystem: Brake ECU. Both requirements use the same unit: v. The requirements operate in overlapping scope."
                  - paragraph [ref=e850]: "Related: BRK-HWE-003 · Same subsystem: Brake ECU."
                - generic [ref=e851]:
                  - button "Open Detail" [ref=e852] [cursor=pointer]:
                    - img [ref=e854]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e856] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e858]
              - generic [ref=e861]:
                - generic [ref=e862]:
                  - paragraph [ref=e863]: BRK-HWE-002
                  - generic [ref=e865]: Hardware
                  - generic [ref=e867]: Draft
                - paragraph [ref=e868]: Conflicting minimum voltage
                - paragraph [ref=e869]: The brake controller hardware shall operate at least 18 V in normal mode.
                - generic [ref=e870]:
                  - paragraph [ref=e871]: "Related: BRK-SUB-002 · The requirements operate in overlapping scope."
                  - paragraph [ref=e872]: "Related: BRK-HWE-001 · Same subsystem: Brake ECU. Both requirements use the same unit: v. The requirements operate in overlapping scope."
                  - paragraph [ref=e873]: "Related: BRK-HWE-003 · Same subsystem: Brake ECU."
                - generic [ref=e874]:
                  - button "Open Detail" [ref=e875] [cursor=pointer]:
                    - img [ref=e877]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e879] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e881]
              - generic [ref=e884]:
                - generic [ref=e885]:
                  - paragraph [ref=e886]: BRK-HWE-003
                  - generic [ref=e888]: Hardware
                  - generic [ref=e890]: Draft
                - paragraph [ref=e891]: Weak hardware wording
                - paragraph [ref=e892]: The hardware shall be efficient and robust during startup.
                - generic [ref=e893]:
                  - paragraph [ref=e894]: "Related: BRK-HWE-001 · Same subsystem: Brake ECU."
                  - paragraph [ref=e895]: "Related: BRK-HWE-002 · Same subsystem: Brake ECU."
                - generic [ref=e896]:
                  - button "Open Detail" [ref=e897] [cursor=pointer]:
                    - img [ref=e899]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e901] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e903]
              - generic [ref=e906]:
                - generic [ref=e907]:
                  - paragraph [ref=e908]: BRK-STK-001
                  - generic [ref=e910]: Stakeholder
                  - generic [ref=e912]: In Review
                - paragraph [ref=e913]: Predictable brake response
                - paragraph [ref=e914]: The vehicle shall provide predictable braking response for the driver during normal operation.
                - generic [ref=e915]:
                  - paragraph [ref=e916]: "Related: BRK-SUB-002 · Same subsystem: Brake Control."
                  - paragraph [ref=e917]: "Related: BRK-SYS-003 · Same subsystem: Brake Control."
                  - paragraph [ref=e918]: "Related: BRK-SYS-004 · Same subsystem: Brake Control."
                - generic [ref=e919]:
                  - button "Open Detail" [ref=e920] [cursor=pointer]:
                    - img [ref=e922]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e924] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e926]
              - generic [ref=e929]:
                - generic [ref=e930]:
                  - paragraph [ref=e931]: BRK-STK-002
                  - generic [ref=e933]: Stakeholder
                  - generic [ref=e935]: In Review
                - paragraph [ref=e936]: Fast pressure build-up
                - paragraph [ref=e937]: At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.
                - generic [ref=e938]:
                  - paragraph [ref=e939]: "Related: BRK-SUB-003 · Same subsystem: Hydraulics."
                  - paragraph [ref=e940]: "Related: BRK-SYS-001 · Same subsystem: Hydraulics."
                  - paragraph [ref=e941]: "Related: BRK-SYS-002 · Same subsystem: Hydraulics."
                - generic [ref=e942]:
                  - button "Open Detail" [ref=e943] [cursor=pointer]:
                    - img [ref=e945]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e947] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e949]
              - generic [ref=e952]:
                - generic [ref=e953]:
                  - paragraph [ref=e954]: BRK-SYS-001
                  - generic [ref=e956]: System
                  - generic [ref=e958]: Approved
                - paragraph [ref=e959]: Normal-mode minimum pressure
                - paragraph [ref=e960]: Brake pressure shall be at least 6 bar in normal mode.
                - generic [ref=e961]:
                  - paragraph [ref=e962]: "Related: BRK-SUB-003 · Same subsystem: Hydraulics."
                  - paragraph [ref=e963]: "Related: BRK-STK-002 · Same subsystem: Hydraulics."
                  - paragraph [ref=e964]: "Related: BRK-SYS-002 · Same subsystem: Hydraulics. Both requirements use the same unit: bar. The requirements operate in overlapping scope."
                - generic [ref=e965]:
                  - button "Open Detail" [ref=e966] [cursor=pointer]:
                    - img [ref=e968]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e970] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e972]
              - generic [ref=e975]:
                - generic [ref=e976]:
                  - paragraph [ref=e977]: BRK-SYS-002
                  - generic [ref=e979]: System
                  - generic [ref=e981]: Draft
                - paragraph [ref=e982]: Conflicting upper pressure limit
                - paragraph [ref=e983]: Brake pressure shall be at most 4 bar in normal mode.
                - generic [ref=e984]:
                  - paragraph [ref=e985]: "Related: BRK-SUB-003 · Same subsystem: Hydraulics."
                  - paragraph [ref=e986]: "Related: BRK-STK-002 · Same subsystem: Hydraulics."
                  - paragraph [ref=e987]: "Related: BRK-SYS-001 · Same subsystem: Hydraulics. Both requirements use the same unit: bar. The requirements operate in overlapping scope."
                - generic [ref=e988]:
                  - button "Open Detail" [ref=e989] [cursor=pointer]:
                    - img [ref=e991]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e993] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e995]
              - generic [ref=e998]:
                - generic [ref=e999]:
                  - paragraph [ref=e1000]: BRK-SYS-003
                  - generic [ref=e1002]: System
                  - generic [ref=e1004]: In Review
                - paragraph [ref=e1005]: Response-time limit
                - paragraph [ref=e1006]: The braking system shall limit response time to at most 100 ms in all modes.
                - generic [ref=e1007]:
                  - paragraph [ref=e1008]: "Conflict: BRK-SYS-004 · The requirements define different upper bounds for the same parameter under overlapping conditions."
                  - paragraph [ref=e1009]: "Related: BRK-SUB-002 · Same subsystem: Brake Control. Both requirements use the same unit: ms."
                  - paragraph [ref=e1010]: "Related: BRK-SUB-003 · Both requirements use the same unit: ms."
                  - paragraph [ref=e1011]: "Related: BRK-STK-001 · Same subsystem: Brake Control."
                - generic [ref=e1012]:
                  - button "Open Detail" [ref=e1013] [cursor=pointer]:
                    - img [ref=e1015]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1017] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1019]
              - generic [ref=e1022]:
                - generic [ref=e1023]:
                  - paragraph [ref=e1024]: BRK-SYS-004
                  - generic [ref=e1026]: System
                  - generic [ref=e1028]: Draft
                - paragraph [ref=e1029]: Conflicting response-time limit
                - paragraph [ref=e1030]: The braking system shall limit response time to at most 250 ms in all modes.
                - generic [ref=e1031]:
                  - paragraph [ref=e1032]: "Conflict: BRK-SYS-003 · The requirements define different upper bounds for the same parameter under overlapping conditions."
                  - paragraph [ref=e1033]: "Related: BRK-SUB-002 · Same subsystem: Brake Control. Both requirements use the same unit: ms."
                  - paragraph [ref=e1034]: "Related: BRK-SUB-003 · Both requirements use the same unit: ms."
                  - paragraph [ref=e1035]: "Related: BRK-STK-001 · Same subsystem: Brake Control."
                - generic [ref=e1036]:
                  - button "Open Detail" [ref=e1037] [cursor=pointer]:
                    - img [ref=e1039]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1041] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1043]
              - generic [ref=e1046]:
                - generic [ref=e1047]:
                  - paragraph [ref=e1048]: BRK-SUB-001
                  - generic [ref=e1050]: Subsystem
                  - generic [ref=e1052]: Approved
                - paragraph [ref=e1053]: Valve delay budget
                - paragraph [ref=e1054]: The hydraulic valve subsystem shall respond within 8 ms during normal mode.
                - generic [ref=e1055]:
                  - paragraph [ref=e1056]: "Related: BRK-SUB-002 · Both requirements use the same unit: ms."
                  - paragraph [ref=e1057]: "Related: BRK-SUB-003 · Same subsystem: Hydraulics. Both requirements use the same unit: ms."
                  - paragraph [ref=e1058]: "Related: BRK-STK-002 · Same subsystem: Hydraulics."
                - generic [ref=e1059]:
                  - button "Open Detail" [ref=e1060] [cursor=pointer]:
                    - img [ref=e1062]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1064] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1066]
        - generic [ref=e1068]:
          - heading "Feasibility Findings Requirements whose current linked evidence is infeasible, warning-level, or insufficient." [level=3] [ref=e1069]:
            - button "Feasibility Findings Requirements whose current linked evidence is infeasible, warning-level, or insufficient." [expanded] [ref=e1070] [cursor=pointer]:
              - generic [ref=e1072]:
                - heading "Feasibility Findings" [level=6] [ref=e1073]
                - paragraph [ref=e1074]: Requirements whose current linked evidence is infeasible, warning-level, or insufficient.
              - img [ref=e1076]
          - region [ref=e1081]:
            - generic [ref=e1083]:
              - generic [ref=e1085]:
                - generic [ref=e1086]:
                  - paragraph [ref=e1087]: BRK-SWE-001
                  - generic [ref=e1089]: Software
                  - generic [ref=e1091]: Draft
                - paragraph [ref=e1092]: Wheel-end monitoring
                - paragraph [ref=e1093]: The software shall monitor wheel-end pressure and log diagnostic deviations during normal and degraded mode.
                - generic [ref=e1094]:
                  - generic [ref=e1095]:
                    - generic [ref=e1096]:
                      - img [ref=e1097]
                      - generic [ref=e1099]: warning
                    - generic [ref=e1101]: Confidence 43%
                  - paragraph [ref=e1102]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
                - generic [ref=e1103]:
                  - button "Open Detail" [ref=e1104] [cursor=pointer]:
                    - img [ref=e1106]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1108] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1110]
              - generic [ref=e1113]:
                - generic [ref=e1114]:
                  - paragraph [ref=e1115]: BRK-SWE-002
                  - generic [ref=e1117]: Software
                  - generic [ref=e1119]: Draft
                - paragraph [ref=e1120]: Weak software wording
                - paragraph [ref=e1121]: The software shall quickly provide user-friendly brake status messages.
                - generic [ref=e1122]:
                  - generic [ref=e1123]:
                    - generic [ref=e1124]:
                      - img [ref=e1125]
                      - generic [ref=e1127]: warning
                    - generic [ref=e1129]: Confidence 43%
                  - paragraph [ref=e1130]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
                - generic [ref=e1131]:
                  - button "Open Detail" [ref=e1132] [cursor=pointer]:
                    - img [ref=e1134]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1136] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1138]
              - generic [ref=e1141]:
                - generic [ref=e1142]:
                  - paragraph [ref=e1143]: BRK-SWE-003
                  - generic [ref=e1145]: Software
                  - generic [ref=e1147]: Draft
                - paragraph [ref=e1148]: Weak compound software requirement
                - paragraph [ref=e1149]: The software should robustly detect wheel slip and notify the driver and log the event as needed.
                - generic [ref=e1150]:
                  - generic [ref=e1151]:
                    - generic [ref=e1152]:
                      - img [ref=e1153]
                      - generic [ref=e1155]: warning
                    - generic [ref=e1157]: Confidence 43%
                  - paragraph [ref=e1158]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
                - generic [ref=e1159]:
                  - button "Open Detail" [ref=e1160] [cursor=pointer]:
                    - img [ref=e1162]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1164] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1166]
              - generic [ref=e1169]:
                - generic [ref=e1170]:
                  - paragraph [ref=e1171]: BRK-HWE-001
                  - generic [ref=e1173]: Hardware
                  - generic [ref=e1175]: Approved
                - paragraph [ref=e1176]: Operating voltage range
                - paragraph [ref=e1177]: The brake controller hardware shall operate between 9 V and 16 V in normal mode.
                - generic [ref=e1178]:
                  - generic [ref=e1179]:
                    - generic [ref=e1180]:
                      - img [ref=e1181]
                      - generic [ref=e1183]: insufficient data
                    - generic [ref=e1185]: Confidence 52%
                  - paragraph [ref=e1186]: A range requirement was expected, but the numeric bounds could not be parsed.
                  - paragraph [ref=e1187]: "requirement: Parsed measurable constraint: type=range, parameter=operate between, value=9.0, unit=v."
                - generic [ref=e1188]:
                  - button "Open Detail" [ref=e1189] [cursor=pointer]:
                    - img [ref=e1191]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1193] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1195]
              - generic [ref=e1198]:
                - generic [ref=e1199]:
                  - paragraph [ref=e1200]: BRK-HWE-002
                  - generic [ref=e1202]: Hardware
                  - generic [ref=e1204]: Draft
                - paragraph [ref=e1205]: Conflicting minimum voltage
                - paragraph [ref=e1206]: The brake controller hardware shall operate at least 18 V in normal mode.
                - generic [ref=e1207]:
                  - generic [ref=e1208]:
                    - generic [ref=e1209]:
                      - img [ref=e1210]
                      - generic [ref=e1212]: insufficient data
                    - generic [ref=e1214]: Confidence 52%
                  - paragraph [ref=e1215]: A minimum-value requirement was detected, but no comparable linked design parameters were available.
                  - paragraph [ref=e1216]: "requirement: Parsed measurable constraint: type=min_value, parameter=operate, value=18.0, unit=v."
                - generic [ref=e1217]:
                  - button "Open Detail" [ref=e1218] [cursor=pointer]:
                    - img [ref=e1220]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1222] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1224]
              - generic [ref=e1227]:
                - generic [ref=e1228]:
                  - paragraph [ref=e1229]: BRK-HWE-003
                  - generic [ref=e1231]: Hardware
                  - generic [ref=e1233]: Draft
                - paragraph [ref=e1234]: Weak hardware wording
                - paragraph [ref=e1235]: The hardware shall be efficient and robust during startup.
                - generic [ref=e1236]:
                  - generic [ref=e1237]:
                    - generic [ref=e1238]:
                      - img [ref=e1239]
                      - generic [ref=e1241]: warning
                    - generic [ref=e1243]: Confidence 43%
                  - paragraph [ref=e1244]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
                - generic [ref=e1245]:
                  - button "Open Detail" [ref=e1246] [cursor=pointer]:
                    - img [ref=e1248]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1250] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1252]
              - generic [ref=e1255]:
                - generic [ref=e1256]:
                  - paragraph [ref=e1257]: BRK-STK-001
                  - generic [ref=e1259]: Stakeholder
                  - generic [ref=e1261]: In Review
                - paragraph [ref=e1262]: Predictable brake response
                - paragraph [ref=e1263]: The vehicle shall provide predictable braking response for the driver during normal operation.
                - generic [ref=e1264]:
                  - generic [ref=e1265]:
                    - generic [ref=e1266]:
                      - img [ref=e1267]
                      - generic [ref=e1269]: warning
                    - generic [ref=e1271]: Confidence 43%
                  - paragraph [ref=e1272]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
                - generic [ref=e1273]:
                  - button "Open Detail" [ref=e1274] [cursor=pointer]:
                    - img [ref=e1276]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1278] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1280]
              - generic [ref=e1283]:
                - generic [ref=e1284]:
                  - paragraph [ref=e1285]: BRK-STK-002
                  - generic [ref=e1287]: Stakeholder
                  - generic [ref=e1289]: In Review
                - paragraph [ref=e1290]: Fast pressure build-up
                - paragraph [ref=e1291]: At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.
                - generic [ref=e1292]:
                  - generic [ref=e1293]:
                    - generic [ref=e1294]:
                      - img [ref=e1295]
                      - generic [ref=e1297]: likely infeasible
                    - generic [ref=e1299]: Confidence 92%
                  - paragraph [ref=e1300]: Computed timing budget is 24.00 ms against a required maximum of 10.00 ms.
                  - paragraph [ref=e1301]: "requirement: Parsed maximum timing target: 10.00 ms."
                  - paragraph [ref=e1302]: "linked_design_parameter: controller_delay contributes 4.00 ms."
                  - paragraph [ref=e1303]: "linked_design_parameter: hydraulic_build_up_estimate contributes 12.00 ms."
                - generic [ref=e1304]:
                  - button "Open Detail" [ref=e1305] [cursor=pointer]:
                    - img [ref=e1307]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1309] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1311]
              - generic [ref=e1314]:
                - generic [ref=e1315]:
                  - paragraph [ref=e1316]: BRK-SYS-002
                  - generic [ref=e1318]: System
                  - generic [ref=e1320]: Draft
                - paragraph [ref=e1321]: Conflicting upper pressure limit
                - paragraph [ref=e1322]: Brake pressure shall be at most 4 bar in normal mode.
                - generic [ref=e1323]:
                  - generic [ref=e1324]:
                    - generic [ref=e1325]:
                      - img [ref=e1326]
                      - generic [ref=e1328]: likely infeasible
                    - generic [ref=e1330]: Confidence 86%
                  - paragraph [ref=e1331]: Observed linked bound is 8 bar, compared against the required maximum of 4 bar.
                  - paragraph [ref=e1332]: "requirement: Parsed maximum requirement: brake_pressure <= 4 bar"
                  - paragraph [ref=e1333]: "linked_design_parameter: Highest comparable linked value: brake_pressure_capability = 8 bar"
                - generic [ref=e1334]:
                  - button "Open Detail" [ref=e1335] [cursor=pointer]:
                    - img [ref=e1337]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1339] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1341]
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
  65 |     await page.getByRole("button", { name: "Validation" }).click();
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
  75 |     await page.getByRole("button", { name: "Reports" }).click();
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