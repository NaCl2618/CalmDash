# Implementation Plan: Screen Wake Lock

**Branch**: `001-screen-wake-lock` | **Date**: 2026-01-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-screen-wake-lock/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Implement Screen Wake Lock API integration to prevent automatic screen timeout on Android devices, iOS, and desktop browsers. The feature allows users to enable "Keep Screen On" functionality through a settings toggle, with automatic lifecycle management (acquire on visibility, release on hide) and graceful degradation for unsupported environments. The implementation uses vanilla JavaScript with the browser's native Wake Lock API, LocalStorage for preference persistence, and Page Visibility API for automatic reacquisition.

## Technical Context

**Language/Version**: JavaScript ES6+ (no transpilation, runs directly in browser)
**Primary Dependencies**:
- Screen Wake Lock API (W3C standard, browser-native)
- Page Visibility API (browser-native)
- LocalStorage API (browser-native)
- No external libraries or frameworks

**Storage**: LocalStorage for user preferences (`settings.screenWakeLock` boolean)
**Testing**: Manual browser testing (no automated test framework currently in project)
**Target Platform**:
- Android: Chrome 84+, Firefox 126+, Opera 73+
- iOS/iPadOS: Safari 16.6+
- Desktop: Chrome 85+, Edge 90+, Firefox 126+, Safari 16.6+

**Project Type**: Single-page web application (SPA) with classic script loading
**Performance Goals**:
- Wake lock acquisition: <100ms
- Wake lock release: <1000ms when tab hidden
- No impact on page load time
- Minimal memory footprint (<1KB for wake lock state)

**Constraints**:
- HTTPS required (browser security policy for Wake Lock API)
- Must not block or delay page initialization
- Must handle API unavailability gracefully
- Must not cause console errors in unsupported browsers
- Browser compatibility detection required before API usage

**Scale/Scope**:
- Single feature (wake lock management)
- 3 core functions (request, release, init)
- 1 UI control (settings toggle with help text)
- 1 event listener (visibility change)
- Affects 2 files: main.js (logic), index.html (UI control)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: No formal constitution file exists for this project. The codebase follows these implicit principles:

1. **Simplicity First**: Vanilla JavaScript, no build tools, no frameworks
2. **Progressive Enhancement**: Features degrade gracefully on older browsers
3. **Privacy-Focused**: All data stored locally, no external tracking
4. **E-Ink Optimization**: High contrast, minimal resource usage
5. **Security**: XSS protection via escapeHTML, HTTPS for sensitive APIs

**Constitution Alignment**: ✅ PASS
- Feature maintains vanilla JavaScript approach (no new dependencies)
- Graceful degradation built-in (browser support detection)
- Privacy preserved (setting stored in LocalStorage only)
- No external API calls (browser-native API)
- Security requirement met (HTTPS enforced by browser for Wake Lock)

**Notes**: Since this project has no formal constitution, we infer principles from existing code patterns. The wake lock feature aligns perfectly with the established architecture.

## Project Structure

### Documentation (this feature)

```text
specs/001-screen-wake-lock/
├── spec.md              # Feature specification (COMPLETE)
├── spec_kor.md          # Korean version of spec (COMPLETE)
├── plan.md              # This file (IN PROGRESS)
├── plan_kor.md          # Korean version of plan (TO BE CREATED)
├── research.md          # Phase 0 output (TO BE CREATED)
├── research_kor.md      # Korean version of research (TO BE CREATED)
├── data-model.md        # Phase 1 output (TO BE CREATED)
├── data-model_kor.md    # Korean version of data model (TO BE CREATED)
├── quickstart.md        # Phase 1 output (TO BE CREATED)
├── quickstart_kor.md    # Korean version of quickstart (TO BE CREATED)
├── checklists/
│   ├── requirements.md      # Spec quality checklist (COMPLETE)
│   └── requirements_kor.md  # Korean version (COMPLETE)
└── tasks.md             # Phase 2 output (/speckit.tasks - NOT YET)
```

### Source Code (repository root)

```text
app/
├── index.html           # Main HTML entry point
│   └── [MODIFIED] Settings modal with wake lock toggle
├── css/
│   └── style.css        # E-Ink optimized styles (NO CHANGES)
└── js/
    ├── constants.js     # Initial data & config (NO CHANGES)
    ├── utils.js         # Helper functions (NO CHANGES)
    ├── store.js         # Data management (MINOR: default settings)
    ├── ui.js            # Rendering functions (MINOR: settings UI)
    └── main.js          # Entry point & initialization
        └── [MODIFIED] Wake lock functions added:
            - requestWakeLock()
            - releaseWakeLock()
            - initWakeLock()

README.md                # Project documentation
└── [TO UPDATE] Add browser compatibility section

specs/                   # Feature specifications
└── 001-screen-wake-lock/ # This feature
```

