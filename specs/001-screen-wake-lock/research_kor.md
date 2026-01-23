# 연구 문서: Screen Wake Lock

**Feature**: Screen Wake Lock
**Phase**: Phase 0 - Research & Decisions
**Date**: 2026-01-23
**Status**: Complete

## 개요

이 문서는 Screen Wake Lock 기능의 구현 결정을 지원하기 위해 수행된 연구를 기록합니다. 기술 컨텍스트의 모든 "NEEDS CLARIFICATION" 항목은 연구 및 기존 코드베이스 분석을 통해 해결되었습니다.

## 연구 영역

### 1. Screen Wake Lock API 브라우저 지원

**Question**: 어느 브라우저와 버전이 Screen Wake Lock API를 지원합니까?

**연구 결과**:

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

**출처**:
- MDN Web Docs: Screen Wake Lock API
- Can I Use: https://caniuse.com/wake-lock
- W3C Specification: https://w3c.github.io/screen-wake-lock/

**Decision**: 위에 나열된 최소 버전을 대상으로 합니다. 지원되지 않는 브라우저를 우아하게 처리하기 위해 기능 감지(`'wakeLock' in navigator`)를 구현합니다.

**고려된 대안**:
- NoSleep.js library - Rejected: Adds dependency, uses video hack workaround
- Manual user interaction requirements - Rejected: Poor UX, defeats purpose
- Android WebView flags - Rejected: App-specific, not applicable to web apps

---

### 2. HTTPS 요구사항 확인

**Question**: Screen Wake Lock API가 HTTPS를 요구하는 이유는 무엇입니까? 예외가 있습니까?

**연구 결과**:

Screen Wake Lock API는 브라우저 공급업체에 의해 "강력한 기능"으로 분류되며 여러 이유로 보안 컨텍스트(HTTPS)가 필요합니다:

1. **개인정보 보호**: 악성 사이트가 화면 상태를 통해 사용자 활동 패턴을 추적하는 것을 방지합니다
2. **보안**: 중간자 공격이 Wake Lock 요청을 주입하는 것을 방지합니다
3. **사용자 신뢰**: 사용자가 Wake Lock을 요청하는 출처를 확인할 수 있도록 합니다

**예외**:
- `localhost` (HTTP) - Allowed for development
- `127.0.0.1` (HTTP) - Allowed for development
- `file://` protocol - ❌ NOT supported (secure context check fails)

**브라우저 시행**:
- All supporting browsers enforce this at the API level
- `navigator.wakeLock.request()`는 HTTP에서 SecurityError로 거부됩니다

**Decision**:
- Document HTTPS requirement in user-facing help text
- 프로덕션 배포에 HTTPS 권장
- 로컬 개발의 경우 file:// 대신 localhost 또는 127.0.0.1 사용

**CalmDash에 미치는 영향**:
- 현재 아키텍처는 로컬 실행을 위해 file://를 사용합니다 - Wake Lock이 로컬에서 작동하지 않습니다
- 프로덕션 배포는 HTTPS를 사용해야 합니다(GitHub Pages, Netlify 등)
- 개발 테스트는 로컬 HTTP 서버를 사용해야 합니다(예: `python -m http.server`)

---

### 3. Page Visibility API 통합 패턴

**Question**: 페이지 가시성 변경으로 Wake Lock 생명주기를 어떻게 처리해야 합니까?

**연구 결과**:

**W3C 사양의 모범 사례**:

1. **자동 해제**: 페이지가 숨겨지면 브라우저가 Wake Lock을 자동으로 해제합니다
2. **수동 재활성화**: 페이지가 다시 표시되면 응용프로그램이 Wake Lock을 재활성화해야 합니다
3. **이벤트 처리**: `visibilitychange` 이벤트를 사용하여 상태 변경을 감지합니다

**일반적인 패턴**:

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

**Decision**: Pattern 1 구현(반응형 재활성화)
- 모든 가시성 변경 시 사용자 환경설정 확인
- 설정이 활성화된 경우에만 재활성화
- 디버깅을 위한 로그 이벤트

**처리된 Edge Cases**:
- User disables wake lock while tab is hidden - checked on reacquisition
- 브라우저 충돌 - Wake Lock 손실, 다음 페이지 로드 시 재활성화
- 여러 빠른 탭 전환 - 각 가시성 변경이 확인을 트리거합니다

---

### 4. 오류 처리 모범 사례

**Question**: Wake Lock 요청의 오류를 어떻게 처리해야 합니까?

**연구 결과**:

**일반적인 오류 유형**:

| Error Type | Cause | Handling Strategy |
|------------|-------|-------------------|
| `NotSupportedError` | 브라우저가 API를 지원하지 않음 | 기능 감지, 요청 건너뛰기 |
| `NotAllowedError` | 권한 거부(드물게 발생) | 오류 로그, 정상 계속 진행 |
| `SecurityError` | HTTPS가 아님 | 도움말 텍스트 표시, 기능 비활성화 |
| `AbortError` | 문서가 숨겨짐 | 정상 동작, 무시 |

**모범 사례 패턴**:

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
- 디버깅을 위한 콘솔 로깅
- 절대 경고 또는 블록 UI를 표시하지 마세요
- 기능이 실패하면 작동하지 않습니다

**사용자 커뮤니케이션**:
- 설정의 도움말 텍스트: "HTTPS와 최신 브라우저 필요"
- 런타임 오류 메시지 없음(조용한 실패)
- UI에 반영된 상태(토글이 실패하면 꺼진 상태로 유지)

