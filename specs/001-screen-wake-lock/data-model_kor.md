# 데이터 모델: Screen Wake Lock

**Feature**: Screen Wake Lock
**Phase**: Phase 1 - Design Artifacts
**Date**: 2026-01-23
**Status**: Complete

## 개요

이 문서는 Screen Wake Lock 기능의 데이터 구조, 상태 관리, 생명주기를 정의합니다. 기능은 주로 부울 환경설정과 런타임 객체 참조인 최소한의 새로운 데이터를 도입합니다.

## 데이터 엔티티

### 1. Wake Lock 설정 (지속성)

**저장 위치**: `localStorage` under key `calmdash-data`
**객체 경로**: `data.settings.screenWakeLock`
**Type**: `Boolean`
**기본값**: `false`

**목적**: 대시보드를 볼 때 화면을 켜진 상태로 유지할지 여부에 대한 사용자 환경설정입니다.

**스키마**:
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

**생명주기**:
1. **초기화**: 페이지 로드 시 localStorage에서 로드됨
2. **업데이트**: 사용자가 UI에서 설정을 토글할 때 변경됨
3. **지속성**: 모든 변경에 대해 Store.save()를 통해 자동 저장됨
4. **Export/Import**: 데이터 export/import 기능에 포함됨(기존 기능)

**유효성 검사 규칙**:
- Must be a boolean (true/false)
- 추가 유효성 검사가 필요 없습니다(설정은 이진입니다)

**액세스 패턴**:
```javascript
// Read
const isEnabled = app.data.settings.screenWakeLock;

// Write
app.data.settings.screenWakeLock = true;
app.save(); // Triggers localStorage update
```

---

### 2. Wake Lock Sentinel (런타임)

**저장 위치**: `main.js`의 JavaScript 모듈 범위 변수
**변수 이름**: `wakeLock`
**Type**: `WakeLockSentinel | null`
**기본값**: `null`

**목적**: 브라우저에서 관리하는 활성 Wake Lock 객체에 대한 런타임 참조입니다.

**스키마**:
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

**생명주기**:
1. **초기화**: 페이지 로드 시 `null`
2. **활성화**: `navigator.wakeLock.request('screen')`이 성공하면 설정됨
3. **해제**: Wake Lock이 해제되면(수동으로 또는 자동으로) `null`로 다시 설정됨
4. **이벤트**: Sentinel이 Lock이 해제될 때 'release' 이벤트를 방출합니다

**상태 전이**:
```
null → WakeLockSentinel  (user enables setting, page visible)
WakeLockSentinel → null  (user disables setting OR page hidden OR browser releases)
```

**액세스 패턴**:
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

## 상태 관리

### 응용프로그램 상태

Screen Wake Lock 기능은 기존 Store 패턴에 통합됩니다:

**Store 클래스** (existing, in `store.js`):
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

**Wake Lock 상태** (new, in `main.js`):
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

### 상태 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                     응용프로그램 시작                        │
└───────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ localStorage에서       │
                    │ 설정 로드              │
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
             │                  │ Wake Lock 요청       │
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
             └─→│ Wake Lock 해제됨                        │
                │ wakeLock = null                         │
                └─────────────────────────────────────────┘
                        │
                        │ Toggle ON + Visible
                        ▼
                ┌──────────────────┐
                │ Wake Lock 요청   │
                │ (cycle repeats)  │
                └──────────────────┘
```

---

## 데이터 흐름

### 1. 사용자가 Wake Lock을 활성화함

```
사용자가 설정 모달의 토글 클릭
  ↓
UI 이벤트 핸들러가 스토어 업데이트
  ↓
app.data.settings.screenWakeLock = true
  ↓
app.save() → localStorage 업데이트됨
  ↓
requestWakeLock() 호출됨
  ↓
navigator.wakeLock.request('screen')
  ↓
wakeLock = WakeLockSentinel (성공)
  OR
