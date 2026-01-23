# Quickstart Guide: Screen Wake Lock

**Feature**: Screen Wake Lock
**Phase**: Phase 1 - Design Artifacts
**Date**: 2026-01-23
**Audience**: Developers implementing or testing this feature

## Overview

This guide provides step-by-step instructions for developers to understand, implement, test, and validate the Screen Wake Lock feature in CalmDash.

---

## Prerequisites

### Required Knowledge
- JavaScript ES6+ (async/await, arrow functions, classes)
- Browser APIs (LocalStorage, Page Visibility API)
- DOM manipulation
- Chrome DevTools or equivalent browser developer tools

### Required Tools
- Modern web browser:
  - Chrome 85+ or Edge 90+ (Desktop)
  - Firefox 126+ (Desktop/Android)
  - Safari 16.6+ (Desktop/iOS)
- Local HTTP server (for development testing)
  - Python: `python -m http.server 8000`
  - Node.js: `npx http-server -p 8000`
  - VS Code: Live Server extension
- Text editor or IDE

### Environment Requirements
- **HTTPS or localhost**: Wake Lock API requires secure context
  - Production: HTTPS mandatory
  - Development: Use `http://localhost:8000` or `http://127.0.0.1:8000`
  - ❌ `file://` protocol does NOT work

---

## Architecture Overview

### Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                      index.html                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │         Settings Modal (UI Layer)                 │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ [x] Keep Screen On (Checkbox Toggle)        │  │  │
│  │  │ ℹ️  Requires HTTPS and modern browser       │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────────┬───────────────────────┘  │
└────────────────────────────────┼────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Store (store.js)     │
                    │ ┌────────────────────┐ │
                    │ │ settings:          │ │
                    │ │   screenWakeLock:  │ │
                    │ │     false          │ │
                    │ └────────┬───────────┘ │
                    │          │ save()      │
                    │          ▼             │
                    │    localStorage        │
                    └────────────┬───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   main.js              │
                    │ ┌────────────────────┐ │
                    │ │ wakeLock = null    │ │
                    │ │                    │ │
                    │ │ initWakeLock()     │ │
                    │ │ requestWakeLock()  │ │
                    │ │ releaseWakeLock()  │ │
                    │ └──────────┬─────────┘ │
                    └────────────┼───────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ Browser Wake Lock API  │
                    │ (navigator.wakeLock)   │
                    └────────────────────────┘
```

### File Modifications

| File | Changes | Lines Added/Modified |
|------|---------|---------------------|
| `app/js/constants.js` | Add `screenWakeLock: false` to INITIAL_DATA | 1 line |
| `app/js/main.js` | Add wake lock functions and initialization | ~60 lines |
| `app/index.html` | Add settings toggle and help text | ~10 lines |
| `README.md` | Document browser compatibility | ~20 lines |

---

## Implementation Steps

### Step 1: Update Constants (constants.js)

**Location**: `app/js/constants.js`
**Change**: Add default wake lock setting

```javascript
const INITIAL_DATA = {
  routines: [...],
  schedules: [...],
  todos: [...],
  settings: {
    theme: 'light',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    sectionOrder: [...],
    sectionVisibility: {...},
    screenWakeLock: false  // ADD THIS LINE
  }
};
```

**Why**: Provides default value for new users and backward compatibility.

---

### Step 2: Add Wake Lock Functions (main.js)

**Location**: `app/js/main.js`
**Change**: Add three new functions at module scope

```javascript
// Wake Lock 관리
let wakeLock = null;

/**
 * @function requestWakeLock
 * @description Wake Lock 활성화
 */
async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            console.log('[Wake Lock] 화면 켜짐 유지 활성화');

            wakeLock.addEventListener('release', () => {
                console.log('[Wake Lock] 화면 켜짐 유지 해제됨');
            });
        } else {
            console.warn('[Wake Lock] 이 브라우저는 Wake Lock API를 지원하지 않습니다.');
        }
    } catch (err) {
        console.error('[Wake Lock] 활성화 실패:', err);
    }
}

/**
 * @function releaseWakeLock
 * @description Wake Lock 해제
 */
async function releaseWakeLock() {
    if (wakeLock !== null) {
        try {
            await wakeLock.release();
            wakeLock = null;
            console.log('[Wake Lock] 화면 켜짐 유지 비활성화');
        } catch (err) {
            console.error('[Wake Lock] 해제 실패:', err);
        }
    }
}

