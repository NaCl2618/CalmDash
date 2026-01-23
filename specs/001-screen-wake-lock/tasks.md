# Tasks: Screen Wake Lock

**Input**: Design documents from `/specs/001-screen-wake-lock/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: No automated tests - manual browser testing only (per project standards)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**IMPORTANT NOTE**: This feature has already been implemented in the codebase (commit `0ac01a5`). These tasks focus on documentation, validation, and potential improvements to the existing implementation.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Project Type**: Single-page web application (SPA)
- **App Structure**: `app/` at repository root
- **Source Files**: `app/js/` for JavaScript, `app/index.html` for HTML
- **Documentation**: `README.md` at repository root, `specs/001-screen-wake-lock/` for feature docs

---

## Phase 1: Setup & Verification (Documentation Focus)

**Purpose**: Verify existing implementation and establish documentation baseline

**Status**: ✅ Implementation already exists - focusing on validation and documentation

- [ ] T001 [P] Verify wake lock functions exist in app/js/main.js (requestWakeLock, releaseWakeLock, initWakeLock)
- [ ] T002 [P] Verify settings toggle exists in app/index.html settings modal
- [ ] T003 [P] Verify default screenWakeLock setting in app/js/constants.js
- [ ] T004 [P] Create Korean version of tasks.md (this file) as tasks_kor.md in specs/001-screen-wake-lock/

**Checkpoint**: Existing implementation validated - ready for story-specific verification

---

## Phase 2: Foundational (Core Infrastructure Validation)

**Purpose**: Validate that core wake lock infrastructure works correctly

**⚠️ CRITICAL**: This phase validates the foundation that all user stories depend on

- [ ] T005 Verify browser support detection works ('wakeLock' in navigator check)
- [ ] T006 Verify LocalStorage persistence mechanism for settings.screenWakeLock
- [ ] T007 Verify console logging works for wake lock events (activation, release, errors)
- [ ] T008 Verify error handling doesn't break app on unsupported browsers
- [ ] T009 Verify Page Visibility API event listener is properly registered

**Checkpoint**: Foundation validated - user story verification can proceed

---

## Phase 3: User Story 1 - Enable Screen Stay-On for Dashboard Viewing (Priority: P1) 🎯 MVP

**Goal**: Users can enable "Keep Screen On" to prevent automatic screen timeout while viewing CalmDash

**Independent Test**: Enable "Keep Screen On" in Settings, leave device idle for 5+ minutes, verify screen stays active

### Manual Testing for User Story 1 ✅

> **NOTE: Execute these tests manually in browsers - no automated test framework**

- [ ] T010 [P] [US1] Test on Chrome 85+ (Desktop): Enable wake lock, verify screen stays on, check console logs
- [ ] T011 [P] [US1] Test on Android Chrome 84+: Enable wake lock, verify screen stays on beyond device timeout
- [ ] T012 [P] [US1] Test on iOS Safari 16.6+: Enable wake lock, verify screen stays on
- [ ] T013 [P] [US1] Test setting persistence: Enable, close browser, reopen, verify setting remembered
- [ ] T014 [P] [US1] Test tab switching: Enable wake lock, switch tabs, return to tab, verify reacquisition
- [ ] T015 [P] [US1] Test visibility change: Minimize browser, restore, verify wake lock reacquired

### Documentation for User Story 1

- [ ] T016 [US1] Document test results in specs/001-screen-wake-lock/test-results.md
- [ ] T017 [US1] Add browser compatibility section to README.md with minimum versions
- [ ] T018 [US1] Create user guide section in README.md explaining how to use "Keep Screen On"

**Checkpoint**: User Story 1 validated and documented - core functionality proven

---

## Phase 4: User Story 2 - Graceful Handling of Unsupported Environments (Priority: P2)

**Goal**: Users in unsupported environments receive clear feedback about why feature isn't available

**Independent Test**: Access app over HTTP or in older browser, attempt to enable, verify informative feedback shown

### Manual Testing for User Story 2 ✅

- [ ] T019 [P] [US2] Test HTTP environment: Access via http://, verify help text explains HTTPS requirement
- [ ] T020 [P] [US2] Test unsupported browser: Use Chrome <84, verify console warning logged
- [ ] T021 [P] [US2] Test wake lock failure: Trigger API failure, verify app continues functioning normally
- [ ] T022 [P] [US2] Verify no console errors in any tested unsupported environment

### Implementation Improvements for User Story 2

- [ ] T023 [US2] Review and enhance help text in app/index.html if needed for clarity
- [ ] T024 [US2] Verify error messages in app/js/main.js are informative and non-technical

### Documentation for User Story 2

- [ ] T025 [US2] Document unsupported environments and expected behavior in README.md
- [ ] T026 [US2] Add troubleshooting section to README.md for common issues

**Checkpoint**: User Story 2 validated - graceful degradation confirmed

---

## Phase 5: User Story 3 - Visual Feedback for Wake Lock Status (Priority: P3)

**Goal**: Users can see at a glance whether "Keep Screen On" is currently active

**Independent Test**: Toggle feature on/off, observe settings UI reflects current state accurately

### Manual Testing for User Story 3 ✅

- [ ] T027 [P] [US3] Test checkbox state reflects enabled setting when opening Settings modal
- [ ] T028 [P] [US3] Test checkbox state reflects disabled setting when opening Settings modal
- [ ] T029 [P] [US3] Test rapid toggling: Click toggle 5 times quickly, verify final state is correct

### Potential Enhancements for User Story 3 (OPTIONAL)

> **NOTE: These are enhancement ideas, not required for current implementation**

- [ ] T030 [US3] Consider adding visual indicator (icon/badge) in header when wake lock is active
- [ ] T031 [US3] Consider adding tooltip on hover showing wake lock status
- [ ] T032 [US3] Document enhancement ideas in specs/001-screen-wake-lock/future-enhancements.md

**Checkpoint**: User Story 3 validated - status visibility confirmed

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and overall quality

### Documentation Polish

- [ ] T033 [P] Verify all English documentation files are complete and accurate
- [ ] T034 [P] Verify all Korean (_kor) documentation files are complete and accurate
- [ ] T035 [P] Add screenshots to README.md showing settings toggle and help text
- [ ] T036 [P] Create quick reference card in specs/001-screen-wake-lock/quick-reference.md

### Code Quality Review

- [ ] T037 Review wake lock code in app/js/main.js for clarity and best practices
- [ ] T038 Verify JSDoc comments exist for all three wake lock functions
- [ ] T039 Review console log messages for consistency and helpfulness
- [ ] T040 Verify error handling covers all edge cases from spec.md

### Cross-Browser Validation

- [ ] T041 [P] Test on Firefox 126+ (Desktop)
- [ ] T042 [P] Test on Edge 90+ (Desktop)
- [ ] T043 [P] Test on Safari 16.6+ (macOS)
- [ ] T044 [P] Test on Firefox 126+ (Android)
- [ ] T045 [P] Test on Opera 73+ (Android)
- [ ] T046 Compile browser compatibility matrix with test results

### Performance Validation

- [ ] T047 Measure wake lock acquisition time (<100ms target)
- [ ] T048 Measure wake lock release time on tab hide (<1000ms target)
- [ ] T049 Verify no impact on page load time
- [ ] T050 Document performance metrics in specs/001-screen-wake-lock/performance.md

### Security & Privacy Review

- [ ] T051 Verify HTTPS enforcement is documented and understood
- [ ] T052 Verify no privacy leaks (all data stays in LocalStorage)
- [ ] T053 Verify no XSS vulnerabilities in wake lock code
- [ ] T054 Document security considerations in README.md

### Edge Case Validation

- [ ] T055 [P] Test battery saver mode behavior (Android)
- [ ] T056 [P] Test browser crash recovery (setting persists after crash)
- [ ] T057 [P] Test rapid tab switching (10 switches in 5 seconds)
- [ ] T058 [P] Test with aggressive power management settings
- [ ] T059 Document edge case test results in specs/001-screen-wake-lock/edge-cases.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup verification completion
- **User Stories (Phase 3-5)**: All depend on Foundational phase validation
  - User stories can proceed in parallel (different testers/devices)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being validated

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Independent from US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Independent from US1 and US2

**Independence Validation**: Each user story can be tested completely independently. You can validate US2 without validating US1 first.

### Within Each User Story

- Manual tests can run in parallel (different browsers/devices)
- Documentation tasks can run in parallel
- Implementation improvements (if any) should be tested before documenting

### Parallel Opportunities

- **Phase 1**: All 4 tasks marked [P] can run in parallel
- **Phase 2**: Tasks T005-T009 can run sequentially (they validate related functionality)
- **Phase 3 (US1)**: All 6 manual tests (T010-T015) marked [P] can run in parallel on different devices
- **Phase 4 (US2)**: All 4 manual tests (T019-T022) marked [P] can run in parallel
- **Phase 5 (US3)**: All 3 manual tests (T027-T029) marked [P] can run in parallel
- **Phase 6 Documentation**: T033-T036 marked [P] can run in parallel
- **Phase 6 Cross-Browser**: T041-T045 marked [P] can run in parallel on different devices
- **Phase 6 Edge Cases**: T055-T058 marked [P] can run in parallel on different devices

---

## Parallel Example: User Story 1 Testing

```bash
# Launch all manual tests for User Story 1 together (different devices/browsers):