console.error (실패, graceful)
```

### 2. 사용자가 Wake Lock을 비활성화함

```
사용자가 설정 모달의 토글 클릭
  ↓
UI 이벤트 핸들러가 스토어 업데이트
  ↓
app.data.settings.screenWakeLock = false
  ↓
app.save() → localStorage 업데이트됨
  ↓
releaseWakeLock() 호출됨
  ↓
wakeLock.release()
  ↓
wakeLock = null
```

### 3. 페이지가 숨겨짐 (탭 전환)

```
브라우저가 'visibilitychange' 이벤트 발생
  ↓
document.visibilityState === 'hidden'
  ↓
브라우저가 자동으로 Wake Lock 해제
  ↓
wakeLock.addEventListener('release') 발생
  ↓
콘솔 로그: "Wake Lock 해제됨"
  ↓
(wakeLock sentinel은 여전히 존재하지만 released=true)
```

### 4. 페이지가 다시 표시됨

```
브라우저가 'visibilitychange' 이벤트 발생
  ↓
document.visibilityState === 'visible'
  ↓
이벤트 리스너가 app.data.settings.screenWakeLock 확인
  ↓
if true && wakeLock === null → requestWakeLock()
  ↓
Wake Lock 재활성화됨(사용자 경험 중단 없음)
```

---

## 기존 데이터 모델과의 통합

### 기존 데이터 구조 (constants.js)

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

**영향**: 단일 줄 추가, 구조적 변경 없음.

---

## 데이터 검증

### 입력 검증

**설정 토글**:
- 입력 소스: 체크박스의 사용자 클릭
- 유효성 검사: 부울 강제(`!!value`)
- 오류 처리: 불필요(이진 입력)

**Wake Lock 요청**:
- 입력 소스: 브라우저 API 호출
- 유효성 검사: 기능 감지(`'wakeLock' in navigator`)
- 오류 처리: try-catch, console.error, continue

### 데이터 무결성

**localStorage 지속성**:
- 형식: JSON 문자열
- 유효성 검사: try-catch를 사용한 JSON.parse(기존 패턴)
- 손상 처리: INITIAL_DATA로 폴백(기존 패턴)
- 마이그레이션: 필요 없음(새 필드, 기본값이 이전 데이터를 처리함)

**Wake Lock Sentinel**:
- 브라우저 관리(우리는 객체를 만들지 않습니다)
- 유효성 검사 필요 없음(브라우저 구현 신뢰)
- Null-safety: 메서드를 호출하기 전에 항상 `wakeLock !== null` 확인

---

## 성능 고려사항

### 메모리 사용량

| Data Item | Size | Lifetime | Impact |
|-----------|------|----------|--------|
| `settings.screenWakeLock` | 1 byte | Persistent | Negligible |
| `wakeLock` sentinel reference | 8 bytes | While active | Negligible |
| Wake Lock object (browser) | ~100 bytes | While active | Low |

**총 메모리 영향**: < 1 KB

### 저장소 사용량

**localStorage 항목**:
- 기존 데이터: ~5-50 KB (routines, schedules, todos)
- 추가 필드: +21 bytes (`"screenWakeLock":false,`)
- 영향: < 0.5% 증가

### 성능 메트릭

| Operation | Time | Frequency |
|-----------|------|-----------|
| localStorage에서 설정 로드 | < 1ms | Once per page load |
| Wake Lock 요청 | < 100ms | On enable or visibility change |
| Wake Lock 해제 | < 50ms | On disable or hide |
| localStorage에 설정 저장 | < 5ms | On toggle change |

**페이지 로드에 미치는 영향**: 없음(Wake Lock 요청은 비동기, 논-블로킹)

---

## Edge Cases & 오류 상태

### Edge Case 1: 브라우저가 Wake Lock을 지원하지 않음

**감지**: `'wakeLock' in navigator === false`
**데이터 상태**: `settings.screenWakeLock`은 true일 수 있지만 `wakeLock`은 `null` 상태로 유지
**동작**: 조용한 실패, 기능이 작동하지 않지만 앱은 정상적으로 계속 진행

### Edge Case 2: Wake Lock 요청 실패 (HTTPS)

**감지**: `navigator.wakeLock.request()`이 SecurityError를 발생시킴
**데이터 상태**: `settings.screenWakeLock = true`, `wakeLock = null`
**동작**: 오류가 로깅되고, HTTPS 요구사항을 설명하는 도움말 텍스트가 사용자에게 표시됨

### Edge Case 3: 브라우저가 Wake Lock을 예기치 않게 해제함

**감지**: 사용자 조치 없이 'release' 이벤트 발생
**데이터 상태**: `settings.screenWakeLock = true`, `wakeLock.released = true`
**동작**: 다음 가시성 변경 시 Lock을 자동으로 재활성화

### Edge Case 4: 빠른 여러 탭 전환

**감지**: 빠른 연속으로 여러 'visibilitychange' 이벤트
**데이터 상태**: Wake Lock이 빠르게 활성화/해제됨
**동작**: 각 이벤트는 독립적으로 처리되며, 경합 조건 없음(브라우저가 큐 관리)

### Edge Case 5: 사용자가 탭이 숨겨져 있는 동안 설정을 변경함

**시나리오**: 탭이 배경에 있는 동안 사용자가 Wake Lock을 활성화함
**데이터 상태**: `settings.screenWakeLock = true`, page hidden
**동작**: Wake Lock 요청은 페이지가 표시될 때까지 연기됨(이벤트 핸들러에서 확인됨)

---

## 테스트 데이터 시나리오

### 테스트 케이스 1: 첫 번째 사용자

**초기 상태**: localStorage 데이터 없음
**기대**: `screenWakeLock = false` (from INITIAL_DATA)
**Wake Lock**: 요청되지 않음

### 테스트 케이스 2: 재방문한 사용자 (설정 활성화)

**초기 상태**: localStorage가 `screenWakeLock: true`를 포함
**기대**: 페이지 로드 시 Wake Lock 요청됨(표시되는 경우)
**Wake Lock**: 활성화됨

### 테스트 케이스 3: 데이터 Export/Import

**조치**: 사용자가 데이터를 내보내고, 저장소를 지우고, 데이터를 가져옴
**기대**: export에서 Wake Lock 설정 유지됨
**Wake Lock**: 다음 로드 시 가져온 설정과 일치

### 테스트 케이스 4: 설정 토글 빠른 클릭

**조치**: 사용자가 토글을 빠르게 여러 번 클릭(2초 내 5회)
**기대**: 각 클릭이 localStorage에 저장되고, Wake Lock request/release 호출됨
**Wake Lock**: 최종 상태는 마지막 토글 위치와 일치

---

## 데이터 마이그레이션

**상태**: 마이그레이션이 필요하지 않습니다

**이유**: 새로운 기능으로 안전한 기본값을 사용하여 선택적 필드를 추가합니다

**역호환성**:
- `screenWakeLock` 필드가 없는 이전 데이터 → `false`로 기본값 지정(INITIAL_DATA)
- Store.loadData()는 누락된 필드를 우아하게 처리합니다
- 기존 데이터 구조에 대한 주요 변경사항 없음

**앞으로의 호환성**:
- 향후 필드가 제거되면 필드가 있는 이전 데이터는 무해합니다(무시됨)
- 정리가 필요하지 않습니다

---

## 결론

Screen Wake Lock 기능은 최소한의 데이터 복잡성을 도입합니다:
- ✅ 단일 부울 환경설정(지속성)
- ✅ 단일 객체 참조(런타임)
- ✅ 기존 Store 패턴과 완벽하게 통합
- ✅ 마이그레이션 또는 유효성 검사 복잡성 없음
- ✅ 무시할 수 있는 성능 영향

**진행할 준비 완료**: 구현 단계 (tasks.md)
