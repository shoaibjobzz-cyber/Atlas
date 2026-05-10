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

Locator: getByText('Requirements assessed')
Expected: visible
Error: strict mode violation: getByText('Requirements assessed') resolved to 2 elements:
    1) <p class="MuiTypography-root MuiTypography-body2 css-1q1fxgw">Requirements assessed</p> aka getByRole('paragraph').filter({ hasText: 'Requirements assessed' })
    2) <p class="MuiTypography-root MuiTypography-body2 css-1q1fxgw">Requirements assessed</p> aka getByText('Requirements assessed').nth(1)

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('Requirements assessed')
    3 × locator resolved to <p class="MuiTypography-root MuiTypography-body2 css-1q1fxgw">Requirements assessed</p>
      - unexpected value "hidden"

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
                  - paragraph [ref=e145]: BRK-STK-001
                  - generic [ref=e147]: Stakeholder
                  - generic [ref=e149]: In Review
                - paragraph [ref=e150]: Predictable brake response
                - paragraph [ref=e151]: The vehicle shall provide predictable braking response for the driver during normal operation.
                - generic [ref=e153]:
                  - generic [ref=e155]:
                    - img [ref=e156]
                    - generic [ref=e158]: high · Missing numeric value
                  - paragraph [ref=e159]: The statement appears to describe a measurable constraint or performance target without a number.
                  - paragraph [ref=e160]: "Suggestion: Add the required numeric threshold or limit so the requirement is measurable."
                - generic [ref=e161]:
                  - button "Open Detail" [ref=e162] [cursor=pointer]:
                    - img [ref=e164]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e166] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e168]
              - generic [ref=e171]:
                - generic [ref=e172]:
                  - paragraph [ref=e173]: BRK-STK-002
                  - generic [ref=e175]: Stakeholder
                  - generic [ref=e177]: In Review
                - paragraph [ref=e178]: Fast pressure build-up
                - paragraph [ref=e179]: At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.
                - generic [ref=e181]:
                  - generic [ref=e183]:
                    - img [ref=e184]
                    - generic [ref=e186]: medium · Ambiguous wording detected
                  - paragraph [ref=e187]: "The requirement uses vague terms: fast."
                  - paragraph [ref=e188]: "Suggestion: Replace the vague wording with measurable thresholds or specific acceptance criteria."
                - generic [ref=e189]:
                  - button "Open Detail" [ref=e190] [cursor=pointer]:
                    - img [ref=e192]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e194] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e196]
              - generic [ref=e199]:
                - generic [ref=e200]:
                  - paragraph [ref=e201]: BRK-SWE-001
                  - generic [ref=e203]: Software
                  - generic [ref=e205]: Draft
                - paragraph [ref=e206]: Wheel-end monitoring
                - paragraph [ref=e207]: The software shall monitor wheel-end pressure and log diagnostic deviations during normal and degraded mode.
                - generic [ref=e208]:
                  - generic [ref=e209]:
                    - generic [ref=e211]:
                      - img [ref=e212]
                      - generic [ref=e214]: high · Missing numeric value
                    - paragraph [ref=e215]: The statement appears to describe a measurable constraint or performance target without a number.
                    - paragraph [ref=e216]: "Suggestion: Add the required numeric threshold or limit so the requirement is measurable."
                  - generic [ref=e217]:
                    - generic [ref=e219]:
                      - img [ref=e220]
                      - generic [ref=e222]: medium · Possible compound requirement
                    - paragraph [ref=e223]: The statement may contain multiple obligations bundled into one requirement.
                    - paragraph [ref=e224]: "Suggestion: Split the statement into separate requirements so each one expresses a single verifiable obligation."
                - generic [ref=e225]:
                  - button "Open Detail" [ref=e226] [cursor=pointer]:
                    - img [ref=e228]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e230] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e232]
              - generic [ref=e235]:
                - generic [ref=e236]:
                  - paragraph [ref=e237]: BRK-SWE-002
                  - generic [ref=e239]: Software
                  - generic [ref=e241]: Draft
                - paragraph [ref=e242]: Weak software wording
                - paragraph [ref=e243]: The software shall quickly provide user-friendly brake status messages.
                - generic [ref=e245]:
                  - generic [ref=e247]:
                    - img [ref=e248]
                    - generic [ref=e250]: medium · Ambiguous wording detected
                  - paragraph [ref=e251]: "The requirement uses vague terms: quickly, user-friendly."
                  - paragraph [ref=e252]: "Suggestion: Replace the vague wording with measurable thresholds or specific acceptance criteria."
                - generic [ref=e253]:
                  - button "Open Detail" [ref=e254] [cursor=pointer]:
                    - img [ref=e256]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e258] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e260]
              - generic [ref=e263]:
                - generic [ref=e264]:
                  - paragraph [ref=e265]: BRK-SWE-003
                  - generic [ref=e267]: Software
                  - generic [ref=e269]: Draft
                - paragraph [ref=e270]: Weak compound software requirement
                - paragraph [ref=e271]: The software should robustly detect wheel slip and notify the driver and log the event as needed.
                - generic [ref=e272]:
                  - generic [ref=e273]:
                    - generic [ref=e275]:
                      - img [ref=e276]
                      - generic [ref=e278]: medium · Non-testable language detected
                    - paragraph [ref=e279]: The statement includes wording that is difficult to verify objectively.
                    - paragraph [ref=e280]: "Suggestion: Rewrite the statement so it can be verified by inspection, analysis, test, or measurement."
                  - generic [ref=e281]:
                    - generic [ref=e283]:
                      - img [ref=e284]
                      - generic [ref=e286]: medium · Weak or passive phrasing detected
                    - paragraph [ref=e287]: The requirement uses weak modal language or passive voice, which can reduce clarity.
                    - paragraph [ref=e288]: "Suggestion: Prefer direct active phrasing such as 'The system shall ...' with a clear subject and action."
                - generic [ref=e289]:
                  - button "Open Detail" [ref=e290] [cursor=pointer]:
                    - img [ref=e292]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e294] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e296]
              - generic [ref=e299]:
                - generic [ref=e300]:
                  - paragraph [ref=e301]: BRK-HWE-001
                  - generic [ref=e303]: Hardware
                  - generic [ref=e305]: Approved
                - paragraph [ref=e306]: Operating voltage range
                - paragraph [ref=e307]: The brake controller hardware shall operate between 9 V and 16 V in normal mode.
                - generic [ref=e309]:
                  - generic [ref=e311]:
                    - img [ref=e312]
                    - generic [ref=e314]: medium · Possible compound requirement
                  - paragraph [ref=e315]: The statement may contain multiple obligations bundled into one requirement.
                  - paragraph [ref=e316]: "Suggestion: Split the statement into separate requirements so each one expresses a single verifiable obligation."
                - generic [ref=e317]:
                  - button "Open Detail" [ref=e318] [cursor=pointer]:
                    - img [ref=e320]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e322] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e324]
              - generic [ref=e327]:
                - generic [ref=e328]:
                  - paragraph [ref=e329]: BRK-HWE-003
                  - generic [ref=e331]: Hardware
                  - generic [ref=e333]: Draft
                - paragraph [ref=e334]: Weak hardware wording
                - paragraph [ref=e335]: The hardware shall be efficient and robust during startup.
                - generic [ref=e336]:
                  - generic [ref=e337]:
                    - generic [ref=e339]:
                      - img [ref=e340]
                      - generic [ref=e342]: medium · Ambiguous wording detected
                    - paragraph [ref=e343]: "The requirement uses vague terms: efficient, robust."
                    - paragraph [ref=e344]: "Suggestion: Replace the vague wording with measurable thresholds or specific acceptance criteria."
                  - generic [ref=e345]:
                    - generic [ref=e347]:
                      - img [ref=e348]
                      - generic [ref=e350]: medium · Possible compound requirement
                    - paragraph [ref=e351]: The statement may contain multiple obligations bundled into one requirement.
                    - paragraph [ref=e352]: "Suggestion: Split the statement into separate requirements so each one expresses a single verifiable obligation."
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
                  - paragraph [ref=e381]: BRK-STK-001
                  - generic [ref=e383]: Stakeholder
                  - generic [ref=e385]: In Review
                - paragraph [ref=e386]: Predictable brake response
                - paragraph [ref=e387]: The vehicle shall provide predictable braking response for the driver during normal operation.
                - generic [ref=e388]:
                  - paragraph [ref=e389]: Extracted 6 of 10 structured fields.
                  - paragraph [ref=e390]: "Missing: parameter, operator, value, unit"
                - generic [ref=e391]:
                  - button "Open Detail" [ref=e392] [cursor=pointer]:
                    - img [ref=e394]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e396] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e398]
              - generic [ref=e401]:
                - generic [ref=e402]:
                  - paragraph [ref=e403]: BRK-STK-002
                  - generic [ref=e405]: Stakeholder
                  - generic [ref=e407]: In Review
                - paragraph [ref=e408]: Fast pressure build-up
                - paragraph [ref=e409]: At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.
                - generic [ref=e410]:
                  - paragraph [ref=e411]: Extracted 5 of 10 structured fields.
                  - paragraph [ref=e412]: "Missing: object, operator, unit, timing, condition"
                - generic [ref=e413]:
                  - button "Open Detail" [ref=e414] [cursor=pointer]:
                    - img [ref=e416]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e418] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e420]
              - generic [ref=e423]:
                - generic [ref=e424]:
                  - paragraph [ref=e425]: BRK-SYS-001
                  - generic [ref=e427]: System
                  - generic [ref=e429]: Approved
                - paragraph [ref=e430]: Normal-mode minimum pressure
                - paragraph [ref=e431]: Brake pressure shall be at least 6 bar in normal mode.
                - generic [ref=e432]:
                  - paragraph [ref=e433]: Extracted 8 of 10 structured fields.
                  - paragraph [ref=e434]: "Missing: timing, condition"
                - generic [ref=e435]:
                  - button "Open Detail" [ref=e436] [cursor=pointer]:
                    - img [ref=e438]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e440] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e442]
              - generic [ref=e445]:
                - generic [ref=e446]:
                  - paragraph [ref=e447]: BRK-SYS-002
                  - generic [ref=e449]: System
                  - generic [ref=e451]: Draft
                - paragraph [ref=e452]: Conflicting upper pressure limit
                - paragraph [ref=e453]: Brake pressure shall be at most 4 bar in normal mode.
                - generic [ref=e454]:
                  - paragraph [ref=e455]: Extracted 8 of 10 structured fields.
                  - paragraph [ref=e456]: "Missing: timing, condition"
                - generic [ref=e457]:
                  - button "Open Detail" [ref=e458] [cursor=pointer]:
                    - img [ref=e460]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e462] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e464]
              - generic [ref=e467]:
                - generic [ref=e468]:
                  - paragraph [ref=e469]: BRK-SYS-003
                  - generic [ref=e471]: System
                  - generic [ref=e473]: In Review
                - paragraph [ref=e474]: Response-time limit
                - paragraph [ref=e475]: The braking system shall limit response time to at most 100 ms in all modes.
                - generic [ref=e476]:
                  - paragraph [ref=e477]: Extracted 8 of 10 structured fields.
                  - paragraph [ref=e478]: "Missing: timing, condition"
                - generic [ref=e479]:
                  - button "Open Detail" [ref=e480] [cursor=pointer]:
                    - img [ref=e482]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e484] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e486]
              - generic [ref=e489]:
                - generic [ref=e490]:
                  - paragraph [ref=e491]: BRK-SYS-004
                  - generic [ref=e493]: System
                  - generic [ref=e495]: Draft
                - paragraph [ref=e496]: Conflicting response-time limit
                - paragraph [ref=e497]: The braking system shall limit response time to at most 250 ms in all modes.
                - generic [ref=e498]:
                  - paragraph [ref=e499]: Extracted 8 of 10 structured fields.
                  - paragraph [ref=e500]: "Missing: timing, condition"
                - generic [ref=e501]:
                  - button "Open Detail" [ref=e502] [cursor=pointer]:
                    - img [ref=e504]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e506] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e508]
              - generic [ref=e511]:
                - generic [ref=e512]:
                  - paragraph [ref=e513]: BRK-SUB-001
                  - generic [ref=e515]: Subsystem
                  - generic [ref=e517]: Approved
                - paragraph [ref=e518]: Valve delay budget
                - paragraph [ref=e519]: The hydraulic valve subsystem shall respond within 8 ms during normal mode.
                - generic [ref=e520]:
                  - paragraph [ref=e521]: Extracted 9 of 10 structured fields.
                  - paragraph [ref=e522]: "Missing: object"
                - generic [ref=e523]:
                  - button "Open Detail" [ref=e524] [cursor=pointer]:
                    - img [ref=e526]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e528] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e530]
              - generic [ref=e533]:
                - generic [ref=e534]:
                  - paragraph [ref=e535]: BRK-SUB-002
                  - generic [ref=e537]: Subsystem
                  - generic [ref=e539]: Approved
                - paragraph [ref=e540]: Controller latency
                - paragraph [ref=e541]: The brake controller shall process a pedal request within 4 ms in normal mode.
                - generic [ref=e542]:
                  - paragraph [ref=e543]: Extracted 8 of 10 structured fields.
                  - paragraph [ref=e544]: "Missing: object, condition"
                - generic [ref=e545]:
                  - button "Open Detail" [ref=e546] [cursor=pointer]:
                    - img [ref=e548]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e550] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e552]
              - generic [ref=e555]:
                - generic [ref=e556]:
                  - paragraph [ref=e557]: BRK-SUB-003
                  - generic [ref=e559]: Subsystem
                  - generic [ref=e561]: Approved
                - paragraph [ref=e562]: Hydraulic build-up estimate
                - paragraph [ref=e563]: The hydraulic circuit shall build pressure within 12 ms during normal mode.
                - generic [ref=e564]:
                  - paragraph [ref=e565]: Extracted 9 of 10 structured fields.
                  - paragraph [ref=e566]: "Missing: object"
                - generic [ref=e567]:
                  - button "Open Detail" [ref=e568] [cursor=pointer]:
                    - img [ref=e570]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e572] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e574]
              - generic [ref=e577]:
                - generic [ref=e578]:
                  - paragraph [ref=e579]: BRK-SWE-001
                  - generic [ref=e581]: Software
                  - generic [ref=e583]: Draft
                - paragraph [ref=e584]: Wheel-end monitoring
                - paragraph [ref=e585]: The software shall monitor wheel-end pressure and log diagnostic deviations during normal and degraded mode.
                - generic [ref=e586]:
                  - paragraph [ref=e587]: Extracted 6 of 10 structured fields.
                  - paragraph [ref=e588]: "Missing: parameter, operator, value, unit"
                - generic [ref=e589]:
                  - button "Open Detail" [ref=e590] [cursor=pointer]:
                    - img [ref=e592]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e594] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e596]
              - generic [ref=e599]:
                - generic [ref=e600]:
                  - paragraph [ref=e601]: BRK-SWE-002
                  - generic [ref=e603]: Software
                  - generic [ref=e605]: Draft
                - paragraph [ref=e606]: Weak software wording
                - paragraph [ref=e607]: The software shall quickly provide user-friendly brake status messages.
                - generic [ref=e608]:
                  - paragraph [ref=e609]: Extracted 4 of 10 structured fields.
                  - paragraph [ref=e610]: "Missing: parameter, operator, value, unit, timing, condition"
                - generic [ref=e611]:
                  - button "Open Detail" [ref=e612] [cursor=pointer]:
                    - img [ref=e614]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e616] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e618]
              - generic [ref=e621]:
                - generic [ref=e622]:
                  - paragraph [ref=e623]: BRK-SWE-003
                  - generic [ref=e625]: Software
                  - generic [ref=e627]: Draft
                - paragraph [ref=e628]: Weak compound software requirement
                - paragraph [ref=e629]: The software should robustly detect wheel slip and notify the driver and log the event as needed.
                - generic [ref=e630]:
                  - paragraph [ref=e631]: Extracted 4 of 10 structured fields.
                  - paragraph [ref=e632]: "Missing: parameter, operator, value, unit, timing, condition"
                - generic [ref=e633]:
                  - button "Open Detail" [ref=e634] [cursor=pointer]:
                    - img [ref=e636]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e638] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e640]
              - generic [ref=e643]:
                - generic [ref=e644]:
                  - paragraph [ref=e645]: BRK-HWE-001
                  - generic [ref=e647]: Hardware
                  - generic [ref=e649]: Approved
                - paragraph [ref=e650]: Operating voltage range
                - paragraph [ref=e651]: The brake controller hardware shall operate between 9 V and 16 V in normal mode.
                - generic [ref=e652]:
                  - paragraph [ref=e653]: Extracted 7 of 10 structured fields.
                  - paragraph [ref=e654]: "Missing: operator, timing, condition"
                - generic [ref=e655]:
                  - button "Open Detail" [ref=e656] [cursor=pointer]:
                    - img [ref=e658]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e660] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e662]
              - generic [ref=e665]:
                - generic [ref=e666]:
                  - paragraph [ref=e667]: BRK-HWE-002
                  - generic [ref=e669]: Hardware
                  - generic [ref=e671]: Draft
                - paragraph [ref=e672]: Conflicting minimum voltage
                - paragraph [ref=e673]: The brake controller hardware shall operate at least 18 V in normal mode.
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
                  - paragraph [ref=e689]: BRK-HWE-003
                  - generic [ref=e691]: Hardware
                  - generic [ref=e693]: Draft
                - paragraph [ref=e694]: Weak hardware wording
                - paragraph [ref=e695]: The hardware shall be efficient and robust during startup.
                - generic [ref=e696]:
                  - paragraph [ref=e697]: Extracted 6 of 10 structured fields.
                  - paragraph [ref=e698]: "Missing: parameter, operator, value, unit"
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
                  - paragraph [ref=e727]: BRK-STK-001
                  - generic [ref=e729]: Stakeholder
                  - generic [ref=e731]: In Review
                - paragraph [ref=e732]: Predictable brake response
                - paragraph [ref=e733]: The vehicle shall provide predictable braking response for the driver during normal operation.
                - generic [ref=e734]:
                  - paragraph [ref=e735]: "Related: BRK-SYS-003 · Same subsystem: Brake Control."
                  - paragraph [ref=e736]: "Related: BRK-SYS-004 · Same subsystem: Brake Control."
                  - paragraph [ref=e737]: "Related: BRK-SUB-002 · Same subsystem: Brake Control."
                - generic [ref=e738]:
                  - button "Open Detail" [ref=e739] [cursor=pointer]:
                    - img [ref=e741]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e743] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e745]
              - generic [ref=e748]:
                - generic [ref=e749]:
                  - paragraph [ref=e750]: BRK-STK-002
                  - generic [ref=e752]: Stakeholder
                  - generic [ref=e754]: In Review
                - paragraph [ref=e755]: Fast pressure build-up
                - paragraph [ref=e756]: At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.
                - generic [ref=e757]:
                  - paragraph [ref=e758]: "Related: BRK-SYS-001 · Same subsystem: Hydraulics."
                  - paragraph [ref=e759]: "Related: BRK-SYS-002 · Same subsystem: Hydraulics."
                  - paragraph [ref=e760]: "Related: BRK-SUB-001 · Same subsystem: Hydraulics."
                - generic [ref=e761]:
                  - button "Open Detail" [ref=e762] [cursor=pointer]:
                    - img [ref=e764]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e766] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e768]
              - generic [ref=e771]:
                - generic [ref=e772]:
                  - paragraph [ref=e773]: BRK-SYS-001
                  - generic [ref=e775]: System
                  - generic [ref=e777]: Approved
                - paragraph [ref=e778]: Normal-mode minimum pressure
                - paragraph [ref=e779]: Brake pressure shall be at least 6 bar in normal mode.
                - generic [ref=e780]:
                  - paragraph [ref=e781]: "Related: BRK-STK-002 · Same subsystem: Hydraulics."
                  - paragraph [ref=e782]: "Related: BRK-SYS-002 · Same subsystem: Hydraulics. Both requirements use the same unit: bar. The requirements operate in overlapping scope."
                  - paragraph [ref=e783]: "Related: BRK-SUB-001 · Same subsystem: Hydraulics."
                - generic [ref=e784]:
                  - button "Open Detail" [ref=e785] [cursor=pointer]:
                    - img [ref=e787]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e789] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e791]
              - generic [ref=e794]:
                - generic [ref=e795]:
                  - paragraph [ref=e796]: BRK-SYS-002
                  - generic [ref=e798]: System
                  - generic [ref=e800]: Draft
                - paragraph [ref=e801]: Conflicting upper pressure limit
                - paragraph [ref=e802]: Brake pressure shall be at most 4 bar in normal mode.
                - generic [ref=e803]:
                  - paragraph [ref=e804]: "Related: BRK-STK-002 · Same subsystem: Hydraulics."
                  - paragraph [ref=e805]: "Related: BRK-SYS-001 · Same subsystem: Hydraulics. Both requirements use the same unit: bar. The requirements operate in overlapping scope."
                  - paragraph [ref=e806]: "Related: BRK-SUB-001 · Same subsystem: Hydraulics."
                - generic [ref=e807]:
                  - button "Open Detail" [ref=e808] [cursor=pointer]:
                    - img [ref=e810]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e812] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e814]
              - generic [ref=e817]:
                - generic [ref=e818]:
                  - paragraph [ref=e819]: BRK-SYS-003
                  - generic [ref=e821]: System
                  - generic [ref=e823]: In Review
                - paragraph [ref=e824]: Response-time limit
                - paragraph [ref=e825]: The braking system shall limit response time to at most 100 ms in all modes.
                - generic [ref=e826]:
                  - paragraph [ref=e827]: "Conflict: BRK-SYS-004 · The requirements define different upper bounds for the same parameter under overlapping conditions."
                  - paragraph [ref=e828]: "Related: BRK-STK-001 · Same subsystem: Brake Control."
                  - paragraph [ref=e829]: "Related: BRK-SYS-004 · Same subsystem: Brake Control. Both requirements reference the same parameter: to at most. Both requirements use the same unit: ms. The requirements operate in overlapping scope."
                  - paragraph [ref=e830]: "Related: BRK-SUB-001 · Both requirements use the same unit: ms."
                - generic [ref=e831]:
                  - button "Open Detail" [ref=e832] [cursor=pointer]:
                    - img [ref=e834]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e836] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e838]
              - generic [ref=e841]:
                - generic [ref=e842]:
                  - paragraph [ref=e843]: BRK-SYS-004
                  - generic [ref=e845]: System
                  - generic [ref=e847]: Draft
                - paragraph [ref=e848]: Conflicting response-time limit
                - paragraph [ref=e849]: The braking system shall limit response time to at most 250 ms in all modes.
                - generic [ref=e850]:
                  - paragraph [ref=e851]: "Conflict: BRK-SYS-003 · The requirements define different upper bounds for the same parameter under overlapping conditions."
                  - paragraph [ref=e852]: "Related: BRK-STK-001 · Same subsystem: Brake Control."
                  - paragraph [ref=e853]: "Related: BRK-SYS-003 · Same subsystem: Brake Control. Both requirements reference the same parameter: to at most. Both requirements use the same unit: ms. The requirements operate in overlapping scope."
                  - paragraph [ref=e854]: "Related: BRK-SUB-001 · Both requirements use the same unit: ms."
                - generic [ref=e855]:
                  - button "Open Detail" [ref=e856] [cursor=pointer]:
                    - img [ref=e858]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e860] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e862]
              - generic [ref=e865]:
                - generic [ref=e866]:
                  - paragraph [ref=e867]: BRK-SUB-001
                  - generic [ref=e869]: Subsystem
                  - generic [ref=e871]: Approved
                - paragraph [ref=e872]: Valve delay budget
                - paragraph [ref=e873]: The hydraulic valve subsystem shall respond within 8 ms during normal mode.
                - generic [ref=e874]:
                  - paragraph [ref=e875]: "Related: BRK-STK-002 · Same subsystem: Hydraulics."
                  - paragraph [ref=e876]: "Related: BRK-SYS-001 · Same subsystem: Hydraulics."
                  - paragraph [ref=e877]: "Related: BRK-SYS-002 · Same subsystem: Hydraulics."
                - generic [ref=e878]:
                  - button "Open Detail" [ref=e879] [cursor=pointer]:
                    - img [ref=e881]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e883] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e885]
              - generic [ref=e888]:
                - generic [ref=e889]:
                  - paragraph [ref=e890]: BRK-SUB-002
                  - generic [ref=e892]: Subsystem
                  - generic [ref=e894]: Approved
                - paragraph [ref=e895]: Controller latency
                - paragraph [ref=e896]: The brake controller shall process a pedal request within 4 ms in normal mode.
                - generic [ref=e897]:
                  - paragraph [ref=e898]: "Related: BRK-STK-001 · Same subsystem: Brake Control."
                  - paragraph [ref=e899]: "Related: BRK-SYS-003 · Same subsystem: Brake Control. Both requirements use the same unit: ms."
                  - paragraph [ref=e900]: "Related: BRK-SYS-004 · Same subsystem: Brake Control. Both requirements use the same unit: ms."
                - generic [ref=e901]:
                  - button "Open Detail" [ref=e902] [cursor=pointer]:
                    - img [ref=e904]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e906] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e908]
              - generic [ref=e911]:
                - generic [ref=e912]:
                  - paragraph [ref=e913]: BRK-SUB-003
                  - generic [ref=e915]: Subsystem
                  - generic [ref=e917]: Approved
                - paragraph [ref=e918]: Hydraulic build-up estimate
                - paragraph [ref=e919]: The hydraulic circuit shall build pressure within 12 ms during normal mode.
                - generic [ref=e920]:
                  - paragraph [ref=e921]: "Conflict: The parsed parameter 'pressure' is paired with unit 'ms', which does not look valid for that parameter."
                  - paragraph [ref=e922]: "Related: BRK-STK-002 · Same subsystem: Hydraulics."
                  - paragraph [ref=e923]: "Related: BRK-SYS-001 · Same subsystem: Hydraulics."
                  - paragraph [ref=e924]: "Related: BRK-SYS-002 · Same subsystem: Hydraulics."
                - generic [ref=e925]:
                  - button "Open Detail" [ref=e926] [cursor=pointer]:
                    - img [ref=e928]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e930] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e932]
              - generic [ref=e935]:
                - generic [ref=e936]:
                  - paragraph [ref=e937]: BRK-SWE-001
                  - generic [ref=e939]: Software
                  - generic [ref=e941]: Draft
                - paragraph [ref=e942]: Wheel-end monitoring
                - paragraph [ref=e943]: The software shall monitor wheel-end pressure and log diagnostic deviations during normal and degraded mode.
                - generic [ref=e944]:
                  - paragraph [ref=e945]: "Related: BRK-SWE-002 · The requirements operate in overlapping scope."
                  - paragraph [ref=e946]: "Related: BRK-SWE-003 · Same subsystem: Brake Software. The requirements operate in overlapping scope."
                - generic [ref=e947]:
                  - button "Open Detail" [ref=e948] [cursor=pointer]:
                    - img [ref=e950]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e952] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e954]
              - generic [ref=e957]:
                - generic [ref=e958]:
                  - paragraph [ref=e959]: BRK-SWE-002
                  - generic [ref=e961]: Software
                  - generic [ref=e963]: Draft
                - paragraph [ref=e964]: Weak software wording
                - paragraph [ref=e965]: The software shall quickly provide user-friendly brake status messages.
                - generic [ref=e966]:
                  - paragraph [ref=e967]: "Related: BRK-SWE-001 · The requirements operate in overlapping scope."
                  - paragraph [ref=e968]: "Related: BRK-SWE-003 · The requirements operate in overlapping scope."
                - generic [ref=e969]:
                  - button "Open Detail" [ref=e970] [cursor=pointer]:
                    - img [ref=e972]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e974] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e976]
              - generic [ref=e979]:
                - generic [ref=e980]:
                  - paragraph [ref=e981]: BRK-SWE-003
                  - generic [ref=e983]: Software
                  - generic [ref=e985]: Draft
                - paragraph [ref=e986]: Weak compound software requirement
                - paragraph [ref=e987]: The software should robustly detect wheel slip and notify the driver and log the event as needed.
                - generic [ref=e988]:
                  - paragraph [ref=e989]: "Related: BRK-SWE-001 · Same subsystem: Brake Software. The requirements operate in overlapping scope."
                  - paragraph [ref=e990]: "Related: BRK-SWE-002 · The requirements operate in overlapping scope."
                - generic [ref=e991]:
                  - button "Open Detail" [ref=e992] [cursor=pointer]:
                    - img [ref=e994]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e996] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e998]
              - generic [ref=e1001]:
                - generic [ref=e1002]:
                  - paragraph [ref=e1003]: BRK-HWE-001
                  - generic [ref=e1005]: Hardware
                  - generic [ref=e1007]: Approved
                - paragraph [ref=e1008]: Operating voltage range
                - paragraph [ref=e1009]: The brake controller hardware shall operate between 9 V and 16 V in normal mode.
                - generic [ref=e1010]:
                  - paragraph [ref=e1011]: "Related: BRK-SUB-002 · The requirements operate in overlapping scope."
                  - paragraph [ref=e1012]: "Related: BRK-HWE-002 · Same subsystem: Brake ECU. Both requirements use the same unit: v. The requirements operate in overlapping scope."
                  - paragraph [ref=e1013]: "Related: BRK-HWE-003 · Same subsystem: Brake ECU."
                - generic [ref=e1014]:
                  - button "Open Detail" [ref=e1015] [cursor=pointer]:
                    - img [ref=e1017]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1019] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1021]
              - generic [ref=e1024]:
                - generic [ref=e1025]:
                  - paragraph [ref=e1026]: BRK-HWE-002
                  - generic [ref=e1028]: Hardware
                  - generic [ref=e1030]: Draft
                - paragraph [ref=e1031]: Conflicting minimum voltage
                - paragraph [ref=e1032]: The brake controller hardware shall operate at least 18 V in normal mode.
                - generic [ref=e1033]:
                  - paragraph [ref=e1034]: "Related: BRK-SUB-002 · The requirements operate in overlapping scope."
                  - paragraph [ref=e1035]: "Related: BRK-HWE-001 · Same subsystem: Brake ECU. Both requirements use the same unit: v. The requirements operate in overlapping scope."
                  - paragraph [ref=e1036]: "Related: BRK-HWE-003 · Same subsystem: Brake ECU."
                - generic [ref=e1037]:
                  - button "Open Detail" [ref=e1038] [cursor=pointer]:
                    - img [ref=e1040]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1042] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1044]
              - generic [ref=e1047]:
                - generic [ref=e1048]:
                  - paragraph [ref=e1049]: BRK-HWE-003
                  - generic [ref=e1051]: Hardware
                  - generic [ref=e1053]: Draft
                - paragraph [ref=e1054]: Weak hardware wording
                - paragraph [ref=e1055]: The hardware shall be efficient and robust during startup.
                - generic [ref=e1056]:
                  - paragraph [ref=e1057]: "Related: BRK-HWE-001 · Same subsystem: Brake ECU."
                  - paragraph [ref=e1058]: "Related: BRK-HWE-002 · Same subsystem: Brake ECU."
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
                  - paragraph [ref=e1087]: BRK-STK-001
                  - generic [ref=e1089]: Stakeholder
                  - generic [ref=e1091]: In Review
                - paragraph [ref=e1092]: Predictable brake response
                - paragraph [ref=e1093]: The vehicle shall provide predictable braking response for the driver during normal operation.
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
                  - paragraph [ref=e1115]: BRK-STK-002
                  - generic [ref=e1117]: Stakeholder
                  - generic [ref=e1119]: In Review
                - paragraph [ref=e1120]: Fast pressure build-up
                - paragraph [ref=e1121]: At 50% brake pedal input, all wheel ends shall reach 6 bar in 10 ms.
                - generic [ref=e1122]:
                  - generic [ref=e1123]:
                    - generic [ref=e1124]:
                      - img [ref=e1125]
                      - generic [ref=e1127]: likely infeasible
                    - generic [ref=e1129]: Confidence 92%
                  - paragraph [ref=e1130]: Computed timing budget is 24.00 ms against a required maximum of 10.00 ms.
                  - paragraph [ref=e1131]: "requirement: Parsed maximum timing target: 10.00 ms."
                  - paragraph [ref=e1132]: "linked_design_parameter: controller_delay contributes 4.00 ms."
                  - paragraph [ref=e1133]: "linked_design_parameter: hydraulic_build_up_estimate contributes 12.00 ms."
                - generic [ref=e1134]:
                  - button "Open Detail" [ref=e1135] [cursor=pointer]:
                    - img [ref=e1137]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1139] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1141]
              - generic [ref=e1144]:
                - generic [ref=e1145]:
                  - paragraph [ref=e1146]: BRK-SYS-002
                  - generic [ref=e1148]: System
                  - generic [ref=e1150]: Draft
                - paragraph [ref=e1151]: Conflicting upper pressure limit
                - paragraph [ref=e1152]: Brake pressure shall be at most 4 bar in normal mode.
                - generic [ref=e1153]:
                  - generic [ref=e1154]:
                    - generic [ref=e1155]:
                      - img [ref=e1156]
                      - generic [ref=e1158]: likely infeasible
                    - generic [ref=e1160]: Confidence 86%
                  - paragraph [ref=e1161]: Observed linked bound is 8 bar, compared against the required maximum of 4 bar.
                  - paragraph [ref=e1162]: "requirement: Parsed maximum requirement: brake_pressure <= 4 bar"
                  - paragraph [ref=e1163]: "linked_design_parameter: Highest comparable linked value: brake_pressure_capability = 8 bar"
                - generic [ref=e1164]:
                  - button "Open Detail" [ref=e1165] [cursor=pointer]:
                    - img [ref=e1167]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1169] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1171]
              - generic [ref=e1174]:
                - generic [ref=e1175]:
                  - paragraph [ref=e1176]: BRK-SWE-001
                  - generic [ref=e1178]: Software
                  - generic [ref=e1180]: Draft
                - paragraph [ref=e1181]: Wheel-end monitoring
                - paragraph [ref=e1182]: The software shall monitor wheel-end pressure and log diagnostic deviations during normal and degraded mode.
                - generic [ref=e1183]:
                  - generic [ref=e1184]:
                    - generic [ref=e1185]:
                      - img [ref=e1186]
                      - generic [ref=e1188]: warning
                    - generic [ref=e1190]: Confidence 43%
                  - paragraph [ref=e1191]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
                - generic [ref=e1192]:
                  - button "Open Detail" [ref=e1193] [cursor=pointer]:
                    - img [ref=e1195]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1197] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1199]
              - generic [ref=e1202]:
                - generic [ref=e1203]:
                  - paragraph [ref=e1204]: BRK-SWE-002
                  - generic [ref=e1206]: Software
                  - generic [ref=e1208]: Draft
                - paragraph [ref=e1209]: Weak software wording
                - paragraph [ref=e1210]: The software shall quickly provide user-friendly brake status messages.
                - generic [ref=e1211]:
                  - generic [ref=e1212]:
                    - generic [ref=e1213]:
                      - img [ref=e1214]
                      - generic [ref=e1216]: warning
                    - generic [ref=e1218]: Confidence 43%
                  - paragraph [ref=e1219]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
                - generic [ref=e1220]:
                  - button "Open Detail" [ref=e1221] [cursor=pointer]:
                    - img [ref=e1223]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1225] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1227]
              - generic [ref=e1230]:
                - generic [ref=e1231]:
                  - paragraph [ref=e1232]: BRK-SWE-003
                  - generic [ref=e1234]: Software
                  - generic [ref=e1236]: Draft
                - paragraph [ref=e1237]: Weak compound software requirement
                - paragraph [ref=e1238]: The software should robustly detect wheel slip and notify the driver and log the event as needed.
                - generic [ref=e1239]:
                  - generic [ref=e1240]:
                    - generic [ref=e1241]:
                      - img [ref=e1242]
                      - generic [ref=e1244]: warning
                    - generic [ref=e1246]: Confidence 43%
                  - paragraph [ref=e1247]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
                - generic [ref=e1248]:
                  - button "Open Detail" [ref=e1249] [cursor=pointer]:
                    - img [ref=e1251]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1253] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1255]
              - generic [ref=e1258]:
                - generic [ref=e1259]:
                  - paragraph [ref=e1260]: BRK-HWE-001
                  - generic [ref=e1262]: Hardware
                  - generic [ref=e1264]: Approved
                - paragraph [ref=e1265]: Operating voltage range
                - paragraph [ref=e1266]: The brake controller hardware shall operate between 9 V and 16 V in normal mode.
                - generic [ref=e1267]:
                  - generic [ref=e1268]:
                    - generic [ref=e1269]:
                      - img [ref=e1270]
                      - generic [ref=e1272]: insufficient data
                    - generic [ref=e1274]: Confidence 52%
                  - paragraph [ref=e1275]: A range requirement was expected, but the numeric bounds could not be parsed.
                  - paragraph [ref=e1276]: "requirement: Parsed measurable constraint: type=range, parameter=operate between, value=9.0, unit=v."
                - generic [ref=e1277]:
                  - button "Open Detail" [ref=e1278] [cursor=pointer]:
                    - img [ref=e1280]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1282] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1284]
              - generic [ref=e1287]:
                - generic [ref=e1288]:
                  - paragraph [ref=e1289]: BRK-HWE-002
                  - generic [ref=e1291]: Hardware
                  - generic [ref=e1293]: Draft
                - paragraph [ref=e1294]: Conflicting minimum voltage
                - paragraph [ref=e1295]: The brake controller hardware shall operate at least 18 V in normal mode.
                - generic [ref=e1296]:
                  - generic [ref=e1297]:
                    - generic [ref=e1298]:
                      - img [ref=e1299]
                      - generic [ref=e1301]: insufficient data
                    - generic [ref=e1303]: Confidence 52%
                  - paragraph [ref=e1304]: A minimum-value requirement was detected, but no comparable linked design parameters were available.
                  - paragraph [ref=e1305]: "requirement: Parsed measurable constraint: type=min_value, parameter=operate, value=18.0, unit=v."
                - generic [ref=e1306]:
                  - button "Open Detail" [ref=e1307] [cursor=pointer]:
                    - img [ref=e1309]
                    - text: Open Detail
                  - button "Open Traceability" [ref=e1311] [cursor=pointer]:
                    - text: Open Traceability
                    - img [ref=e1313]
              - generic [ref=e1316]:
                - generic [ref=e1317]:
                  - paragraph [ref=e1318]: BRK-HWE-003
                  - generic [ref=e1320]: Hardware
                  - generic [ref=e1322]: Draft
                - paragraph [ref=e1323]: Weak hardware wording
                - paragraph [ref=e1324]: The hardware shall be efficient and robust during startup.
                - generic [ref=e1325]:
                  - generic [ref=e1326]:
                    - generic [ref=e1327]:
                      - img [ref=e1328]
                      - generic [ref=e1330]: warning
                    - generic [ref=e1332]: Confidence 43%
                  - paragraph [ref=e1333]: The requirement does not contain a measurable deterministic constraint that this MVP engine can evaluate yet.
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
  35 |     await expect(page.getByText("The software").first()).toBeVisible();
  36 |     await expect(page.getByText("provide").first()).toBeVisible();
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
  66 |     await expect(page.getByRole("heading", { name: "Validation", exact: true })).toBeVisible();
> 67 |     await expect(page.getByText("Requirements assessed")).toBeVisible();
     |                                                           ^ Error: expect(locator).toBeVisible() failed
  68 |     await expect(page.getByRole("heading", { name: "Requirement Quality Warnings" })).toBeVisible();
  69 |     await expect(page.getByText("BRK-SWE-002")).toBeVisible();
  70 | 
  71 |     await page.getByRole("button", { name: "Open Traceability" }).first().click();
  72 |     await expect(page).toHaveURL(/tab=traceability/);
  73 |     await expect(page.getByRole("heading", { name: "Validation Traceability" })).toBeVisible();
  74 | 
  75 |     await page.getByRole("button", { name: "Reports" }).click();
  76 |     await expect(page.getByRole("heading", { name: "Reports", exact: true })).toBeVisible();
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