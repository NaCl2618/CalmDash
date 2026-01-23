# Data Model: Screen Wake Lock

**Feature**: Screen Wake Lock
**Phase**: Phase 1 - Design Artifacts
**Date**: 2026-01-23
**Status**: Complete

## Overview

This document defines the data structures, state management, and lifecycle for the Screen Wake Lock feature. The feature introduces minimal new data - primarily a boolean preference and a runtime object reference.

## Data Entities

### 1. Wake Lock Setting (Persistent)

**Storage Location**: `localStorage` under key `calmdash-data`
**Path in Object**: `data.settings.screenWakeLock`
**Type**: `Boolean`
**Default Value**: `false`

**Purpose**: User preference for whether to keep the screen on while viewing the dashboard.

**Schema**:
```javascript
{
  settings: {
    theme: 'light',              // Existing
    dateFormat: 'YYYY-MM-DD',    // Existing
    timeFormat: '24h',           // Existing
    sectionOrder: [...],         // Existing
    sectionVisibility: {...},    // Existing
    screenWakeLock: false        // NEW: Wake lock preference
  }
}
```

**Lifecycle**:
1. **Initialization**: Loaded from localStorage on page load
2. **Updates**: Changed when user toggles setting in UI
3. **Persistence**: Saved automatically via Store.save() on every change
4. **Export/Import**: Included in data export/import feature (existing functionality)

**Validation Rules**:
- Must be a boolean (true/false)
- No additional validation needed (setting is binary)

**Access Pattern**:
```javascript
// Read
const isEnabled = app.data.settings.screenWakeLock;

// Write
app.data.settings.screenWakeLock = true;
app.save(); // Triggers localStorage update
```

---

### 2. Wake Lock Sentinel (Runtime)

**Storage Location**: JavaScript module scope variable in `main.js`
**Variable Name**: `wakeLock`
**Type**: `WakeLockSentinel | null`
**Default Value**: `null`

**Purpose**: Runtime reference to the active wake lock object managed by the browser.

**Schema**:
```javascript
// Browser-managed object (not defined by our code)
WakeLockSentinel {
  released: boolean,          // Whether lock has been released
  type: 'screen',             // Always 'screen' for this feature
  addEventListener(event, handler),
  removeEventListener(event, handler),
  release(): Promise<void>
}
```

**Lifecycle**:
1. **Initialization**: `null` on page load
2. **Acquisition**: Set when `navigator.wakeLock.request('screen')` succeeds
3. **Release**: Set back to `null` when wake lock is released (manually or automatically)
4. **Events**: Sentinel emits 'release' event when lock is released

**State Transitions**:
```
null → WakeLockSentinel  (user enables setting, page visible)
WakeLockSentinel → null  (user disables setting OR page hidden OR browser releases)
```

**Access Pattern**:
```javascript
// Acquire
wakeLock = await navigator.wakeLock.request('screen');

// Check status
if (wakeLock !== null && !wakeLock.released) {
  // Wake lock is active
}

// Release
await wakeLock.release();
wakeLock = null;
```

---

## State Management

### Application State

The Screen Wake Lock feature integrates into the existing Store pattern:

**Store Class** (existing, in `store.js`):
```javascript
class Store {
  constructor() {
    this.data = this.loadData();      // Includes settings.screenWakeLock
    this.subscribers = [];
  }

  loadData() {
    const saved = localStorage.getItem('calmdash-data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  }

  save() {
    localStorage.setItem('calmdash-data', JSON.stringify(this.data));
    this.notifySubscribers();
  }
}
```

**Wake Lock State** (new, in `main.js`):
```javascript
let wakeLock = null;  // Runtime sentinel reference

function initWakeLock() {
  // Initialize based on stored preference
  if (app.data.settings.screenWakeLock) {
    requestWakeLock();
  }

  // Re-acquire on visibility change
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' &&
        app.data.settings.screenWakeLock &&
        wakeLock === null) {
      requestWakeLock();
    }
  });
}
```

