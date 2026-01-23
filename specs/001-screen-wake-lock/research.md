# Research Documentation: Screen Wake Lock

**Feature**: Screen Wake Lock
**Phase**: Phase 0 - Research & Decisions
**Date**: 2026-01-23
**Status**: Complete

## Overview

This document captures the research conducted to support implementation decisions for the Screen Wake Lock feature. All "NEEDS CLARIFICATION" items from the technical context have been resolved through research and analysis of the existing codebase.

## Research Areas

### 1. Screen Wake Lock API Browser Support

**Question**: Which browsers and versions support the Screen Wake Lock API?

**Research Findings**:

| Platform | Browser | Minimum Version | Support Status |
|----------|---------|----------------|----------------|
| Android | Chrome | 84+ | ✅ Full support |
| Android | Firefox | 126+ | ✅ Full support |
| Android | Opera | 73+ | ✅ Full support |
| Android | Samsung Internet | Unknown | ⚠️ Needs testing |
| iOS/iPadOS | Safari | 16.6+ | ✅ Full support |
| Desktop | Chrome | 85+ | ✅ Full support |
| Desktop | Edge | 90+ | ✅ Full support |
| Desktop | Firefox | 126+ | ✅ Full support |
| Desktop | Safari | 16.6+ | ✅ Full support |

**Sources**:
- MDN Web Docs: Screen Wake Lock API
- Can I Use: https://caniuse.com/wake-lock
- W3C Specification: https://w3c.github.io/screen-wake-lock/

**Decision**: Target the minimum versions listed above. Implement feature detection (`'wakeLock' in navigator`) to handle unsupported browsers gracefully.

**Alternatives Considered**:
- NoSleep.js library - Rejected: Adds dependency, uses video hack workaround
- Manual user interaction requirements - Rejected: Poor UX, defeats purpose
- Android WebView flags - Rejected: App-specific, not applicable to web apps

---

### 2. HTTPS Requirement Verification

**Question**: Why does Screen Wake Lock API require HTTPS? Are there any exceptions?

**Research Findings**:

The Screen Wake Lock API is classified as a "powerful feature" by browser vendors and requires a secure context (HTTPS) for several reasons:

1. **Privacy Protection**: Prevents malicious sites from tracking user activity patterns through screen state
2. **Security**: Prevents man-in-the-middle attacks from injecting wake lock requests
3. **User Trust**: Ensures users can verify the origin requesting wake lock

**Exceptions**:
- `localhost` (HTTP) - Allowed for development
- `127.0.0.1` (HTTP) - Allowed for development
- `file://` protocol - ❌ NOT supported (secure context check fails)

**Browser Enforcement**:
- All supporting browsers enforce this at the API level
- `navigator.wakeLock.request()` will reject with SecurityError on HTTP

**Decision**:
- Document HTTPS requirement in user-facing help text
- Recommend HTTPS for production deployments
- For local development, use localhost or 127.0.0.1 instead of file://

**Impact on CalmDash**:
- Current architecture uses file:// for local execution - wake lock will not work locally
- Production deployment must use HTTPS (GitHub Pages, Netlify, etc.)
- Development testing should use local HTTP server (e.g., `python -m http.server`)

---

### 3. Page Visibility API Integration Patterns

**Question**: How should we handle wake lock lifecycle with page visibility changes?

**Research Findings**:

**Best Practices from W3C Specification**:

1. **Automatic Release**: Browsers automatically release wake lock when page becomes hidden
2. **Manual Reacquisition**: Application must reacquire wake lock when page becomes visible again
3. **Event Handling**: Use `visibilitychange` event to detect state changes

**Common Patterns**:

```javascript
// Pattern 1: Reactive (recommended)
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible' && userWantsWakeLock) {
    await requestWakeLock();
  }
});

// Pattern 2: Preventive (not recommended - cannot prevent release)
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'hidden') {
    // Cannot prevent automatic release, just cleanup
  }
});
```

**Decision**: Implement Pattern 1 (reactive reacquisition)
- Check user preference on every visibility change
- Reacquire only if setting is enabled
- Log events for debugging

**Edge Cases Handled**:
- User disables wake lock while tab is hidden - checked on reacquisition
- Browser crashes - wake lock lost, will reacquire on next page load
- Multiple rapid tab switches - each visibility change triggers check

---

### 4. Error Handling Best Practices

**Question**: How should we handle errors from wake lock requests?

**Research Findings**:

**Common Error Types**:

| Error Type | Cause | Handling Strategy |
|------------|-------|-------------------|
| `NotSupportedError` | Browser doesn't support API | Feature detection, skip request |
| `NotAllowedError` | Permission denied (rare) | Log error, continue normally |
| `SecurityError` | Not HTTPS | Show help text, disable feature |
| `AbortError` | Document becoming hidden | Normal behavior, ignore |

**Best Practice Pattern**:

