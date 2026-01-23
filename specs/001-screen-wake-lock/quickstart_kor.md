# 빠른 시작 가이드: Screen Wake Lock

**Feature**: Screen Wake Lock
**Phase**: Phase 1 - Design Artifacts
**Date**: 2026-01-23
**Audience**: CalmDash에서 이 기능을 구현하거나 테스트하는 개발자

## 개요

이 가이드는 CalmDash에서 Screen Wake Lock 기능을 이해, 구현, 테스트, 검증하기 위한 개발자용 단계별 지침을 제공합니다.

---

## 전제조건

### 필요한 지식
- JavaScript ES6+ (async/await, arrow functions, classes)
- Browser APIs (LocalStorage, Page Visibility API)
- DOM manipulation
- Chrome DevTools 또는 동등한 브라우저 개발자 도구

### 필요한 도구
- 최신 웹 브라우저:
  - Chrome 85+ or Edge 90+ (Desktop)
  - Firefox 126+ (Desktop/Android)
  - Safari 16.6+ (Desktop/iOS)
- 로컬 HTTP 서버(개발 테스트용)
  - Python: `python -m http.server 8000`
  - Node.js: `npx http-server -p 8000`
  - VS Code: Live Server extension
- 텍스트 편집기 또는 IDE

### 환경 요구사항
- **HTTPS 또는 localhost**: Wake Lock API는 보안 컨텍스트가 필요합니다
  - Production: HTTPS 필수
  - Development: `http://localhost:8000` 또는 `http://127.0.0.1:8000` 사용
  - ❌ `file://` protocol은 작동하지 않습니다

---

## 아키텍처 개요

### 컴포넌트 다이어그램

```
┌─────────────────────────────────────────────────────────┐
│                      index.html                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │         설정 모달 (UI Layer)                       │  │
│  │  ┌─────────────────────────────────────────────┐  │  │
│  │  │ [x] 화면 켜짐 유지 (체크박스 토글)          │  │  │
│  │  │ ℹ️  HTTPS 및 최신 브라우저 필요             │  │  │
│  │  └─────────────────────────────────────────────┘  │  │
│  └───────────────────────┬───────────────────────────┘  │
└────────────────────────────┼────────────────────────────┘
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

### 파일 수정사항

| File | Changes | Lines Added/Modified |
|------|---------|---------------------|
| `app/js/constants.js` | INITIAL_DATA에 `screenWakeLock: false` 추가 | 1 line |
| `app/js/main.js` | Wake Lock 함수 및 초기화 추가 | ~60 lines |
| `app/index.html` | 설정 토글 및 도움말 텍스트 추가 | ~10 lines |
| `README.md` | 브라우저 호환성 문서 | ~20 lines |

---

## 구현 단계

### 1단계: 상수 업데이트 (constants.js)

**위치**: `app/js/constants.js`
**변경**: 기본 Wake Lock 설정 추가

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
    screenWakeLock: false  // 이 줄 추가
  }
};
```

**이유**: 새로운 사용자를 위한 기본값을 제공하고 역호환성을 보장합니다.

---

### 2단계: Wake Lock 함수 추가 (main.js)

**위치**: `app/js/main.js`
**변경**: 모듈 범위에서 세 개의 새로운 함수 추가

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

**이유**:
- `requestWakeLock()`: API 호출, 기능 감지, 오류 처리 처리
- `releaseWakeLock()`: 비활성화 시 Wake Lock 정리
- `initWakeLock()`: 페이지 로드 시 초기화 및 가시성 변경 처리

---

### 3단계: Wake Lock 초기화 (main.js)

**위치**: `app/js/main.js` - `DOMContentLoaded` 이벤트 핸들러 내부
**변경**: 앱 초기화 중에 `initWakeLock()` 호출

```javascript
document.addEventListener('DOMContentLoaded', () => {
    // 기존 초기화...
    initClock();
    initWeather();
    updateDashboard();

    // 이 줄 추가
    initWakeLock();
});
```

**이유**: 사용자가 활성화한 경우 페이지 로드 시 Wake Lock이 활성화되도록 보장합니다.

---

### 4단계: 설정 UI 추가 (index.html)

**위치**: `app/index.html` - 설정 모달 내부
**변경**: 도움말 텍스트가 있는 체크박스 토글 추가