### State Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Start                        │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Load settings from    │
                    │ localStorage          │
                    │ (screenWakeLock bool) │
                    └───────────┬───────────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
                ▼                               ▼
    ┌──────────────────┐           ┌──────────────────┐
    │ Setting = false  │           │ Setting = true   │
    │ (DEFAULT)        │           │                  │
    └────────┬─────────┘           └────────┬─────────┘
             │                              │
             │                              ▼
             │                  ┌──────────────────────┐
             │                  │ Request wake lock    │
             │                  │ wakeLock = Sentinel  │
             │                  └────────┬─────────────┘
             │                           │
             │         ┌─────────────────┴─────────────────┐
             │         │                                   │
             │         ▼                                   ▼
             │  ┌─────────────┐                    ┌─────────────┐
             │  │ Page Visible│                    │ Page Hidden │
             │  │ (Active)    │                    │             │
             │  └──────┬──────┘                    └──────┬──────┘
             │         │                                  │
             │         │ Toggle OFF                       │ Auto-release
             │         ▼                                  ▼
             │  ┌─────────────────────────────────────────┐
             └─→│ Wake lock released                      │
                │ wakeLock = null                         │
                └─────────────────────────────────────────┘
                        │
                        │ Toggle ON + Visible
                        ▼
                ┌──────────────────┐
                │ Request wake lock│
                │ (cycle repeats)  │
                └──────────────────┘
```

---

## Data Flow

### 1. User Enables Wake Lock

```
User clicks toggle in Settings Modal
  ↓
UI event handler updates store
  ↓
app.data.settings.screenWakeLock = true
  ↓
app.save() → localStorage updated
  ↓
requestWakeLock() called
  ↓
navigator.wakeLock.request('screen')
  ↓
wakeLock = WakeLockSentinel (success)
  OR
console.error (failure, graceful)
```

### 2. User Disables Wake Lock

```
User clicks toggle in Settings Modal
  ↓
UI event handler updates store
  ↓
app.data.settings.screenWakeLock = false
  ↓
app.save() → localStorage updated
  ↓
releaseWakeLock() called
  ↓
wakeLock.release()
  ↓
wakeLock = null
```

### 3. Page Becomes Hidden (Tab Switch)

```
Browser fires 'visibilitychange' event
  ↓
document.visibilityState === 'hidden'
  ↓
Browser automatically releases wake lock
  ↓
wakeLock.addEventListener('release') fires
  ↓
Console log: "Wake lock released"
  ↓
(wakeLock sentinel still exists but released=true)
```

### 4. Page Becomes Visible Again

```
Browser fires 'visibilitychange' event
  ↓
document.visibilityState === 'visible'
  ↓
Event listener checks app.data.settings.screenWakeLock
  ↓
if true && wakeLock === null → requestWakeLock()
  ↓
