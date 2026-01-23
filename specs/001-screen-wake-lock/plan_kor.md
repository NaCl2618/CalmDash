# 구현 계획: Screen Wake Lock

**Branch**: `001-screen-wake-lock` | **Date**: 2026-01-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-screen-wake-lock/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## 요약

Android 기기, iOS, 데스크톱 브라우저에서 자동 화면 타임아웃을 방지하도록 Screen Wake Lock API 통합을 구현합니다. 이 기능은 사용자가 설정 토글을 통해 "화면 켜짐 유지" 기능을 활성화할 수 있으며, 자동 생명주기 관리(보이기 시 활성화, 숨김 시 해제)와 지원되지 않는 환경에 대한 우아한 기능 저하를 제공합니다. 구현은 바닐라 JavaScript를 사용하며 브라우저의 네이티브 Wake Lock API, 환경설정 지속성을 위한 LocalStorage, 자동 재활성화를 위한 Page Visibility API를 활용합니다.

## 기술 컨텍스트

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
- Wake lock 획득: <100ms
- Wake lock 해제: <1000ms when tab hidden
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

## 규칙 검토

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: 이 프로젝트에 대한 공식 규칙 파일은 없습니다. 코드베이스는 다음의 암묵적 원칙을 따릅니다:

1. **단순성 우선**: 바닐라 JavaScript, 빌드 도구 없음, 프레임워크 없음
2. **점진적 개선**: 기능이 이전 브라우저에서 우아하게 기능 저하됨
3. **개인정보 보호 중심**: 모든 데이터는 로컬에 저장, 외부 추적 없음
4. **E-Ink 최적화**: 높은 대비, 최소 리소스 사용
5. **보안**: XSS 방지를 위한 escapeHTML, 민감한 API를 위한 HTTPS

**규칙 준수**: ✅ PASS
- Feature maintains vanilla JavaScript approach (no new dependencies)
- Graceful degradation built-in (browser support detection)
- Privacy preserved (setting stored in LocalStorage only)
- No external API calls (browser-native API)
- Security requirement met (HTTPS enforced by browser for Wake Lock)

**Notes**: 이 프로젝트에는 공식 규칙이 없으므로 기존 코드 패턴에서 원칙을 추론합니다. Wake Lock 기능은 확립된 아키텍처와 완벽하게 정렬됩니다.

## 프로젝트 구조

### 문서 (이 기능)

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

### 소스 코드 (저장소 루트)

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

**구조 결정**: 이 프로젝트는 클래식 스크립트 로딩(모듈 번들러 없음)을 사용하는 단일 페이지 응용프로그램 구조를 사용합니다. 모든 JavaScript 파일은 index.html의 `<script>` 태그를 통해 종속성 순서대로 로드됩니다. Wake Lock 기능은 세 개의 도우미 함수로 main.js에 직접 통합되며, UI 변경사항은 index.html 설정 모달에, 설정 초기화는 store.js에 있습니다.

**기존 아키텍처**:
- **Store pattern**: 관찰자 패턴을 사용한 중앙집중식 상태 관리
- **Module separation**: utils (helpers), store (data), ui (rendering), main (initialization)
- **No ES6 modules**: Classic script loading for `file://` protocol compatibility
- **LocalStorage persistence**: 모든 사용자 설정은 변경 시 자동 저장됨

## 복잡성 추적

> **Fill ONLY if Constitution Check has violations that must be justified**

**Status**: ✅ NO VIOLATIONS - Feature fully complies with inferred project principles

이 기능은 추가적인 복잡성을 도입하지 않습니다:
- No new dependencies (uses browser-native APIs)
- No new architectural patterns (follows existing Store pattern)
- No build complexity (continues classic script approach)
- No external services (browser API only)
- Minimal code footprint (~60 lines of JavaScript)

## Phase 0: 연구 & 결정

**Status**: ✅ COMPLETE (documented in research.md)

완료된 주요 연구 영역:
1. ✅ Screen Wake Lock API 브라우저 지원 매트릭스
2. ✅ HTTPS 요구사항 확인
3. ✅ Page Visibility API 통합 패턴
4. ✅ 지원되지 않는 브라우저에 대한 오류 처리 모범 사례
5. ✅ 기존 코드베이스의 LocalStorage 지속성 패턴