**Structure Decision**: This project uses a single-page application structure with classic script loading (no module bundler). All JavaScript files are loaded via `<script>` tags in index.html in dependency order. The wake lock feature integrates directly into main.js as three helper functions, with UI changes in index.html settings modal and settings initialization in store.js.

**Existing Architecture**:
- **Store pattern**: Centralized state management with observer pattern
- **Module separation**: utils (helpers), store (data), ui (rendering), main (initialization)
- **No ES6 modules**: Classic script loading for `file://` protocol compatibility
- **LocalStorage persistence**: All user settings auto-saved on change

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: ✅ NO VIOLATIONS - Feature fully complies with inferred project principles

This feature introduces zero additional complexity:
- No new dependencies (uses browser-native APIs)
- No new architectural patterns (follows existing Store pattern)
- No build complexity (continues classic script approach)
- No external services (browser API only)
- Minimal code footprint (~60 lines of JavaScript)

## Phase 0: Research & Decisions

**Status**: ✅ COMPLETE (documented in research.md)

Key research areas completed:
1. ✅ Screen Wake Lock API browser support matrix
2. ✅ HTTPS requirement verification
3. ✅ Page Visibility API integration patterns
4. ✅ Error handling best practices for unsupported browsers
5. ✅ LocalStorage persistence patterns in existing codebase

See [research.md](research.md) for full research documentation.

## Phase 1: Design Artifacts

### Data Model

**Status**: ✅ COMPLETE (documented in data-model.md)

Key entities:
1. **Wake Lock Setting** (Boolean in LocalStorage)
2. **Wake Lock Sentinel** (Browser-managed object reference)

See [data-model.md](data-model.md) for full data model specification.

### API Contracts

**Status**: N/A - No external API contracts needed

This feature uses browser-native APIs only:
- `navigator.wakeLock.request('screen')` - W3C standard
- `document.visibilityState` - W3C standard
- `localStorage.setItem/getItem` - W3C standard

No custom API endpoints or contracts required.

### Integration Points

**Existing codebase integration**:

1. **Settings System** (store.js)
   - Add `screenWakeLock: false` to default settings
   - Persisted automatically via existing save mechanism

2. **UI System** (ui.js + index.html)
   - Add toggle control to settings modal
   - Add help text about HTTPS requirement
   - Checkbox styling already supports custom controls

3. **Initialization** (main.js)
   - Call `initWakeLock()` during app startup
   - Register visibility change listener
   - Integrate with existing lifecycle

### Quickstart Guide

**Status**: ✅ COMPLETE (documented in quickstart.md)

See [quickstart.md](quickstart.md) for developer setup and testing instructions.

## Implementation Phases (for /speckit.tasks)

### Phase A: Core Wake Lock Logic (P1 - Critical)
- Implement `requestWakeLock()` function
- Implement `releaseWakeLock()` function
- Implement `initWakeLock()` function
- Add visibility change event listener

### Phase B: Settings Integration (P1 - Critical)
- Add `screenWakeLock` to default settings in store.js
- Add toggle control to settings modal HTML
- Wire toggle to wake lock enable/disable
- Add help text about HTTPS requirement

### Phase C: Testing & Documentation (P2 - High)
- Manual testing on Android Chrome
- Manual testing on iOS Safari
- Manual testing on desktop browsers
- Test HTTP vs HTTPS behavior
- Update README with browser compatibility

### Phase D: Edge Case Handling (P3 - Nice-to-have)
- Test battery saver mode behavior
- Test browser crash recovery
- Test rapid tab switching
- Document known limitations

## Success Validation

The implementation will be considered complete when:

1. ✅ Wake lock can be enabled/disabled via settings toggle
2. ✅ Wake lock persists across browser sessions
3. ✅ Wake lock releases automatically on tab hide
4. ✅ Wake lock reacquires automatically on tab show (if enabled)
5. ✅ Feature degrades gracefully on HTTP or unsupported browsers
6. ✅ No console errors in any tested environment
7. ✅ README documents browser compatibility requirements

These map directly to success criteria SC-001 through SC-007 in the feature specification.

## Notes

**Already Implemented**: This feature has already been implemented in the codebase (commit `0ac01a5`). This plan documents the existing implementation for reference and future enhancements.

**Future Enhancements** (Out of Scope):
- Automated browser tests (requires test framework setup)
- Battery consumption monitoring/warnings
- Visual indicator when wake lock is active
- Wake lock duration limits or auto-disable
- Alternative implementations for unsupported browsers