Tester 1 with Desktop Chrome:
Task: "Test on Chrome 85+ (Desktop): Enable wake lock, verify screen stays on"

Tester 2 with Android Device:
Task: "Test on Android Chrome 84+: Enable wake lock, verify screen stays on"

Tester 3 with iOS Device:
Task: "Test on iOS Safari 16.6+: Enable wake lock, verify screen stays on"

Tester 4 with Desktop Chrome:
Task: "Test setting persistence: Enable, close browser, reopen"

Tester 5 with Desktop Chrome:
Task: "Test tab switching: Enable, switch tabs, return, verify reacquisition"

Tester 6 with Desktop Chrome:
Task: "Test visibility change: Minimize browser, restore, verify reacquired"
```

---

## Parallel Example: Phase 6 Documentation

```bash
# Launch all documentation tasks together (different contributors):

Contributor 1:
Task: "Verify all English documentation files are complete and accurate"

Contributor 2:
Task: "Verify all Korean (_kor) documentation files are complete and accurate"

Contributor 3:
Task: "Add screenshots to README.md showing settings toggle and help text"

Contributor 4:
Task: "Create quick reference card in specs/001-screen-wake-lock/quick-reference.md"
```

---

## Implementation Strategy

### Validation First (User Story 1 Testing)

1. Complete Phase 1: Setup & Verification
2. Complete Phase 2: Foundational Validation (CRITICAL)
3. Complete Phase 3: User Story 1 Testing
4. **STOP and DOCUMENT**: Record test results, update README
5. Feature is validated and ready for users

### Incremental Documentation

1. Validate US1 → Document → Publish (MVP validation done!)
2. Validate US2 → Document → Publish (Graceful degradation confirmed!)
3. Validate US3 → Document → Publish (Status visibility confirmed!)
4. Polish → Final documentation pass → Complete

### Parallel Team Strategy

With multiple testers/contributors:

1. Team completes Setup + Foundational together
2. Once Foundational is validated:
   - Tester A: User Story 1 (critical path)
   - Tester B: User Story 2 (can run simultaneously)
   - Tester C: User Story 3 (can run simultaneously)
3. Stories validate independently, documentation proceeds in parallel

---

## Task Summary

**Total Tasks**: 59
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 5 tasks
- Phase 3 (US1): 9 tasks (6 tests + 3 docs)
- Phase 4 (US2): 8 tasks (4 tests + 2 implementation + 2 docs)
- Phase 5 (US3): 6 tasks (3 tests + 3 enhancements)
- Phase 6 (Polish): 27 tasks (4 docs + 4 code + 6 cross-browser + 4 performance + 4 security + 5 edge cases)

**Tasks by Story**:
- US1: 9 tasks
- US2: 8 tasks
- US3: 6 tasks
- Setup/Foundational: 9 tasks
- Polish: 27 tasks

**Parallel Opportunities**: 35 tasks marked [P] can run in parallel within their phases

**Suggested MVP Scope**: Phase 1-3 (US1 validation and documentation) = 18 tasks

**Implementation Status**: ✅ Feature already implemented, tasks focus on validation and documentation

---

## Notes

### Feature Status
- ✅ Core implementation complete (commit `0ac01a5`)
- ✅ All three wake lock functions implemented
- ✅ Settings toggle implemented
- ✅ Page visibility handling implemented
- 🔄 Documentation needs completion
- 🔄 Cross-browser testing needed
- 🔄 README updates needed

### Testing Approach
- No automated tests (no test framework in project)
- Manual browser testing across platforms
- Focus on real-world usage scenarios
- Test on actual devices when possible

### Documentation Priority
- README.md updates (high priority)
- Browser compatibility matrix (high priority)
- Troubleshooting guide (medium priority)
- Screenshots/visual aids (medium priority)
- Performance metrics (low priority)

### Future Enhancements (Out of Scope)
- Automated browser tests (requires test infrastructure)
- Battery consumption monitoring
- Visual indicator when wake lock is active
- Wake lock duration limits
- Alternative implementations for unsupported browsers

---

## Validation Checklist

Before considering this feature "complete":

- [ ] All US1 acceptance scenarios pass on at least 3 browsers
- [ ] All US2 acceptance scenarios pass (graceful degradation tested)
- [ ] All US3 acceptance scenarios pass (status visibility confirmed)
- [ ] README.md has browser compatibility section
- [ ] README.md has user guide for "Keep Screen On"
- [ ] README.md has troubleshooting section
- [ ] All edge cases from spec.md tested and documented
- [ ] Performance metrics meet targets (<100ms acquire, <1000ms release)
- [ ] No console errors in any tested environment
- [ ] Security review complete (HTTPS, privacy, XSS)
- [ ] Korean documentation (_kor files) complete and accurate

---

## Quick Start for Contributors

**To validate the existing implementation**:

1. Start with Phase 1 (Setup & Verification) - verify code exists
2. Move to Phase 2 (Foundational) - validate core infrastructure
3. Pick a user story based on available devices:
   - Have Android device? → User Story 1 (P1)
   - Testing on HTTP? → User Story 2 (P2)
   - Just checking UI? → User Story 3 (P3)
4. Document your test results
5. Update README.md with findings
6. Commit and move to next story or Phase 6 tasks

**To add documentation**:

1. Pick a documentation task from Phase 3-6
2. Review existing implementation in app/js/main.js and app/index.html
3. Write documentation based on actual code
4. Verify accuracy with manual testing if needed
5. Commit documentation updates

**To run cross-browser tests**:

1. Pick a browser from Phase 6 cross-browser tasks
2. Follow test procedure from Phase 3 (US1) tests
3. Record results in browser compatibility matrix
4. Commit test results documentation
