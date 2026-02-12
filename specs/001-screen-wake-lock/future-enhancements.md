# Future Enhancements: Screen Wake Lock

**Feature**: Screen Wake Lock  
**Document**: Enhancement Ideas  
**Date**: 2026-02-12  
**Status**: Optional / Future Consideration

---

## Enhancement Ideas

### 1. Header Visual Indicator (T030) ⭐

**Description**: Add an icon or badge in the header to indicate when wake lock is active.

**User Value**:
- Immediate visual confirmation without opening settings
- Useful for always-on dashboard setups
- Reduces uncertainty about feature status

**Implementation Idea**:
```javascript
// Add to header HTML
<div id="wake-lock-indicator" class="hidden">
    <i class="ph ph-monitor text-sm" title="화면 켜짐 유지 활성화"></i>
</div>

// Update indicator in requestWakeLock/releaseWakeLock
function updateWakeLockIndicator() {
    const indicator = document.getElementById('wake-lock-indicator');
    if (wakeLock && !wakeLock.released) {
        indicator.classList.remove('hidden');
    } else {
        indicator.classList.add('hidden');
    }
}
```

**Priority**: Low  
**Complexity**: Low  
**Impact**: Medium

---

### 2. Settings Tooltip (T031)

**Description**: Show wake lock status in a tooltip when hovering over the settings gear icon.

**User Value**:
- Quick status check without opening modal
- Educational for users learning the feature

**Implementation Idea**:
```javascript
// Update settings button title dynamically
const settingsBtn = document.getElementById('settings-btn');
const status = app.data.settings.screenWakeLock ? '활성화' : '비활성화';
settingsBtn.title = `설정 (화면 켜짐 유지: ${status})`;
```

**Priority**: Low  
**Complexity**: Low  
**Impact**: Low

---

### 3. Battery Impact Warning

**Description**: More prominent warning about battery consumption when enabling wake lock.

**User Value**:
- Informed decision about battery usage
- Prevents accidental battery drain

**Implementation Idea**:
```html
<div class="text-[10px] text-orange-600 mt-1 font-bold">
    ⚠️ 배터리 소모가 증가할 수 있습니다
</div>
```

**Priority**: Medium  
**Complexity**: Low  
**Impact**: Medium

---

### 4. Wake Lock Timer

**Description**: Option to automatically disable wake lock after a specified time period.

**User Value**:
- Prevents accidental all-day usage
- Useful for focused work sessions

**Implementation Idea**:
```javascript
// Add to settings
autoDisableWakeLock: false,
autoDisableAfterMinutes: 60,

// Timer logic
let wakeLockTimer;
function startWakeLockTimer() {
    if (app.data.settings.autoDisableWakeLock) {
        const ms = app.data.settings.autoDisableAfterMinutes * 60 * 1000;
        wakeLockTimer = setTimeout(() => {
            releaseWakeLock();
            app.data.settings.screenWakeLock = false;
            app.save();
            alert('화면 켜짐 유지가 자동으로 비활성화되었습니다.');
        }, ms);
    }
}
```

**Priority**: Low  
**Complexity**: Medium  
**Impact**: Low

---

### 5. Per-Section Wake Lock

**Description**: Different wake lock behavior for different dashboard sections.

**User Value**:
- Wake lock only when viewing specific sections
- Overkill for current use case

**Implementation Idea**:
```javascript
// Not recommended for current simple dashboard
// Would add unnecessary complexity
```

**Priority**: Very Low  
**Complexity**: High  
**Impact**: Low  
**Recommendation**: **Do not implement** - adds complexity without clear benefit

---

## Decision Log

| Enhancement | Decision | Rationale |
|-------------|----------|-----------|
| Header Indicator | Consider for v1.1 | Nice-to-have, low effort |
| Settings Tooltip | Consider for v1.1 | Low effort, improves UX |
| Battery Warning | Consider for v1.1 | Important for user awareness |
| Wake Lock Timer | Defer to v2.0 | Adds complexity, low demand |
| Per-Section Lock | Reject | Overkill for current use case |

---

## Implementation Priority

### Phase 6 (Current Phase)
Focus on core functionality validation and polish. No enhancements.

### Version 1.1 (Future)
1. Battery Impact Warning (quick win)
2. Header Visual Indicator (polish)
3. Settings Tooltip (nice-to-have)

### Version 2.0 (Future)
- Wake Lock Timer (if user demand exists)

---

**Note**: These are enhancement ideas, not requirements. The current implementation is complete and functional. These ideas are documented for future consideration based on user feedback.

---

**Document Created**: 2026-02-12  
**Last Updated**: 2026-02-12  
**Author**: Phase 5 Validation Team