```html
<!-- 기존 설정... -->

<!-- 이 섹션 추가 -->
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

**이유**: 사용자 제어를 제공하고 요구사항을 명확하게 전달합니다.

---

### 5단계: 설정 UI 초기화 (ui.js 또는 main.js)

**위치**: 설정 모달이 채워지는 위치(아마도 `showSettingsModal()`)
**변경**: 저장된 값에서 체크박스 상태 설정

```javascript
function showSettingsModal() {
    // 기존 설정 초기화...

    // 이 줄 추가
    document.getElementById('setting-screen-wake-lock').checked = app.data.settings.screenWakeLock;

    // 모달 표시...
}
```

**이유**: 모달이 열릴 때 UI가 현재 설정을 반영하도록 보장합니다.

---

### 6단계: 문서 업데이트 (README.md)

**위치**: `README.md`
**변경**: 브라우저 호환성 섹션 추가

```markdown
## 브라우저 호환성

### 화면 켜짐 유지 기능

"화면 켜짐 유지" 기능은 Screen Wake Lock API 지원이 있는 최신 브라우저가 필요합니다:

**지원되는 플랫폼:**
- **Android**: Chrome 84+, Firefox 126+, Opera 73+
- **iOS/iPadOS**: Safari 16.6+
- **Desktop**: Chrome 85+, Edge 90+, Firefox 126+, Safari 16.6+

**요구사항:**
- HTTPS 연결(개발 시 localhost)
- 지난 2~3년 내에 출시된 최신 브라우저

**참고**: 앱은 이전 브라우저에서 정상적으로 작동합니다. 이 기능은 단순히 사용할 수 없습니다.
```

**이유**: 사용자와 개발자에게 명확한 기대를 설정합니다.

---

## 테스트 가이드

### 테스트 환경 설정

1. **로컬 HTTP 서버 시작**:
   ```bash
   # Option 1: Python
   cd app
   python -m http.server 8000

   # Option 2: Node.js
   npx http-server app -p 8000

   # Option 3: VS Code Live Server
   # Right-click index.html → "Open with Live Server"
   ```

2. **브라우저에서 열기**:
   - `http://localhost:8000`으로 이동
   - ⚠️ `file://`을 사용하지 마세요 - Wake Lock이 작동하지 않습니다

3. **개발자 도구 열기**:
   - F12 또는 Ctrl+Shift+I 누르기(Mac에서 Cmd+Option+I)
   - Console 탭으로 이동하여 Wake Lock 로그 확인

---

### 테스트 케이스

#### 테스트 케이스 1: Wake Lock 활성화

**단계**:
1. 지원되는 브라우저(Chrome 85+)에서 앱 열기
2. 설정 버튼 클릭
3. "화면 켜짐 유지" 체크박스 체크
4. 설정 모달 닫기

**예상 결과**:
- ✅ 콘솔 로그: `[Wake Lock] 화면 켜짐 유지 활성화`
- ✅ 설정이 유지됨(페이지 새로고침, 설정이 여전히 체크되어 있음)
- ✅ 화면이 무기한으로 켜져 있음(5분 이상 대기)

**검증**:
```javascript
// 브라우저 콘솔에서:
app.data.settings.screenWakeLock  // true여야 함
wakeLock  // WakeLockSentinel 객체여야 함
```

---

#### 테스트 케이스 2: Wake Lock 비활성화

**단계**:
1. Wake Lock 활성화(테스트 케이스 1)
2. 설정 열기
3. "화면 켜짐 유지" 체크박스 체크 해제
4. 설정 모달 닫기

**예상 결과**:
- ✅ 콘솔 로그: `[Wake Lock] 화면 켜짐 유지 비활성화`
- ✅ 설정이 유지됨(페이지 새로고침, 설정이 여전히 체크 해제됨)
- ✅ 화면이 정상 타임아웃 동작으로 돌아감

**검증**:
```javascript
// 브라우저 콘솔에서:
app.data.settings.screenWakeLock  // false여야 함
wakeLock  // null이어야 함
```

---

#### 테스트 케이스 3: 탭 가시성 변경

**단계**:
1. Wake Lock 활성화
2. 다른 브라우저 탭으로 전환(또는 브라우저 최소화)
3. 5초 대기
4. CalmDash 탭으로 돌아가기

**예상 결과**:
- ✅ 숨겨질 때 콘솔 로그: `[Wake Lock] 화면 켜짐 유지 해제됨`
- ✅ 표시될 때 콘솔 로그: `[Wake Lock] 화면 켜짐 유지 활성화`
- ✅ Wake Lock이 원활하게 재활성화됨