Wake lock reacquired (user experience uninterrupted)
```

---

## Integration with Existing Data Model

### Existing Data Structure (constants.js)

```javascript
const INITIAL_DATA = {
  routines: [...],      // Existing
  schedules: [...],     // Existing
  todos: [...],         // Existing
  settings: {
    theme: 'light',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    sectionOrder: [
      { id: 'routines', label: '루틴' },
      { id: 'schedules', label: '일정' },
      { id: 'todos', label: '할일' }
    ],
    sectionVisibility: {
      routines: true,
      schedules: true,
      todos: true
    },
    screenWakeLock: false  // NEW: Add this line
  }
};
```

**Impact**: Single line addition, no structural changes.

---

## Data Validation

### Input Validation

**Setting Toggle**:
- Input source: User click on checkbox
- Validation: Boolean coercion (`!!value`)
- Error handling: None needed (binary input)

**Wake Lock Request**:
- Input source: Browser API call
- Validation: Feature detection (`'wakeLock' in navigator`)
- Error handling: try-catch, console.error, continue

### Data Integrity

**localStorage Persistence**:
- Format: JSON string
- Validation: JSON.parse with try-catch (existing in Store)
- Corruption handling: Falls back to INITIAL_DATA (existing pattern)
- Migration: Not needed (new field, default value handles old data)

**Wake Lock Sentinel**:
- Browser-managed (we don't create the object)
- No validation needed (trust browser implementation)
- Null-safety: Always check `wakeLock !== null` before calling methods

---

## Performance Considerations

### Memory Usage

| Data Item | Size | Lifetime | Impact |
|-----------|------|----------|--------|
| `settings.screenWakeLock` | 1 byte | Persistent | Negligible |
| `wakeLock` sentinel reference | 8 bytes | While active | Negligible |
| Wake lock object (browser) | ~100 bytes | While active | Low |

**Total Memory Impact**: < 1 KB

### Storage Usage

**localStorage Entry**:
- Existing data: ~5-50 KB (routines, schedules, todos)
- Added field: +21 bytes (`"screenWakeLock":false,`)
- Impact: < 0.5% increase

### Performance Metrics

| Operation | Time | Frequency |
|-----------|------|-----------|
| Load setting from localStorage | < 1ms | Once per page load |
| Request wake lock | < 100ms | On enable or visibility change |
| Release wake lock | < 50ms | On disable or hide |
| Save setting to localStorage | < 5ms | On toggle change |

**Impact on Page Load**: None (wake lock request is async, non-blocking)

---

## Edge Cases & Error States

### Edge Case 1: Browser Doesn't Support Wake Lock

**Detection**: `'wakeLock' in navigator === false`
**Data State**: `settings.screenWakeLock` can be true, but `wakeLock` stays `null`
**Behavior**: Silent failure, feature doesn't work but app continues normally

### Edge Case 2: Wake Lock Request Fails (HTTPS)

**Detection**: `navigator.wakeLock.request()` throws SecurityError
**Data State**: `settings.screenWakeLock = true`, `wakeLock = null`
**Behavior**: Error logged, help text visible to user explaining HTTPS requirement

### Edge Case 3: Browser Releases Wake Lock Unexpectedly

**Detection**: 'release' event fires without user action
**Data State**: `settings.screenWakeLock = true`, `wakeLock.released = true`
**Behavior**: Next visibility change will reacquire lock automatically

### Edge Case 4: Multiple Rapid Tab Switches

**Detection**: Multiple 'visibilitychange' events in quick succession
**Data State**: Wake lock rapidly acquired and released
**Behavior**: Each event handled independently, no race conditions (browser queues)

### Edge Case 5: User Changes Setting While Tab Hidden

**Scenario**: User enables wake lock while tab is in background
**Data State**: `settings.screenWakeLock = true`, page hidden
**Behavior**: Wake lock request deferred until page becomes visible (checked in event handler)

---

## Testing Data Scenarios

### Test Case 1: First-Time User

**Initial State**: No localStorage data
**Expected**: `screenWakeLock = false` (from INITIAL_DATA)
**Wake Lock**: Not requested

### Test Case 2: Returning User (Setting Enabled)

**Initial State**: localStorage contains `screenWakeLock: true`
**Expected**: Wake lock requested on page load (if visible)
**Wake Lock**: Active

### Test Case 3: Data Export/Import

**Action**: User exports data, clears storage, imports data
**Expected**: Wake lock setting preserved in export
**Wake Lock**: Matches imported setting on next load

### Test Case 4: Setting Toggle Rapid Clicks

**Action**: User clicks toggle on/off repeatedly (5 times in 2 seconds)
**Expected**: Each click saves to localStorage, wake lock request/release called
**Wake Lock**: Final state matches last toggle position

---

## Data Migration

**Status**: No migration needed

**Reason**: New feature, adding optional field with safe default

**Backward Compatibility**:
- Old data without `screenWakeLock` field → defaults to `false` (INITIAL_DATA)
- Store.loadData() handles missing fields gracefully
- No breaking changes to existing data structure

**Forward Compatibility**:
- If field is removed in future, old data with field is harmless (ignored)
- No cleanup needed

---

## Conclusion

The Screen Wake Lock feature introduces minimal data complexity:
- ✅ Single boolean preference (persistent)
- ✅ Single object reference (runtime)
- ✅ Integrates seamlessly with existing Store pattern
- ✅ No migration or validation complexity
- ✅ Negligible performance impact

**Ready to Proceed**: Implementation Phase (tasks.md)