---

### 5. LocalStorage 지속성 패턴

**Question**: 기존 코드베이스는 설정 지속성을 어떻게 처리합니까?

**연구 결과**:

**store.js의 기존 패턴**:

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

**설정 구조**:
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

**Decision**: 기존 패턴을 정확히 따릅니다
- constants.js의 INITIAL_DATA에 `screenWakeLock: false` 추가
- 설정이 변경되면 자동으로 저장됩니다(Store.save())
- 페이지 로드 시 `app.data.settings.screenWakeLock`에서 Wake Lock 초기화

**장점**:
- Zero new code for persistence
- 다른 설정과 일관성이 있습니다
- 기존 가져오기/내보내기 기능과 함께 작동합니다
- 브라우저 관리 생명주기(서버 불필요)

---

## 기술 스택 확인

연구 및 코드베이스 분석을 기반으로:

| Component | Technology | Justification |
|-----------|-----------|---------------|
| Language | JavaScript ES6+ | Existing codebase standard, no transpilation |
| Wake Lock API | Browser native | W3C standard, zero dependencies |
| Persistence | LocalStorage | 코드베이스의 기존 패턴 |
| Event Handling | Page Visibility API | W3C standard, browser native |
| Error Handling | try-catch with console | 코드베이스의 기존 패턴 |
| UI Integration | Vanilla DOM manipulation | 코드베이스의 기존 패턴 |

**새로운 종속성 필요 없음**: 모든 API는 브라우저 네이티브입니다.

---

## 구현 위험 & 완화

### 위험 1: 브라우저 호환성

**위험**: 이전 브라우저의 사용자는 기능을 사용할 수 없습니다
**가능성**: 중간(일부 이전 Android 기기 사용자)
**영향**: 낮음(기능은 선택사항, 앱은 없어도 작동)
**완화**:
- 기능 감지는 오류를 방지합니다
- 도움말 텍스트가 사용자에게 요구사항을 알립니다
- 우아한 기능 저하는 앱 기능을 보장합니다

### 위험 2: HTTPS 요구사항

**위험**: 기능이 HTTP 또는 file://에서 작동하지 않습니다
**가능성**: 높음(개발/테스트 중)
**영향**: 중간(개발자에게 혼동)
**완화**:
- HTTPS 요구사항을 명확하게 문서화합니다
- 개발을 위한 로컬 HTTP 서버를 권장합니다
- 도움말 텍스트가 설정 패널에 표시됩니다

### 위험 3: 배터리 소모 우려

**위험**: 사용자가 배터리 영향을 우려합니다
**가능성**: 중간(모바일 사용자는 배터리 인식)
**영향**: 낮음(사용자가 기능을 제어하고 언제든 비활성화 가능)
**완화**:
- 기능은 선택사항입니다(기본값: 비활성화)
- Clear naming: "화면 켜짐 유지"는 목적을 나타냅니다
- 향후 개선: 도움말 텍스트에 배터리 경고 추가

### 위험 4: 페이지 가시성 Edge Cases

**위험**: 일부 시나리오에서 Wake Lock이 재활성화되지 않습니다
**가능성**: 낮음(API는 성숙하고 잘 명시됨)
**영향**: 낮음(사용자가 다시 활성화할 수 있음)
**완화**:
- 간단한 이벤트 리스너가 모든 경우를 다룹니다
- 모든 플랫폼에 대한 광범위한 수동 테스트
- 콘솔 로그는 문제 진단에 도움이 됩니다

---

## 미해결 질문 & 향후 연구

### 향후 개선으로 연기됨

1. **배터리 소비 모니터링**
   - 상태: MVP에 필수적이지 않습니다
   - 향후: 사용 가능한 경우 Battery Status API 사용
   - 참고: Battery API는 브라우저 지원이 제한됨

2. **시각적 Wake Lock 표시기**
   - 상태: MVP에 필수적이지 않습니다
   - 향후: Wake Lock이 활성화된 경우 아이콘 또는 배지 추가
   - 참고: 사용자는 현재 설정 패널에서 확인 가능

3. **자동화된 브라우저 테스트**
   - 상태: MVP에 필수적이지 않습니다(프로젝트에 테스트 프레임워크 없음)
   - 향후: 테스트 인프라가 추가되면 Playwright/Puppeteer 테스트 추가
   - 참고: 단일 기능의 경우 수동 테스트로 충분합니다

4. **Wake Lock 기간 제한**
   - 상태: 필요하지 않습니다(사용자 제어)
   - 향후: N시간 후 자동 비활성화 추가 가능
   - 참고: 사용자가 언제든 수동으로 비활성화 가능

---

## 결론

모든 연구 질문이 구체적인 결정을 통해 해결되었습니다:

✅ 브라우저 지원 매트릭스 문서화
✅ HTTPS 요구사항 이해 및 문서화
✅ Page Visibility API 패턴 선택
✅ 오류 처리 전략 정의
✅ LocalStorage 지속성 패턴 확인

**진행할 준비 완료**: Phase 1 (설계 인산물)

**주요 요점**:
1. 구현은 간단합니다 - 복잡한 결정이 필요하지 않습니다
2. 필요한 모든 API는 브라우저 네이티브이고 잘 지원됩니다
3. 기존 코드베이스 패턴은 모든 통합 요구사항을 다룹니다
4. 주요 관심사는 프로덕션 사용을 위한 HTTPS 요구사항입니다