**검증**:
- CalmDash 탭이 활성화되면 화면이 켜져 있음
- 다른 탭이 활성화되면 화면 타임아웃 가능

---

#### 테스트 케이스 4: 페이지 새로고침

**단계**:
1. Wake Lock 활성화
2. 페이지 새로고침(F5 또는 Ctrl+R)

**예상 결과**:
- ✅ 새로고침 후 설정 체크박스가 체크됨
- ✅ 콘솔 로그: `[Wake Lock] 화면 켜짐 유지 활성화`
- ✅ Wake Lock이 자동으로 재활성화됨

**검증**:
- 설정이 localStorage에 유지됨
- Wake Lock이 페이지 로드 시 초기화됨

---

#### 테스트 케이스 5: 지원되지 않는 브라우저 (HTTP)

**단계**:
1. HTTP를 통해 앱 제공(HTTPS 아님)
2. Wake Lock을 활성화하려고 시도

**예상 결과**:
- ✅ 콘솔 오류: `[Wake Lock] 활성화 실패: SecurityError`
- ✅ 앱이 정상적으로 계속 작동
- ✅ HTTPS 요구사항을 설명하는 도움말 텍스트 표시
- ⚠️ Wake Lock이 활성화되지 않음(예상된 동작)

**검증**:
- JavaScript 오류가 발생하지 않음
- 사용자가 도움말 텍스트를 통해 요구사항을 알 수 있음

---

#### 테스트 케이스 6: 지원되지 않는 브라우저 (이전 버전)

**단계**:
1. Wake Lock API를 지원하지 않는 브라우저에서 테스트
   - Chrome <84, Firefox <126, Safari <16.6
   - 또는 DevTools를 사용하여 시뮬레이션

**예상 결과**:
- ✅ 콘솔 경고: `[Wake Lock] 이 브라우저는 Wake Lock API를 지원하지 않습니다.`
- ✅ 앱이 정상적으로 계속 작동
- ✅ 체크박스를 토글할 수 있지만 기능이 작동하지 않음

**검증**:
```javascript
'wakeLock' in navigator  // false여야 함
```

---

### 브라우저 호환성 테스트 매트릭스

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

## 디버깅

### 일반적인 문제

#### 문제 1: Wake Lock이 활성화되지 않음

**증상**: 콘솔 로그 없음, 체크박스가 작동하지 않음

**가능한 원인**:
1. `file://` 프로토콜을 사용 중(HTTP/HTTPS 대신)
2. 브라우저가 Wake Lock API를 지원하지 않음
3. JavaScript 오류로 인해 실행이 차단됨

**디버깅 단계**:
```javascript
// 확인 1: 프로토콜
console.log(window.location.protocol);  // "http:" 또는 "https:"여야 함

// 확인 2: API 지원
console.log('wakeLock' in navigator);  // true여야 함

// 확인 3: 함수 존재
console.log(typeof requestWakeLock);  // "function"이어야 함

// 확인 4: 수동 테스트
requestWakeLock();  // 오류가 있는지 콘솔 확인
```

**해결책**:
- 로컬 HTTP 서버 사용(테스트 환경 설정 참조)
- 브라우저를 최신 버전으로 업데이트
- 브라우저 콘솔에서 JavaScript 오류 확인

---

#### 문제 2: 새로고침 후 Wake Lock이 유지되지 않음

**증상**: 페이지 새로고침 후 설정이 체크 해제됨

**가능한 원인**:
1. localStorage 저장 안 됨
2. 브라우저가 비공개/시크릿 모드 중
3. localStorage가 브라우저에서 지워짐

**디버깅 단계**:
```javascript
// 확인 1: localStorage 사용 가능
console.log(typeof localStorage);  // "object"여야 함

// 확인 2: 데이터 저장됨
console.log(localStorage.getItem('calmdash-data'));  // JSON을 표시해야 함

// 확인 3: 데이터 구문 분석
const data = JSON.parse(localStorage.getItem('calmdash-data'));
console.log(data.settings.screenWakeLock);  // 체크박스 상태와 일치해야 함
```

**해결책**:
- 비공개/시크릿 모드 종료
- 브라우저 설정에서 localStorage 권한 확인
- 체크박스를 토글한 후 `app.save()` 수동 호출

