# Feature Specification: Screen Wake Lock

**Feature Branch**: `001-screen-wake-lock`
**Created**: 2026-01-23
**Status**: Draft
**Input**: User description: "Screen Wake Lock feature for preventing automatic screen timeout on Android devices and other platforms"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enable Screen Stay-On for Dashboard Viewing (Priority: P1)

A user wants to use CalmDash as an always-visible dashboard on their Android device (or tablet/desktop) without the screen automatically turning off due to device timeout settings. They need a way to keep the screen active while viewing their productivity information.

**Why this priority**: This is the core value proposition of the feature. Without the ability to keep the screen on, the dashboard becomes unusable for always-on scenarios, which is a key use case for E-Ink displays and dedicated dashboard setups.

**Independent Test**: Can be fully tested by enabling the "Keep Screen On" setting in the app's settings panel, leaving the device idle, and verifying that the screen remains active beyond the device's normal timeout period. Delivers immediate value for dashboard use cases.

**Acceptance Scenarios**:

1. **Given** the user has opened CalmDash in a supported browser (Chrome 84+, Firefox 126+, Safari 16.6+), **When** they navigate to Settings and toggle "Keep Screen On" to enabled, **Then** the screen stays active indefinitely while the app is visible
2. **Given** the "Keep Screen On" feature is enabled, **When** the user switches to another tab or app, **Then** the wake lock is released and the device returns to normal timeout behavior
3. **Given** the "Keep Screen On" feature is enabled, **When** the user switches back to the CalmDash tab, **Then** the wake lock is automatically re-acquired and the screen stays on again
4. **Given** the user enables "Keep Screen On", **When** they close the browser or navigate away, **Then** the setting persists and is remembered for the next session

---

### User Story 2 - Graceful Handling of Unsupported Environments (Priority: P2)

A user attempts to enable the "Keep Screen On" feature in an environment that doesn't support the Screen Wake Lock API (older browser, HTTP instead of HTTPS, or unsupported platform). They need clear feedback about why the feature isn't available.

**Why this priority**: Essential for user experience and avoiding confusion, but secondary to the core functionality working in supported environments.

**Independent Test**: Can be tested by accessing CalmDash on HTTP (not HTTPS) or in an older browser version, attempting to enable the setting, and verifying that appropriate feedback is shown to explain why the feature is unavailable.

**Acceptance Scenarios**:

1. **Given** the user accesses CalmDash over HTTP (not HTTPS), **When** they view the Settings panel, **Then** they see informational text indicating that "Keep Screen On" requires HTTPS
2. **Given** the user is on a browser that doesn't support Wake Lock API, **When** they attempt to enable the feature, **Then** the system logs an informative error message and the toggle returns to disabled state
3. **Given** the Wake Lock request fails for any reason, **When** the error occurs, **Then** the user is not disrupted and the app continues functioning normally with standard timeout behavior

---

### User Story 3 - Visual Feedback for Wake Lock Status (Priority: P3)

A user has enabled "Keep Screen On" and wants to know at a glance whether the feature is currently active or not, especially after returning to the app from another tab or after a browser restart.

**Why this priority**: Nice-to-have enhancement that improves user confidence but not critical for basic functionality. The feature works transparently in the background.

**Independent Test**: Can be tested by toggling the feature on/off and observing the settings UI to confirm that the current state is clearly indicated.

**Acceptance Scenarios**:

1. **Given** the user has enabled "Keep Screen On", **When** they open the Settings panel, **Then** the toggle switch shows the enabled state
2. **Given** the Wake Lock is actively preventing screen timeout, **When** the user views the app, **Then** the settings reflect the active state accurately

---

### Edge Cases

- What happens when the user's device battery is critically low? (System may override Wake Lock)
- How does the system handle Wake Lock when the browser tab is in background vs foreground?
- What occurs if the user enables Wake Lock and then their browser crashes or loses connection?
- How does the feature behave on platforms with aggressive battery optimization (e.g., Android with battery saver mode)?
- What happens if the user denies Wake Lock permission (if browser prompts for it)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a user-accessible toggle control in the Settings panel to enable/disable the "Keep Screen On" feature
- **FR-002**: System MUST detect browser support for the Screen Wake Lock API before attempting to use it
- **FR-003**: System MUST request a screen wake lock when the feature is enabled and the page is visible
- **FR-004**: System MUST automatically release the wake lock when the page becomes hidden (tab switch, minimize, etc.)
- **FR-005**: System MUST automatically re-acquire the wake lock when the page becomes visible again (if the setting is still enabled)
- **FR-006**: System MUST persist the user's wake lock preference across browser sessions using LocalStorage
- **FR-007**: System MUST initialize the wake lock state on page load based on the saved user preference
- **FR-008**: System MUST provide informational help text indicating that the feature requires HTTPS and browser support
- **FR-009**: System MUST handle wake lock failures gracefully without disrupting the user experience
- **FR-010**: System MUST log wake lock errors to the console for debugging purposes
- **FR-011**: System MUST work on Android devices running Chrome 84+, Firefox 126+, or Opera 73+
- **FR-012**: System MUST work on iOS/iPadOS devices running Safari 16.6+
- **FR-013**: System MUST work on desktop browsers (Chrome 85+, Edge 90+, Firefox 126+, Safari 16.6+)

### Key Entities

- **Wake Lock Setting**: Boolean user preference stored in LocalStorage under the `settings.screenWakeLock` property (default: false)
- **Wake Lock Sentinel**: Browser-managed object representing the active screen wake lock, held as a reference in the application state

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can keep their screen active indefinitely while viewing CalmDash dashboard without manual interaction
- **SC-002**: The wake lock preference persists across browser sessions with 100% reliability (saved to LocalStorage)
- **SC-003**: Wake lock is automatically released within 1 second when user switches tabs or minimizes the browser
- **SC-004**: Wake lock is automatically re-acquired within 1 second when user returns to the CalmDash tab (if enabled)
- **SC-005**: Feature works correctly on all supported platforms (Android, iOS/iPadOS, Desktop) with specified minimum browser versions
- **SC-006**: Feature degrades gracefully on unsupported browsers without causing errors or breaking other functionality
- **SC-007**: Users receive clear feedback about HTTPS requirement and browser support through help text in Settings panel

## Assumptions *(optional)*

- Users understand that "Keep Screen On" will affect battery life on mobile devices
- Users have access to modern browsers (released within last 2-3 years) with Wake Lock API support
- CalmDash is served over HTTPS in production environments
- Browser implementations of Wake Lock API follow the standard specification
- Device-level battery optimization settings may override app-level wake locks in extreme cases (low battery, aggressive power saving)

## Dependencies *(optional)*

- Browser support for Screen Wake Lock API (W3C specification)
- HTTPS connection (required by browser security policy for Wake Lock)
- Page Visibility API for detecting tab visibility changes
- LocalStorage for persisting user preferences

## Out of Scope *(optional)*

- Custom wake lock duration limits (wake lock remains active until tab is hidden or user disables it)
- Battery consumption monitoring or warnings
- Alternative wake lock methods for browsers without native API support
- Automatic disable of wake lock based on battery level
- Per-section wake lock controls (feature applies to entire dashboard)
- Desktop-specific keep-awake mechanisms (system-level, not browser-level)