/**
 * @function initWakeLock
 * @description Wake Lock 초기화 및 설정 적용
 */
function initWakeLock() {
    if (app.data.settings.screenWakeLock) {
        requestWakeLock();
    }

    // 페이지가 다시 보일 때 Wake Lock 재활성화
    document.addEventListener('visibilitychange', async () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
            await requestWakeLock();
        }
    });
}
```

**Why**:
- `requestWakeLock()`: Handles API call, feature detection, error handling
- `releaseWakeLock()`: Cleans up wake lock on disable
- `initWakeLock()`: Initializes on page load and handles visibility changes

---

### Step 3: Initialize Wake Lock (main.js)

**Location**: `app/js/main.js` - Inside `DOMContentLoaded` event handler
**Change**: Call `initWakeLock()` during app initialization

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // Existing initialization...
    initClock();
    initWeather();
    updateDashboard();

    // ADD THIS LINE
    initWakeLock();
});
```

**Why**: Ensures wake lock is activated on page load if user has enabled it.

---

### Step 4: Add Settings UI (index.html)

**Location**: `app/index.html` - Inside settings modal
**Change**: Add checkbox toggle with help text

```html
<!-- Existing settings... -->

<!-- ADD THIS SECTION -->
<div class="e-form-group">
    <label class="e-label">
        <input type="checkbox" id="setting-screen-wake-lock"
               onchange="app.data.settings.screenWakeLock = this.checked; app.save(); this.checked ? requestWakeLock() : releaseWakeLock();">
        <span>화면 켜짐 유지 (Keep Screen On)</span>
    </label>
    <p class="e-help-text">
        ℹ️ HTTPS 환경과 최신 브라우저에서만 작동합니다.
        <br>
        지원: Chrome 84+, Firefox 126+, Safari 16.6+
    </p>
</div>
```

**Why**: Provides user control and communicates requirements clearly.

---

### Step 5: Initialize Settings UI (ui.js or main.js)

**Location**: Where settings modal is populated (likely `showSettingsModal()`)
**Change**: Set checkbox state from stored value

```javascript
function showSettingsModal() {
    // Existing settings initialization...

    // ADD THIS LINE
    document.getElementById('setting-screen-wake-lock').checked = app.data.settings.screenWakeLock;

    // Show modal...
}
```

**Why**: Ensures UI reflects current setting when modal opens.

---

### Step 6: Update Documentation (README.md)

**Location**: `README.md`
**Change**: Add browser compatibility section

```markdown
## Browser Compatibility

### Screen Wake Lock Feature

The "Keep Screen On" feature requires a modern browser with Screen Wake Lock API support:

**Supported Platforms:**
- **Android**: Chrome 84+, Firefox 126+, Opera 73+
- **iOS/iPadOS**: Safari 16.6+
- **Desktop**: Chrome 85+, Edge 90+, Firefox 126+, Safari 16.6+

**Requirements:**
- HTTPS connection (or localhost for development)
- Modern browser released within the last 2-3 years

**Note**: The app works normally on older browsers - this feature simply won't be available.
```

**Why**: Sets clear expectations for users and developers.

---

## Testing Guide

### Test Environment Setup

1. **Start Local HTTP Server**:
   ```bash
   # Option 1: Python
   cd app
   python -m http.server 8000

   # Option 2: Node.js
   npx http-server app -p 8000

   # Option 3: VS Code Live Server
   # Right-click index.html → "Open with Live Server"
   ```

2. **Open in Browser**:
   - Navigate to `http://localhost:8000`
   - ⚠️ Do NOT use `file://` - wake lock will not work

3. **Open Developer Tools**:
   - Press F12 or Ctrl+Shift+I (Cmd+Option+I on Mac)
   - Go to Console tab to see wake lock logs

---

### Test Cases

#### Test Case 1: Enable Wake Lock

**Steps**:
1. Open app in supported browser (Chrome 85+)
2. Click Settings button
3. Check "Keep Screen On" checkbox
4. Close settings modal

**Expected Results**:
- ✅ Console log: `[Wake Lock] 화면 켜짐 유지 활성화`
- ✅ Setting persists (refresh page, setting still checked)
- ✅ Screen stays on indefinitely (wait 5+ minutes)