---

#### 문제 3: 페이지 로드 시 콘솔 오류

**증상**: `TypeError: Cannot read property 'screenWakeLock' of undefined`

**가능한 원인**: INITIAL_DATA가 새 필드로 업데이트되지 않음

**해결책**: `constants.js`에 `screenWakeLock: false`가 포함되어 있는지 확인

---

### DevTools 팁

**Wake Lock 상태 모니터링**:
```javascript
// 브라우저 콘솔에서 watcher 생성:
setInterval(() => {
    console.log('Wake Lock 상태:', {
        enabled: app.data.settings.screenWakeLock,
        active: wakeLock !== null,
        released: wakeLock?.released ?? 'N/A'
    });
}, 5000);  // 5초마다 확인
```

**함수 수동 테스트**:
```javascript
// 강제 활성화
await requestWakeLock();

// 강제 비활성화
await releaseWakeLock();

// 상태 확인
console.log(app.data.settings.screenWakeLock);
console.log(wakeLock);
```

---

## 성능 검증

### 모니터링할 메트릭

1. **페이지 로드 시간**: Wake Lock은 페이지 로드를 지연하지 않아야 함
   - 목표: <10ms 추가 시간
   - 측정: DevTools 성능 탭

2. **메모리 사용량**: Wake Lock은 최소 footprint를 가져야 함
   - 목표: <1KB 추가 메모리
   - 측정: DevTools 메모리 탭

3. **Wake Lock 획득 시간**: 빨라야 함
   - 목표: <100ms
   - 측정: 콘솔 타임스탬프

4. **Wake Lock 해제 시간**: 즉시여야 함
   - 목표: <1000ms on tab hide
   - 측정: 콘솔 타임스탬프

### 성능 테스트

```javascript
// 테스트를 위해 main.js에 추가:
async function testWakeLockPerformance() {
    const results = [];

    for (let i = 0; i < 10; i++) {
        // 획득 테스트
        const startAcquire = performance.now();
        await requestWakeLock();
        const acquireTime = performance.now() - startAcquire;

        // 해제 테스트
        const startRelease = performance.now();
        await releaseWakeLock();
        const releaseTime = performance.now() - startRelease;

        results.push({ acquireTime, releaseTime });
    }

    console.table(results);
    console.log('평균 획득:', results.reduce((sum, r) => sum + r.acquireTime, 0) / 10);
    console.log('평균 해제:', results.reduce((sum, r) => sum + r.releaseTime, 0) / 10);
}

// 테스트 실행:
testWakeLockPerformance();
```

---

## 배포 체크리스트

이 기능을 프로덕션에 배포하기 전에:

- [ ] 모든 테스트 케이스 통과(위의 6개 테스트 케이스)
- [ ] 최소 3개의 다른 브라우저에서 테스트됨
- [ ] 최소 1개의 모바일 기기(Android 또는 iOS)에서 테스트됨
- [ ] 프로덕션 서버에서 HTTPS 활성화됨
- [ ] README.md가 브라우저 호환성으로 업데이트됨
- [ ] 콘솔 로그가 작동 중(모든 환경에서 오류 없음)
- [ ] 기능이 지원되지 않는 브라우저에서 우아하게 기능 저하됨
- [ ] 설정이 페이지 새로고침 전체에서 유지됨
- [ ] Wake Lock이 탭 숨김 시 해제됨
- [ ] Wake Lock이 탭 표시 시 재활성화됨
- [ ] 도움말 텍스트가 요구사항을 명확하게 설명함

---

## 다음 단계

구현 및 테스트 후:

1. **`/speckit.tasks` 실행** - 남은 작업에 대한 작업 분석 생성
2. **개선사항 검토** (plan.md 향후 개선사항 참조)
3. **사용자 피드백 수집** - 배터리 영향 및 사용성
4. **프로덕션에서 브라우저 콘솔 모니터링** - 예기치 않은 오류

---

## 추가 리소스

### 공식 문서
- [MDN: Screen Wake Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
- [W3C 사양](https://w3c.github.io/screen-wake-lock/)
- [Can I Use: Wake Lock](https://caniuse.com/wake-lock)

### 관련 API
- [Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)

### 기존 코드베이스 패턴
- `store.js`의 데이터 관리 패턴 참조
- `ui.js`의 설정 모달 패턴 참조
- `utils.js`의 도우미 함수 패턴 참조