전체 연구 설명서는 [research.md](research.md)를 참조하세요.

## Phase 1: 설계 인산물

### 데이터 모델

**Status**: ✅ COMPLETE (documented in data-model.md)

주요 엔티티:
1. **Wake Lock Setting** (Boolean in LocalStorage)
2. **Wake Lock Sentinel** (Browser-managed object reference)

전체 데이터 모델 사양은 [data-model.md](data-model.md)를 참조하세요.

### API 계약

**Status**: N/A - No external API contracts needed

이 기능은 브라우저 네이티브 API만 사용합니다:
- `navigator.wakeLock.request('screen')` - W3C standard
- `document.visibilityState` - W3C standard
- `localStorage.setItem/getItem` - W3C standard

사용자 정의 API 엔드포인트 또는 계약이 필요하지 않습니다.

### 통합 포인트

**기존 코드베이스 통합**:

1. **설정 시스템** (store.js)
   - Add `screenWakeLock: false` to default settings
   - 기존 저장 메커니즘을 통해 자동 지속

2. **UI 시스템** (ui.js + index.html)
   - 설정 모달에 토글 컨트롤 추가
   - HTTPS 요구사항에 대한 도움말 텍스트 추가
   - 체크박스 스타일이 이미 사용자 정의 컨트롤 지원

3. **초기화** (main.js)
   - Call `initWakeLock()` during app startup
   - 가시성 변경 리스너 등록
   - 기존 생명주기와 통합

### 빠른 시작 가이드

**Status**: ✅ COMPLETE (documented in quickstart.md)

개발자 설정 및 테스트 지침은 [quickstart.md](quickstart.md)를 참조하세요.

## 구현 단계 (/speckit.tasks용)

### Phase A: 핵심 Wake Lock 로직 (P1 - Critical)
- Implement `requestWakeLock()` function
- Implement `releaseWakeLock()` function
- Implement `initWakeLock()` function
- 가시성 변경 이벤트 리스너 추가

### Phase B: 설정 통합 (P1 - Critical)
- Add `screenWakeLock` to default settings in store.js
- 설정 모달 HTML에 토글 컨트롤 추가
- Wake Lock 활성화/비활성화에 토글 연결
- HTTPS 요구사항에 대한 도움말 텍스트 추가

### Phase C: 테스트 & 문서 (P2 - High)
- Manual testing on Android Chrome
- Manual testing on iOS Safari
- 데스크톱 브라우저에서 수동 테스트
- HTTP vs HTTPS 동작 테스트
- README를 브라우저 호환성으로 업데이트

### Phase D: Edge Case 처리 (P3 - Nice-to-have)
- 배터리 절약 모드 동작 테스트
- 브라우저 충돌 복구 테스트
- 빠른 탭 전환 테스트
- 알려진 제한사항 문서화

## 성공 검증

구현은 다음의 경우에 완료된 것으로 간주됩니다:

1. ✅ Wake Lock을 설정 토글을 통해 활성화/비활성화할 수 있음
2. ✅ Wake Lock이 브라우저 세션 전체에서 유지됨
3. ✅ Wake Lock이 탭 숨김 시 자동으로 해제됨
4. ✅ Wake Lock이 탭 표시 시 자동으로 재활성화됨(활성화된 경우)
5. ✅ 기능이 HTTP 또는 지원되지 않는 브라우저에서 우아하게 기능 저하됨
6. ✅ 테스트된 환경에서 콘솔 오류 없음
7. ✅ README가 브라우저 호환성 요구사항을 문서화함

이는 기능 사양의 성공 기준 SC-001부터 SC-007에 직접 매핑됩니다.

## Notes

**이미 구현됨**: 이 기능은 코드베이스에 이미 구현되었습니다(commit `0ac01a5`). 이 계획은 향후 참조 및 개선을 위해 기존 구현을 문서화합니다.

**향후 개선사항** (범위 외):
- Automated browser tests (requires test framework setup)
- Battery consumption monitoring/warnings
- Wake Lock이 활성화된 경우 시각적 표시
- Wake Lock 기간 제한 또는 자동 비활성화
- 지원되지 않는 브라우저를 위한 대체 구현