**Validation**:
```javascript
// In browser console:
app.data.settings.screenWakeLock  // Should be true
wakeLock  // Should be WakeLockSentinel object
```

---

#### Test Case 2: Disable Wake Lock

**Steps**:
1. Enable wake lock (Test Case 1)
2. Open Settings
3. Uncheck "Keep Screen On" checkbox
4. Close settings modal

**Expected Results**:
- ✅ Console log: `[Wake Lock] 화면 켜짐 유지 비활성화`
- ✅ Setting persists (refresh page, setting unchecked)
- ✅ Screen returns to normal timeout behavior

**Validation**:
```javascript
// In browser console:
app.data.settings.screenWakeLock  // Should be false
wakeLock  // Should be null
```

---

#### Test Case 3: Tab Visibility Changes

**Steps**:
1. Enable wake lock
2. Switch to another browser tab (or minimize browser)
3. Wait 5 seconds
4. Switch back to CalmDash tab

**Expected Results**:
- ✅ Console log when hidden: `[Wake Lock] 화면 켜짐 유지 해제됨`
- ✅ Console log when visible: `[Wake Lock] 화면 켜짐 유지 활성화`
- ✅ Wake lock seamlessly reacquired

**Validation**:
- Screen stays on while CalmDash tab is active
- Screen can timeout when other tabs are active

---

#### Test Case 4: Page Reload

**Steps**:
1. Enable wake lock
2. Refresh page (F5 or Ctrl+R)

**Expected Results**:
- ✅ Settings checkbox is checked after reload
- ✅ Console log: `[Wake Lock] 화면 켜짐 유지 활성화`
- ✅ Wake lock automatically reacquired

**Validation**:
- Setting persisted to localStorage
- Wake lock initialized on page load

---

#### Test Case 5: Unsupported Browser (HTTP)

**Steps**:
1. Serve app over HTTP (not HTTPS)
2. Try to enable wake lock

**Expected Results**:
- ✅ Console error: `[Wake Lock] 활성화 실패: SecurityError`
- ✅ App continues to work normally
- ✅ Help text visible explaining HTTPS requirement
- ⚠️ Wake lock does not activate (expected)

**Validation**:
- No JavaScript errors thrown
- User is informed of requirement via help text

---

#### Test Case 6: Unsupported Browser (Old Version)

**Steps**:
1. Test in browser without Wake Lock API support
   - Chrome <84, Firefox <126, Safari <16.6
   - Or use DevTools to simulate

**Expected Results**:
- ✅ Console warning: `[Wake Lock] 이 브라우저는 Wake Lock API를 지원하지 않습니다.`
- ✅ App continues to work normally
- ✅ Checkbox can be toggled but feature doesn't work

**Validation**:
```javascript
'wakeLock' in navigator  // Should be false
```

---

### Browser Compatibility Testing Matrix

| Browser | Version | Platform | Expected Result |
|---------|---------|----------|----------------|
| Chrome | 85+ | Desktop | ✅ Full support |
| Chrome | 84+ | Android | ✅ Full support |
| Firefox | 126+ | Desktop/Android | ✅ Full support |
| Safari | 16.6+ | macOS/iOS | ✅ Full support |
| Edge | 90+ | Desktop | ✅ Full support |
| Opera | 73+ | Android | ✅ Full support |
| Chrome | <84 | Any | ⚠️ Graceful degradation |
| Safari | <16.6 | Any | ⚠️ Graceful degradation |

---

## Debugging

### Common Issues

#### Issue 1: Wake Lock Not Activating

**Symptoms**: No console logs, checkbox doesn't work

**Possible Causes**:
1. Using `file://` protocol instead of HTTP/HTTPS
2. Browser doesn't support Wake Lock API
3. JavaScript error preventing execution

**Debugging Steps**:
```javascript
// Check 1: Protocol
console.log(window.location.protocol);  // Should be "http:" or "https:"

// Check 2: API Support
console.log('wakeLock' in navigator);  // Should be true

// Check 3: Function exists
console.log(typeof requestWakeLock);  // Should be "function"

// Check 4: Manual test
requestWakeLock();  // Check console for errors
```

**Solutions**:
- Use local HTTP server (see Test Environment Setup)
- Update browser to latest version
- Check browser console for JavaScript errors