```javascript
async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      console.log('Wake lock acquired');
    } else {
      console.warn('Wake Lock not supported');
    }
  } catch (err) {
    console.error('Wake lock failed:', err);
    // Continue normally - don't disrupt user experience
  }
}
```

**Decision**:
- Graceful degradation: always catch errors
- Console logging for debugging
- Never show alerts or block UI
- Feature simply doesn't work if it fails

**User Communication**:
- Help text in settings: "Requires HTTPS and modern browser"
- No runtime error messages (silent failure)
- State reflected in UI (toggle remains off if failed)

---

### 5. LocalStorage Persistence Patterns

**Question**: How does the existing codebase handle settings persistence?

**Research Findings**:

**Existing Pattern in store.js**:

```javascript
class Store {
  constructor() {
    this.data = this.loadData();
  }

  loadData() {
    const saved = localStorage.getItem('calmdash-data');
    return saved ? JSON.parse(saved) : INITIAL_DATA;
  }

  save() {
    localStorage.setItem('calmdash-data', JSON.stringify(this.data));
  }
}
```

**Settings Structure**:
```javascript
settings: {
  theme: 'light',
  dateFormat: 'YYYY-MM-DD',
  timeFormat: '24h',
  sectionOrder: [...],
  sectionVisibility: {...},
  // ADD: screenWakeLock: false
}
```

**Decision**: Follow existing pattern exactly
- Add `screenWakeLock: false` to INITIAL_DATA in constants.js
- Settings automatically saved when changed (Store.save())
- Wake lock initialized from `app.data.settings.screenWakeLock` on page load

**Advantages**:
- Zero new code for persistence
- Consistent with other settings
- Works with existing import/export feature
- Browser-managed lifecycle (no server needed)

---

## Technology Stack Confirmation

Based on research and codebase analysis:

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Language | JavaScript ES6+ | Existing codebase standard, no transpilation |
| Wake Lock API | Browser native | W3C standard, zero dependencies |
| Persistence | LocalStorage | Existing pattern in codebase |
| Event Handling | Page Visibility API | W3C standard, browser native |
| Error Handling | try-catch with console | Existing pattern in codebase |
| UI Integration | Vanilla DOM manipulation | Existing pattern in codebase |

**No New Dependencies Required**: All APIs are browser-native.

---

## Implementation Risks & Mitigations

### Risk 1: Browser Incompatibility

**Risk**: Users on older browsers cannot use feature
**Likelihood**: Medium (some users on older Android devices)
**Impact**: Low (feature is optional, app works without it)
**Mitigation**:
- Feature detection prevents errors
- Help text informs users of requirements
- Graceful degradation ensures app functionality

### Risk 2: HTTPS Requirement

**Risk**: Feature doesn't work on HTTP or file://
**Likelihood**: High (during development/testing)
**Impact**: Medium (confusing for developers)
**Mitigation**:
- Document HTTPS requirement prominently
- Recommend local HTTP server for development
- Help text visible in settings panel

### Risk 3: Battery Drain Concerns

**Risk**: Users concerned about battery impact
**Likelihood**: Medium (mobile users are battery-conscious)
**Impact**: Low (user controls feature, can disable anytime)
**Mitigation**:
- Feature is opt-in (default: disabled)
- Clear naming: "Keep Screen On" indicates purpose
- Future enhancement: add battery warning in help text

### Risk 4: Page Visibility Edge Cases

**Risk**: Wake lock not reacquired in some scenarios
**Likelihood**: Low (API is mature and well-specified)
**Impact**: Low (user can toggle to reactivate)
**Mitigation**:
- Simple event listener covers all cases
- Extensive manual testing on all platforms
- Console logs help diagnose issues

---

## Open Questions & Future Research

### Deferred to Future Enhancements

1. **Battery Consumption Monitoring**
   - Status: Not critical for MVP
   - Future: Use Battery Status API if available
   - Note: Battery API has limited browser support

2. **Visual Wake Lock Indicator**
   - Status: Not critical for MVP
   - Future: Add icon or badge when wake lock active
   - Note: User can check settings panel currently

3. **Automated Browser Testing**
   - Status: Not critical for MVP (no test framework in project)
   - Future: Add Playwright/Puppeteer tests when test infrastructure added
   - Note: Manual testing sufficient for single feature

4. **Wake Lock Duration Limits**
   - Status: Not needed (user-controlled)
   - Future: Could add auto-disable after N hours
   - Note: User can manually disable anytime

---

## Conclusion

All research questions have been resolved with concrete decisions:

✅ Browser support matrix documented
✅ HTTPS requirement understood and documented
✅ Page Visibility API pattern selected
✅ Error handling strategy defined
✅ LocalStorage persistence pattern confirmed

**Ready to Proceed**: Phase 1 (Design Artifacts)

**Key Takeaways**:
1. Implementation is straightforward - no complex decisions needed
2. All required APIs are browser-native and well-supported
3. Existing codebase patterns cover all integration needs
4. Main concern is HTTPS requirement for production use