---

#### Issue 2: Wake Lock Not Persisting After Reload

**Symptoms**: Setting resets to unchecked after page refresh

**Possible Causes**:
1. localStorage not saving
2. Browser in private/incognito mode
3. localStorage cleared by browser

**Debugging Steps**:
```javascript
// Check 1: localStorage available
console.log(typeof localStorage);  // Should be "object"

// Check 2: Data saved
console.log(localStorage.getItem('calmdash-data'));  // Should show JSON

// Check 3: Parse data
const data = JSON.parse(localStorage.getItem('calmdash-data'));
console.log(data.settings.screenWakeLock);  // Should match checkbox state
```

**Solutions**:
- Exit private/incognito mode
- Check browser settings for localStorage permissions
- Manually call `app.save()` after toggling checkbox

---

#### Issue 3: Console Errors on Page Load

**Symptoms**: `TypeError: Cannot read property 'screenWakeLock' of undefined`

**Possible Cause**: INITIAL_DATA not updated with new field

**Solution**: Verify `constants.js` includes `screenWakeLock: false`

---

### DevTools Tips

**Monitor Wake Lock State**:
```javascript
// In browser console, create watcher:
setInterval(() => {
    console.log('Wake Lock Status:', {
        enabled: app.data.settings.screenWakeLock,
        active: wakeLock !== null,
        released: wakeLock?.released ?? 'N/A'
    });
}, 5000);  // Check every 5 seconds
```

**Manually Test Functions**:
```javascript
// Force enable
await requestWakeLock();

// Force disable
await releaseWakeLock();

// Check state
console.log(app.data.settings.screenWakeLock);
console.log(wakeLock);
```

---

## Performance Validation

### Metrics to Monitor

1. **Page Load Time**: Wake lock should not delay page load
   - Target: <10ms additional time
   - Measure: DevTools Performance tab

2. **Memory Usage**: Wake lock should have minimal footprint
   - Target: <1KB additional memory
   - Measure: DevTools Memory tab

3. **Wake Lock Acquisition Time**: Should be fast
   - Target: <100ms
   - Measure: Console timestamps

4. **Wake Lock Release Time**: Should be immediate
   - Target: <1000ms on tab hide
   - Measure: Console timestamps

### Performance Test

```javascript
// Add to main.js for testing:
async function testWakeLockPerformance() {
    const results = [];

    for (let i = 0; i < 10; i++) {
        // Test acquisition
        const startAcquire = performance.now();
        await requestWakeLock();
        const acquireTime = performance.now() - startAcquire;

        // Test release
        const startRelease = performance.now();
        await releaseWakeLock();
        const releaseTime = performance.now() - startRelease;

        results.push({ acquireTime, releaseTime });
    }

    console.table(results);
    console.log('Average Acquire:', results.reduce((sum, r) => sum + r.acquireTime, 0) / 10);
    console.log('Average Release:', results.reduce((sum, r) => sum + r.releaseTime, 0) / 10);
}

// Run test:
testWakeLockPerformance();
```

---

## Deployment Checklist

Before deploying this feature to production:

- [ ] All test cases pass (6 test cases above)
- [ ] Tested on at least 3 different browsers
- [ ] Tested on at least 1 mobile device (Android or iOS)
- [ ] HTTPS enabled on production server
- [ ] README.md updated with browser compatibility
- [ ] Console logs working (no errors in any environment)
- [ ] Feature degrades gracefully on unsupported browsers
- [ ] Settings persist across page reloads
- [ ] Wake lock releases when tab hidden
- [ ] Wake lock reacquires when tab visible
- [ ] Help text clearly explains requirements

---

## Next Steps

After implementing and testing:

1. **Run `/speckit.tasks`** to generate task breakdown for any remaining work
2. **Consider enhancements** (see plan.md Future Enhancements)
3. **Gather user feedback** on battery impact and usability
4. **Monitor browser console** in production for any unexpected errors

---

## Additional Resources

### Official Documentation
- [MDN: Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [W3C Specification](https://w3c.github.io/screen-wake-lock/)
- [Can I Use: Wake Lock](https://caniuse.com/wake-lock)

### Related APIs
- [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

### Existing Codebase Patterns
- See `store.js` for data management patterns
- See `ui.js` for settings modal patterns
- See `utils.js` for helper function patterns
